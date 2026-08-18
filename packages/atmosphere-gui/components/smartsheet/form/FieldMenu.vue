<script lang="ts" setup>
import type { ColumnReqType, ColumnType } from 'atmosphere-sdk'
import { UITypes } from 'atmosphere-sdk'
import { computed } from 'vue'

const props = defineProps<{
  column: ColumnType
  formColumn: Record<string, any>
  isRequired?: boolean
  isOpen: boolean
  onDelete: () => void
}>()

const emit = defineEmits(['hideField', 'update:isOpen', 'delete'])

const { column, isRequired } = toRefs(props)

const isOpen = useVModel(props, 'isOpen', emit)

const { eventBus } = useSmartsheetStoreOrThrow()

const reloadDataHook = inject(ReloadViewDataHookInj)

const meta = inject(MetaInj, ref())

const view = inject(ActiveViewInj, ref())

const isLocked = inject(IsLockedInj)

provide(ColumnInj, column)

const { $api } = useNuxtApp()

const { t } = useI18n()

const { getMeta } = useMetas()

const showDeleteColumnModal = ref(false)

const isDuplicateDlgOpen = ref(false)
const selectedColumnExtra = ref<any>()
const duplicateDialogRef = ref<any>()

const duplicateVirtualColumn = async () => {
  let columnCreatePayload = {}

  // generate duplicate column title
  const duplicateColumnTitle = getUniqueColumnName(`${column!.value.title} copy`, meta!.value!.columns!)

  columnCreatePayload = {
    ...column!.value!,
    ...(column!.value.colOptions ?? {}),
    title: duplicateColumnTitle,
    column_name: duplicateColumnTitle.replace(/\s/g, '_'),
    id: undefined,
    colOptions: undefined,
    order: undefined,
    system: false,
  }

  try {
    const gridViewColumnList = (
      await $api.internal.getOperation(meta.value!.fk_workspace_id!, meta.value!.base_id!, {
        operation: 'viewColumnList',
        viewId: view.value?.id as string,
      })
    ).list

    const currentColumnIndex = gridViewColumnList.findIndex((f) => f.fk_column_id === column!.value.id)
    let newColumnOrder
    if (currentColumnIndex === gridViewColumnList.length - 1) {
      newColumnOrder = gridViewColumnList[currentColumnIndex].order! + 1
    } else {
      newColumnOrder = (gridViewColumnList[currentColumnIndex].order! + gridViewColumnList[currentColumnIndex + 1].order!) / 2
    }

    await $api.internal.postOperation(
      meta.value!.fk_workspace_id!,
      meta.value!.base_id!,
      {
        operation: 'columnAdd',
        tableId: meta!.value!.id!,
      },
      {
        ...columnCreatePayload,
        pv: false,
        view_id: view.value!.id as string,
        column_order: {
          order: newColumnOrder,
          view_id: view.value!.id as string,
        },
      } as ColumnReqType,
    )
    await getMeta(meta!.value!.base_id!, meta!.value!.id!, true)

    eventBus.emit(SmartsheetStoreEvents.FIELD_RELOAD)
    reloadDataHook?.trigger()

    // message.success(t('msg.success.columnDuplicated'))
  } catch (e) {
    message.error(await extractSdkResponseErrorMsg(e))
  }
  // closing dropdown
  isOpen.value = false
}

