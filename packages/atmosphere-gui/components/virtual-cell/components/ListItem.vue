<script lang="ts" setup>
import { PermissionEntity, PermissionKey, isVirtualCol } from 'atmosphere-sdk'

const props = withDefaults(
  defineProps<{
    row: any
    fields: any[]
    attachment: any
    displayValueColumn: any
    relatedTableDisplayValueProp: string
    displayValueTypeAndFormatProp: { type: string; format: string }
    isLoading: boolean
    isLinked: boolean
    isSelected?: boolean
    /** Grid interface: allow expanding this linked record (follows viz inline-edit toggle) */
    allowExpand?: boolean
  }>(),
  {
    isLoading: false,
    isSelected: false,
    allowExpand: true,
  },
)

const emits = defineEmits(['expand', 'linkOrUnlink', 'close'])

const { showExtraFields, relatedTableMeta, meta, isLinkedTableAccessible } = useLTARStoreOrThrow()!

provide(IsExpandedFormOpenInj, ref(true))

provide(RowHeightInj, ref(1 as const))

provide(IsUnderLookupInj, ref(true))

provide(IsLinkRecordDropdownInj, ref(true))

const isForm = inject(IsFormInj, ref(false))

const column = inject(ColumnInj)!

provide(IsFormInj, ref(false))

provide(MetaInj, relatedTableMeta)

const row = useVModel(props, 'row')

const { isLinked, isLoading, isSelected } = toRefs(props)

const isPublic = inject(IsPublicInj, ref(false))

const readOnly = inject(ReadonlyInj, ref(false))

// Interface pages hide the expand icon (`isLinkedTableAccessible` is false
// there) — unless the column's "Click into record details" is configured, in
// which case expand opens the LINKED record's interface record-detail sheet
// instead of the classic expanded form.
const linkRecordExpand = inject(LinkRecordExpandInj, ref(null))

const interfaceExpandEnabled = computed(() => !!column?.value && !!linkRecordExpand.value?.isEnabled(column.value))

const showExpandButton = computed(
  () => (props.allowExpand && !isForm.value && !isPublic.value && isLinkedTableAccessible.value) || interfaceExpandEnabled.value,
)

function onExpandClick() {
  if (interfaceExpandEnabled.value) {
    // The record-detail sheet is an in-canvas layer; this list rides a
    // body-portaled dropdown and would cover it. Close before expanding —
    // same order the simple picker uses.
    emits('close')
    linkRecordExpand.value?.expand({ column: column.value, row: row.value, relatedTableMeta: relatedTableMeta.value })
    return
  }

  emits('expand', row.value)
}

const { getPossibleAttachmentSrc } = useAttachment()

const { isMounted } = useIsMounted()

interface Attachment {
  url: string
  title: string
  type: string
  mimetype: string
}

const attachments: ComputedRef<Attachment[]> = computed(() => {
  try {
    if (props.attachment && row.value[props.attachment.title]) {
      return typeof row.value[props.attachment.title] === 'string'
        ? JSON.parse(row.value[props.attachment.title])
        : row.value[props.attachment.title]
    }
    return []
  } catch (e) {
    return []
  }
})
</script>

