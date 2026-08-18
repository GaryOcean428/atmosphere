<script setup lang="ts">
import { type ClientType } from 'atmosphere-sdk'
import type { GroupHandler } from './types'
import { SmartsheetToolbarFilterGroup } from '#components'

interface Props {
  modelValue: ColumnFilterType
  index: number
  nestedLevel: number
  columns: ColumnTypeForFilter[]
  dbClientType?: ClientType

  disableAddNewFilter?: boolean
  actionBtnType?: 'text' | 'secondary'
  webHook?: boolean
  link?: boolean
  widget?: boolean
  isForm?: boolean
  isPublic?: boolean
  isFullWidth?: boolean

  disabled?: boolean
  // some view is different when locked view but not disabled
  isLockedView?: boolean
  isLogicalOpChangeAllowed?: boolean

  // limit imposed by user plan
  filterPerViewLimit: number
  // total filter already added into section
  filtersCount?: number
  // total visible filter count at current nested level
  visibleFilterCount?: number

  // what's this???
  queryFilter?: boolean

  handler?: GroupHandler
  isColourFilter?: boolean
  isLoadingFilter?: boolean
  parentEnabled?: boolean
}
interface Emits {
  (event: 'update:modelValue', model: string): void
  (event: 'change', model: FilterRowChangeEvent): void
  (
    event: 'delete',
    model: {
      filter: ColumnFilterType
      index: number
    },
  ): void
  (
    event: 'copy',
    model: {
      filter: ColumnFilterType
      index: number
    },
  ): void
}
const props = defineProps<Props>()
const emits = defineEmits<Emits>()
const vModel = useVModel(props, 'modelValue', emits)

const { t } = useI18n()

const { appInfo } = useGlobal()

const { blockToggleFilter, showUpgradeToUseToggleFilter } = useEeConfig()

const logicalOps = [
  { value: 'and', text: t('general.and') },
  { value: 'or', text: t('general.or') },
]

// #region utils & computed
const isDisabled = computed(() => {
  return vModel.value.readOnly || props.disabled || props.isLockedView
})

const isChildLogicalOpChangeAllowed = computed(() => {
  return new Set(vModel.value.children?.slice(1).map((filter) => filter.logical_op)).size > 1
})

// For now hide toggle filter enabled feature
const isAllowFilterEnableToggle = false
// #endregion

// #region event handling
const onFilterChange = (event: FilterGroupChangeEvent) => {
  switch (event.type) {
    case 'add': {
      event.filter.fk_parent_id = vModel.value.id
      emits('change', {
        filter: { ...vModel.value },
        type: 'child_add',
        prevValue: { ...vModel.value, children: event.prevValue },
        value: { ...vModel.value },
        index: props.index,
      })
      break
    }
    case 'delete': {
      event.filter.fk_parent_id = vModel.value.id
      emits('change', {
        filter: { ...vModel.value },
        type: 'child_delete',
        prevValue: { ...vModel.value, children: event.prevValue },
        value: { ...vModel.value },
        index: props.index,
      })
      break
    }
  }
}
const onFilterRowChange = (event: FilterRowChangeEvent) => {
  emits('change', {
    ...event,
    index: props.index,
  })
}
const onLogicalOpChange = (logical_op: string) => {
  const prevValue = vModel.value.logical_op
  if (props.handler?.rowChange) {
    props.handler?.rowChange({
      filter: vModel.value,
      type: 'logical_op',
      prevValue,
      value: logical_op,
      index: props.index,
    })
  } else {
    vModel.value.logical_op = logical_op as any
    emits('change', {
      filter: { ...vModel.value },
      type: 'logical_op',
      prevValue,
      value: logical_op,
      index: props.index,
    })
  }
}
const onDelete = () => {
  emits('delete', {
    filter: { ...vModel.value },
    index: props.index,
  })
}

const onCopy = () => {
  emits('copy', {
    filter: { ...vModel.value },
    index: props.index,
  })
}

const isFilterEnabled = computed(() => vModel.value.enabled !== false)

const effectiveEnabled = computed(() => props.parentEnabled !== false && isFilterEnabled.value)

const onEnabledChange = (val: boolean | Event) => {
  const newValue = typeof val === 'boolean' ? val : (val?.target as HTMLInputElement)?.checked
  const prevValue = vModel.value.enabled
  vModel.value.enabled = newValue

  if (props.handler?.rowChange) {
    props.handler?.rowChange({
      filter: vModel.value,
      type: 'enabled',
      prevValue,
      value: newValue,
      index: props.index,
    })
  } else {
    emits('change', {
      filter: { ...vModel.value },
      type: 'enabled',
      prevValue,
      value: newValue,
      index: props.index,
    })
  }
}

