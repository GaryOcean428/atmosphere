<script lang="ts" setup>
export interface AtBadgeProps {
  color?: string
  border?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  rounded?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<AtBadgeProps>(), {
  border: true,
  size: 'sm',
  rounded: 'md',
})
</script>

<template>
  <div
    :class="{
      'border-atm-purple-500 bg-atm-bg-purple-dark dark:bg-atm-bg-purple-light': props.color === 'purple',
      'border-atm-blue-500 bg-atm-bg-blue-dark dark:bg-atm-blue-20': props.color === 'blue',
      'border-atm-green-500 bg-atm-bg-green-dark dark:bg-atm-green-20': props.color === 'green',
      'border-atm-orange-500 bg-atm-bg-orange-dark dark:bg-atm-orange-20': props.color === 'orange',
      'border-atm-yellow-500 bg-atm-bg-yellow-dark dark:bg-atm-yellow-20': props.color === 'yellow',
      'border-atm-red-500 bg-atm-bg-red-dark dark:bg-atm-red-20': props.color === 'red',
      'border-atm-maroon-500 bg-atm-bg-maroon': props.color === 'maroon',
      'border-atm-gray-500 bg-atm-bg-gray-extralight': props.color === 'gray',
      'bg-atm-bg-brand text-atm-content-brand': props.color === 'brand',
      'bg-atm-bg-coloured-purple text-atm-content-purple-medium': props.color === 'ai',
      'border-atm-border-gray-dark': !props.color,
      'border-1': props.border,
      'h-5': props.size === 'xs',
      'h-6': props.size === 'sm',
      'h-8': props.size === 'md',
      'h-10': props.size === 'lg',
      'rounded-sm': props.rounded === 'sm',
      'rounded-md': props.rounded === 'md',
      'rounded-lg': props.rounded === 'lg',
    }"
    class="px-1 flex items-center"
  >
    <slot />
  </div>
</template>

<style>
.badge-color {
  @apply mt-1 w-23 border h-6 rounded-lg;
}
</style>
