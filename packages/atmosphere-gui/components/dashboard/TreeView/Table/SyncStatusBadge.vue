<script lang="ts" setup>
import type { TableType } from 'atmosphere-sdk'
defineProps<{
  table: TableType
}>()
</script>

<template>
  <div class="flex flex-col gap-0.5 text-left">
    <div class="font-semibold">{{ $t('labels.syncedTable') }}</div>
  </div>
</template>
