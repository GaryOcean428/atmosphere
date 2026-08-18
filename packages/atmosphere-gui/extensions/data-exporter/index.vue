<script setup lang="ts">
import dayjs from 'dayjs'
import {
  SupportedExportCharset,
  type ViewType,
  ViewTypes,
  charsetOptions,
  csvColumnSeparatorOptions,
  getFirstNonPersonalView,
} from 'atmosphere-sdk'
import { extensionUserPrefsManager } from '~/helpers/extensionUserPrefsManager'

const jobStatusTooltip = {
  [JobStatus.COMPLETED]: 'Export successful',
  [JobStatus.FAILED]: 'Export failed',
} as Record<string, string>

const { $api, $poller, $e } = useNuxtApp()

const { appInfo, user } = useGlobal()

const meta = inject(MetaInj)!

const router = useRouter()
const route = router.currentRoute

const activeTableId = computed(() => route.value.params.viewId as string | undefined)

const activeViewTitleOrId = computed(() => {
  return route.value.params.viewTitle
})

const { eventBus, extensionAccess } = useExtensions()

const { extension, tables, fullscreen, getViewsForTable } = useExtensionHelperOrThrow()
const EXTENSION_ID = extension.value.extensionId

const { jobList, loadJobsForBase } = useJobs()

const views = ref<ViewType[]>([])

const deletedExports = ref<string[]>([])

const dataExporterRef = ref<HTMLDivElement>()

const { width } = useElementSize(dataExporterRef)

const exportedFiles = computed(() => {
  const list = jobList.value
    .filter(
      (job) =>
        (job.job === 'data-export' || job.name === 'data-export') &&
        job.result?.extension_id === extension.value.id &&
        !deletedExports.value.includes(job.id),
    )
    .map((job) => {
      const isNew = job.result?.timestamp ? dayjs().diff(job.result?.timestamp) < 10000 : false

      return {
        ...job,
        result: { ...(job.result || {}), isNew } as {
          url: string
          type: 'csv' | 'json' | 'xlsx'
          title: string
          timestamp: number
          isNew: boolean
        },
      }
    })
    .sort((a, b) => dayjs(b.created_at).unix() - dayjs(a.created_at).unix())

  if (fullscreen.value) {
    return list
  }

  return list.slice(0, 1)
})

const exportPayload = ref<{
  tableId?: string
  viewId?: string
  delimiter?: string
  encoding?: SupportedExportCharset
}>({
  delimiter: ',',
  encoding: SupportedExportCharset['utf-8'],
})

const tableList = computed(() => {
  return tables.value.map((table) => {
    return {
      label: table.title,
      value: table.id,
      meta: table.meta,
      synced: table.synced,
    }
  })
})

const viewList = computed(() => {
  if (!exportPayload.value.tableId) return []
  return (
    views.value
      .filter((view) => view.type !== ViewTypes.FORM)
      .map((view) => {
        return {
          label: view.title,
          value: view.id,
          meta: view.meta,
          type: view.type,
        }
      }) || []
  )
})

const reloadViews = async () => {
  if (exportPayload.value.tableId) {
    views.value = await getViewsForTable(exportPayload.value.tableId)
  }
}

const saveChanges = async () => {
  extensionUserPrefsManager.set(user.value.id, extension.value.id, exportPayload.value, extension.value.baseId)
}

const onTableSelect = async (tableId?: string) => {
  if (!tableId) {
    exportPayload.value.tableId = activeTableId.value
    await reloadViews()
    exportPayload.value.viewId = activeViewTitleOrId.value
      ? views.value.find((view) => view.id === activeViewTitleOrId.value)?.id
      : getFirstNonPersonalView(views.value, {
          includeViewType: ViewTypes.GRID,
        })?.id
  } else {
    exportPayload.value.tableId = tableId
    await reloadViews()
    exportPayload.value.viewId = getFirstNonPersonalView(views.value, {
      excludeViewType: ViewTypes.FORM,
    })?.id
  }

  await saveChanges()
}

