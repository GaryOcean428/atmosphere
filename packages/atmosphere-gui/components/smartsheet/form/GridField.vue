<script lang="ts" setup>
interface Props {
  field: Record<string, any>
  isEditable: boolean
  isLocked: boolean
}

const props = defineProps<Props>()

const emits = defineEmits<{
  'activate': []
  'hide': []
  'update-meta': []
}>()

const { isRequired, activeRow, allViewFilters } = useFormViewStoreOrThrow()

// Active/visibility state is derived from the store HERE rather than passed as props from the
// parent. If the parent computed `activeRow === field.id` per item, its render effect would
// depend on `activeRow` and re-walk all ~145 preview rows on every field switch. By reading
// `activeRow` locally, only the two items whose `isActive` value actually flips re-render — the
// parent's render no longer depends on the active field at all.
const isActive = computed(() => activeRow.value === props.field.id)

const hasVisibilityCondition = computed(() => !!allViewFilters.value?.[props.field.fk_column_id]?.length)
</script>

<template>
  <div
    class="atm-editable atm-form-focus-element item relative bg-atm-bg-default p-2 flex-1 basis-0 min-w-0"
    :class="[
      `atm-form-drag-${toSafeClassName(field.title)}`,
      {
        'atm-form-field-drag-handler rounded-xl border-2 border-transparent my-1 cursor-move': isEditable,
      },
      {
        'my-0': !isEditable,
      },
      {
        'hover:(bg-atm-bg-gray-extralight)': !isActive && isEditable,
      },
      {
        'border-atm-border-brand': isActive,
      },
      {
        '!hover:bg-atm-bg-default !border-transparent !cursor-auto': isLocked,
      },
    ]"
    :data-title="field.title"
    :data-row-id="field.row_id || ''"
    data-testid="atm-form-fields"
    @click.stop="emits('activate')"
  >
    <template v-if="isActive">
      <div class="absolute right-1 top-1">
        <AtTooltip
          :title="isRequired(field, field.required) ? $t('tooltip.youCantRemoveARequiredField') : $t('tooltip.removeFromForm')"
        >
          <AtButton
            type="link"
            size="xsmall"
            class="atm-form-field-hide !bg-white !h-5 !w-5 !min-w-5 !rounded-full"
            :class="{
              '!text-atm-content-gray-muted !hover:text-atm-content-brand': !isRequired(field, field.required),
            }"
            icon-only
            :disabled="isRequired(field, field.required)"
            @click="emits('hide')"
          >
            <template #icon>
              <GeneralIcon icon="close" class="!w-4 !h-4" />
            </template>
          </AtButton>
        </AtTooltip>
      </div>
    </template>
    <div class="flex items-center gap-3">
      <AtTooltip v-if="hasVisibilityCondition && !isLocked" class="relative h-3.5 w-3.5 flex cursor-pointer" placement="topLeft">
        <template #title> {{ $t('tooltip.conditionallyVisibleField') }} </template>
        <Transition name="icon-fade" :duration="500">
          <GeneralIcon
            v-if="field?.visible"
            icon="eye"
            class="atm-field-visibility-icon atm-field-visible w-3.5 h-3.5 flex-none text-atm-content-gray-muted"
          />
          <GeneralIcon v-else icon="eyeSlash" class="atm-field-visibility-icon w-3.5 h-3.5 flex-none text-atm-content-gray-muted" />
        </Transition>
      </AtTooltip>
      <div class="text-sm font-medium text-atm-content-gray">
        <span data-testid="atm-form-input-label">
          {{ field.label || field.title }}
        </span>
        <span v-if="isRequired(field, field.required)" class="text-atm-content-red-medium text-base leading-[18px]">
          &nbsp;*
        </span>
      </div>
    </div>

    <LazyCellRichText
      v-if="field.description"
      :value="field.description"
      is-form-field
      read-only
      sync-value-change
      class="atm-form-help-text !h-auto text-atm-content-gray-muted text-xs mt-1 -ml-1"
      data-testid="atm-form-help-text"
      @update:value="emits('update-meta')"
    />

    <SmartsheetFormFieldBody :field="field" />
  </div>
</template>

<style lang="scss" scoped>
.atm-editable {
  // Each grid field cell is its own layout/style scope, so activating or restyling one cell
  // (or the sidebar's width transition) doesn't cascade a style/layout recalc across the
  // other ~150 cells. Deliberately no `paint`/`size` containment: cell content (select/date
  // dropdowns, tooltips) overflows the box and sizes to its content.
  contain: layout style;
}

.atm-form-help-text {
  max-width: 100%;
  white-space: pre-line;
}
</style>
