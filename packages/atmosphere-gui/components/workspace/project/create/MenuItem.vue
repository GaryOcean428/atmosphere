<script lang="ts" setup>
import { AtMenuItem } from '#components'

interface Props {
  label: string
  subtext?: string
  icon?: IconMapKey
  variant?: 'dropdown' | 'modal'
}

withDefaults(defineProps<Props>(), {})
</script>

<template>
  <component
    :is="variant === 'modal' ? 'div' : AtMenuItem"
    :inner-class="`w-full ${$slots.subtext || subtext ? '!items-start' : ''}`"
    :class="`atm-create-project-menu-item-${variant}`"
  >
    <div class="atm-icon-wrapper">
      <slot name="icon">
        <GeneralIcon v-if="icon" :icon="icon" class="h-4 w-4 flex-none" />
      </slot>
    </div>

    <div class="atm-content-wrapper">
      <div class="atm-content-label">
        <slot name="label">{{ label }}</slot>
      </div>
      <div v-if="$slots.subtext || subtext" class="atm-content-subtext">
        <slot name="subtext">{{ subtext }}</slot>
      </div>
    </div>
  </component>
</template>

<style lang="scss" scoped>
.atm-icon-wrapper {
  @apply flex items-center justify-center h-5 children:flex-none;
}

.atm-create-project-menu-item-modal {
  @apply font-normal text-sm flex items-start gap-3 mx-1 px-2 py-1 rounded-md hover:bg-atm-bg-gray-light transition-colors cursor-pointer;

  .atm-content-wrapper {
    .atm-content-label {
    }
  }
}

.atm-content-wrapper {
  .atm-content-subtext {
    @apply text-tiny !leading-4 text-atm-content-gray-muted;
  }
}
</style>
