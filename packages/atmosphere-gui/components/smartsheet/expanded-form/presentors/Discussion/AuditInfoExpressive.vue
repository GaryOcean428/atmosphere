<script setup lang="ts">
import type { AttachmentType, AuditType } from 'atmosphere-sdk'
import { checkboxIconListMap, isAIPromptCol, parseHelper, ratingIconListMap } from 'atmosphere-sdk'

/* interface */

const props = defineProps<{
  audit: AuditType
}>()

const details = computed(() => {
  try {
    return JSON.parse(props.audit.details || '')
  } catch (e) {
    return {}
  }
})

const oldData = computed(() => {
  return details.value.old_data ?? {}
})

const newData = computed(() => {
  return details.value.data ?? {}
})

const meta = computed(() => {
  return details.value.column_meta ?? {}
})

const columnKeys = computed(() => {
  return Object.keys(newData.value)
})

/* provides */

provide(RawReadonlyInj, ref(true))

/* attachment */

const { getPossibleAttachmentSrc } = useAttachment()

/* meta processing */

function normalizeColOptions(key: string) {
  return {
    ...(meta.value?.[key]?.options ?? {}),
    options: meta.value?.[key]?.options?.choices,
  }
}

function normalizeMeta(key: string) {
  const mta = meta.value?.[key] ?? {}
  const opts = normalizeColOptions(key)
  const icn = opts.icon || (mta.type === 'Rating' ? 'star' : 'circle-check')

  return {
    ...opts,
    ...mta,
    icon: mta.type === 'Rating' ? ratingIconListMap[icn] : checkboxIconListMap[icn],
    duration: opts.duration_format ? durationOptions.find((it) => it.title === opts.duration_format)?.id : undefined,
    is12hrFormat: opts['12hr_format'],
    isLocaleString: opts.locale_string,
    isDisplayTimezone: opts?.isDisplayTimezone || opts?.is_display_timezone,
    useSameTimezoneForAll: opts?.useSameTimezoneForAll || opts?.use_same_timezone_for_all,
  }
}

function processOldDataFor(key: string) {
  const odata = oldData.value[key]
  const ndata = newData.value[key]

  if (meta.value?.[key]?.type === 'Attachment') {
    // Attachment cell value can be string so we have to parse it

    if (!ncIsArray(parseHelper(odata))) return []

    return parseHelper(odata)?.filter((it: AttachmentType) => {
      if (!ncIsArray(parseHelper(ndata))) return true

      return !parseHelper(ndata)?.some((t: AttachmentType) => t.title === it.title)
    })
  }
  if (meta.value?.[key]?.type === 'MultiSelect') {
    return odata?.filter?.((it: string) => !ndata?.includes?.(it)) ?? odata
  }

  return odata
}

function processNewDataFor(key: string) {
  const odata = oldData.value[key]
  const ndata = newData.value[key]

  if (meta.value?.[key]?.type === 'Attachment') {
    if (!ncIsArray(ndata)) return []

    return ndata.filter((it: AttachmentType) => ncIsArray(odata) && !odata?.some((t: AttachmentType) => t.title === it.title))
  }
  if (meta.value?.[key]?.type === 'MultiSelect') {
    return ndata?.filter?.((it: string) => !odata?.includes?.(it)) ?? ndata
  }

  return ndata
}

function shouldUseNormalizedPadding(key: string) {
  return !['Checkbox', 'SingleSelect', 'MultiSelect', 'User'].includes(meta.value?.[key]?.type) && !normalizeMeta(key).is_progress
}

function shouldUseUniformPadding(key: string) {
  return ['SingleSelect', 'MultiSelect', 'User'].includes(meta.value?.[key]?.type)
}

/* visibility */

function isShowableValue(value: any) {
  return ![undefined, null, ''].includes(value)
}

const isAiGeneratedText = (key: string) => {
  return (
    isAIPromptCol({
      uidt: meta.value?.[key]?.type,
      dt: meta.value?.[key]?.type === 'Number' ? 'bigint' : undefined,
      meta: normalizeMeta(key),
    }) &&
    (!ncIsObject(newData.value[key]) || !newData.value[key]?.lastModifiedBy)
  )
}
</script>

