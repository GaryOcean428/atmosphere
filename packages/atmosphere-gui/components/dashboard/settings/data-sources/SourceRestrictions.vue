<script setup lang="ts">
const props = defineProps<{
  allowMetaWrite: boolean
  allowDataWrite: boolean
}>()

const emits = defineEmits(['update:allowMetaWrite', 'update:allowDataWrite'])

const dataWrite = useVModel(props, 'allowDataWrite', emits)
const metaWrite = useVModel(props, 'allowMetaWrite', emits)
</script>

<template>
  <a-form-item class="atm-source-restictions-card">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-3">
        <AtTooltip :disabled="!metaWrite" placement="topLeft" class="flex">
          <template #title>
            {{ $t('tooltip.dataWriteOptionDisabled') }}
          </template>
          <a-switch v-model:checked="dataWrite" :disabled="metaWrite" data-testid="atm-allow-data-write" size="small"></a-switch>
        </AtTooltip>
        <span class="cursor-pointer text-atm-content-gray" @click="!metaWrite ? (dataWrite = !dataWrite) : undefined">
          {{ $t('labels.allowDataWrite') }}
        </span>
      </div>
      <div class="ml-10 text-small leading-[18px] text-atm-content-gray-muted">
        {{ $t('tooltip.allowDataWrite') }}
      </div>
    </div>
  </a-form-item>
  <a-form-item class="atm-source-restictions-card">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-3">
        <a-switch
          v-model:checked="metaWrite"
          data-testid="atm-allow-meta-write"
          class="atm-allow-meta-write"
          size="small"
        ></a-switch>

        <span class="cursor-pointer text-atm-content-gray" @click="metaWrite = !metaWrite">
          {{ $t('labels.allowMetaWrite') }}
        </span>
      </div>
      <div class="ml-10 text-small leading-[18px] text-atm-content-gray-muted" :class="{ 'atm-allow-meta-write-help': metaWrite }">
        {{ $t('labels.notRecommended') }}:
        {{ $t('tooltip.allowMetaWrite') }}
      </div>
    </div>
  </a-form-item>
</template>

<style lang="scss" scoped>
.atm-allow-meta-write.ant-switch-checked {
  background: #b33771;
}

.atm-allow-meta-write-help {
  color: #b33771;
}

.atm-source-restictions-card {
  @apply border-1 border-atm-border-gray-medium rounded-lg px-3 py-2;
}
</style>
