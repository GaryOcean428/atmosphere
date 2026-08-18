<script lang="ts" setup>
import type { AtBadgeProps } from './index.vue'

withDefaults(defineProps<AtBadgeProps>(), {
  border: false,
  color: 'brand',
  size: 'xs',
})
</script>

<template>
  <AtBadge :border="border" :color="color" :size="size" class="text-bodyDefaultSm">
    <slot>
      {{ $t('general.beta') }}
    </slot>
  </AtBadge>
</template>
