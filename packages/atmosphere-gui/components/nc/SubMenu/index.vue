<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    popupOffset?: number[]
    popupClassName?: string
    variant?: 'default' | 'small' | 'medium' | 'large'
    titleClass?: string
  }>(),
  {
    variant: 'default',
    titleClass: '',
    popupClassName: '',
  },
)

const { isMobileMode } = useGlobal()

const { isRtl } = useRtl()

const responsiveVariant = computed(() => {
  if (isMobileMode.value && ['small', 'medium'].includes(props.variant)) {
    return 'large'
  }

  return props.variant
})

const chevronIcon = computed(() => (isRtl.value ? 'ncChevronLeft' : 'ncChevronRight'))
</script>

<template>
  <a-sub-menu
    :popup-offset="props.popupOffset"
    class="atm-sub-menu"
    :class="`atm-variant-${responsiveVariant}`"
    :popup-class-name="`atm-variant-${responsiveVariant} atm-submenu-popup ${popupClassName}`"
  >
    <template #title>
      <div class="atm-submenu-title flex flex-row items-center gap-x-1.5 py-1.75 justify-between group" :class="titleClass">
        <div class="flex flex-row items-center gap-x-2">
          <slot name="title" />
        </div>

        <slot v-if="$slots.expandIcon" name="expandIcon" />
        <GeneralIcon v-else :icon="chevronIcon" class="atm-submenu-arrow !opacity-60" />
      </div>
    </template>

    <template #expandIcon> </template>
    <div class="py-1.5">
      <slot />
    </div>
  </a-sub-menu>
</template>

<style lang="scss">
.ant-dropdown-menu-submenu.atm-sub-menu {
  @apply flex-none flex mx-1.5 rounded-md overflow-hidden !hover:bg-atm-bg-gray-light;

  &:not(.ant-dropdown-menu-submenu-disabled) {
    .atm-submenu-title {
      @apply hover:text-atm-content-gray;
    }

    .atm-icon {
      @apply opacity-80;
    }
  }

  & > .ant-dropdown-menu-submenu-title {
    @apply pl-2 py-0 w-full xs:(text-base !px-3.5);
  }

  &:not(.atm-variant-default) {
    @apply text-small leading-5 font-weight-550 mx-1;

    & .atm-submenu-title {
      @apply py-0.5 text-small leading-5 font-weight-550;
    }

    &.atm-variant-small {
      .atm-submenu-title {
        @apply min-h-7;
      }

      &.atm-sub-menu-item-icon-only {
        .atm-submenu-title {
          @apply !min-h-6;
        }
      }
    }

    &.atm-variant-medium {
      .atm-submenu-title {
        @apply min-h-8;
      }

      &.atm-sub-menu-item-icon-only {
        .atm-submenu-title {
          @apply !min-h-7;
        }
      }
    }

    &.atm-variant-large {
      .atm-submenu-title {
        @apply min-h-9 !font-600;
      }

      &.atm-sub-menu-item-icon-only {
        .atm-submenu-title {
          @apply !min-h-8;
        }
      }
    }

    &:not(.ant-dropdown-menu-submenu-disabled) {
      @apply hover:text-atm-content-gray-extreme text-atm-content-gray-subtle;

      & .atm-submenu-title {
        @apply hover:text-atm-content-gray-extreme text-atm-content-gray-subtle;
      }
    }
  }
}

.ant-dropdown-menu-submenu .ant-dropdown-menu-submenu-title:hover {
  @apply !bg-atm-bg-gray-light;
}

.atm-submenu-popup {
  @apply !rounded-lg border-1 border-atm-border-gray-extralight min-w-[144px];

  .ant-dropdown-menu.ant-dropdown-menu-sub {
    @apply !rounded-lg !shadow-lg shadow-atm-border-gray-medium dark:!shadow-black/40;
  }

  &:not(.atm-variant-default) {
    @apply flex flex-col gap-0.5 py-1;

    .ant-dropdown-menu-item {
      @apply !py-1 !text-small !leading-5 font-weight-550 mx-1;

      .atm-menu-item-inner {
        @apply !text-small !leading-5 font-weight-550;
      }

      &:not(.ant-dropdown-menu-item-disabled) {
        @apply hover:text-atm-content-gray-extreme text-atm-content-gray-subtle;
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

.atm-menu-item::after {
  background: none;
}
</style>
