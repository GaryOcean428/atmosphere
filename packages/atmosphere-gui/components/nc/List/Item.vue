<script lang="ts" setup>
import type { AtListItemProps } from '#imports'

/**
 * AtListItem — standalone list-row component.
 *
 * Encapsulates all state-based styling (selected, active, disabled, locked,
 * variant padding, group-header, itemFullWidth) that was previously inlined
 * inside AtList.  Can be used:
 *
 *   1. Inside AtList — AtList drives isSelected / isActive via its own state.
 *   2. Standalone — caller passes isSelected / isActive / isDisabled directly
 *      and handles the `click` / `mouseover` emits itself.
 *
 * Slots mirror AtList's named slots so AtList can forward them unchanged:
 *   - listItemGroupHeader  { option }
 *   - listItem             { option, isSelected }
 *   - listItemExtraLeft    { option, isSelected, searchBasisInfo }
 *   - listItemContent      { option, isSelected, searchBasisInfo }
 *   - listItemExtraRight   { option, isSelected, searchBasisInfo }
 *   - listItemSelectedIcon { option, isSelected }
 */

const props = withDefaults(defineProps<AtListItemProps>(), {
  variant: 'default',
  index: -1,
  optionLabelKey: 'label',
  isSelected: false,
  isActive: false,
  showSelectedOption: true,
  showHoverEffect: true,
  isLocked: false,
  itemFullWidth: false,
  itemClassName: '',
  groupHeaderClassName: '',
  itemTooltipPlacement: 'right',
  groupHeaderHeight: 28,
})

const emits = defineEmits<{
  (e: 'click', option: AtListItemType, index: number, event: MouseEvent): void
  (e: 'mouseover'): void
}>()

const handleClick = (event: MouseEvent) => {
  if (props.option.ncGroupHeader || props.option.ncItemDisabled || props.isLocked) return
  emits('click', props.option, props.index, event)
}

const handleMouseover = () => {
  if (props.option.ncGroupHeader) return
  emits('mouseover')
}
</script>

<template>
  <AtTooltip
    class="flex items-center gap-2 atm-list-item w-full px-2 my-[2px] first-of-type:mt-0 last-of-type:mb-0"
    :class="[
      `atm-list-option-${index}`,
      {
        'atm-list-group-header text-atm-content-gray-muted text-bodySmBold border-t !border-t-atm-border-gray-medium !first-of-type:border-t-transparent flex items-center':
          option.ncGroupHeader,
        'rounded-md': !itemFullWidth && !option.ncGroupHeader,
        'atm-list-option-selected': isSelected,
        'bg-atm-bg-gray-light': !option?.ncItemDisabled && showHoverEffect && isSelected,
        'bg-atm-bg-gray-light atm-list-option-active': !option?.ncItemDisabled && isActive && !option.ncGroupHeader,
        'opacity-60 cursor-not-allowed': option?.ncItemDisabled && !option?.ncGroupHeader,
        'hover:bg-atm-bg-gray-light cursor-pointer': !option?.ncItemDisabled && !option?.ncGroupHeader,
        'py-2': variant === 'default' && !option.ncGroupHeader,
        'py-[5px]': variant === 'medium' && !option.ncGroupHeader,
        'py-[3px]': variant === 'small' && !option.ncGroupHeader,
        '-mx-1 px-3 w-[calc(100%_+_8px)]': variant === 'small' && option.ncGroupHeader,
        '-mx-2 px-4 w-[calc(100%_+_16px)]': variant !== 'small' && option.ncGroupHeader,
        'pointer-events-none': isLocked,
      },
      itemClassName,
      option.ncGroupHeader ? groupHeaderClassName : '',
    ]"
    :style="{
      minHeight: `${groupHeaderHeight}px`,
    }"
    :placement="itemTooltipPlacement"
    :disabled="!option?.ncItemTooltip"
    :attrs="{
      onMouseover: () => handleMouseover(),
    }"
    @click="handleClick"
  >
    <template #title>{{ option.ncItemTooltip }}</template>

    <!-- Group header row -->
    <slot v-if="option.ncGroupHeader" name="listItemGroupHeader" :option="option">
      <div>{{ option.ncGroupHeaderLabel }}</div>
    </slot>

    <!-- Regular item row -->
    <slot v-else name="listItem" :option="option" :is-selected="isSelected">
      <slot name="listItemExtraLeft" :option="option" :is-selected="isSelected" :search-basis-info="searchBasisInfo" />

      <slot name="listItemContent" :option="option" :is-selected="isSelected" :search-basis-info="searchBasisInfo">
        <AtTooltip class="truncate" :class="{ 'flex-1': !searchBasisInfo }" show-on-truncate-only>
          <template #title>{{ option[optionLabelKey] }}</template>
          {{ option[optionLabelKey] }}
        </AtTooltip>
        <div v-if="searchBasisInfo" class="flex-1 flex">
          <AtTooltip :title="searchBasisInfo" class="flex cursor-help">
            <GeneralIcon icon="info" class="flex-none h-3.5 w-3.5 text-atm-content-gray-muted" />
          </AtTooltip>
        </div>
      </slot>

      <slot name="listItemExtraRight" :option="option" :is-selected="isSelected" :search-basis-info="searchBasisInfo" />

      <slot name="listItemSelectedIcon" :option="option" :is-selected="isSelected">
        <GeneralIcon
          v-if="showSelectedOption && isSelected"
          id="atm-selected-item-icon"
          icon="check"
          class="flex-none text-atm-content-brand w-4 h-4"
        />
      </slot>
    </slot>
  </AtTooltip>
</template>
