<script setup lang="ts">
import type { ColumnType, SortType, TableType } from 'atmosphere-sdk'
import Draggable from 'vuedraggable'
import { getColumnUidtByID as resolveColumnUidt } from '~/utils/sortUtils'

// Presentational, reusable sort-row list — the shared UI behind the toolbar sort
// menu AND the lookup field editor. Intentionally dumb: NO store, NO injections,
// NO API calls. All persistence stays in the caller (this is the deliberate
// counter-pattern to the over-coupled filter component). Callers feed `sorts` +
// selectable `columns` and react to the emitted intents.
const props = withDefaults(
  defineProps<{
    // Sort rows to render (mutated in place on field/direction change, matching
    // the existing toolbar behaviour — caller persists via the emitted events).
    sorts: SortType[]
    // Selectable columns for the field dropdown (already filtered/decorated by
    // the caller, e.g. with ncItemDisabled tooltips).
    columns: ColumnType[]
    // Table meta the columns belong to (field dropdown needs it).
    meta: TableType | Record<string, any>
    // Show a drag handle + enable reordering (toolbar/EE). Off for lookup.
    draggable?: boolean
    // Show the per-row enable/disable checkbox (toolbar/EE). Off for lookup.
    showEnableToggle?: boolean
    // Render rows read-only (locked / non-owned personal views).
    readOnly?: boolean
    // Disable the whole control (e.g. locked view).
    disabled?: boolean
    // Bypass view-column store inside the field dropdown — required when used
    // outside a smartsheet view (e.g. the lookup field editor modal).
    disableSmartsheet?: boolean
  }>(),
  {
    draggable: false,
    showEnableToggle: false,
    readOnly: false,
    disabled: false,
    disableSmartsheet: false,
  },
)

const emit = defineEmits<{
  // A row's field or direction changed → persist it.
  (e: 'saveOrUpdate', sort: SortType): void
  // A row's remove button was clicked.
  (e: 'delete', sort: SortType): void
  // The enable checkbox was toggled.
  (e: 'toggleEnabled', sort: SortType): void
  // Drag reorder happened — payload is vuedraggable's change event.
  (e: 'move', event: { moved?: { newIndex: number; oldIndex: number } }): void
}>()

const getColumnUidtByID = (key?: string) => resolveColumnUidt(key, props.columns)
</script>

