<script lang="ts" setup>
import { isVirtualCol } from 'atmosphere-sdk'

interface Props {
  field: Record<string, any>
}

defineProps<Props>()

const { formState, validateInfos, fieldMappings } = useFormViewStoreOrThrow()

const { row } = useSmartsheetRowStoreOrThrow()

// True when an attachment cell currently holds files — drives a static
// `atm-input-has-attachments` class that replaces a costly `:has()` CSS selector.
function isAttachmentCellWithFiles(col: Record<string, any>) {
  if (!isAttachment(col)) return false
  const val = formState.value?.[col.title]
  const arr = ncIsArray(val) ? val : ncIsString(val) ? parseProp(val) : []
  return ncIsArray(arr) && arr.length > 0
}
</script>

<template>
  <div class="atm-form-field-body">
    <div class="mt-2">
      <a-form-item
        v-if="fieldMappings[field.title]"
        :name="fieldMappings[field.title]"
        class="!my-0 atm-input-required-error atm-form-input-item"
        v-bind="validateInfos[fieldMappings[field.title]]"
      >
        <LazySmartsheetDivDataCell class="relative" @click.stop>
          <LazySmartsheetVirtualCell
            v-if="isVirtualCol(field)"
            v-model="formState[field.title]"
            :row="row"
            class="atm-input"
            :class="`atm-form-input-${toSafeClassName(field.title)}`"
            :data-testid="`atm-form-input-${toSafeClassName(field.title)}`"
            :column="field"
          />
          <LazySmartsheetCell
            v-else
            v-model="formState[field.title]"
            class="atm-input truncate"
            :class="[
              `atm-form-input-${toSafeClassName(field.title)}`,
              {
                'layout-list': field.meta.isList,
                'atm-input-has-attachments': isAttachmentCellWithFiles(field),
              },
            ]"
            :data-testid="`atm-form-input-${toSafeClassName(field.title)}`"
            :column="field"
            :edit-enabled="true"
          />
        </LazySmartsheetDivDataCell>
      </a-form-item>

      <div>
        <LazySmartsheetFormFieldConfigError :column="field" mode="preview" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.atm-input {
  @apply appearance-none w-full;
  // Bordered-input style for all non-list cells except attachment cells that have
  // files (their attachment display has its own chrome). Uses a static class
  // (`atm-input-has-attachments`) instead of `:has(...)` — the relational selector
  // forced Blink to re-scan every `.atm-input` subtree on ANY in-form style change
  // (e.g. the activeRow class toggle), which was the dominant RecalcStyle cost on
  // large forms. A direct class is O(1) invalidation.
  &:not(.layout-list):not(.atm-input-has-attachments) {
    @apply !bg-atm-bg-default rounded-lg border-solid border-1 border-atm-border-gray-medium !focus-within:border-atm-border-brand;
  }
  &.layout-list {
    @apply h-auto !p-0;
  }

  &.atm-cell-geodata {
    @apply !py-1;
  }
  &.atm-cell-currency {
    @apply !py-0 !pl-0 flex items-stretch;
  }

  &:not(.atm-cell-datetime) {
    :deep(input) {
      &:not(.ant-select-selection-search-input) {
        @apply !px-1;
      }
    }
  }

  &.atm-cell-longtext {
    @apply p-0 h-auto;
  }
  &.atm-cell:not(.atm-cell-longtext) {
    @apply p-2;
  }

  :deep(&.atm-cell:not(.atm-cell-longtext)) {
    &.atm-cell-phonenumber,
    &.atm-cell-email,
    &.atm-cell-url {
      .atm-cell-field.atm-cell-link-preview {
        @apply px-3;
      }
    }
  }
  &.atm-virtual-cell {
    @apply px-2 py-1 min-h-10;
  }

  &.atm-cell-json {
    @apply min-h-[38px] h-auto;
    & > div {
      @apply w-full;
    }
  }

  :deep(.ant-picker) {
    @apply !py-0;
  }
  :deep(input.atm-cell-field) {
    @apply !py-0;
  }
}

.atm-input-required-error {
  max-width: 100%;
  white-space: pre-line;
  :deep(.ant-form-item-explain-error) {
    &:first-child {
      @apply mt-2;
    }
  }
  &:focus-within {
    :deep(.ant-form-item-explain-error) {
      @apply text-atm-content-gray-disabled;
    }
  }
}

:deep(.ant-form-item-has-error .ant-select:not(.ant-select-disabled) .ant-select-selector) {
  border: none !important;
}
:deep(.ant-form-item-has-success .ant-select:not(.ant-select-disabled) .ant-select-selector) {
  border: none !important;
}

:deep(.atm-cell-attachment) {
  @apply p-0;

  .atm-attachment-cell {
    @apply px-4 min-h-[75px] w-full h-full;

    .atm-attachment {
      @apply md: (w-[50px] h-[50px]) lg:(w-[75px] h-[75px]) min-h-[50px] min-w-[50px];
    }

    .atm-attachment-cell-dropzone {
      @apply rounded bg-atm-bg-gray-extradark/75;
    }
  }
}

.atm-form-input-item .atm-data-cell {
  @apply !border-none rounded-none;

  &:focus-within {
    @apply !border-none;
  }
}

.atm-form-field-body {
  :deep(.atm-cell) {
    @apply my-0;
  }
}
</style>
