<script lang="ts" setup>
import type { ViewType } from 'atmosphere-sdk'

const props = defineProps<{
  meta: ViewType
  ignoreColor?: boolean
}>()

const viewMeta = toRef(props, 'meta')
</script>

<template>
  <LazyGeneralEmojiPicker
    v-if="viewMeta?.meta?.icon"
    :data-testid="`atm-emoji-${viewMeta.meta?.icon}`"
    size="xsmall"
    :emoji="viewMeta.meta?.icon"
    class="atm-view-icon"
    readonly
  />
  <component
    :is="viewIcons[viewMeta.type]?.icon"
    v-else-if="viewMeta?.type"
    class="atm-view-icon group-hover"
    :style="{
      color: !props.ignoreColor ? viewIcons[viewMeta.type]?.color : undefined,
      fontWeight: 500,
    }"
  />
</template>

<style>
.atm-view-icon {
  font-size: 1.05rem;
}
</style>
