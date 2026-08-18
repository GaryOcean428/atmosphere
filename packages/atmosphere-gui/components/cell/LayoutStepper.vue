<script lang="ts" setup>
export interface CellStepperOption {
  key: string
  title: string
}

interface Props {
  options: CellStepperOption[]
  modelValue?: string
  /** Indicator style — radio dots or 1..N position numbers. */
  format?: 'radio' | 'number'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  format: 'radio',
  disabled: false,
})

const emits = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { t } = useI18n()

/** Below this container width the stepper stacks vertically (narrow panes /
 *  third-width fields); at or above it stays a chevron-scrollable row. */
const VERTICAL_BREAKPOINT = 320

/** Synthetic menu row key — "Clear selection" scrolls with the options. */
const CLEAR_OPTION_KEY = '__nc_stepper_clear__'

const rootRef = ref<HTMLElement>()

const scrollerRef = ref<HTMLElement>()

const isMenuOpen = ref(false)

const canScrollLeft = ref(false)

const canScrollRight = ref(false)

const { width: rootWidth } = useElementSize(rootRef)

const isVertical = computed(() => rootWidth.value > 0 && rootWidth.value < VERTICAL_BREAKPOINT)

const showChevrons = computed(() => !isVertical.value && (canScrollLeft.value || canScrollRight.value))

const hasSelection = computed(() => props.options.some((op) => op.key === props.modelValue))

const menuList = computed<CellStepperOption[]>(() => {
  if (props.disabled || !hasSelection.value) return props.options

  return [{ key: CLEAR_OPTION_KEY, title: t('labels.clearSelection') }, ...props.options]
})

/** All-options menu (AtList) — writes back on pick, no-op when disabled. */
const menuValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (props.disabled || !ncIsString(value)) return

    emits('update:modelValue', value === CLEAR_OPTION_KEY ? null : value)
  },
})

function isSelected(op: CellStepperOption) {
  return op.key === props.modelValue
}

function selectOption(op: CellStepperOption) {
  if (props.disabled || isSelected(op)) return

  emits('update:modelValue', op.key)
}

function syncScrollState() {
  const el = scrollerRef.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }

  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollByStep(direction: -1 | 1) {
  const el = scrollerRef.value
  if (!el) return

  el.scrollBy({ left: direction * Math.max(120, el.clientWidth * 0.8), behavior: 'smooth' })
}

function jumpToSelected() {
  isMenuOpen.value = false

  if (!hasSelection.value) return

  nextTick(() => {
    rootRef.value
      ?.querySelector<HTMLElement>('.atm-stepper-item-selected')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
}

/** Arrows move the selection (radio-group pattern) and stay inside the
 *  control — outer surfaces use them for cell/row nav. */
function handleKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowRight':
    case 'ArrowLeft': {
      e.stopPropagation()
      e.preventDefault()

      if (props.disabled || !props.options.length) return

      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      const current = props.options.findIndex((op) => op.key === props.modelValue)
      const next = current === -1 ? (dir === 1 ? 0 : props.options.length - 1) : current + dir

      if (next < 0 || next >= props.options.length || next === current) return

      emits('update:modelValue', props.options[next]!.key)

      nextTick(() => {
        const el = rootRef.value?.querySelector<HTMLElement>('.atm-stepper-item-selected')
        el?.focus({ preventScroll: true })
        el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      })
      break
    }
  }
}

useEventListener(scrollerRef, 'scroll', syncScrollState)

useResizeObserver(scrollerRef, syncScrollState)

watch(
  () => [props.options, isVertical.value],
  () => nextTick(syncScrollState),
)

onMounted(() => nextTick(syncScrollState))
</script>

