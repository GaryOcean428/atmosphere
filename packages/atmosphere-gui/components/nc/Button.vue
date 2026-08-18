<script lang="ts" setup>
import type { ButtonType } from 'ant-design-vue/lib/button'
import { useSlots } from 'vue'
import type { GeneralLoaderProps } from '../general/Loader.vue'

/**
 * @description
 * Button component
 *
 * @example
 * <AtButton type="primary" size="medium" :loading="loading" @click="onClick">
 *  Save
 *  <template #loading> {{ $t('general.saving') }} </template>
 * </AtButton>
 */

export interface AtButtonProps {
  loading?: boolean
  disabled?: boolean
  showAsDisabled?: boolean
  type?: ButtonType | 'danger' | 'secondary' | undefined
  size?: AtButtonSize
  mobileSize?: AtButtonSize
  loaderSize?: GeneralLoaderProps['size']
  centered?: boolean
  fullWidth?: boolean
  iconOnly?: boolean
  iconPosition?: 'left' | 'right'
  theme?: 'default' | 'ai' | 'orange'
  textColor?: 'primary'
  bordered?: boolean
  shadow?: boolean
  innerClass?: string
  hideFocus?: boolean
}

const props = withDefaults(defineProps<AtButtonProps>(), {
  disabled: false,
  showAsDisabled: false,
  size: 'medium',
  loaderSize: 'medium',
  type: 'primary',
  fullWidth: false,
  centered: true,
  iconPosition: 'left',
  theme: 'default',
  bordered: true,
  shadow: true,
  innerClass: '',
  hideFocus: false,
})

const emits = defineEmits(['update:loading'])

const slots = useSlots()

const { isMobileMode } = useGlobal()

const AtButton = ref<HTMLElement | null>(null)

const { size, mobileSize, loaderSize, type, theme, bordered } = toRefs(props)

const loading = useVModel(props, 'loading', emits)

const isFocused = ref(false)
const isClicked = ref(false)

const buttonSize = computed(() => {
  if (isMobileMode.value && mobileSize.value) return mobileSize.value

  return size.value
})

const onFocus = (e: FocusEvent) => {
  // Only focus when coming from another element which is not a mouse click
  nextTick(() => {
    if (isClicked.value) {
      isFocused.value = false
    } else {
      const relatedTarget = e.relatedTarget as HTMLElement | null

      isFocused.value = !!relatedTarget
    }

    isClicked.value = false
  })
}

const onBlur = () => {
  isFocused.value = false
  isClicked.value = false
}

useEventListener(AtButton, 'mousedown', () => {
  isClicked.value = true
})
</script>

<template>
  <a-button
    ref="AtButton"
    :class="{
      'small': buttonSize === 'small',
      'medium': buttonSize === 'medium',
      'xsmall': buttonSize === 'xsmall',
      'xxsmall': buttonSize === 'xxsmall',
      'size-xs': buttonSize === 'xs',
      'focused': isFocused && !props.hideFocus,
      'theme-default': theme === 'default',
      'theme-ai': theme === 'ai',
      'theme-orange': theme === 'orange',
      'bordered': bordered,
      'atm-btn-shadow': shadow,
      'atm-show-as-disabled': props.showAsDisabled,
      'atm-text-primary': textColor === 'primary',
    }"
    :disabled="props.disabled"
    :loading="loading"
    :tabindex="props.disabled ? -1 : 0"
    :type="type"
    class="atm-button"
    @blur="onBlur"
    @focus="onFocus"
  >
    <div
      :class="[
        {
          'justify-center': props.centered,
          'justify-start': !props.centered,
        },
        innerClass,
      ]"
      class="flex flex-row gap-x-2.5 atm-btn-inner w-full"
    >
      <template v-if="iconPosition === 'left'">
        <slot v-if="loading" name="loadingIcon">
          <GeneralLoader class="flex !bg-inherit !text-inherit" :size="loaderSize" />
        </slot>

        <slot v-else name="icon" />
      </template>
      <div
        v-if="!(buttonSize === 'xxsmall' && loading) && !props.iconOnly"
        :class="{
          'font-medium': type === 'primary' || type === 'danger',
          'w-full': props.fullWidth,
        }"
        class="flex flex-row items-center"
      >
        <slot v-if="loading && slots.loading" name="loading" />

        <slot v-else />
      </div>
      <template v-if="iconPosition === 'right'">
        <slot v-if="loading" name="loadingIcon">
          <GeneralLoader class="flex !bg-inherit !text-inherit" :size="loaderSize" />
        </slot>

        <slot v-else name="icon" />
      </template>
    </div>
  </a-button>
</template>

<style lang="scss">
.ant-btn:before {
  display: none !important;
}

.atm-button {
  // Not Icon
  :not(.atm-icon):not(.material-symbols) {
    line-height: 0.95;
  }
  > .ant-btn-loading-icon {
    display: none !important;
  }
}

.atm-button {
  @apply !xs:(outline-none);

  &.atm-btn-shadow {
    box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.06), 0px 5px 3px -2px rgba(0, 0, 0, 0.02);
  }
  outline: none;
}

.desktop {
  .atm-button.ant-btn.focused {
    &.theme-default {
      box-shadow: 0px 0px 0px 2px var(--atm-bg-default), 0px 0px 0px 4px var(--atm-brand-accent);
    }

    &.theme-ai {
      box-shadow: 0px 0px 0px 2px var(--atm-bg-default), 0px 0px 0px 4px #7d26cd;
    }
  }

  .atm-button.ant-btn-text.focused {
    &.theme-default {
      @apply text-atm-content-brand;
    }

    &.theme-ai {
      @apply text-atm-content-purple-dark;
    }
  }
}