<template>
  <div
    class="atm-list-item-wrapper group px-[1px] hover:bg-atm-bg-gray-extralight border-y-1 border-atm-border-gray-medium border-t-transparent"
  >
    <a-card
      tabindex="0"
      class="atm-list-item !outline-none transition-all relative group-hover:!bg-atm-bg-gray-extralight cursor-auto !border-transparent"
      :class="{
        '!bg-atm-bg-default': isLoading,
        '!hover:bg-atm-bg-default': readOnly,
        'atm-is-selected': isSelected,
      }"
      :body-style="{ padding: '6px 10px !important', borderRadius: 0 }"
      :hoverable="false"
    >
      <div class="flex items-center gap-3">
        <template v-if="attachment">
          <div v-if="isMounted && attachments && attachments.length">
            <a-carousel autoplay class="!w-11 !h-11 !max-h-11 !max-w-11">
              <template #customPaging> </template>
              <template v-for="(attachmentObj, index) in attachments">
                <LazyCellAttachmentPreviewImage
                  v-if="isImage(attachmentObj.title, attachmentObj.mimetype ?? attachmentObj.type)"
                  :key="`carousel-${attachmentObj.title}-${index}`"
                  class="!w-11 !h-11 !max-h-11 !max-w-11object-cover !rounded-l-xl"
                  :srcs="getPossibleAttachmentSrc(attachmentObj, 'tiny')"
                />
              </template>
            </a-carousel>
          </div>
          <div
            v-else
            class="h-11 w-11 !min-h-11 !min-w-11 !max-h-11 !max-w-11 !flex flex-row items-center !rounded-l-xl justify-center"
          >
            <GeneralIcon class="w-full h-full !text-6xl !leading-10 !text-transparent rounded-lg" icon="fileImage" />
          </div>
        </template>
        <div class="flex-1 flex flex-col gap-1 justify-center overflow-hidden">
          <div class="flex justify-start">
            <SmartsheetPlainCell
              v-if="displayValueColumn"
              class="font-semibold text-atm-content-brand atm-display-value truncate leading-[20px]"
              :column="displayValueColumn"
              :model-value="row[displayValueColumn.title]"
            />
          </div>

          <!-- Only show sub-fields if linked table is accessible -->
          <div
            v-if="isLinkedTableAccessible && fields.length > 0 && showExtraFields"
            class="flex ml-[-0.25rem] sm:flex-row xs:(flex-col mt-2) gap-4 min-h-5"
          >
            <div v-for="field in fields" :key="field.id" class="sm:(w-1/3 max-w-1/3 overflow-hidden)">
              <div v-if="!isRowEmpty({ row }, field)" class="flex flex-col gap-[-1]">
                <AtTooltip class="z-10 flex" placement="bottomLeft" :arrow-point-at-center="false">
                  <template #title>
                    <LazySmartsheetHeaderVirtualCell
                      v-if="isVirtualCol(field)"
                      class="text-gray-100 !text-sm atm-link-record-cell-tooltip"
                      :column="field"
                      :hide-menu="true"
                      hide-icon-tooltip
                    />
                    <LazySmartsheetHeaderCell
                      v-else
                      class="text-gray-100 !text-sm atm-link-record-cell-tooltip"
                      :column="field"
                      :hide-menu="true"
                      hide-icon-tooltip
                    />
                  </template>
                  <div class="atm-link-record-cell flex w-full max-w-full">
                    <LazySmartsheetVirtualCell
                      v-if="isVirtualCol(field)"
                      v-model="row[field.title]"
                      :row="row"
                      :column="field"
                      class="!h-auto"
                    />
                    <LazySmartsheetCell
                      v-else
                      v-model="row[field.title]"
                      :column="field"
                      :edit-enabled="false"
                      :read-only="true"
                      class="!h-auto"
                    />
                  </div>
                </AtTooltip>
              </div>
              <div v-else class="flex flex-row w-full max-w-72 h-5 pl-1 items-center justify-start">-</div>
            </div>
          </div>
        </div>
        <div v-if="showExpandButton" class="flex-none flex items-center w-7" @click.stop>
          <AtTooltip class="flex" hide-on-click>
            <template #title>{{ $t('title.expand') }}</template>

            <button
              v-e="['c:row-expand:open']"
              :tabindex="-1"
              class="z-10 flex items-center justify-center atm-expand-item !group-hover:visible !invisible !h-7 !w-7 transition-all !hover:children:(w-4.5 h-4.5)"
              @click="onExpandClick"
            >
              <GeneralIcon icon="maximize" class="flex-none w-4 h-4 scale-125" />
            </button>
          </AtTooltip>
        </div>
        <template v-if="((!isPublic && !readOnly) || (isForm && !readOnly)) && !(meta?.synced && column?.readonly)">
          <PermissionsTooltip
            class="z-10 flex"
            :entity="PermissionEntity.FIELD"
            :entity-id="relatedTableMeta?.id"
            :permission="PermissionKey.RECORD_FIELD_EDIT"
            :default-tooltip="isLinked ? 'Unlink' : 'Link'"
          >
            <template #default="{ isAllowed }">
              <button
                tabindex="-1"
                class="atm-list-item-link-unlink-btn p-1.5 flex rounded-lg transition-all"
                :class="{
                  'bg-atm-bg-gray-medium text-atm-content-gray hover:(bg-atm-bg-red-dark text-atm-content-red-medium)': isLinked,
                  'bg-green-[#D4F7E0] text-[#17803D] hover:bg-green-200': !isLinked,
                }"
                :disabled="!isAllowed"
                @click="$emit('linkOrUnlink')"
              >
                <div v-if="isLoading" class="flex">
                  <MdiLoading class="flex-none w-4 h-4 !text-atm-content-brand animate-spin" />
                </div>
                <GeneralIcon v-else :icon="isLinked ? 'minus' : 'plus'" class="flex-none w-4 h-4 !font-extrabold" />
              </button>
            </template>
          </PermissionsTooltip>
        </template>
      </div>
    </a-card>
  </div>