<template>
  <div class="atm-sort-list-rows">
    <!-- Editable rows -->
    <template v-if="!readOnly">
      <Draggable
        :model-value="sorts"
        :item-key="(sort) => sort.id || sort.fk_column_id"
        ghost-class="bg-atm-bg-gray-extralight"
        :disabled="disabled || !draggable"
        @change="emit('move', $event)"
      >
        <template #item="{ element: sort }">
          <div
            :key="sort.id || sort.fk_column_id"
            class="flex first:mb-0 !mb-1.5 !last:mb-0 items-center gap-2"
            :class="{ 'atm-sort-disabled-row': sort.enabled === false }"
          >
            <AtCheckbox
              v-if="showEnableToggle"
              :checked="sort.enabled !== false"
              size="default"
              :disabled="disabled"
              class="atm-sort-enabled-checkbox xs:(flex min-h-8)"
              @change="emit('toggleEnabled', sort)"
            />
            <!-- joined control group (no internal gap so the field/dir/reorder/remove stay connected) -->
            <div class="flex items-center flex-1 min-w-0">
              <SmartsheetToolbarFieldListAutoCompleteDropdown
                v-model="sort.fk_column_id"
                class="flex caption atm-sort-field-select !w-44 flex-grow"
                :columns="columns"
                is-sort
                :meta="meta"
                :disabled="disabled"
                :disable-smartsheet="disableSmartsheet"
                @click.stop
                @update:model-value="emit('saveOrUpdate', sort)"
              />

              <AtSelect
                v-model:value="sort.direction"
                class="flex flex-grow-1 w-full atm-sort-dir-select"
                :label="$t('labels.operation')"
                dropdown-class-name="sort-dir-dropdown atm-dropdown-sort-dir !rounded-lg"
                :disabled="disabled"
                @click.stop
                @select="emit('saveOrUpdate', sort)"
              >
                <a-select-option
                  v-for="(option, j) of getSortDirectionOptions(getColumnUidtByID(sort.fk_column_id))"
                  :key="j"
                  v-e="['c:sort:operation:select']"
                  :value="option.value"
                >
                  <div class="w-full flex items-center justify-between gap-2">
                    <div class="truncate flex-1">{{ option.text }}</div>
                    <component
                      :is="iconMap.check"
                      v-if="sort.direction === option.value"
                      id="atm-selected-item-icon"
                      class="text-primary w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>

              <AtButton
                v-if="draggable"
                type="secondary"
                size="small"
                class="atm-sort-item-reorder-btn !border-l-transparent !rounded-none"
                :shadow="false"
                :disabled="disabled"
              >
                <component :is="iconMap.drag" />
              </AtButton>

              <AtTooltip placement="top" :title="$t('general.remove')" class="flex-none">
                <AtButton
                  v-e="['c:sort:delete']"
                  size="small"
                  type="secondary"
                  :shadow="false"
                  :disabled="disabled"
                  class="atm-sort-item-remove-btn !max-w-8 !border-l-transparent !rounded-l-none"
                  @click.stop="emit('delete', sort)"
                >
                  <component :is="iconMap.deleteListItem" />
                </AtButton>
              </AtTooltip>
            </div>
          </div>
        </template>
      </Draggable>
    </template>

    <!-- Read-only rows (locked / non-owned personal views) -->
    <template v-else>
      <div
        v-for="(sort, i) of sorts"
        :key="`existing-${sort.id || i}`"
        class="flex first:mb-0 !mb-1.5 !last:mb-0 items-center opacity-70"
      >
        <SmartsheetToolbarFieldListAutoCompleteDropdown
          :model-value="sort.fk_column_id"
          class="flex caption atm-sort-field-select !w-44 flex-grow"
          :columns="columns"
          is-sort
          :meta="meta"
          disabled
          :disable-smartsheet="disableSmartsheet"
          show-all-columns
        />

        <AtSelect
          :value="sort.direction"
          class="flex flex-grow-1 w-full atm-sort-dir-select"
          :label="$t('labels.operation')"
          dropdown-class-name="sort-dir-dropdown atm-dropdown-sort-dir !rounded-lg"
          :disabled="true"
        >
          <a-select-option
            v-for="(option, j) of getSortDirectionOptions(getColumnUidtByID(sort.fk_column_id))"
            :key="j"
            :value="option.value"
          >
            <div class="w-full flex items-center justify-between gap-2">
              <div class="truncate flex-1">{{ option.text }}</div>
              <component
                :is="iconMap.check"
                v-if="sort.direction === option.value"
                id="atm-selected-item-icon"
                class="text-primary w-4 h-4"
              />
            </div>
          </a-select-option>
        </AtSelect>

        <AtTooltip placement="top" :title="$t('general.remove')" class="flex-none">
          <AtButton
            v-e="['c:sort:delete']"
            size="small"
            type="secondary"
            :shadow="false"
            :disabled="true"
            class="atm-sort-item-remove-btn !max-w-8 !border-l-transparent !rounded-l-none"
          >
            <component :is="iconMap.deleteListItem" />
          </AtButton>
        </AtTooltip>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
:deep(.atm-sort-field-select) {
  @apply !w-44;
  .ant-select-selector {
    @apply !rounded-none !rounded-l-lg !border-r-0 !border-atm-border-gray-medium !shadow-none !w-44;

    &.ant-select-focused:not(.ant-select-disabled) {
      @apply !border-r-transparent;
    }

    .field-selection-tooltip-wrapper {
      @apply !max-w-30;
    }
  }
}

:deep(.atm-select:not(.ant-select-disabled):hover) {
  &,
  .ant-select-selector {
    @apply bg-atm-bg-gray-extralight;
  }
}

:deep(.atm-sort-dir-select) {
  .ant-select-selector {
    @apply !rounded-none !border-atm-border-gray-medium !shadow-none;
  }
}

.atm-sort-disabled-row {
  .atm-sort-field-select,
  .atm-sort-dir-select {
    @apply opacity-40 pointer-events-none;
  }
}
</style>