<template>
  <div v-for="columnKey in columnKeys" :key="columnKey" class="relative not-last:mb-4">
    <GeneralIcon
      icon="ncNode"
      class="w-[16px] h-[16px] text-atm-content-gray-muted bg-atm-bg-default absolute left-0 transform -translate-x-1/2"
      :class="[
        ['JSON', 'Attachment', 'SingleLineText', 'LongText'].includes(meta[columnKey]?.type)
          ? 'top-1'
          : 'top-1/2 -translate-y-2/5',
      ]"
    />
    <div class="ml-6.5">
      <div class="text-small1 font-weight-500 inline-flex items-center flex-wrap gap-1 !w-full !max-w-full">
        <span class="text-atm-content-gray-subtle2 text-xs"> {{ $t('activity.changed') }} </span>
        <span
          class="rounded-md px-1 !h-[20px] inline-flex items-center gap-1 text-atm-content-gray-emphasis border-1 border-atm-border-gray-medium max-w-full"
        >
          <SmartsheetHeaderIcon
            :column="{
              uidt: meta[columnKey]?.type,
              dt: meta[columnKey]?.type === 'Number' ? 'bigint' : undefined,
              meta: normalizeMeta(columnKey),
            }"
            class="!w-4 !h-4 !mx-0"
            color="text-atm-content-gray-emphasis"
          />

          <AtTooltip class="truncate" show-on-truncate-only>
            <template #title>
              {{ columnKey }}
            </template>

            {{ columnKey }}
          </AtTooltip>

          <span v-if="isAiGeneratedText(columnKey)" class="whitespace-nowrap text-xs text-atm-content-purple-medium">
            ({{ $t('labels.generatedByAi') }})
          </span>
        </span>
        <template v-if="meta[columnKey]?.type === 'Attachment'">
          <div v-if="processOldDataFor(columnKey)?.length > 0" class="w-full">
            <div
              class="border-1 border-atm-red-200 rounded-md bg-atm-bg-red-light p-0.5 flex flex-col items-start gap-0.5 w-[284px]"
            >
              <div
                v-for="(item, i) of processOldDataFor(columnKey)"
                :key="item.url || item.title"
                class="border-1 border-atm-border-gray-medium rounded-md bg-atm-bg-default w-full"
              >
                <div class="flex items-center gap-2 w-full">
                  <div class="flex items-center justify-center w-8 aspect-square">
                    <LazyCellAttachmentPreviewImage
                      v-if="isImage(item.title, item.mimetype ?? item.type)"
                      :alt="item.title || `#${i}`"
                      class="atm-attachment rounded !w-5.5 !h-5.5 object-cover overflow-hidden"
                      :srcs="getPossibleAttachmentSrc(item, 'small')"
                    />
                    <div v-else class="atm-attachment flex items-center justify-center">
                      <CellAttachmentIconView :item="item" class="!w-8 !h-8" />
                    </div>
                  </div>
                  <span class="w-0 flex-1 truncate text-small1 font-weight-500 text-atm-content-gray-subtle2">
                    {{ item.title }}
                  </span>
                  <span class="text-xs font-weight-500 p-2 text-atm-content-gray-muted">
                    {{ getReadableFileSize(item.size) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="processNewDataFor(columnKey)?.length > 0" class="w-full">
            <div
              class="border-1 border-atm-green-200 rounded-md bg-atm-bg-green-light p-0.5 flex flex-col items-start gap-0.5 w-[284px]"
            >
              <div
                v-for="(item, i) of processNewDataFor(columnKey)"
                :key="item.url || item.title"
                class="border-1 border-atm-border-gray-medium rounded-md bg-atm-bg-default w-full"
              >
                <div class="flex items-center gap-2 w-full">
                  <div class="flex items-center justify-center w-8 aspect-square">
                    <LazyCellAttachmentPreviewImage
                      v-if="isImage(item.title, item.mimetype ?? item.type)"
                      :alt="item.title || `#${i}`"
                      class="atm-attachment rounded !w-5.5 !h-5.5 object-cover overflow-hidden"
                      :srcs="getPossibleAttachmentSrc(item, 'small')"
                    />
                    <div v-else class="atm-attachment flex items-center justify-center">
                      <CellAttachmentIconView :item="item" class="!w-8 !h-8" />
                    </div>
                  </div>
                  <span class="w-0 flex-1 truncate text-small1 font-weight-500 text-atm-content-gray-subtle2">
                    {{ item.title }}
                  </span>
                  <span class="text-xs font-weight-500 p-2 text-atm-content-gray-muted">
                    {{ getReadableFileSize(item.size) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="meta[columnKey]?.type === 'SingleLineText'">
          <template v-for="(block, i) of diffTextBlocks(oldData[columnKey] || '', newData[columnKey] || '')" :key="i">
            <span
              v-if="block.op === 'removed'"
              class="max-w-full text-atm-content-red-dark border-1 border-atm-red-200 rounded-md px-1 bg-atm-bg-red-light line-through decoration-clone !leading-[18px]"
            >
              {{ block.text }}
            </span>
            <span
              v-else-if="block.op === 'added'"
              class="max-w-full text-atm-content-green-dark border-1 border-atm-green-200 rounded-md px-1 bg-atm-bg-green-light decoration-clone !leading-[18px]"
            >
              {{ block.text }}
            </span>
            <span v-else class="max-w-full !leading-[18px]">
              {{ block.text }}
            </span>
          </template>
        </template>
        <template v-else-if="meta[columnKey]?.type === 'LongText'">
          <div class="w-full border-1 rounded-md p-1">
            <template
              v-for="(block, i) of diffTextBlocks(
                meta[columnKey]?.type === 'LongText' && meta[columnKey]?.options?.ai
                  ? oldData[columnKey]?.value || ''
                  : oldData[columnKey] || '',
                meta[columnKey]?.type === 'LongText' && meta[columnKey]?.options?.ai
                  ? newData[columnKey]?.value || ''
                  : newData[columnKey] || '',
              )"
              :key="i"
            >
              <span
                v-if="block.op === 'removed'"
                class="max-w-full text-atm-content-red-dark px-1 bg-atm-bg-red-light rounded-md line-through decoration-clone !leading-[18px]"
                :class="{
                  'whitespace-pre-wrap': meta[columnKey]?.type === 'LongText',
                }"
              >
                {{ block.text }}
              </span>
              <span
                v-else-if="block.op === 'added'"
                class="max-w-full text-atm-content-green-dark px-1 bg-atm-bg-green-light rounded-md decoration-clone !leading-[18px]"
                :class="{
                  'whitespace-pre-wrap': meta[columnKey]?.type === 'LongText',
                }"
              >
                {{ block.text }}
              </span>
              <span
                v-else
                class="max-w-full !leading-[18px]"
                :class="{
                  'whitespace-pre-wrap': meta[columnKey]?.type === 'LongText',
                }"
              >
                {{ block.text }}
              </span>
            </template>
          </div>
        </template>
        <template v-else-if="meta[columnKey]?.type === 'JSON'">
          <div class="w-full flex justify-start">
            <pre
              v-if="isShowableValue(processOldDataFor(columnKey))"
              class="!text-atm-content-red-dark border-1 border-atm-red-200 rounded-md bg-atm-bg-red-light line-through !mb-0 mt-1 p-1 max-w-full atm-scrollbar-thin"
              >{{ processOldDataFor(columnKey) }}</pre
            >
          </div>
          <div class="w-full flex justify-start">
            <pre
              v-if="isShowableValue(processNewDataFor(columnKey))"
              class="!text-atm-content-green-dark border-1 border-atm-green-200 rounded-md bg-atm-bg-green-light !mb-0 mt-1 p-1 max-w-full atm-scrollbar-thin"
              >{{ processNewDataFor(columnKey) }}</pre
            >
          </div>
        </template>
        <template v-else>
          <div
            v-if="isShowableValue(processOldDataFor(columnKey))"
            :data-label="processOldDataFor(columnKey)"
            class="max-w-full atm-expressive-mini-item-cell atm-audit-removal !text-atm-content-red-dark border-1 border-atm-red-200 rounded-md bg-atm-bg-red-light line-through"
            :class="{
              'px-1 py-0': shouldUseNormalizedPadding(columnKey),
              '!px-0.25 !py-0.25': shouldUseUniformPadding(columnKey),
            }"
          >
            <SmartsheetCell
              :column="{
                uidt: meta[columnKey]?.type,
                dt: meta[columnKey]?.type === 'Number' ? 'bigint' : undefined,
                meta: normalizeMeta(columnKey),
                colOptions: normalizeColOptions(columnKey),
              }"
              :model-value="processOldDataFor(columnKey)"
              :edit-enabled="false"
              :read-only="true"
              class="!text-atm-content-red-dark"
              :class="{
                'min-w-[100px]': normalizeMeta(columnKey).is_progress,
              }"
            />
          </div>
          <div
            v-if="isShowableValue(processNewDataFor(columnKey))"
            :data-label="processNewDataFor(columnKey)"
            class="max-w-full atm-expressive-mini-item-cell atm-audit-addition border-1 border-atm-green-200 rounded-md bg-atm-bg-green-light"
            :class="{
              'px-1 py-0': shouldUseNormalizedPadding(columnKey),
              '!px-0.25 !py-0.25': shouldUseUniformPadding(columnKey),
            }"
          >
            <SmartsheetCell
              :column="{
                uidt: meta[columnKey]?.type,
                dt: meta[columnKey]?.type === 'Number' ? 'bigint' : undefined,
                meta: normalizeMeta(columnKey),
                colOptions: normalizeColOptions(columnKey),
              }"
              :model-value="processNewDataFor(columnKey)"
              :edit-enabled="false"
              :read-only="true"
              class="!text-atm-content-green-dark"
              :class="{
                'min-w-[100px]': normalizeMeta(columnKey).is_progress,
              }"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-expressive-mini-item-cell :deep(.atm-cell-checkbox > div:first-child) {
  @apply pl-0;
}
.atm-expressive-mini-item-cell :deep(.atm-cell-field.atm-multi-select > div) {
  @apply !gap-1 !flex;
  & > span {
    @apply !m-0 flex items-center h-[18px];
  }
}
.atm-expressive-mini-item-cell :deep(.atm-cell-field.atm-single-select > div) {
  height: 20px !important;
  .ant-tag {
    height: 20px !important;
    @apply !m-0;
  }
}
.atm-expressive-mini-item-cell.atm-audit-removal :deep(.atm-cell-field.atm-multi-select > div) {
  span.ant-tag span.text-ellipsis {
    @apply line-through;
  }
}
.atm-expressive-mini-item-cell.atm-audit-removal :deep(.atm-cell-field.atm-single-select > div) {
  span.ant-tag span.text-ellipsis {
    @apply line-through;
  }
}
.atm-expressive-mini-item-cell :deep(.atm-cell-rating .ant-rate) {
  @apply !p-0 transform -translate-y-[1px];
}
.atm-expressive-mini-item-cell :deep(.atm-cell-percent) {
  & > div > div {
    @apply !p-0;
    &,
    & * {
      height: 6px !important;
    }
    .ant-progress-inner {
      transform: translateY(-9px) !important;
    }
  }
}
.atm-expressive-mini-item-cell :deep(.atm-cell-datetime) {
  .atm-date-picker {
    @apply !inline;
    & > div {
      @apply !inline !text-inherit text-small1;

      & > div {
        @apply !inline;
      }
    }
    & > div + div {
      @apply !ml-1;
    }
  }
}
.atm-expressive-mini-item-cell.atm-audit-removal :deep(.atm-cell-time) {
  .atm-time-picker span {
    text-decoration: line-through;
  }
}
.atm-expressive-mini-item-cell.atm-audit-removal :deep(.atm-cell-year) {
  .atm-year-picker span {
    text-decoration: line-through;
  }
}
.atm-expressive-mini-item-cell.atm-audit-removal :deep(.atm-cell-date) {
  .atm-date-picker span {
    text-decoration: line-through;
  }
}
.atm-expressive-mini-item-cell :deep(.atm-cell-user) {
  .atm-cell-field > div {
    display: flex !important;
    & > .ant-tag {
      @apply !m-0 !text-inherit !border-1 !border-atm-border-gray-dark !pr-1 !pl-0.5 !bg-atm-bg-gray-light !rounded-[17px];
      & > span > div + div {
        @apply flex items-center !text-small1 font-weight-500 !leading-[16px];
      }
      & > span {
        @apply gap-1;
      }
    }
    .atm-user-avatar {
      @apply border-1 border-atm-border-gray-medium !text-[8px];
      height: 16px !important;
      width: 16px !important;
    }
  }
}
.atm-expressive-mini-item-cell.atm-audit-removal :deep(.atm-cell-user) {
  .ant-tag > span > div + div {
    @apply !text-atm-content-red-dark;
  }
}
.atm-expressive-mini-item-cell.atm-audit-addition :deep(.atm-cell-user) {
  .ant-tag > span > div + div {
    @apply !text-atm-content-green-dark;
  }
}
</style>

