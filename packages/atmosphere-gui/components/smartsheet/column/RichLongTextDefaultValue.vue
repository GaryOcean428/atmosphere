<script lang="ts" setup>
const props = defineProps<{
  value: any
  isVisibleDefaultValueInput: boolean
}>()
const emits = defineEmits(['update:value', 'update:isVisibleDefaultValueInput'])

provide(EditColumnInj, ref(true))

const vModel = useVModel(props, 'value', emits)

const isVisibleDefaultValueInput = useVModel(props, 'isVisibleDefaultValueInput', emits)

const { isAiModeFieldModal } = usePredictFields()

const { isSyncedField } = useColumnCreateStoreOrThrow()

const defaultValueWrapperRef = ref<HTMLDivElement>()

const cdfValue = computed({
  get: () => vModel.value.cdf,
  set: (value) => {
    if (value === '<br />' || value === '<br>') {
      vModel.value.cdf = null
    } else {
      vModel.value.cdf = value
    }
  },
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
    <AtTooltip :disabled="!vModel.unique" placement="right">
      <template #title>
        <div class="max-w-xs">
          {{ $t('tooltip.cannotSetDefaultValueWithUnique') }}
        </div>
      </template>
      <AtButton
        size="small"
        type="text"
        :disabled="isSyncedField || vModel.unique"
        class="text-atm-content-gray-subtle"
        data-testid="atm-show-default-value-btn"
        @click.stop="handleShowInput"
      >
        <div class="flex items-center gap-2">
          <GeneralIcon icon="plus" class="flex-none h-4 w-4" />
          <span>{{ $t('general.set') }} {{ $t('placeholder.defaultValue').toLowerCase() }}</span>
        </div>
      </AtButton>
    </AtTooltip>
  </div>

  <div v-else>
    <div class="w-full flex items-center gap-2 mb-2">
      <div class="text-small leading-[18px] flex-1 text-atm-content-gray-subtle">{{ $t('placeholder.defaultValue') }}</div>
    </div>
    <div class="flex flex-row gap-2">
      <div
        ref="defaultValueWrapperRef"
        class="atm-default-value-wrapper atm-rich-long-text-default-value border-1 relative pt-7 flex items-center w-full px-0 border-atm-border-gray-dark rounded-md max-h-70 pb-1 focus-within:(border-atm-border-brand shadow-selected) transition-all duration-0.3s"
        :class="{
          'bg-atm-bg-default': isAiModeFieldModal,
          'bg-atm-bg-gray-light opacity-60 pointer-events-none': vModel.unique,
        }"
      >
        <LazyCellRichText
          v-model:value="cdfValue"
          class="border-t-1 border-atm-border-gray-light !max-h-80 !min-h-30 text-atm-content-gray-subtle2"
          :class="{
            'pointer-events-none': vModel.unique,
          }"
          :disabled="vModel.unique"
          show-menu
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-rich-long-text-default-value {
  :deep(.atm-rich-text) {
    .bubble-menu.embed-mode.edit-column-mode {
      @apply gap-x-0 p-0 h-7 border-0;

      .atm-button {
        @apply !mt-0 h-7 p-1 min-w-7;

        svg {
          @apply h-4 w-4;
        }
      }
      .divider {
        @apply !m-0 !h-7 border-atm-border-gray-light;
      }
    }
  }
}
</style>