</template>

<style lang="scss" scoped>
:deep(.slick-list) {
  @apply rounded-lg;
}
.atm-list-item-link-unlink-btn {
  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.06), 0px 5px 3px -2px rgba(0, 0, 0, 0.02);
}

.atm-link-record-cell {
  :deep(.atm-cell),
  :deep(.atm-virtual-cell) {
    @apply !text-small !text-atm-content-gray-subtle2 ml-1;

    .atm-cell-field,
    .atm-cell-field-link,
    input,
    textarea {
      @apply !text-small !p-0 m-0;
    }

    &:not(.atm-display-value-cell) {
      @apply text-atm-content-gray-subtle2;
      font-weight: 500;

      .atm-cell-field,
      input,
      textarea {
        @apply text-atm-content-gray-subtle2;
        font-weight: 500;
      }
    }

    .atm-cell-field,
    a.atm-cell-field-link,
    input,
    textarea {
      @apply !p-0 m-0;
    }

    &.atm-cell-longtext {
      @apply leading-[18px];

      textarea {
        @apply pr-2;
      }

      .long-text-wrapper {
        @apply !min-h-4;

        .atm-rich-text-grid {
          @apply pl-0 -ml-1;
        }
      }
    }

    .ant-picker-input {
      @apply text-small leading-4;
      font-weight: 500;

      input {
        @apply text-small leading-4;
        font-weight: 500;
      }
    }

    .ant-select:not(.ant-select-customize-input) {
      .ant-select-selector {
        @apply !border-none flex-nowrap pr-4.5;
      }
      .ant-select-arrow,
      .ant-select-clear {
        @apply right-[3px];
      }
    }
  }
}
.atm-link-record-cell-tooltip {
  @apply !bg-transparent !hover:bg-transparent;

  :deep(.atm-cell-icon) {
    @apply !ml-0;
  }
  :deep(.name) {
    @apply !text-small;
  }
}
</style>

<style lang="scss">
.atm-list-item {
  @apply border-1 border-transparent rounded-md;

  &:focus-visible,
  &.atm-is-selected {
    @apply border-atm-border-brand;
    box-shadow: 0 0 0 1px var(--atm-border-brand);
  }
  &:hover {
    .atm-text-area-expand-btn {
      @apply !hidden;
    }
  }
  .long-text-wrapper {
    @apply select-none pointer-events-none;
    .atm-readonly-rich-text-wrapper {
      @apply !min-h-5 !max-h-5;
    }
    .atm-rich-text-embed {
      @apply -mt-0.5;
      .atm-textarea-rich-editor {
        @apply !overflow-hidden;
        .ProseMirror {
          @apply !overflow-hidden line-clamp-1 h-[18px] pt-0.4;
        }
      }
    }
  }
}
</style>
