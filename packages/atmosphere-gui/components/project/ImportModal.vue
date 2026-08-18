<script lang="ts" setup>
import type { SourceType } from 'atmosphere-sdk'

const props = defineProps<{
  visible: boolean
  source: SourceType
}>()

const emits = defineEmits(['update:visible'])

const source = toRef(props, 'source')

const visible = useVModel(props, 'visible', emits)

const { $e } = useNuxtApp()

const { isMobileMode } = useGlobal()

const { showRecordPlanLimitExceededModal, isEEFeatureBlocked } = useEeConfig()

async function openAirtableImportDialog(baseId?: string, sourceId?: string) {
  if (!baseId || !sourceId) return

  $e('a:actions:import-airtable')

  const isOpen = ref(true)

  await nextTick()
  visible.value = false

  const { close } = useDialog(resolveComponent('DlgAirtableImport'), {
    'modelValue': isOpen,
    'baseId': baseId,
    'sourceId': sourceId,
    'onUpdate:modelValue': closeDialog,
    'showBackBtn': true,
    'onBack': () => {
      visible.value = true
    },
  })

  function closeDialog() {
    isOpen.value = false

    close(1000)
  }
}

async function openAtmosphereImportDialog(baseId?: string) {
  if (!baseId) return

  // $e('a:actions:import-atmosphere')

  const isOpen = ref(true)

  await nextTick()
  visible.value = false

  const { close } = useDialog(resolveComponent('DlgAtmosphereImport'), {
    'modelValue': isOpen,
    'baseId': baseId,
    'onUpdate:modelValue': closeDialog,
    'showBackBtn': true,
    'onBack': () => {
      visible.value = true
    },
  })

  function closeDialog() {
    isOpen.value = false

    close(1000)
  }
}

async function openQuickImportDialog(type: 'csv' | 'excel' | 'json') {
  if (!source.value.id || !source.value.base_id) return

  $e(`a:actions:import-${type}`)

  const isOpen = ref(true)

  await nextTick()
  visible.value = false

  const { close } = useDialog(resolveComponent('DlgQuickImport'), {
    'modelValue': isOpen,
    'importType': type,
    'baseId': source.value.base_id,
    'sourceId': source.value.id,
    'onUpdate:modelValue': closeDialog,
    'showBackBtn': true,
    'onBack': () => {
      visible.value = true
    },
  })

  function closeDialog() {
    isOpen.value = false

    close(1000)
  }
}

const onClick = (type: 'airtable' | 'csv' | 'excel' | 'json' | 'atmosphere') => {
  if (showRecordPlanLimitExceededModal()) return

  if (type === 'airtable') {
    openAirtableImportDialog(source.value.base_id, source.value.id)
  } else if (type === 'atmosphere') {
    openAtmosphereImportDialog(source.value.base_id)
  } else {
    openQuickImportDialog(type)
  }
}
</script>

<template>
  <GeneralModal v-model:visible="visible" width="448px" class="!top-[25vh]">
    <div class="flex flex-col p-4 md:(px-6 pt-6 pb-9)">
      <div class="flex items-center gap-3 mb-4 md:mb-6">
        <div class="text-base font-weight-700">{{ $t('labels.importDataFrom') }}</div>
      </div>
      <AtMenu class="border-1 divide-y-1 atm-import-items-menu overflow-clip">
        <AtMenuItem @click="onClick('airtable')">
          <GeneralIcon icon="importAirtable" class="w-5 h-5" />
          <span class="ml-1 text-[13px] font-weight-700"> {{ $t('labels.airtable') }} </span>
          <GeneralIcon icon="chevronRight" class="ml-auto text-lg" />
        </AtMenuItem>
        <AtMenuItem @click="onClick('csv')">
          <GeneralIcon icon="importCsv" class="w-5 h-5" />
          <span class="ml-1 text-[13px] font-weight-700"> {{ $t('labels.csv') }} </span>
          <GeneralIcon icon="chevronRight" class="ml-auto text-lg" />
        </AtMenuItem>
        <AtMenuItem @click="onClick('json')">
          <GeneralIcon icon="importJson" class="w-5 h-5" />
          <span class="ml-1 text-[13px] font-weight-700"> {{ $t('labels.jsonCapitalized') }} </span>
          <GeneralIcon icon="chevronRight" class="ml-auto text-lg" />
        </AtMenuItem>
        <AtMenuItem @click="onClick('excel')">
          <GeneralIcon icon="importExcel" class="w-5 h-5" />
          <span class="ml-1 text-[13px] font-weight-700"> {{ $t('labels.excel') }} </span>
          <GeneralIcon icon="chevronRight" class="ml-auto text-lg" />
        </AtMenuItem>
        <AtMenuItem v-if="isEeUI && !isEEFeatureBlocked && !isMobileMode" @click="onClick('atmosphere')">
          <GeneralIcon icon="atmosphere1" class="w-5 h-5" />
          <span class="ml-1 text-[13px] font-weight-700"> {{ $t('objects.syncData.atmosphere') }} </span>
          <GeneralIcon icon="chevronRight" class="ml-auto text-lg" />
        </AtMenuItem>
        <!-- <AtMenuItem disabled>
          <GeneralIcon icon="importSheets" class="w-5 h-5 opacity-50" />
          <span class="ml-1 text-[13px] font-weight-700 text-[#6A7184]">
            Sheet
          </span>
          <span class="ml-auto text-primary bg-[#F0F3FF] px-1 rounded-md mr-2 font-weight-500 text-[13px]">
            {{ $t('title.comingSoon') }}
          </span>
          <GeneralIcon icon="chevronRight" class="text-lg" />
        </AtMenuItem> -->
        <!-- <AtMenuItem disabled>
          <GeneralIcon icon="importSalesforce" class="w-5 h-5 text-white" />
          <span class="ml-1 text-[13px] font-weight-700 text-[#6A7184]">
            Salesforce
          </span>
          <span class="ml-auto text-primary bg-[#F0F3FF] px-1 rounded-md mr-2 font-weight-500 text-[13px]">
            {{ $t('title.comingSoon') }}
          </span>
          <GeneralIcon icon="chevronRight" class="text-lg" />
        </AtMenuItem> -->
        <!-- <AtMenuItem disabled>
          <GeneralIcon icon="importMonday" class="w-5 h-5" />
          <span class="ml-1 text-[13px] font-weight-700 text-[#6A7184]">
            Monday.com
          </span>
          <span class="ml-auto text-primary bg-[#F0F3FF] px-1 rounded-md mr-2 font-weight-500 text-[13px]">
            {{ $t('title.comingSoon') }}
          </span>
          <GeneralIcon icon="chevronRight" class="text-lg" />
        </AtMenuItem> -->
      </AtMenu>
    </div>
  </GeneralModal>
</template>

<style lang="scss" scoped>
.atm-import-items-menu {
  padding: 0 !important;
  border-radius: 8px !important;
  & :deep(.atm-menu-item) {
    border: 0px !important;
    &:hover {
      @apply bg-atm-bg-gray-extralight text-atm-content-gray-extreme;
    }
    margin: 0 !important;
    &.ant-menu-item-disabled {
      @apply bg-atm-bg-gray-extralight;
    }
    & .ant-menu-title-content {
      width: 100%;
      display: flex;
      align-items: center;
      & .atm-menu-item-inner {
        width: 100%;
      }
    }
  }
}

.ant-menu-inline,
.ant-menu-vertical,
.ant-menu-vertical-left {
  @apply border-r-atm-border-gray-medium;
}
</style>