const onToggleFilterChange = (val: boolean | Event) => {
  if (blockToggleFilter.value) {
    showUpgradeToUseToggleFilter({ triggerSource: 'toolbar-toggle-filter' })
    return
  }
  onEnabledChange(val)
}
// #endregion
</script>

<template>
  <div class="flex flex-col min-w-full w-min gap-y-2">
    <div
      class="flex rounded-lg p-2 min-w-full w-min border-1"
      :class="[`atm-filter-nested-level-${nestedLevel}`, { 'atm-filter-disabled-row': isEeUI && !effectiveEnabled }]"
    >
      <SmartsheetToolbarFilterGroup
        v-model="vModel.children"
        :index="index"
        :nested-level="nestedLevel + 1"
        :columns="columns"
        :disabled="disabled"
        :is-locked-view="isLockedView"
        :is-logical-op-change-allowed="isChildLogicalOpChangeAllowed"
        :action-btn-type="actionBtnType"
        :web-hook="webHook"
        :link="link"
        :widget="widget"
        :is-form="isForm"
        :is-public="isPublic"
        :filter-per-view-limit="filterPerViewLimit"
        :disable-add-new-filter="disableAddNewFilter"
        :filters-count="filtersCount"
        :query-filter="queryFilter"
        :fk-parent-id="vModel.id"
        :parent-filter="vModel"
        :is-full-width="isFullWidth"
        :handler="handler"
        :is-colour-filter="isColourFilter"
        :is-loading-filter="isLoadingFilter"
        :parent-enabled="effectiveEnabled"
        @change="onFilterChange"
        @row-change="onFilterRowChange"
      >
        <template #nestedRowStart>
          <AtCheckbox
            v-if="appInfo.ee && isAllowFilterEnableToggle"
            :checked="isFilterEnabled"
            size="default"
            :disabled="isDisabled || parentEnabled === false"
            class="atm-filter-enabled-checkbox"
            @change="onToggleFilterChange"
          />
          <template v-if="index === 0">
            <span class="flex items-center atm-filter-where-label ml-1">{{ $t('labels.where') }}</span>
          </template>
          <div v-else :key="`${index}nested`" class="flex atm-filter-logical-op">
            <AtSelect
              v-model:value="vModel.logical_op"
              v-e="['c:filter:logical-op:select']"
              :dropdown-match-select-width="false"
              class="min-w-18 capitalize"
              :placeholder="$t('placeholder.groupOp')"
              dropdown-class-name="atm-dropdown-filter-logical-op-group"
              :disabled="(index > 1 && !isLogicalOpChangeAllowed) || isDisabled"
              :class="{
                'atm-disabled-logical-op': isDisabled || (index > 1 && !isLogicalOpChangeAllowed),
              }"
              @click.stop
              @change="onLogicalOpChange($event)"
            >
              <a-select-option v-for="op in logicalOps" :key="op.value" :value="op.value">
                <div class="flex items-center w-full justify-between gap-2">
                  <div class="truncate flex-1 capitalize">{{ op.text }}</div>
                  <component
                    :is="iconMap.check"
                    v-if="vModel.logical_op === op.value"
                    id="atm-selected-item-icon"
                    class="text-primary w-4 h-4"
                  />
                </div>
              </a-select-option>
            </AtSelect>
          </div>
        </template>
        <template #nestedRowEnd>
          <div v-if="!vModel.readOnly && !disabled" class="inline-block" :class="{ 'cursor-wait': isLoadingFilter }">
            <AtButton
              :key="index"
              v-e="['c:filter:delete', { link: !!link, webHook: !!webHook, widget: !!widget }]"
              type="text"
              size="small"
              :disabled="isLockedView"
              class="atm-filter-item-remove-btn cursor-pointer"
              :class="{ 'pointer-events-none': isLoadingFilter }"
              @click.stop="onDelete()"
            >
              <component :is="iconMap.deleteListItem" />
            </AtButton>
          </div>
          <div
            v-if="!vModel.readOnly && !disabled && appInfo.ee"
            class="inline-block"
            :class="{ 'cursor-wait': isLoadingFilter }"
          >
            <AtButton
              :key="index"
              v-e="['c:filter:copy', { link: !!link, webHook: !!webHook, widget: !!widget }]"
              type="text"
              size="small"
              :disabled="isLockedView"
              class="atm-filter-item-copy-btn cursor-pointer"
              :class="{ 'pointer-events-none': isLoadingFilter }"
              @click.stop="onCopy()"
            >
              <GeneralIcon icon="copy" />
            </AtButton>
          </div>
          <div v-if="!isDisabled" class="inline-block" :class="{ 'cursor-wait': isLoadingFilter }">
            <AtButton
              v-e="['c:filter:reorder', { link: !!link, webHook: !!webHook, widget: !!widget }]"
              type="text"
              size="small"
              class="atm-filter-item-reorder-btn atm-filter-group-row-drag-handler self-center"
              :class="{ 'pointer-events-none': isLoadingFilter }"
              :shadow="false"
              :disabled="!visibleFilterCount || visibleFilterCount <= 1"
            >
              <GeneralIcon icon="drag" class="flex-none h-4 w-4" />
            </AtButton>
          </div>
        </template>
      </SmartsheetToolbarFilterGroup>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-filter-where-label {
  @apply text-atm-content-gray-disabled;
}

