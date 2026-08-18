<script setup lang="ts">
import { onKeyDown } from '@vueuse/core'

const props = defineProps<{
  modelValue: boolean
  rows: number
  isSelectedAll?: boolean
}>()

const emit = defineEmits(['cancel', 'update:modelValue', 'deleteAll'])

const dialogShow = useVModel(props, 'modelValue', emit)

onKeyDown('esc', () => {
  dialogShow.value = false
  emit('update:modelValue', false)
})

const close = () => {
  dialogShow.value = false
  emit('cancel')
}
</script>

<template>
  <AtModal
    v-if="dialogShow"
    v-model:visible="dialogShow"
    :show-separator="false"
    :header="$t('activity.deleteAllRecords')"
    size="small"
    @keydown.esc="dialogShow = false"
  >
    <div class="flex justify-between w-full text-base font-semibold mb-2 text-atm-content-gray-emphasis items-center">
      {{ isSelectedAll ? $t('activity.deleteAllRecords') : $t('activity.deleteAllSelectedRecords') }}
    </div>
    <div data-testid="atm-expand-table-modal" class="flex flex-col">
      <div class="mb-2 atm-content-gray">{{ $t('objects.deleteAllRecordDlg.subtitle', { rowCount: rows }) }}</div>
    </div>

    <div class="bg-atm-bg-gray-light py-2 px-4 flex items-center gap-4 w-full rounded-lg">
      <div class="leading-5 text-atm-content-gray">{{ $t('objects.deleteAllRecordDlg.warning') }}</div>
    </div>

    <div class="flex flex-row mt-5 justify-end gap-x-2">
      <div class="flex gap-2 items-center">
        <AtButton data-testid="nn-record-delete-cancel" type="secondary" size="small" @click="close">
          {{ $t('labels.cancel') }}
        </AtButton>
      </div>
      <div class="flex gap-2 items-center">
        <AtButton data-testid="atm-record-delete-all" type="danger" size="small" @click="emit('deleteAll')">
          {{ $t('general.delete') }}
        </AtButton>
      </div>
    </div>
  </AtModal>
</template>
