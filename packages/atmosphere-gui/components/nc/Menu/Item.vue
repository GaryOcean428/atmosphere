<script setup lang="ts">
/**
 * ## Known Issue and Fix
 * - **Issue**: When conditionally rendering `AtMenuItem` using `v-if` without a corresponding `v-else` fallback,
 *   Vue may throw a
 * `NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`.
 *
 * - This issue occurs specifically when the `AtMenu` is open, and the condition changes dynamically (e.g., during runtime state changes)
 *
 * - **Fix**: Use `v-show` instead of `v-if` when no replacement (fallback) node is provided. This keeps the element
 *   in the DOM but toggles its visibility, preventing the DOM manipulation issue.
 */
import type { StyleValue } from '@vue/runtime-dom'

defineProps<{
  mKey?: string
  style?: StyleValue
  disabled?: boolean | number
  innerClass?: string
  danger?: boolean
  theme?: 'ai'
}>()

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <div class="w-full" :style="style">
    <a-menu-item
      :key="mKey"
      v-bind="$attrs"
      :disabled="Boolean(disabled)"
      class="atm-menu-item"
      :class="{
        'atm-menu-item-danger': danger,
        'atm-menu-item-ai': theme === 'ai',
      }"
    >
      <div class="atm-menu-item-inner" :class="innerClass">
        <slot />
      </div>
    </a-menu-item>
  </div>
</template>

<style lang="scss">
.ant-dropdown-menu-item.atm-menu-item {
  @apply p-2 mx-1.5 font-normal text-sm xs:(text-base py-3 px-3.5 mx-0) rounded-md overflow-hidden;
}

.atm-menu-item-inner {
  @apply flex flex-row items-center gap-x-2 text-sm;
}

.atm-menu-item.atm-menu-item-danger {
  &:not(.ant-dropdown-menu-item-disabled) {
    @apply !text-atm-content-red-medium !hover:bg-atm-bg-red-light dark:!hover:bg-atm-bg-red-light/20;
  }
}

.atm-menu-item.atm-menu-item-ai {
  &:not(.ant-dropdown-menu-item-disabled) {
    @apply !text-atm-content-purple-medium !hover:bg-atm-bg-purple-light;
  }
}

.atm-menu-item > .ant-dropdown-menu-title-content {
  // Not Icon
  :not(.atm-icon):not(.material-symbols) {
    line-height: 20px;
  }

  @apply flex flex-row items-center;
}

.atm-menu-item::after {
  background: none;
}
</style>
