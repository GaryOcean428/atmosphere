<script setup lang="ts">
import type { ColumnType } from 'atmosphere-sdk'
import { isVirtualCol } from 'atmosphere-sdk'

defineProps<{
  column: ColumnType
  modelValue: any
}>()

provide(ReadonlyInj, ref(true))
provide(IsGroupByLabelInj, ref(true))
</script>

<template>
  <div class="pointer-events-none">
    <LazySmartsheetRow :row="{ row: { [column.title as string]: modelValue }, rowMeta: {} }">
      <LazySmartsheetVirtualCell
        v-if="isVirtualCol(column)"
        :model-value="modelValue"
        class="!text-atm-content-gray-subtle2"
        :column="column"
        :read-only="true"
      />

      <LazySmartsheetCell
        v-else
        :model-value="modelValue"
        class="!text-atm-content-gray-subtle2"
        :column="column"
        :edit-enabled="false"
        :read-only="true"
      />
    </LazySmartsheetRow>
  </div>
</template>
