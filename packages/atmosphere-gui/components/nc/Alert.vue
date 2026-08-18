<script lang="ts" setup>
import type { AlertProps } from 'ant-design-vue/es'
import { getI18n } from '~/plugins/a.i18n'

/**
 * AtAlert Component
 *
 * A customizable alert component with optional icons, descriptions, actions, and notifications.
 * Can be used as a standalone alert or inside the `message` notification system.
 *
 * @example
 * ```vue
 * <AtAlert
 *   type="error"
 *   message="Something went wrong"
 *   description="We couldn’t complete your request. Please try again."
 *   :closable="true"
 *   :copy-text="'ERR_CODE_404'"
 * />
 * ```
 */
export interface AtAlertProps extends Pick<AlertProps, 'showIcon' | 'message' | 'description' | 'closable'> {
  /**
   * type toast will be used only in message.toast('simple toast message')
   */
  type: AlertProps['type'] | 'toast'
  /**
   * Controls the visibility of the alert.
   * @default true
   */
  visible?: boolean

  /**
   * Whether the alert has a border.
   * @default true
   */
  bordered?: boolean

  /**
   * Aligns the content vertically.
   * - `top`: Align to the top
   * - `center`: Align to the center
   * @default 'top'
   */
  align?: 'top' | 'center'

  /**
   * The text to be copied when clicking the copy button.
   */
  copyText?: any

  /**
   * Show toast msg after copying the text
   */
  copyTextToastMessage?: string

  /**
   * Tooltip text for the copy button.
   * @default 'tooltip.copyErrorCode' (from i18n)
   */
  copyBtnTooltip?: string

  /**
   * Custom class for the message text.
   */
  messageClass?: string

  /**
   * Custom class for the description text.
   */
  descriptionClass?: string

  /**
   * Whether this alert is used inside a notification message.
   * @default false
   */
  isNotification?: boolean

  /**
   * Duration before the alert disappears (in seconds).
   * If not provided, uses default Ant Design message duration.
   */
  duration?: number

  /**
   * Whether to show a visual progress bar for the remaining duration.
   * @default true
   */
  showDuration?: boolean

  /**
   * Show background color
   * @default false
   */
  background?: boolean
}

const props = withDefaults(defineProps<AtAlertProps>(), {
  visible: true,
  showIcon: true,
  bordered: true,
  align: 'top',
  messageClass: '',
  descriptionClass: '',
  isNotification: false,
  showDuration: true,
  background: false,
})

/**
 * Emits events when the alert is closed or visibility changes.
 */
const emits = defineEmits<{
  /**
   * Event triggered when visibility is updated.
   * @param value - The new visibility state
   */
  (e: 'update:visible', value: boolean): void

  /**
   * Event triggered when the alert is closed.
   */
  (e: 'close'): void
}>()

const vVisible = useVModel(props, 'visible', emits, { defaultValue: true })

const { type } = toRefs(props)

const slots = useSlots()

const { t } = getI18n().global

const { copy } = useCopy()

const isMessageAvailable = computed(() => !!(slots.message || props.message))

const isDescriptionAvailable = computed(() => !!(slots.description || props.description))

const align = computed<AtAlertProps['align']>(() => {
  return isMessageAvailable.value && isDescriptionAvailable.value ? props.align : 'center'
})

/**
 * Tracks whether the text has been copied successfully.
 */
const isCopied = ref<boolean>(false)

const copyText = computed(() => props.copyText?.toString() ?? '')

const copyBtnTooltip = computed(() =>
  ncIsUndefined(props.copyBtnTooltip) && props.type === 'error' ? t('tooltip.copyErrorCode') : props.copyBtnTooltip,
)

let copiedTimeoutId: any

/**
 * Handles the copy button click event.
 * Copies the `copyText` value to the clipboard and shows a success indicator.
 */
const onClickCopy = async () => {
  if (copiedTimeoutId) {
    clearTimeout(copiedTimeoutId)
  }

  if (!copyText.value) return

  try {
    await copy(copyText.value)

    isCopied.value = true

    if (props.copyTextToastMessage) {
      message.toast(props.copyTextToastMessage)
    }

    copiedTimeoutId = setTimeout(() => {
      isCopied.value = false
      clearTimeout(copiedTimeoutId)
    }, 3000)
  } catch (e: any) {
    message.error(e.message)
  }
}