const onViewSelect = async (viewId: string) => {
  exportPayload.value.viewId = viewId
  await saveChanges()
}

const isExporting = ref(false)

async function exportDataAsync() {
  try {
    if (isExporting.value || !exportPayload.value.viewId) return

    isExporting.value = true

    const jobData = await $api.internal.postOperation(
      meta.value!.fk_workspace_id!,
      meta.value!.base_id!,
      {
        operation: 'dataExport',
        viewId: exportPayload.value.viewId as string,
      },
      {
        options: {
          extension_id: extension.value.id,
          delimiter: exportPayload.value.delimiter,
          encoding: exportPayload.value.encoding,
        },
        exportAs: 'csv',
      },
    )

    jobList.value.unshift({ ...jobData, name: 'data-export' })

    $poller.subscribe(
      { id: jobData.id },
      async (data: {
        id: string
        status?: string
        data?: {
          error?: {
            message: string
          }
          message?: string
          result?: any
        }
      }) => {
        if (data.status !== 'close') {
          if (data.status === JobStatus.COMPLETED) {
            // Export completed successfully
            message.toast('Successfully exported data!')

            const job = jobList.value.find((j) => j.id === data.id)
            if (job) {
              job.status = JobStatus.COMPLETED
              job.result = data.data?.result
            }

            isExporting.value = false
            $e(`a:extension:${EXTENSION_ID}:export:completed`)
          } else if (data.status === JobStatus.FAILED) {
            message.error('Failed to export data!')

            const job = jobList.value.find((j) => j.id === data.id)
            if (job) {
              job.status = JobStatus.FAILED
              job.result = data.data?.result

              // Add title if not present in response
              if (!job.result?.title) {
                job.result = {
                  ...(job.result || {}),
                  title: titleHelper(),
                }
              }
            }

            isExporting.value = false
            $e(`a:extension:${EXTENSION_ID}:export:failed`)
          }
        }
      },
    )
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    $e(`a:extension:${EXTENSION_ID}:export`)
  }
}

const urlHelper = (url: string) => {
  if (url.startsWith('http')) {
    return url
  } else {
    return `${appInfo.value.ncSiteUrl || BASE_FALLBACK_URL}/${url}`
  }
}

const handleDownload = async (url: string) => {
  const isExpired = await isLinkExpired(url)

  if (isExpired) {
    navigateTo(url, {
      open: navigateToBlankTargetOpenOption,
    })
    return
  }

  const link = document.createElement('a')
  link.href = url
  link.style.display = 'none' // Hide the link

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  $e(`a:extension:${EXTENSION_ID}:export:download`)
}

function titleHelper() {
  const table = tables.value.find((t) => t.id === exportPayload.value.tableId)
  const view = views.value.find((v) => v.id === exportPayload.value.viewId)

  return `${table?.title} (${view?.title})`
}

const onRemoveExportedFile = async (exportId: string) => {
  deletedExports.value.push(exportId)

  await extension.value.kvStore.set('deletedExports', deletedExports.value)
}

const filterOption = (input: string, option: { key: string }) => {
  return option.key?.toLowerCase()?.includes(input?.toLowerCase())
}

const extensionEvents = async (event: ExtensionsEvents, payload: any) => {
  if (event === ExtensionsEvents.CLEARDATA && payload && extension.value.id && payload === extension.value.id) {
    const deleteExportsPayload = exportedFiles.value.map((exp) => exp.id)

    if (deleteExportsPayload.length) {
      deletedExports.value.push(...deleteExportsPayload)
      await extension.value.kvStore.set('deletedExports', deletedExports.value)
    }
  }
}

eventBus.on(extensionEvents)

onBeforeUnmount(() => {
  eventBus.off(extensionEvents)
})

onMounted(async () => {
  const stored = extensionUserPrefsManager.get(user.value.id, extension.value.id)
  if (stored) {
    exportPayload.value = stored
  }

  exportPayload.value.delimiter = exportPayload.value.delimiter || ','
  exportPayload.value.encoding = exportPayload.value.encoding || SupportedExportCharset['utf-8']

  deletedExports.value = extension.value.kvStore.get('deletedExports') || []

  await reloadViews()
  await loadJobsForBase()

  if (!exportPayload.value.tableId && tableList.value.find((table) => table.value === activeTableId.value)) {
    onTableSelect()
  }
})
</script>

