<script lang="ts" setup>
interface Props {
  label?: string
  tooltip?: string
  disableTooltip?: boolean
  icon?: string
  activeIcon?: string
  active?: boolean
  disabled?: boolean
  /** Dropdown trigger — active state shows hover bg only, no indicator or text color */
  isDropdown?: boolean
  /** Hide the left-side active indicator bar and active background */
  plainActive?: boolean
  panelKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  tooltip: '',
  icon: undefined,
  activeIcon: undefined,
  active: false,
  disabled: false,
  isDropdown: false,
  plainActive: false,
  panelKey: undefined,
})

const emits = defineEmits<{
  (e: 'click'): void
}>()

const slots = useSlots()

// Labels render beside icons only at ≥1280px (see media query in styles) — the tooltip is redundant then
const isLabelVisible = useMediaQuery('(min-width: 1280px)')

const tooltipText = computed(() => props.tooltip || props.label)

const currentIcon = computed(() => {
  if (props.active && props.activeIcon) return props.activeIcon
  return props.icon
})

const isTooltipDisabled = computed(() => {
  if (!tooltipText.value || props.disableTooltip) return true

  return !!(props.label || slots.label) && isLabelVisible.value
})
</script>

<template>
  <AtTooltip
    class="w-full flex justify-center relative"
    placement="right"
    :arrow="false"
    :disabled="isTooltipDisabled"
  >
    <template #title>{{ tooltipText }}</template>

    <div
      class="atm-rail-item"
      :class="{ active, disabled, 'is-dropdown': isDropdown, 'plain-active': plainActive }"
      :data-panel="panelKey"
      @click="!disabled && emits('click')"
    >
      <!-- Active indicator bar -->
      <span v-if="!plainActive" class="atm-rail-item-indicator" />

      <slot v-if="$slots.default" />

      <template v-else>
        <slot name="icon">
          <GeneralIcon v-if="currentIcon" :icon="(currentIcon as any)" class="atm-rail-item-icon" />
        </slot>
      </template>

      <span v-if="label || $slots.label" class="atm-rail-item-label">
        <slot name="label">{{ label }}</slot>
      </span>
    </div>
  </AtTooltip>
</template>

<style lang="scss" scoped>
.atm-rail-item {
  @apply flex flex-col items-center justify-center cursor-pointer transition-all duration-150 rounded-lg;
  width: 36px;
  height: 36px;

  &:not(.active) {
    @apply text-atm-content-gray-muted;
  }

  .atm-rail-item-indicator {
    @apply absolute left-0 top-1/2 transform -translate-y-1/2 w-[3px] h-[28px] opacity-0 pointer-events-none rounded-r-sm;
    @apply bg-atm-content-brand;
    transition: opacity 0.2s;
  }

  .atm-rail-item-icon {
    @apply h-4 w-4 flex items-center justify-center;
  }

  .atm-rail-item-label {
    @apply select-none text-captionXsBold leading-tight tracking-tight hidden;
  }

  &:hover:not(.active):not(.disabled) {
    @apply text-atm-content-subtle2;
    background: rgba(0, 0, 0, 0.05);

    :root[theme='dark'] & {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  // Normal active state: brand color text + indicator
  &.active:not(.is-dropdown) {
    @apply text-atm-content-brand;
    background: rgba(0, 0, 0, 0.08);

    :root[theme='dark'] & {
      background: rgba(255, 255, 255, 0.08);
    }

    .atm-rail-item-indicator {
      opacity: 1;
    }
  }

  // Plain active: no background, no indicator — text color preserved from slot content
  &.plain-active.active {
    background: transparent;
  }

  // Dropdown active state: hover bg only, no indicator or text color change
  &.is-dropdown.active {
    @apply text-atm-content-gray-muted;
    background: rgba(0, 0, 0, 0.05);

    :root[theme='dark'] & {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  &.disabled {
    @apply opacity-40 cursor-not-allowed;
  }

  // Expanded layout with labels when sidebar is 64px
  @media (min-width: 1280px) {
    @apply gap-1.5 pt-2.5 pb-1.5 rounded-[10px];
    width: 53px;
    height: auto;

    .atm-rail-item-label {
      display: block;
    }

    .atm-rail-item-indicator {
      @apply h-[36px];
    }
  }
}
</style>

<style lang="scss">
.atm-rail-item:not(.active) .atm-rail-item-label,
.atm-rail-item:not(.active) .atm-rail-item-icon {
  color: rgba(0, 0, 0, 0.7);
}

[theme='dark'] .atm-rail-item:not(.active) .atm-rail-item-label,
[theme='dark'] .atm-rail-item:not(.active) .atm-rail-item-icon {
  color: rgba(255, 255, 255, 0.95);
}

.rtl .atm-rail-item .atm-rail-item-indicator {
  left: auto;
  right: 0;
  border-radius: 2px 0 0 2px;
}
</style>
