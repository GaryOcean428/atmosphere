<script lang="ts" setup>
import type { AtBadgeProps } from './index.vue'

const props = withDefaults(defineProps<AtBadgeProps>(), {
  border: false,
  color: 'gray',
  size: 'xs',
})
</script>

<template>
  <AtBadge v-bind="props" class="text-bodySm">
    <slot>
      {{ $t('title.comingSoon') }}
    </slot>
  </AtBadge>
</template>
