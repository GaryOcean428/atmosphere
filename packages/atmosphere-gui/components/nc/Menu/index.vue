<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    selectable?: boolean | undefined
    variant?: 'default' | 'small' | 'medium' | 'large'
  }>(),
  {
    variant: 'default',
  },
)

const { isMobileMode } = useGlobal()

const selectable = computed(() => props.selectable ?? false)

const responsiveVariant = computed(() => {
  if (isMobileMode.value && ['small', 'medium'].includes(props.variant)) {
    return 'large'
  }

  return props.variant
})
</script>

<template>
  <a-menu class="atm-menu" :class="`atm-variant-${responsiveVariant}`" :selectable="selectable">
    <slot />
  </a-menu>
</template>

<style lang="scss">
.atm-menu {
  @apply !rounded-md !py-1.5;

  &:not(.atm-variant-default) {
    @apply flex flex-col gap-0.5 !py-1 min-w-[144px];

    .ant-dropdown-menu-item {
      @apply !py-1 !text-small !leading-5 font-weight-550 mx-1;

      .atm-menu-item-inner {
        @apply !text-small !leading-5 font-weight-550;
      }

      .atm-icon {
        @apply opacity-80;
      }
    }

    &.atm-variant-small {
      .ant-dropdown-menu-item,
      .atm-ant-dropdown-menu-item-label {
        @apply min-h-7;
      }
    }

    &.atm-variant-medium {
      .ant-dropdown-menu-item,
      .atm-ant-dropdown-menu-item-label {
        @apply min-h-8;
      }
    }

    &.atm-variant-large {
      .ant-dropdown-menu-item,
      .atm-ant-dropdown-menu-item-label {
        @apply min-h-9;
      }

      .atm-menu-item-inner {
        @apply !font-600;
      }
    }

    .atm-ant-dropdown-menu-item-label {
      @apply py-0 mx-1 text-bodyDefaultSmBold;
    }

    .atm-divider {
      @apply my-0.5;
    }
  }

  &.atm-variant-default {
    .atm-ant-dropdown-menu-item-label {
      @apply py-2.5 text-bodyDefaultSmBold;
    }
  }
}

.atm-menu.ant-dropdown-menu {
  @apply !rounded-lg !shadow-none;
}
</style>