<template>
  <div
    ref="rootRef"
    class="atm-cell-stepper w-full max-w-full flex flex-col"
    :class="{ 'atm-cell-stepper-disabled': disabled, 'atm-stepper-format-number': format === 'number' }"
    role="radiogroup"
    @click.stop
    @keydown="handleKeyDown"
  >
    <!-- Top-right controls (Airtable parity): ⋯ all-options menu, then ‹ ›
         scroll arrows when the horizontal row overflows. -->
    <div class="flex items-center justify-end gap-0.5">
      <AtDropdown v-model:visible="isMenuOpen" placement="bottomRight" overlay-class-name="atm-stepper-menu-overlay">
        <AtButton icon-only size="xsmall" type="text" class="atm-stepper-menu-btn !px-1" data-testid="atm-stepper-all-options">
          <template #icon>
            <GeneralIcon icon="threeDotHorizontal" class="w-3.5 h-3.5" />
          </template>
        </AtButton>

        <template #overlay>
          <AtList
            v-model:value="menuValue"
            v-model:open="isMenuOpen"
            :list="menuList"
            option-value-key="key"
            option-label-key="title"
            :search-input-placeholder="$t('placeholder.searchOptions')"
            :is-locked="disabled"
            variant="medium"
            class="!w-70 max-w-[90vw]"
            @click.stop
          >
            <template #listItemContent="{ option, isSelected: isItemSelected }">
              <span
                v-if="option.key === CLEAR_OPTION_KEY"
                class="atm-stepper-menu-clear-chip"
                data-testid="atm-stepper-clear-selection"
              >
                {{ option.title }}
              </span>
              <div v-else class="flex-1 flex min-w-0" :data-testid="`atm-stepper-menu-option-${option.title}`">
                <slot name="chip" :option="option" :selected="isItemSelected" :in-menu="true">
                  <span class="truncate">{{ option.title }}</span>
                </slot>
              </div>
            </template>

            <template #listFooter>
              <div class="border-t-1 border-atm-border-gray-medium p-1 mt-1">
                <button
                  type="button"
                  class="atm-stepper-menu-row text-atm-content-brand"
                  :disabled="!hasSelection"
                  :class="{ '!text-atm-content-gray-muted !cursor-default': !hasSelection }"
                  data-testid="atm-stepper-jump-to-selected"
                  @click="jumpToSelected"
                >
                  <GeneralIcon icon="arrowRight" class="flex-none w-3.5 h-3.5" />
                  <span>{{ $t('labels.jumpToSelected') }}</span>
                </button>
              </div>
            </template>
          </AtList>
        </template>
      </AtDropdown>

      <template v-if="showChevrons">
        <AtButton
          icon-only
          size="xsmall"
          type="text"
          class="atm-stepper-chevron !px-1"
          :disabled="!canScrollLeft"
          @click="scrollByStep(-1)"
        >
          <template #icon>
            <GeneralIcon icon="chevronLeft" class="w-3.5 h-3.5" />
          </template>
        </AtButton>
        <AtButton
          icon-only
          size="xsmall"
          type="text"
          class="atm-stepper-chevron !px-1"
          :disabled="!canScrollRight"
          @click="scrollByStep(1)"
        >
          <template #icon>
            <GeneralIcon icon="chevronRight" class="w-3.5 h-3.5" />
          </template>
        </AtButton>
      </template>
    </div>

    <!-- Vertical: circle rail on the left with a continuous line through the
         indicators, chip beside each circle. -->
    <div v-if="isVertical" class="flex flex-col items-start px-1 pb-1 max-h-[440px] overflow-y-auto atm-scrollbar-visible">
      <button
        v-for="(op, i) of options"
        :key="op.key"
        type="button"
        role="radio"
        :aria-checked="isSelected(op)"
        class="atm-stepper-item atm-stepper-item-v relative flex items-center gap-3 max-w-full"
        :class="{
          'atm-stepper-item-selected': isSelected(op),
          'atm-stepper-item-first': i === 0,
          'atm-stepper-item-last': i === options.length - 1,
        }"
        :disabled="disabled"
        :data-testid="`atm-stepper-option-${op.title}`"
        @click="selectOption(op)"
      >
        <span
          class="atm-stepper-indicator"
          :class="{ 'atm-stepper-indicator-selected': isSelected(op), 'atm-stepper-indicator-radio': format === 'radio' }"
        >
          <template v-if="format === 'number'">{{ i + 1 }}</template>
        </span>
        <!-- min-w-0 wrapper so long chips ellipsize instead of overflowing the panel -->
        <span class="min-w-0 flex">
          <slot name="chip" :option="op" :selected="isSelected(op)" :in-menu="false">
            <span class="truncate">{{ op.title }}</span>
          </slot>
        </span>
      </button>
    </div>

    <!-- Horizontal: indicator row with a continuous line through the circles,
         chip centered UNDER each circle (Airtable parity). -->
    <div v-else ref="scrollerRef" class="atm-stepper-scroller flex items-start px-1 pb-1 pt-1">
      <button
        v-for="(op, i) of options"
        :key="op.key"
        type="button"
        role="radio"
        :aria-checked="isSelected(op)"
        class="atm-stepper-item atm-stepper-item-h relative flex-1 flex flex-col items-center gap-1.5"
        :class="{
          'atm-stepper-item-selected': isSelected(op),
          'atm-stepper-item-first': i === 0,
          'atm-stepper-item-last': i === options.length - 1,
        }"
        :disabled="disabled"
        :data-testid="`atm-stepper-option-${op.title}`"
        @click="selectOption(op)"
      >
        <span
          class="atm-stepper-indicator relative z-1"
          :class="{ 'atm-stepper-indicator-selected': isSelected(op), 'atm-stepper-indicator-radio': format === 'radio' }"
        >
          <template v-if="format === 'number'">{{ i + 1 }}</template>
        </span>
        <!-- Cap long chips so one wordy option doesn't eat the row (tooltip shows the full title) -->
        <span class="min-w-0 max-w-40 flex">
          <slot name="chip" :option="op" :selected="isSelected(op)" :in-menu="false">
            <span class="truncate">{{ op.title }}</span>
          </slot>
        </span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Padding here, not in the template — scoped selectors outrank Windi utilities. */