const openDuplicateDlg = async () => {
  if (!column?.value) return
  if (
    column.value.uidt &&
    [
      UITypes.Lookup,
      UITypes.Rollup,
      UITypes.CreatedTime,
      UITypes.LastModifiedTime,
      UITypes.CreatedBy,
      UITypes.LastModifiedBy,
    ].includes(column.value.uidt as UITypes)
  ) {
    duplicateVirtualColumn()
  } else {
    const gridViewColumnList = (
      await $api.internal.getOperation(meta.value!.fk_workspace_id!, meta.value!.base_id!, {
        operation: 'viewColumnList',
        viewId: view.value?.id as string,
      })
    ).list

    const currentColumnIndex = gridViewColumnList.findIndex((f) => f.fk_column_id === column!.value.id)
    let newColumnOrder
    if (currentColumnIndex === gridViewColumnList.length - 1) {
      newColumnOrder = gridViewColumnList[currentColumnIndex].order! + 1
    } else {
      newColumnOrder = (gridViewColumnList[currentColumnIndex].order! + gridViewColumnList[currentColumnIndex + 1].order!) / 2
    }

    selectedColumnExtra.value = {
      pv: false,
      view_id: view.value!.id as string,
      column_order: {
        order: newColumnOrder,
        view_id: view.value!.id as string,
      },
    }

    if (column.value.uidt === UITypes.Formula) {
      nextTick(() => {
        duplicateDialogRef?.value?.duplicate()
      })
    } else {
      isDuplicateDlgOpen.value = true
    }

    isOpen.value = false
  }
}

// hide the field in view
const hideField = async () => {
  if (isRequired.value) return
  isOpen.value = false
  emit('hideField')
}

const handleDelete = () => {
  // closing the dropdown
  // when modal opens
  isOpen.value = false
  showDeleteColumnModal.value = true
}

const isDeleteAllowed = computed(() => {
  return column?.value && !column.value.system
})
const isDuplicateAllowed = computed(() => {
  return column?.value && !column.value.system
})
</script>

<template>
  <AtDropdown
    v-if="!isLocked"
    v-model:visible="isOpen"
    :trigger="['click']"
    placement="bottomLeft"
    overlay-class-name="atm-dropdown-form-column-operations !border-1 rounded-lg !shadow-xl"
    @click.stop="isOpen = !isOpen"
  >
    <AtButton
      type="secondary"
      size="small"
      class="atm-form-add-field"
      data-testid="atm-form-add-field"
      @click.stop="showAddColumnDropdown = true"
    >
      <component :is="iconMap.threeDotVertical" class="flex-none w-4 h-4" />
    </AtButton>
    <template #overlay>
      <AtMenu class="atm-column-options" variant="small">
        <!-- Todo: Duplicate column with form column settings -->
        <!-- eslint-disable vue/no-constant-condition -->
        <AtMenuItem v-if="false" :disabled="!isDuplicateAllowed" @click="openDuplicateDlg">
          <div class="atm-column-duplicate atm-form-header-menu-item">
            <component :is="iconMap.duplicate" />
            <!-- Duplicate -->
            {{ t('general.duplicate') }}
          </div>
        </AtMenuItem>

        <AtMenuItem :disabled="isRequired" @click="hideField">
          <div class="atm-column-hide-or-show atm-form-header-menu-item">
            <component :is="iconMap.eyeSlash" class="!w-3.75 !h-3.75" />
            <!-- Hide Field -->
            {{ $t('general.hideField') }}
          </div>
        </AtMenuItem>

        <template v-if="!column?.pv">
          <AtDivider />

          <AtMenuItem :disabled="!isDeleteAllowed" danger @click="handleDelete">
            <div class="atm-column-delete atm-form-header-menu-item">
              <GeneralIcon icon="delete" />
              <!-- Delete -->
              {{ $t('general.delete') }}
            </div>
          </AtMenuItem>
        </template>
      </AtMenu>
    </template>
  </AtDropdown>
  <SmartsheetHeaderDeleteColumnModal
    v-model:visible="showDeleteColumnModal"
    class="atm-form-column-delete-dropdown"
    :on-delete-column="onDelete"
  />
  <DlgColumnDuplicate
    v-if="column"
    ref="duplicateDialogRef"
    v-model="isDuplicateDlgOpen"
    :column="column"
    :extra="selectedColumnExtra"
  />
</template>

<style scoped>
.atm-form-header-menu-item {
  @apply flex items-center gap-2;
}
</style>
