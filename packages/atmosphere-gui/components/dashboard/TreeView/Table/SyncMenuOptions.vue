<script lang="ts" setup>
import type { TableType } from 'atmosphere-sdk'

defineProps<{
  baseId: string
  table: TableType
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <AtSpanHidden />
</template>
