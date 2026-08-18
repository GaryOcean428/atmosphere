<script lang="ts" setup>
import { UITypes } from 'atmosphere-sdk'

const props = defineProps<{
  value: any
  isVisibleDefaultValueInput: boolean
}>()
const emits = defineEmits(['update:value', 'update:isVisibleDefaultValueInput'])

provide(EditColumnInj, ref(true))

const vModel = useVModel(props, 'value', emits)

const meta = inject(MetaInj, ref())

const isVisibleDefaultValueInput = useVModel(props, 'isVisibleDefaultValueInput', emits)

const rowRef = ref({
  row: {},
  oldRow: {},
  rowMeta: {
    isUpdatedFromCopyNPaste: [vModel.value?.title],
  },
})

useProvideSmartsheetRowStore(rowRef)

const { isAiModeFieldModal } = usePredictFields()

const cdfValue = ref<string | null>(null)

const editEnabled = ref(false)

const defaultValueWrapperRef = ref<HTMLDivElement>()

const updateCdfValue = (cdf: string | null) => {
  vModel.value = { ...vModel.value, cdf }
  cdfValue.value = cdf
}

onMounted(() => {
  updateCdfValue(vModel.value?.cdf ?? null)
})

watch(
  () => vModel.value.cdf,
  (newValue) => {
    cdfValue.value = newValue
  },
)

const { sqlUis } = storeToRefs(useBase())
const sqlUi = computed(() =>
  meta.value?.source_id && sqlUis.value[meta.value?.source_id]
    ? sqlUis.value[meta.value?.source_id]
    : Object.values(sqlUis.value)[0],
)

const showCurrentDateOption = computed(() => {
  return [UITypes.Date, UITypes.DateTime].includes(vModel.value?.uidt) && sqlUi.value?.getCurrentDateDefault?.(vModel.value)
})

const isCurrentDate = computed(() => {
  return showCurrentDateOption.value && cdfValue.value?.toUpperCase?.() === sqlUi.value?.getCurrentDateDefault?.(vModel.value)
})

const { isSystem, isSyncedField } = useColumnCreateStoreOrThrow()

const validationError = computed(() => {
  return getColumnValidationError(vModel.value)
})

const handleShowInput = () => {
  isVisibleDefaultValueInput.value = true

  // In playwright testing we first enable this default input and then start filling all fields
  // So it's imp to not to focus input
  if (ncIsPlaywright()) return

  nextTick(() => {
    ncDelay(300).then(() => {
      if (defaultValueWrapperRef.value) {
        focusInputEl('.atm-cell', defaultValueWrapperRef.value)
      }
    })
  })
}
</script>

<template>
  <div v-if="!isVisibleDefaultValueInput">
    <AtTooltip :disabled="!isSyncedField" placement="right">
      <AtTooltip :disabled="!vModel.unique" placement="right">
        <template #title>
          <div class="max-w-xs">
            {{ $t('msg.info.defaultValueNotAllowedForUniqueFields') }}
          </div>
        </template>
        <AtButton
          size="small"
          type="text"
          class="!text-atm-content-gray-subtle"
          data-testid="atm-show-default-value-btn"
          :disabled="isSystem || isSyncedField || vModel.unique"
          @click.stop="handleShowInput"
        >
          <div class="flex items-center gap-2">
            <GeneralIcon icon="plus" class="flex-none h-4 w-4" />
            <span>{{ $t('general.set') }} {{ $t('placeholder.defaultValue').toLowerCase() }}</span>
          </div>
        </AtButton>
      </AtTooltip>
      <template #title>
        {{ $t('msg.info.defaultValSyncedCol') }}
      </template>
    </AtTooltip>
  </div>

  <div v-else>
    <div class="w-full flex items-center gap-2 mb-2">
      <div class="text-small leading-[18px] flex-1 text-atm-content-gray-subtle">{{ $t('placeholder.defaultValue') }}</div>
    </div>
    <div class="flex flex-row gap-2 relative">
      <div
        class="atm-default-value-wrapper border-1 flex items-center w-full px-3 border-atm-border-gray-dark rounded-lg sm:min-h-[32px] xs:min-h-13 focus-within:(border-atm-border-brand shadow-selected ring-0) transition-all duration-0.3s"
        :class="{
          'bg-atm-bg-default': isAiModeFieldModal,
          'bg-atm-bg-gray-light opacity-60': vModel.unique,
        }"
      >
        <div ref="defaultValueWrapperRef" class="relative flex-grow max-w-full">
          <div
            v-if="isCurrentDate"
            class="absolute pointer-events-none h-full w-full bg-atm-bg-default z-2 top-0 left-0 rounded-full items-center flex bg-atm-bg-default"
          >
            <div class="-ml-2">
              <AtBadge>{{ $t('labels.currentDate') }}</AtBadge>
            </div>
          </div>
          <LazySmartsheetCell
            :edit-enabled="!vModel.unique"
            :model-value="cdfValue"
            :column="vModel"
            class="!border-none h-auto my-auto"
            :class="{
              'pointer-events-none': vModel.unique,
            }"
            @update:cdf="updateCdfValue"
            @update:edit-enabled="editEnabled = $event"
            @click="editEnabled = !vModel.unique"
          />
        </div>
        <AtTooltip :title="$t('general.clear')" class="flex">
          <component
            :is="iconMap.close"
            v-if="
              ![UITypes.Year, UITypes.Date, UITypes.Time, UITypes.DateTime, UITypes.SingleSelect, UITypes.MultiSelect].includes(
                vModel.uidt,
              ) || isCurrentDate
            "
            :class="{
              'w-4 h-4 cursor-pointer rounded-full z-3 text-atm-content-gray-muted hover:bg-atm-bg-gray-extralight dark:hover:bg-atm-bg-gray-medium default-value-clear':
                !vModel.unique,
              'w-4 h-4 rounded-full z-3 text-atm-content-gray-muted opacity-50 pointer-events-none': vModel.unique,
            }"
            @click.stop="!vModel.unique && updateCdfValue(null)"
          />
        </AtTooltip>
      </div>
    </div>
    <div v-if="validationError" class="text-atm-content-red-medium text-small leading-[18px] mt-1">{{ $t(validationError) }}</div>
  </div>
</template>