<template>
  <ExtensionsExtensionWrapper
    :style="fullscreen ? {} : { height: exportedFiles.length ? (width <= 325 ? '172px' : '130px') : '100%' }"
  >
    <template v-if="fullscreen" #headerExtra>
      <AtTooltip class="flex" placement="topRight" :disabled="!isExporting">
        <template #title> The CSV file is being prepared in the background. You'll be notified once it's ready. </template>
        <AtButton :disabled="!exportPayload?.viewId" :loading="isExporting" size="small" @click="exportDataAsync">{{
          isExporting ? 'Generating' : 'Export'
        }}</AtButton>
      </AtTooltip>
    </template>
    <div
      ref="dataExporterRef"
      class="data-exporter"
      :class="{
        'bg-atm-bg-gray-extralight': fullscreen,
      }"
    >
      <div
        v-if="!fullscreen"
        class="p-3 flex flex-col gap-3"
        :class="{
          'bg-atm-bg-default': fullscreen,
        }"
      >
        <div class="flex items-center justify-between gap-2.5 flex-wrap">
          <div
            class="atm-data-exporter-select-wrapper flex-1 flex items-center border-1 border-atm-border-gray-medium rounded-lg relative shadow-default"
            :class="{
              'max-w-[min(350px,calc(100%-124px))]': isExporting && !fullscreen && width > 325,
              'max-w-[min(350px,calc(100%_-_76px))]': !isExporting && !fullscreen && width > 325,
              'max-w-full': width <= 325,
              'max-w-[480px]': fullscreen,
            }"
          >
            <a-form-item
              class="!my-0"
              :class="{
                'flex-1 max-w-[240px]': fullscreen,
                'min-w-1/2 max-w-[175px]': !fullscreen,
              }"
            >
              <AtSelect
                v-model:value="exportPayload.tableId"
                placeholder="-select table-"
                :disabled="isExporting"
                class="atm-data-exporter-table-select atm-select-shadow"
                :filter-option="filterOption"
                dropdown-class-name="w-[250px]"
                show-search
                @change="onTableSelect"
              >
                <a-select-option v-for="table of tableList" :key="table.label" :value="table.value">
                  <div class="w-full flex items-center gap-2">
                    <div class="min-w-5 flex items-center justify-center">
                      <GeneralTableIcon
                        size="xsmall"
                        :meta="{ meta: table.meta, synced: table.synced }"
                        class="text-atm-content-gray-muted"
                      />
                    </div>
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>{{ table.label }}</template>
                      <span>{{ table.label }}</span>
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="exportPayload.tableId === table.value"
                      id="atm-selected-item-icon"
                      class="flex-none text-atm-content-brand w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>
            </a-form-item>

            <a-form-item
              class="!my-0"
              :class="{
                'flex-1 max-w-[240px]': fullscreen,
                'min-w-1/2 max-w-[175px]': !fullscreen,
              }"
            >
              <AtSelect
                v-model:value="exportPayload.viewId"
                placeholder="-select view-"
                :disabled="isExporting"
                class="atm-data-exporter-view-select atm-select-shadow"
                dropdown-class-name="w-[250px]"
                :filter-option="filterOption"
                show-search
                placement="bottomRight"
                @change="onViewSelect"
              >
                <a-select-option v-for="view of viewList" :key="view.label" :value="view.value">
                  <div class="w-full flex items-center gap-2">
                    <div class="min-w-5 flex items-center justify-center">
                      <GeneralViewIcon
                        :meta="{ meta: view.meta, type: view.type }"
                        class="flex-none text-atm-content-gray-muted"
                      />
                    </div>
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>{{ view.label }}</template>
                      <span>{{ view.label }}</span>
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="exportPayload.viewId === view.value"
                      id="atm-selected-item-icon"
                      class="flex-none text-atm-content-brand w-4 h-4"
                    />
                  </div> </a-select-option
              ></AtSelect>
            </a-form-item>
          </div>
          <div class="flex-none flex justify-end">
            <AtTooltip class="flex" placement="topRight" :disabled="!isExporting">
              <template #title> The CSV file is being prepared in the background. You'll be notified once it's ready. </template>
              <AtButton :disabled="!exportPayload?.viewId" :loading="isExporting" size="small" @click="exportDataAsync">{{
                isExporting ? 'Generating' : 'Export'
              }}</AtButton>
            </AtTooltip>
          </div>
        </div>
      </div>
      <div
        class="data-exporter-body flex-1 flex"
        :class="{
          '': fullscreen,
          'flex-col': !fullscreen,
        }"
      >
        <div
          v-if="fullscreen"
          class="w-[320px] border-r-1 border-r-atm-border-gray-medium bg-atm-bg-default p-4 pt-t flex flex-col gap-5 atm-scrollbar-thin"
        >
          <div class="text-base font-bold text-atm-content-gray-extreme">Settings</div>
          <div class="flex flex-col gap-2">
            <div class="text-atm-content-gray font-medium">Table</div>
            <a-form-item class="!my-0">
              <AtSelect
                v-model:value="exportPayload.tableId"
                placeholder="-select table-"
                :disabled="isExporting"
                class="atm-data-exporter-table-select-sidebar atm-select-shadow"
                :filter-option="filterOption"
                dropdown-class-name="w-[250px]"
                show-search
                @change="onTableSelect"
              >
                <a-select-option v-for="table of tableList" :key="table.label" :value="table.value">
                  <div class="w-full flex items-center gap-2">
                    <div class="min-w-5 flex items-center justify-center">
                      <GeneralTableIcon
                        size="xsmall"
                        :meta="{ meta: table.meta, synced: table.synced }"
                        class="text-atm-content-gray-muted"
                      />
                    </div>
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>{{ table.label }}</template>
                      <span>{{ table.label }}</span>
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="exportPayload.tableId === table.value"
                      id="atm-selected-item-icon"
                      class="flex-none text-atm-content-brand w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>
            </a-form-item>
          </div>
          <div class="flex flex-col gap-2">
            <div class="text-atm-content-gray font-medium">View</div>
            <a-form-item class="!my-0 min-w-1/2">
              <AtSelect
                v-model:value="exportPayload.viewId"
                placeholder="-select view-"
                :disabled="isExporting"
                class="atm-data-exporter-view-select-sidebar atm-select-shadow"
                dropdown-class-name="w-[250px]"
                :filter-option="filterOption"
                show-search
                placement="bottomRight"
                @change="onViewSelect"
              >
                <a-select-option v-for="view of viewList" :key="view.label" :value="view.value">
                  <div class="w-full flex items-center gap-2">
                    <div class="min-w-5 flex items-center justify-center">
                      <GeneralViewIcon
                        :meta="{ meta: view.meta, type: view.type }"
                        class="flex-none text-atm-content-gray-muted"
                      />
                    </div>
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>{{ view.label }}</template>
                      <span>{{ view.label }}</span>
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="exportPayload.viewId === view.value"
                      id="atm-selected-item-icon"
                      class="flex-none text-atm-content-brand w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>
            </a-form-item>
          </div>
          <div class="flex flex-col gap-2">
            <div>Separator</div>
            <a-form-item class="!my-0 flex-1">
              <AtSelect
                v-model:value="exportPayload.delimiter"
                placeholder="-select separator-"
                :disabled="isExporting"
                class="atm-data-exporter-separator atm-select-shadow"
                dropdown-class-name="w-[180px]"
                @change="saveChanges"
              >
                <a-select-option v-for="delimiter of csvColumnSeparatorOptions" :key="delimiter.value" :value="delimiter.value">
                  <div class="w-full flex items-center gap-2">
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>{{ delimiter.label }}</template>
                      <span>{{ delimiter.label }}</span>
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="exportPayload.delimiter === delimiter.value"
                      id="atm-selected-item-icon"
                      class="flex-none text-atm-content-brand w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>
            </a-form-item>
          </div>
          <div class="flex flex-col gap-2">
            <div class="min-w-[65px]">Encoding</div>
            <a-form-item class="!my-0 flex-1">
              <AtSelect
                v-model:value="exportPayload.encoding"
                placeholder="-select encoding-"
                class="atm-data-exporter-encoding atm-select-shadow"
                dropdown-class-name="w-[190px]"
                :filter-option="filterOption"
                show-search
                @change="saveChanges"
              >
                <a-select-option v-for="encoding of charsetOptions" :key="encoding.label" :value="encoding.value">
                  <div class="w-full flex items-center gap-2">
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>{{ encoding.label }}</template>
                      <span>{{ encoding.label }}</span>
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="exportPayload.encoding === encoding.value"
                      id="atm-selected-item-icon"
                      class="flex-none text-atm-content-brand w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>
            </a-form-item>
          </div>
        </div>
        <div class="flex flex-col flex-1 atm-scrollbar-thin">
          <div v-if="fullscreen" class="data-exporter-header sticky top-0 z-100">Recent Exports</div>
          <div v-if="exportedFiles.length" class="flex-1 flex flex-col max-h-[calc(100%_-_25px)]">
            <template v-for="exp of exportedFiles">
              <div
                v-if="exp.status === JobStatus.COMPLETED ? exp.result : true"
                :key="exp.id"
                class="p-3 flex gap-2 justify-between border-b-1"
                :class="{
                  'px-4 py-3': fullscreen,
                  'px-3 py-2 border-1 border-atm-border-gray-medium mx-3 rounded-lg': !fullscreen,
                  'bg-atm-bg-default hover:bg-atm-bg-gray-extralight': exp.status === JobStatus.COMPLETED,
                  'bg-atm-bg-red-light': exp.status !== JobStatus.COMPLETED,
                }"
              >
                <div
                  class="flex-1 flex items-start gap-3"
                  :class="{
                    'max-w-[calc(100%_-_74px)]': exp.status === JobStatus.COMPLETED && !exp.result.isNew,
                    'max-w-[calc(100%_-_113px)]': exp.status === JobStatus.COMPLETED && exp.result.isNew,
                    'max-w-[calc(100%_-_48px)]': exp.status !== JobStatus.COMPLETED && !exp.result.isNew,
                    'max-w-[calc(100%_-_85px)]': exp.status !== JobStatus.COMPLETED && exp.result.isNew,
                  }"
                >
                  <AtTooltip v-if="[JobStatus.COMPLETED, JobStatus.FAILED].includes(exp.status)" class="flex">
                    <template #title>
                      {{ jobStatusTooltip[exp.status] }}
                    </template>
                    <GeneralIcon
                      :icon="exp.status === JobStatus.COMPLETED ? 'circleCheckSolid' : 'alertTriangleSolid'"
                      class="flex-none h-5 w-5"
                      :class="{
                        '!text-green-700': exp.status === JobStatus.COMPLETED,
                        '!text-red-700': exp.status === JobStatus.FAILED,
                      }"
                    />
                  </AtTooltip>
                  <div v-else class="h-5 flex items-center">
                    <GeneralLoader size="regular" class="flex-none" />
                  </div>

                  <div class="flex-1 max-w-[calc(100%_-_28px)] flex flex-col gap-1">
                    <div class="inline-flex gap-1 text-sm text-atm-content-gray -ml-[1px]">
                      <span class="inline-flex items-center h-5">
                        <GeneralIcon
                          icon="file"
                          class="flex-none text-atm-content-gray-subtle2/80 dark:text-atm-content-gray-subtle2 h-3.5 w-3.5"
                        />
                      </span>
                      <AtTooltip class="truncate max-w-[calc(100%_-_20px)]" show-on-truncate-only>
                        <template #title>
                          {{ exp.result.title || titleHelper() }}
                        </template>
                        {{ exp.result.title || titleHelper() }}
                      </AtTooltip>
                    </div>

                    <div v-if="exp.result.timestamp" name="error" class="text-small leading-[18px] text-atm-content-gray-muted">
                      {{ timeAgo(dayjs(exp.result.timestamp).toString()) }}
                    </div>
                  </div>
                </div>

                <div v-if="exp.result.isNew" class="flex h-7 flex items-center">
                  <AtBadge color="green" :border="false" class="!bg-atm-bg-green-light !text-atm-content-green-dark">{{
                    $t('general.new')
                  }}</AtBadge>
                </div>
                <div v-if="exp.status === JobStatus.COMPLETED" class="flex" @click="handleDownload(urlHelper(exp.result.url))">
                  <AtTooltip class="flex">
                    <template #title>
                      {{ $t('general.download') }}
                    </template>

                    <AtButton type="secondary" size="xs" class="!px-[5px]">
                      <div class="flex items-center gap-2">
                        <GeneralIcon icon="download" />
                      </div>
                    </AtButton>
                  </AtTooltip>
                </div>

                <div class="flex">
                  <AtTooltip class="flex" :placement="extensionAccess.update ? 'top' : 'left'">
                    <template #title>
                      {{
                        extensionAccess.update
                          ? $t('general.remove')
                          : $t('tooltip.youDoNotHaveSufficientPermissionToPerformThisAction')
                      }}
                    </template>

                    <AtButton
                      :disabled="!extensionAccess.update"
                      type="text"
                      size="xs"
                      class="!px-[5px]"
                      @click="onRemoveExportedFile(exp.id)"
                    >
                      <GeneralIcon icon="close" />
                    </AtButton>
                  </AtTooltip>
                </div>
              </div>
            </template>
          </div>
          <div v-else-if="fullscreen" class="px-3 py-2 flex-1 flex items-center justify-center text-atm-content-gray">
            <a-empty
              :image-style="{
                height: '24px',
              }"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="No exports"
              class="!my-0"
            />
          </div>
        </div>
      </div>
    </div>
  </ExtensionsExtensionWrapper>