/**
 * Computes the appropriate icon based on the alert type.
 */
const iconName = computed<IconMapKey>(() => {
  if (type.value === 'error') {
    return 'ncAlertCircleFilled'
  }

  if (type.value === 'warning') {
    return 'alertTriangleSolid'
  }

  if (type.value === 'info') {
    return 'ncInfoSolid'
  }

  return 'circleCheckSolid'
})

/**
 * Handles alert close action.
 */
const handleClose = () => {
  vVisible.value = false
  emits('close')
}

/**
 * Remaining duration of the alert in seconds.
 */
const remDuration = ref(props.duration ?? ANT_MESSAGE_DURATION)

/**
 * Tracks the start time of the alert.
 */
const startTime = ref(performance.now())

/**
 * Computes the progress percentage based on remaining duration.
 */
const remDurationPercent = computed(() => (remDuration.value / (props.duration ?? ANT_MESSAGE_DURATION)) * 100)

let frameId: number

/**
 * Updates the progress bar smoothly using requestAnimationFrame.
 */
const updateProgress = () => {
  const elapsedTime = (performance.now() - startTime.value) / 1000 // Convert ms to seconds
  const totalDuration = props.duration ?? ANT_MESSAGE_DURATION
  const remaining = Math.max(totalDuration - elapsedTime, 0)

  // Lerp (smooth transition instead of abrupt frame jumps)
  remDuration.value = remDuration.value * 0.9 + remaining * 0.1

  if (remDuration.value > 0.01) {
    // Stop when close to zero
    frameId = requestAnimationFrame(updateProgress)
  } else {
    remDuration.value = 0 // Ensure it reaches zero exactly
  }
}
/**
 * Starts the progress bar animation when the component is mounted.
 */
onMounted(() => {
  if (!props.showDuration) return

  startTime.value = performance.now()
  updateProgress()
})

/**
 * Cancels the animation frame when the component is unmounted.
 */
onUnmounted(() => {
  cancelAnimationFrame(frameId)
})
</script>