.atm-button.ant-btn {
  @apply rounded-lg font-medium;
}

.atm-button.ant-btn.small {
  @apply py-1 px-1.75 h-8 min-w-8;
}

.atm-button.ant-btn.medium {
  @apply py-2 px-4 h-10 min-w-10 xs:(h-10.5 max-h-10.5 min-w-10.5 !px-3);
}

.atm-button.ant-btn.size-xs {
  @apply px-2 py-0 h-7 min-w-7 rounded-lg text-small leading-[18px];

  & > div {
    @apply gap-x-2;
  }
}
.atm-button.ant-btn.xsmall {
  @apply p-0.25 h-6.25 min-w-6.25 rounded-md;
}

.atm-button.ant-btn.xxsmall {
  @apply p-0 h-5.75 min-w-5.75 rounded-md;
}

.atm-button.ant-btn[disabled],
.ant-btn-text.atm-button.ant-btn[disabled] {
  box-shadow: none !important;

  @apply border-0 !cursor-not-allowed;

  &.theme-default {
    @apply bg-atm-bg-gray-extralight text-atm-content-brand-hover md:(hover:bg-atm-bg-gray-extralight);
  }

  &.theme-ai {
    @apply bg-atm-bg-purple-light text-atm-content-purple-light md:(hover:bg-atm-bg-purple-light);
  }

  &.theme-orange {
    @apply bg-atm-bg-orange-light text-atm-content-orange-light md:(hover:bg-atm-bg-orange-light);
  }
}

.atm-button.ant-btn.atm-show-as-disabled,
.ant-btn-text.atm-button.ant-btn.atm-show-as-disabled {
  box-shadow: none !important;

  @apply border-0;

  &.theme-default {
    @apply bg-atm-bg-gray-extralight text-atm-content-brand-hover md:(hover:bg-atm-bg-gray-extralight);
  }

  &.theme-ai {
    @apply bg-atm-bg-purple-light text-atm-content-purple-light md:(hover:bg-atm-bg-purple-light);
  }

  &.theme-orange {
    @apply bg-atm-bg-orange-light text-atm-content-orange-light md:(hover:bg-atm-bg-orange-light);
  }
}
.atm-button.ant-btn.atm-text-primary {
  &:not(.atm-show-as-disabled):not(:disabled) {
    &.theme-default {
      @apply text-atm-content-brand md:(hover:text-atm-content-brand);
    }
  }
}

.atm-button.ant-btn-text.ant-btn[disabled],
.atm-button.ant-btn-text.ant-btn.atm-show-as-disabled {
  &.theme-default,
  &.theme-ai {
    @apply bg-transparent hover:bg-transparent;
  }
}

.atm-button.ant-btn-secondary[disabled],
.atm-button.ant-btn-secondary.atm-show-as-disabled {
  @apply border-1;

  &:not(.bordered) {
    @apply border-transparent;
  }

  &.theme-default {
    @apply bg-atm-bg-default hover:bg-atm-bg-default border-atm-border-gray-light text-atm-content-brand-hover;

    &.bordered {
      @apply border-atm-border-gray-light;
    }
  }

  &.theme-ai {
    @apply bg-atm-bg-purple-light hover:bg-atm-bg-purple-light text-atm-content-purple-light;

    &.bordered {
      @apply border-atm-border-purple-light;
    }
  }
}

.atm-button.ant-btn-primary {
  @apply border-0 xs:(hover:border-0) text-white !text-shadow-none;

  &.theme-default {
    @apply bg-brand-500 md:(hover:bg-brand-600);
  }

  &.theme-ai {
    @apply bg-purple-700 md:(hover:bg-purple-800);
  }

  // Orange CTA accent (base #f97316 / hover #e25e0e). Solid fill, no shadow,
  // theme-independent by design (same in light/dark). Hover/active only when
  // interactive — disabled state is handled by the [disabled]/show-as-disabled blocks.
  &.theme-orange:not(:disabled):not(.atm-show-as-disabled) {
    background: #f97316;
    box-shadow: none;

    &:hover,
    &:active {
      background: #e25e0e;
    }
  }
}

.atm-button.ant-btn-secondary {
  @apply border-1;

  &:not(.bordered) {
    @apply border-transparent;
  }

  &.theme-default {
    @apply bg-atm-bg-default text-atm-content-inverted-secondary md:(hover:bg-atm-bg-gray-light);

    &.bordered {
      @apply border-atm-border-gray-medium;
    }
  }

  &.theme-ai {
    @apply bg-atm-bg-purple-light text-atm-content-purple-dark md:(hover:bg-atm-bg-purple-dark);

    &.bordered {
      @apply border-atm-border-purple-medium;
    }
  }
}

.atm-button.ant-btn-danger {
  @apply bg-red-500 border-0 hover:border-0 md:(hover:bg-red-600);
}

.atm-button.ant-btn-text {
  box-shadow: none;

  @apply bg-transparent border-0;

  &.theme-default {
    @apply text-atm-content-inverted-secondary hover:text-atm-content-gray-emphasis hover:bg-atm-bg-gray-light;
  }

  &.theme-ai {
    @apply text-atm-content-purple-dark hover:text-atm-content-purple-dark hover:bg-atm-bg-purple-dark;
  }

  &:focus {
    box-shadow: none;
  }
}

.atm-button.ant-btn-link {
  box-shadow: none;
}

.ant-btn-ghost {
  @apply border-atm-border-gray-medium text-atm-content-inverted-secondary;
}
</style>
