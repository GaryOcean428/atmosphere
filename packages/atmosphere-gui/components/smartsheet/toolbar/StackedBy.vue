<script setup lang="ts">
import type { KanbanType } from 'atmosphere-sdk'
import { UITypes } from 'atmosphere-sdk'
import type { SelectProps } from 'ant-design-vue'

provide(IsKanbanInj, ref(true))

const meta = inject(MetaInj, ref())

const activeView = inject(ActiveViewInj, ref())

const IsPublic = inject(IsPublicInj, ref(false))

const isLocked = inject(IsLockedInj, ref(false))

const isToolbarIconMode = inject(
  IsToolbarIconMode,
  computed(() => false),
)

const { fields, loadViewColumns, metaColumnById } = useViewColumnsOrThrow(activeView, meta)

const { kanbanMetaData, updateKanbanMeta, groupingField } = useKanbanViewStoreOrThrow()

const open = ref(false)

useMenuCloseOnEsc(open)

watch(
  () => activeView.value?.id,
  async (newVal, oldVal) => {
    if (newVal !== oldVal && meta.value) {
      await loadViewColumns()
    }
  },
  { immediate: true },
)

const updateGroupingField = async (v: string) => {
  await updateKanbanMeta({
    fk_grp_col_id: v,
  })
}

const groupingFieldColumnId = computed({
  get: () => kanbanMetaData.value.fk_grp_col_id,
  set: async (val) => {
    if (val) {
      await updateGroupingField(val)
    }
  },
})

const updateHideEmptyStack = async (v: boolean) => {
  const payload = {
    ...parseProp(kanbanMetaData.value?.meta),
    hide_empty_stack: v,
    ...(v ? { auto_collapse_empty_stack: false } : {}),
  }
  await updateKanbanMeta({
    meta: payload,
  })
  ;(activeView.value?.view as KanbanType).meta = payload
}

const updateAutoCollapseEmptyStack = async (v: boolean) => {
  const payload = {
    ...parseProp(kanbanMetaData.value?.meta),
    auto_collapse_empty_stack: v,
    ...(v ? { hide_empty_stack: false } : {}),
  }
  await updateKanbanMeta({
    meta: payload,
  })
  ;(activeView.value?.view as KanbanType).meta = payload
}

const isLoading = ref<'hideEmptyStack' | 'autoCollapseEmptyStack' | null>(null)

const readMetaFlag = (key: 'hide_empty_stack' | 'auto_collapse_empty_stack') => !!parseProp(kanbanMetaData.value?.meta)[key]

const hideEmptyStack = computed({
  get: () => readMetaFlag('hide_empty_stack'),
  set: async (val: boolean) => {
    isLoading.value = 'hideEmptyStack'

    await updateHideEmptyStack(val)

    isLoading.value = null
  },
})

const autoCollapseEmptyStack = computed({
  get: () => readMetaFlag('auto_collapse_empty_stack'),
  set: async (val: boolean) => {
    isLoading.value = 'autoCollapseEmptyStack'

    await updateAutoCollapseEmptyStack(val)

    isLoading.value = null
  },
})

const singleSelectFieldOptions = computed<SelectProps['options']>(() => {
  return fields.value
    ?.filter((el) => el.fk_column_id && metaColumnById.value[el.fk_column_id].uidt === UITypes.SingleSelect)
    .map((field) => {
      return {
        value: field.fk_column_id,
        label: field.title,
      }
    })
})

const handleChange = () => {
  open.value = false
}
</script>

