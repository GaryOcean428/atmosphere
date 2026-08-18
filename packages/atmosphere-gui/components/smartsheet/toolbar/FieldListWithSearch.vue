<script lang="ts" setup>
import { type ButtonType, type ColumnType, isSystemColumn } from 'atmosphere-sdk'

const props = withDefaults(
  defineProps<{
    // As we need to focus search box when the parent is opened
    isParentOpen: boolean
    toolbarMenu: 'groupBy' | 'sort' | 'globalSearch'
    searchInputPlaceholder?: string
    selectedOptionId?: string
    options: ColumnType[]
    showSelectedOption?: boolean
    inputBordered?: boolean
  }>(),
  {
    inputBordered: true,
  },
)

const emits = defineEmits<{ selected: [ColumnType] }>()

const { isParentOpen, toolbarMenu, searchInputPlaceholder, selectedOptionId, showSelectedOption } = toRefs(props)

const { fieldsMap, isLocalMode } = useViewColumnsOrThrow()

// Compact hosts (interface toolbar/panel): smaller, subtler field-type icons.
const isCompact = inject(FieldListCompactInj, ref(false))

const { $e } = useNuxtApp()

const { t } = useI18n()

const options = computed(() =>
  (props.options || [])
    .filter((c) => (isLocalMode.value && c?.id && fieldsMap.value[c.id] ? fieldsMap.value[c.id]?.initialShow : true))
    .map((c) => c)
    .sort((field1, field2) => {
      // sort by view column order and keep system columns at the end
      let orderVal1 = 0
      let orderVal2 = 0
      let sortByOrder = 0

      if (isSystemColumn(field1)) {
        orderVal1 = 1
      }
      if (isSystemColumn(field2)) {
        orderVal2 = 1
      }

      if (
        field1?.id &&
        field2?.id &&
        fieldsMap.value[field1.id]?.order !== undefined &&
        fieldsMap.value[field2.id]?.order !== undefined
      ) {
        sortByOrder = fieldsMap.value[field1.id].order - fieldsMap.value[field2.id].order
      }

      return orderVal1 - orderVal2 || sortByOrder
    }),
)

const configByToolbarMenu = computed(() => {
  switch (toolbarMenu.value) {
    case 'groupBy':
      return {
        selectOptionEvent: 'c:group-by:add:column:select',
        optionClassName: 'atm-group-by-column-search-item',
      }
    case 'sort':
      return {
        selectOptionEvent: 'c:sort:add:column:select',
        optionClassName: 'atm-sort-column-search-item',
      }
    case 'globalSearch':
      return {
        selectOptionEvent: 'c:search:field:select',
        optionClassName: '',
      }
    default:
      return {
        selectOptionEvent: undefined,
        optionClassName: '',
      }
  }
})

const handleSelect = (c: ColumnType) => {
  emits('selected', c)
  if (configByToolbarMenu.value.selectOptionEvent) {
    $e(configByToolbarMenu.value.selectOptionEvent)
  }
}

const isLocked = inject(IsLockedInj)

const fieldSearchBasisOptions = computed<AtListSearchBasisOptionType[]>(() => [
  {
    searchBasisInfo: t('msg.info.matchedByButtonLabel'),
    filterCallback: (query, option) => {
      if (!option) return false

      const column = option as ColumnType

      return isButton(column) && searchCompare([(column.colOptions as ButtonType)?.label], query)
    },
  },
  {
    searchBasisInfo: t('msg.info.matchedByFieldDescription'),
    filterCallback: (query, option) => {
      if (!option) return false

      const column = option as ColumnType

      if (!column.description) return false

      return searchCompare([column.description], query)
    },
  },
])
</script>

<template>
  <AtList
    class="field-list-with-search"
    :class="{
      'atm-input-bordered': inputBordered,
    }"
    :search-input-placeholder="searchInputPlaceholder"
    :show-selected-option="showSelectedOption"
    option-label-key="title"
    option-value-key="id"
    :input-bordered="inputBordered"
    :hide-top-divider="inputBordered"
    :open="isParentOpen"
    :is-locked="isLocked && toolbarMenu !== 'globalSearch'"
    show-search-always
    :item-class-name="configByToolbarMenu.optionClassName"
    :list="options"
    :value="selectedOptionId"
    variant="medium"
    :search-basis-options="fieldSearchBasisOptions"
    @change="handleSelect"
  >
    <template #listItemExtraLeft="{ option }">
      <SmartsheetHeaderIcon
        :column="option"
        :class="isCompact ? '!w-3 !h-3 opacity-75' : '!w-3.5 !h-3.5'"
        color="text-atm-content-gray-muted"
      />
    </template>
  </AtList>
</template>

<style lang="scss">
.field-list-with-search {
  &.atm-input-bordered .atm-toolbar-dropdown-search-field-input {
    @apply rounded-lg mb-2;
  }

  .atm-list-item {
    @apply h-8 hover:bg-atm-bg-gray-light gap-x-1.5;
  }
}
</style>