.atm-stepper-item {
  @apply p-0 border-none bg-transparent cursor-pointer min-w-0;

  &:disabled {
    @apply cursor-default;
  }
}

.atm-stepper-indicator {
  @apply flex-none w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold leading-none;
  border: 1px solid var(--atm-border-gray-medium);
  background: var(--atm-bg-default);
  color: var(--atm-content-gray-muted);

  &.atm-stepper-indicator-selected {
    border-color: var(--atm-content-gray);
    background: var(--atm-content-gray);
    color: var(--atm-bg-default);
  }

  /* Radio format: keep the ring light and mark selection with an inner dot. */
  &.atm-stepper-indicator-radio.atm-stepper-indicator-selected {
    background: var(--atm-bg-default);

    &::after {
      content: '';
      @apply w-2 h-2 rounded-full;
      background: var(--atm-content-gray);
    }
  }
}

/* Continuous through-line — two half segments per item at circle-center
   height, suppressed on the outer halves of the first/last items. The
   opaque circle sits on top, so the line reads as touching the circles. */
.atm-stepper-item-h {
  @apply px-2;

  min-width: max-content;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 7.5px; /* half the 16px circle */
    height: 1px;
    background: var(--atm-border-gray-medium);
  }

  &::before {
    left: 0;
    right: 50%;
  }

  &::after {
    left: 50%;
    right: 0;
  }

  /* First/last hug the container edges (Airtable parity) — indicator + chip
     flush to the edge, their line segment extended under the opaque circle. */
  &.atm-stepper-item-first {
    @apply items-start pl-0;

    &::after {
      left: 0;
    }
  }

  &.atm-stepper-item-last {
    @apply items-end pr-0;

    &::before {
      right: 0;
    }
  }

  /* Single option is both first and last — keep it left-aligned. */
  &.atm-stepper-item-first.atm-stepper-item-last {
    @apply items-start;
  }

  &.atm-stepper-item-first::before {
    content: none;
  }

  &.atm-stepper-item-last::after {
    content: none;
  }
}

.atm-stepper-item-v {
  @apply py-2;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 7.5px; /* center of the 16px circle */
    width: 1px;
    background: var(--atm-border-gray-medium);
  }

  &::before {
    top: 0;
    bottom: 50%;
  }

  &::after {
    top: 50%;
    bottom: 0;
  }

  &.atm-stepper-item-first::before {
    content: none;
  }

  &.atm-stepper-item-last::after {
    content: none;
  }

  .atm-stepper-indicator {
    @apply relative z-1;
  }
}

/* Number format needs room for two digits — bigger circle, line re-centered. */
.atm-stepper-format-number {
  .atm-stepper-indicator {
    @apply w-5 h-5 text-[10px];
  }

  .atm-stepper-item-h::before,
  .atm-stepper-item-h::after {
    top: 9.5px;
  }

  .atm-stepper-item-v::before,
  .atm-stepper-item-v::after {
    left: 9.5px;
  }
}

/* Chevrons live in the top-right controls — hide the native scrollbar. */
.atm-stepper-scroller {
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.atm-stepper-menu-row {
  @apply w-full flex items-center gap-2 px-2 py-1.5 rounded-md border-none bg-transparent cursor-pointer text-left;

  &:hover:not(:disabled) {
    @apply bg-atm-bg-gray-light;
  }

  &:disabled {
    @apply cursor-default;
  }
}

.atm-stepper-menu-clear-chip {
  @apply inline-flex items-center px-2 rounded-[12px] text-small text-atm-content-gray;
  border: 1px solid var(--atm-border-gray-medium);
  background: var(--atm-bg-default);
}
</style>
