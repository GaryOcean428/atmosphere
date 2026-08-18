<script setup lang="ts">
import { type ColumnType, columnTypeName, isSupportedDisplayValueColumn, isSystemColumn } from 'atmosphere-sdk'

interface Props {
  value?: boolean
  useMetaFields?: boolean
}

const props = defineProps<Props>()

const { $api } = useNuxtApp()

const { getMeta } = useMetas()

const { eventBus } = useSmartsheetStoreOrThrow()

const { fields } = useViewColumnsOrThrow()

const { t } = useI18n()

const meta = inject(MetaInj, ref())

const value = useVModel(props, 'value')

// keep localstate for modal visibility
// if parent component unmouts changing value will not update
const localValue = ref(value.value)
const isVisible = computed({
  get: () => value.value,
  set: (v) => {
    value.value = v
    localValue.value = v
  },
})

const { useMetaFields } = toRefs(props)

const menuColumn = inject(ColumnInj)

const canvasColumn = inject(CanvasColumnInj, ref())

const column = computed(() => menuColumn?.value || canvasColumn?.value)

const selectedFieldId = ref()

const isLoading = ref(false)

const getFormatedColumn = (column: ColumnType) => ({
  title: column.title,
  id: column.id,
  ncItemDisabled: !isSupportedDisplayValueColumn(column) && !column.pv,
  ncItemTooltip:
    !isSupportedDisplayValueColumn(column) && columnTypeName(column) && !column.pv
      ? t('tooltip.fieldCannotBeUsedAsDisplayValueField', { field: columnTypeName(column) })
      : '',
  column,
})

const filteredColumns = computed(() => {
  const columns = meta.value?.columnsById ?? {}

  if (useMetaFields.value) {
    return (meta.value?.columns ?? [])
      .filter((c) => c?.id && !isSystemColumn(c))
      .map((column) => {
        return getFormatedColumn(column)
      })
  }

  return (fields.value ?? [])
    .filter((f) => columns[f?.fk_column_id] && !isSystemColumn(columns[f.fk_column_id]))
    .map((f) => {
      return getFormatedColumn(columns[f.fk_column_id] as ColumnType)
    })
})

const changeDisplayField = async () => {
  if (!selectedFieldId.value) return
  isLoading.value = true

  try {
    await $api.internal.postOperation(
      meta!.value!.fk_workspace_id!,
      meta!.value!.base_id!,
      {
        operation: 'columnSetAsPrimary',
        columnId: selectedFieldId.value,
      },
      {},
    )

    await getMeta(meta?.value?.base_id as string, meta?.value?.id as string, true)

    eventBus.emit(SmartsheetStoreEvents.FIELD_RELOAD)
    value.value = false
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  selectedFieldId.value = useMetaFields.value
    ? meta.value?.columns?.find((c) => c.id === column.value.id)?.id
    : fields.value?.find((f) => f.fk_column_id === column.value.id)?.fk_column_id
})
</script>

<template>
  <AtModal v-model:visible="isVisible" size="small">
    <div class="flex flex-col gap-3">
      <div>
        <h1 class="text-base text-atm-content-gray font-semibold">{{ $t('labels.searchDisplayValue') }}</h1>
        <div class="text-atm-content-gray-subtle2 flex items-center gap-1">
          {{ $t('labels.selectYourNewTitleFor') }}

          <span class="bg-atm-bg-gray-light inline-flex items-center gap-1 px-1 rounded-md">
            <component :is="iconMap.table" />
            {{ meta?.title ?? meta?.table_name }}
          </span>
        </div>
      </div>

      <div class="border-1 rounded-lg border-atm-border-gray-medium">
        <AtList
          v-model:value="selectedFieldId"
          v-model:open="value"
          :list="filteredColumns"
          option-label-key="title"
          option-value-key="id"
          :close-on-select="false"
          class="!w-auto"
          show-search-always
          container-class-name="!max-h-[200px]"
        >
          <template #listItemExtraLeft="{ option }">
            <SmartsheetHeaderIcon :column="option.column" class="!mx-0 opacity-70" />
          </template>
        </AtList>
      </div>

      <div class="flex w-full gap-2 justify-end">
        <AtButton type="secondary" size="small" @click="value = false">
          {{ $t('general.cancel') }}
        </AtButton>

        <AtButton
          :disabled="!selectedFieldId || selectedFieldId === column.id"
          :loading="isLoading"
          size="small"
          @click="changeDisplayField"
        >
          {{ $t('labels.changeDisplayValueField') }}
        </AtButton>
      </div>
    </div>
  </AtModal>
</template>

<style scoped lang="scss">
.ant-input::placeholder {
  @apply text-atm-content-gray-muted;
}

.ant-input:placeholder-shown {
  @apply text-atm-content-gray-muted !text-md;
}

.ant-input-affix-wrapper {
  @apply px-4 rounded-lg py-2 w-84 border-1 focus:border-atm-border-brand border-atm-border-gray-medium !ring-0;
}
</style>