<template>
  <div
    v-if="vVisible"
    class="atm-alert group"
    :class="[
      `atm-alert-type-${type}`,
      {
        'items-center': align === 'center',
        'items-start': align === 'top',
        'no-border': !bordered,
        'atm-alert-notification': isNotification,
        'atm-show-background': background,
      },
    ]"
  >
    <div v-if="showIcon" class="atm-alert-icon-wrapper">
      <slot name="icon">
        <GeneralIcon :icon="iconName" class="atm-alert-icon" />
      </slot>
    </div>

    <div class="atm-alert-content flex-1">
      <div v-if="message || $slots.message" class="atm-alert-message" :class="messageClass">
        <slot name="message">{{ message }}</slot>
      </div>

      <AtTooltip
        v-if="description || $slots.description"
        :title="description"
        :line-clamp="isNotification ? 2 : 3"
        show-on-truncate-only
        :disabled="!description"
      >
        <div
          class="atm-alert-description"
          :class="[
            descriptionClass,
            {
              'atm-only-description': isDescriptionAvailable && !isMessageAvailable,
            },
          ]"
        >
          <slot name="description">{{ description }}</slot>
        </div>
      </AtTooltip>
    </div>

    <div v-if="$slots.action || copyText || closable" class="atm-alert-action">
      <slot name="action"> </slot>
      <AtTooltip
        v-if="copyText"
        :title="copyBtnTooltip"
        :disabled="!copyBtnTooltip"
        class="atm-alert-action-copy"
        :class="{
          'invisible group-hover:visible transition-all': isNotification,
        }"
      >
        <AtButton size="xsmall" type="text" @click.stop="onClickCopy">
          <div class="flex children:flex-none relative h-4 w-4">
            <Transition name="icon-fade" :duration="200">
              <GeneralIcon v-if="isCopied" icon="check" class="h-4 w-4 opacity-80" />
              <GeneralIcon v-else icon="copy" class="h-4 w-4 opacity-80" />
            </Transition>
          </div>
        </AtButton>
      </AtTooltip>
      <slot v-if="closable" name="closable" :handle-close="handleClose">
        <AtButton size="xsmall" type="text" @click.stop="handleClose">
          <GeneralIcon icon="close" class="text-atm-content-gray-subtle" />
        </AtButton>
      </slot>
    </div>

    <div
      v-if="isNotification && showDuration"
      class="atm-alert-progress-wrapper"
      :class="{
        'bg-atm-bg-brand': remDurationPercent > 0,
        'bg-atm-bg-gray-medium': remDurationPercent <= 0,
      }"
    >
      <div
        class="atm-alert-progress"
        :style="{
          width: `${remDurationPercent}%`,
        }"
      ></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-alert {
  @apply flex gap-4;

  &:not(.atm-alert-notification) {
    @apply rounded-lg p-4 w-full border-1 border-atm-border-gray-medium;
  }

  &.atm-alert-notification {
    @apply min-w-[calc(100vw_-_64px)] md:min-w-[308px] max-w-[488px] w-[calc(30vw_-_32px)];
    .atm-alert-content {
      .atm-alert-description {
        @apply line-clamp-2;
      }
    }

    &.atm-alert-type-toast {
      @apply min-w-[fit-content]  md:min-w-[fit-content] max-w-[350px] w-[fit-content];
    }
  }

  &.no-border {
    @apply border-none;
  }

  .atm-alert-icon-wrapper {
    @apply flex children:flex-none;

    .atm-alert-icon {
      @apply h-6 w-6;
    }
  }

  .atm-alert-content {
    @apply flex flex-col gap-1;

    .atm-alert-message {
      @apply text-base text-atm-content-gray font-weight-700;
    }

    .atm-alert-description {
      @apply text-sm font-weight-500 line-clamp-3;

      &:not(.atm-only-description) {
        @apply text-atm-content-gray-muted;
      }

      &.atm-only-description {
        @apply text-atm-content-gray;
      }
    }
  }

  .atm-alert-action {
    @apply flex items-center gap-3 children:flex-none;
  }

  &.atm-alert-type-success,
  &.atm-alert-type-undefined {
    .atm-alert-icon-wrapper {
      @apply text-green-700;
    }

    &.atm-show-background {
      @apply bg-atm-bg-green-light dark:bg-atm-green-20;
    }
  }

  &.atm-alert-type-error {
    .atm-alert-icon-wrapper {
      @apply text-red-700;
    }

    &.atm-show-background {
      @apply bg-atm-bg-red-light dark:bg-atm-red-20;
    }
  }

  &.atm-alert-type-warning {
    .atm-alert-icon-wrapper {
      @apply text-orange-700;
    }

    &.atm-show-background {
      @apply bg-atm-bg-orange-light dark:bg-atm-orange-20;
    }
  }

  &.atm-alert-type-info {
    .atm-alert-icon-wrapper {
      @apply text-atm-content-brand;
    }

    &.atm-show-background {
      @apply bg-atm-bg-brand dark:bg-atm-brand-20;
    }
  }

  .atm-alert-progress-wrapper {
    @apply absolute bottom-0 left-0 right-0 h-1;

    .atm-alert-progress {
      @apply h-full  bg-atm-brand-400;
    }
  }
}
</style>

<style lang="scss">
.ant-message {
  @apply z-1053;

  .ant-message-notice {
    &:has(.atm-alert-notification) {
      .ant-message-notice-content {
        @apply bg-atm-bg-default !rounded-lg p-4 gap-4 box-border border-1 border-atm-border-gray-medium text-left relative overflow-hidden;

        .ant-message-custom-content > span {
          @apply flex-none w-full block;
        }

        &:has(.atm-alert-type-toast) {
          @apply py-2.5 px-3 bg-gray-700 border-gray-700;

          .atm-alert-description {
            @apply text-base-white;
          }
        }
      }
    }
  }
}
</style>