</template>

<style lang="scss" scoped>
.data-exporter {
  @apply flex flex-col overflow-hidden h-full;
  .data-exporter-header {
    @apply px-3 py-1 bg-atm-bg-gray-light text-[11px] leading-4 text-atm-content-gray-subtle2 border-b-1;
  }

  .atm-data-exporter-select-wrapper {
    &:not(:focus-within) {
      &::after {
        @apply absolute left-1/2 h-full content-[''] border-r-1 border-atm-border-gray-medium;
      }
    }
  }

  :deep(.atm-data-exporter-table-select.ant-select) {
    &.ant-select-focused {
      .ant-select-selector {
        @apply z-10 !rounded-r-lg;
      }
    }

    &:not(.ant-select-focused) {
      .ant-select-selector {
        @apply !border-transparent !shadow-none;
      }
    }

    .ant-select-selector {
      @apply relative !rounded-lg !text-sm;
    }
  }

  :deep(.atm-data-exporter-view-select.ant-select) {
    &.ant-select-focused {
      .ant-select-selector {
        @apply z-10 !rounded-l-lg;
      }
    }

    &:not(.ant-select-focused) {
      .ant-select-selector {
        @apply !border-transparent !shadow-none;
      }
    }

    .ant-select-selector {
      @apply relative !rounded-lg !text-sm;
    }
  }

  :deep(.atm-data-exporter-separator.ant-select),
  :deep(.atm-data-exporter-encoding.ant-select) {
    .ant-select-selector {
      @apply !rounded-lg h-8;
    }
  }

  .data-exporter-body {
    @apply flex-1 overflow-hidden;
  }

  .data-exporter-footer {
    @apply flex items-center justify-end bg-atm-bg-gray-light;
  }
}
</style>

<style lang="scss">
.atm-atm-data-exporter .extension-content {
  @apply !p-0;
}
</style>
