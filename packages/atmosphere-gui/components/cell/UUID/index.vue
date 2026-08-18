<script setup lang="ts">
interface Props {
  modelValue?: string | null
}

const props = defineProps<Props>()

const { showNull } = useGlobal()

const rowHeight = inject(RowHeightInj, ref(undefined))

const vModel = useVModel(props, 'modelValue')
</script>

<template>
  <span v-if="vModel === null && showNull" class="atm-cell-field atm-null uppercase">{{ $t('general.null') }}</span>

  <LazyCellClampedText
    v-else
    class="atm-cell-field atm-uuid-cell"
    :value="vModel"
    :lines="rowHeight"
    :style="{ 'word-break': 'break-word', 'font-family': 'monospace' }"
  />
</template>

<style scoped>
.atm-uuid-cell {
  font-family: monospace;
}
</style>