<template>
  <AtDropdown
    v-if="!IsPublic"
    v-model:visible="open"
    :trigger="['click']"
    overlay-class-name="atm-dropdown-kanban-stacked-by-menu overflow-hidden"
  >
    <AtTooltip :disabled="!isToolbarIconMode" class="atm-kanban-btn">
      <template #title>
        {{ $t('activity.kanban.stackedBy') }}
      </template>

      <AtButton
        v-e="['c:kanban:change-grouping-field']"
        class="atm-kanban-stacked-by-menu-btn atm-toolbar-btn !border-0 !h-7 group"
        size="small"
        type="secondary"
        :show-as-disabled="isLocked"
      >
        <div class="flex items-center gap-2">
          <GeneralIcon icon="settings" class="h-4 w-4" />
          <div v-if="!isToolbarIconMode" class="flex items-center gap-0.5">
            <span class="text-capitalize !text-[13px] font-medium flex items-center gap-1">
              {{ $t('activity.kanban.stackedBy') }}
            </span>
            <div
              class="flex items-center rounded-md transition-colors duration-0.3s bg-atm-bg-gray-light px-1 min-h-5 max-w-[108px]"
              :class="{
                'group-hover:bg-atm-bg-gray-medium': !isLocked,
              }"
            >
              <span class="!text-[13px] font-medium truncate !leading-5">{{ groupingField }}</span>
            </div>
          </div>
        </div>
      </AtButton>
    </AtTooltip>

    <template #overlay>
      <div v-if="open" class="p-4 w-90 bg-atm-bg-default atm-table-toolbar-menu rounded-lg flex flex-col gap-5" @click.stop>
        <div class="flex flex-col gap-2">
          <div>
            {{ $t('general.groupingField') }}
          </div>
          <div class="atm-fields-list">
            <div class="grouping-field">
              <a-select
                v-model:value="groupingFieldColumnId"
                class="atm-select-shadow w-full atm-kanban-grouping-field-select !rounded-lg"
                dropdown-class-name="!rounded-lg"
                :placeholder="$t('placeholder.selectGroupField')"
                :disabled="isLocked"
                @change="handleChange"
                @click.stop
              >
                <template #suffixIcon><GeneralIcon icon="arrowDown" class="text-atm-content-gray-subtle" /></template>
                <a-select-option v-for="option of singleSelectFieldOptions" :key="option.value" :value="option.value">
                  <div class="w-full h-full flex gap-2 items-center justify-between" :title="option.label">
                    <div class="flex items-center gap-1 max-w-[calc(100%_-_20px)]">
                      <SmartsheetHeaderIcon
                        v-if="option.value && metaColumnById[option.value]"
                        :column="metaColumnById[option.value]"
                        class="!w-3.5 !h-3.5 opacity-80 !ml-0"
                        color="text-current"
                      />

                      <AtTooltip class="flex-1 max-w-[calc(100%_-_20px)] truncate" show-on-truncate-only>
                        <template #title>
                          {{ option.label }}
                        </template>
                        <template #default>{{ option.label }}</template>
                      </AtTooltip>
                    </div>
                    <GeneralIcon
                      v-if="groupingFieldColumnId === option.value"
                      id="atm-selected-item-icon"
                      icon="check"
                      class="flex-none text-primary w-4 h-4"
                    />
                  </div> </a-select-option
              ></a-select>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-1">
            <AtSwitch
              v-model:checked="hideEmptyStack"
              v-e="['c:kanban:toggle-hide-empty-stack', { enabled: hideEmptyStack }]"
              size="small"
              class="atm-switch atm-kanban-hide-empty-stack-toggle"
              :loading="isLoading === 'hideEmptyStack'"
              :disabled="isLocked"
            >
              <div class="text-sm text-atm-content-gray">
                {{ $t('general.hide') }}
                {{ $t('general.empty').toLowerCase() }}
                {{ $t('general.stack').toLowerCase() }}
              </div>
            </AtSwitch>
          </div>
          <div class="flex items-center gap-1">
            <AtSwitch
              v-model:checked="autoCollapseEmptyStack"
              v-e="['c:kanban:toggle-auto-collapse-empty-stack', { enabled: autoCollapseEmptyStack }]"
              size="small"
              class="atm-switch atm-kanban-auto-collapse-empty-stack-toggle"
              :loading="isLoading === 'autoCollapseEmptyStack'"
              :disabled="isLocked"
            >
              <div class="text-sm text-atm-content-gray">
                {{ $t('activity.kanban.autoCollapseEmptyStack') }}
              </div>
            </AtSwitch>
          </div>
        </div>
        <GeneralLockedViewFooter v-if="isLocked" class="-mb-4 -mx-4" @on-open="open = false" />
      </div>
    </template>
  </AtDropdown>
</template>