<style lang="scss">
.atm-expressive-mini-item-header {
  svg {
    height: 12px;
  }
}
.atm-expressive-mini-item-cell:has(.atm-cell-user .ant-tag) {
  @apply !p-0.25;
  .atm-cell-field > div {
    @apply gap-1;
  }
}
.atm-expressive-mini-item-cell.atm-audit-removal:has(.atm-cell-user) {
  text-decoration: none;
  .ant-tag div + div {
    text-decoration: line-through;
  }
}
.atm-expressive-mini-item-cell :where(.atm-cell-email, .atm-cell-url, .atm-cell-phonenumber) a {
  @apply text-inherit !no-underline !p-0;
}
.atm-expressive-mini-item-cell :where(.atm-cell-email, .atm-cell-url, .atm-cell-phonenumber) {
  @apply !h-[20px];
}
.atm-expressive-mini-item-cell :where(.atm-cell-email, .atm-cell-url, .atm-cell-phonenumber) span {
  @apply !text-small1 !leading-[16px];
}
.atm-expressive-mini-item-cell .atm-cell-url > div > span {
  width: auto !important;
}
.atm-expressive-mini-item-cell.atm-audit-removal :where(.atm-cell-email, .atm-cell-url, .atm-cell-phonenumber) a {
  @apply !line-through !p-0;
}
.atm-expressive-mini-item-cell.atm-audit-removal :where(.atm-year-picker, .atm-time-picker, .atm-date-picker) {
  @apply !line-through;
}
.atm-expressive-mini-item-cell :where(.atm-cell-year, .atm-cell-time, .atm-cell-datetime, .atm-cell-date) span {
  @apply !text-small1 !leading-[16px];
}
.atm-expressive-mini-item-cell.atm-expressive-mini-item-cell.atm-expressive-mini-item-cell.atm-expressive-mini-item-cell
  :where(
    .atm-cell.atm-cell-percent .atm-cell-field,
    .atm-cell.atm-cell-duration .atm-cell-field,
    .atm-cell.atm-cell-currency .atm-cell-field,
    .atm-cell.atm-cell-decimal .atm-cell-field,
    .atm-cell.atm-cell-geometry .atm-cell-field,
    .atm-cell.atm-cell-number .atm-cell-field
  ) {
  font-size: 13px !important;
  line-height: 16px !important;
}
.atm-expressive-mini-item-cell .atm-cell-field:not(.atm-single-select, .atm-multi-select),
.atm-expressive-mini-item-cell .atm-cell:not(.atm-cell-singleselect, .atm-cell-multiselect) {
  @apply flex items-center h-[20px];
}
.atm-expressive-mini-item-cell
  .atm-cell
  :where(.atm-cell-field, input, textarea, .atm-cell-field-link):not(.ant-select-selection-search-input) {
  font-size: unset;
  line-height: unset;
}
</style>
