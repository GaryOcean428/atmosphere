<script lang="ts" setup>
import type { ViewType } from 'atmosphere-sdk'
const props = defineProps<{
  view: ViewType
  ignoreColor?: boolean
}>()
</script>

<template>
  <LazyGeneralEmojiPicker
    v-if="(view.meta as any)?.icon"
    :data-testid="`atm-emoji-${(view.meta as any)?.icon}`"
    size="xsmall"
    :emoji="(view.meta as any)?.icon"
    readonly
  />
  <component
    :is="viewIcons[view.type]?.icon"
    v-else-if="view?.type"
    class="atm-view-icon group-hover"
    :style="{
      color: !props.ignoreColor ? viewIcons[view.type]?.color : undefined,
      fontWeight: 500,
    }"
  />
</template>

<style scoped lang="scss">
.atm-view-icon {
  font-size: 1.05rem;
}
</style>
