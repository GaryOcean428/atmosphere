<script setup lang="ts">
const props = defineProps<{
  modelValue: any[]
  disabled?: boolean
}>()

const emits = defineEmits(['update:modelValue'])

const vModel = useVModel(props, 'modelValue', emits)

const addParamRow = () =>
  vModel.value.push({
    enabled: true,
    name: '',
    value: '',
  })

const deleteParamRow = (i: number) => {
  if (vModel.value.length === 1) return

  vModel.value.splice(i, 1)
}
</script>

<template>
  <div class="flex flex-col py-3 gap-1.5 w-full">
    <div v-for="(paramRow, idx) in vModel" :key="idx" class="flex relative items-center w-full">
      <a-form-item class="form-item w-8">
        <AtCheckbox v-model:checked="paramRow.enabled" size="large" :disabled="disabled" />
      </a-form-item>
      <a-form-item class="form-item w-3/6">
        <a-input
          v-model:value="paramRow.name"
          :disabled="disabled"
          :placeholder="$t('placeholder.key')"
          class="!rounded-l-lg !border-atm-border-gray-medium"
        />
      </a-form-item>
      <a-form-item class="form-item w-3/6">
        <a-input
          v-model:value="paramRow.value"
          :disabled="disabled"
          :placeholder="$t('placeholder.value')"
          class="atm-webhook-parameters-value-input !border-x-0 !border-atm-border-gray-medium !rounded-none"
        />
      </a-form-item>

      <AtButton
        class="!rounded-l-none delete-btn !border-atm-border-gray-medium !shadow-none"
        type="secondary"
        size="small"
        :disabled="vModel.length === 1 || disabled"
        @click="deleteParamRow(idx)"
      >
        <component :is="iconMap.deleteListItem" />
      </AtButton>
    </div>

    <div class="mt-1.5">
      <AtButton size="small" type="secondary" class="atm-btn-focus" :disabled="disabled" @click="addParamRow">
        <div class="flex flex-row items-center gap-x-2">
          <component :is="iconMap.plus" class="flex-none" />
          <div data-rec="true">{{ $t('general.add') }}</div>
        </div>
      </AtButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ant-input {
  box-shadow: none !important;

  &:hover:not(:disabled) {
    @apply !hover:bg-atm-bg-gray-extralight;
  }
}

.delete-btn:not([disabled]) {
  @apply !text-atm-content-gray-muted;
}

:deep(.ant-input) {
  @apply !placeholder-atm-content-gray-muted;
}

:deep(.ant-input.atm-webhook-parameters-value-input) {
  @apply !border-x-0;
}

.ant-input-affix-wrapper {
  @apply px-4 rounded-lg py-2 w-84 border-1 focus:border-atm-border-brand border-atm-border-gray-medium !ring-0;
}

.atm-btn-focus:focus {
  @apply !text-atm-content-brand !shadow-none;
}
</style>