.atm-filter-item-remove-btn,
.atm-filter-item-reorder-btn,
.atm-filter-item-copy-btn {
  @apply text-atm-content-gray-subtle2 hover:text-atm-content-gray;
}

.atm-filter-grid {
  @apply items-center w-full;
}

:deep(.ant-select-item-option) {
  @apply "!min-w-full";
}

:deep(.ant-select-selector) {
  @apply !min-h-8;
}

.atm-disabled-logical-op :deep(.ant-select-arrow) {
  @apply hidden;
}

.atm-filter-wrapper {
  @apply bg-atm-bg-default !rounded-lg border-1px border-[#E7E7E9];

  & > *,
  .atm-filter-value-select {
    @apply !border-none;
  }

  & > div > :deep(.ant-select-selector),
  :deep(.atm-filter-field-select) > div {
    border: none !important;
    box-shadow: none !important;
  }

  & > :not(:last-child):not(:empty) {
    border-right: 1px solid #eee !important;
    border-bottom-right-radius: 0 !important;
    border-top-right-radius: 0 !important;
  }

  .atm-settings-dropdown {
    border-left: 1px solid #eee !important;
    border-radius: 0 !important;
  }

  & > :not(:first-child) {
    border-bottom-left-radius: 0 !important;
    border-top-left-radius: 0 !important;
  }

  & > :last-child {
    @apply relative;
    &::after {
      content: '';
      @apply absolute h-full w-1px bg-[#eee] -left-1px top-0;
    }
  }

  :deep(::placeholder) {
    @apply text-sm tracking-normal;
  }

  :deep(::-ms-input-placeholder) {
    @apply text-sm tracking-normal;
  }

  :deep(input) {
    @apply text-sm;
  }

  :deep(.atm-select:not(.atm-disabled-logical-op):not(.ant-select-disabled):hover) {
    &,
    .ant-select-selector {
      @apply bg-atm-bg-gray-extralight;
    }
  }
}

.atm-filter-nested-level-0 {
  @apply bg-atm-bg-gray-extralight;
}

.atm-filter-nested-level-1,
.atm-filter-nested-level-3 {
  @apply bg-atm-bg-gray-light;
}

.atm-filter-nested-level-2,
.atm-filter-nested-level-4 {
  @apply bg-atm-bg-gray-medium;
}

.atm-filter-logical-op-level-3,
.atm-filter-logical-op-level-5 {
  :deep(.atm-select.ant-select .ant-select-selector) {
    @apply border-[#d9d9d9];
  }
}

.atm-filter-where-label {
  @apply text-atm-content-gray-disabled;
}

:deep(.ant-select-disabled.ant-select:not(.ant-select-customize-input) .ant-select-selector) {
  @apply bg-transparent text-atm-content-gray-disabled;
}

:deep(.atm-filter-logical-op .atm-select.ant-select .ant-select-selector) {
  @apply shadow-none;
}

:deep(.atm-select-expand-btn) {
  @apply text-atm-content-gray-muted;
}

.menu-filter-dropdown {
  input:not(:disabled),
  select:not(:disabled),
  .ant-select:not(.ant-select-disabled) {
    @apply text-atm-content-brand-disabled;
  }
}

.atm-filter-input-wrapper :deep(input) {
  &:not(.ant-select-selection-search-input) {
    @apply !px-2;
  }
}

.atm-btn-focus:focus {
  @apply !text-atm-content-brand !shadow-none;
}

.atm-filter-disabled-row {
  @apply opacity-40;

  :deep(.atm-filter-enabled-checkbox) {
    @apply opacity-100;
  }
}

.atm-filter-enabled-checkbox {
  @apply flex-shrink-0 flex items-center;
}
</style>
