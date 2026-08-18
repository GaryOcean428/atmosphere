<script lang="ts" setup>
import type { TableType } from 'atmosphere-sdk'

const { meta: tableMeta } = defineProps<{
  meta?: TableType
}>()
</script>

<template>
  <LazyGeneralEmojiPicker
    v-if="tableMeta?.meta?.icon"
    :data-testid="`atm-emoji-${tableMeta.meta?.icon}`"
    class="atm-table-icon text-lg"
    size="small"
    :emoji="tableMeta.meta?.icon"
    readonly
  />

  <component
    :is="iconMap.ncZap"
    v-else-if="tableMeta?.synced"
    class="atm-table-icon w-4 mx-0.5 text-sm text-atm-gray-600/75 flex-none"
  />
  <component :is="iconMap.eye" v-else-if="tableMeta?.type === 'view'" class="atm-table-icon w-4 mx-0.75 flex-none" />
  <component :is="iconMap.table" v-else class="atm-table-iconw-4 mx-0.5 text-atm-gray-600/80 flex-none" />
</template>
