<script lang="ts" setup>
interface Props {
  modelValue?: string | null
}

defineProps<Props>()

const rowHeight = inject(RowHeightInj, ref(undefined))
</script>

<template>
  <LazyCellClampedText
    class="atm-cell-field atm-uuid-cell"
    :value="modelValue"
    :lines="rowHeight"
    :style="{ 'word-break': 'break-word', 'font-family': 'monospace' }"
  />
</template>

<style scoped>
.atm-uuid-cell {
  font-family: monospace;
}
</style>
