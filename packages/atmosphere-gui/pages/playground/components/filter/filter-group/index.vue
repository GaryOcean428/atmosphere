<script lang="ts" setup>
import { mockSetupInit } from '../../../-helper/mock-setup'
import MockInjection from '../../MockInjection.vue'
const { metas } = useMetas()

const rootMeta = ref({})
const columns = computedAsync(async () => {
  if (!metas.value || Object.keys(metas.value).length === 0) return []
  return await composeColumnsForFilter({
    rootMeta: rootMeta.value,
    getMeta: async (id) => metas.value[`${rootMeta.value?.base_id}:${id}`],
  })
}, [])
const filterMap = ref({})
const filters = ref([])
const options1 = ref({
  index: 0,
  nestedLevel: 0,
  disabled: false,
  isLockedView: false,
  isFullWidth: false,
  isLogicalOpChangeAllowed: false,
  showNullAndEmptyInFilter: false,
  dbClientType: ClientType.PG,
  actionBtnType: 'text',
  webHook: false,
  link: false,
  isForm: false,
  isPublic: false,
  filterPerViewLimit: 50,
  filtersCount: 0,
  queryFilter: false,
  disableAddNewFilter: false,
  handler: {
    addFilter: async (event: FilterGroupChangeEvent) => {
      const newFilter = {
        tmp_id: Math.random().toString(36).substring(2, 15),
        fk_column_id: columns.value[1].id,
        comparison_op: 'eq',
        is_group: false,
        logical_op: 'and',
        fk_parent_id: event.fk_parent_id,
        tmp_fk_parent_id: event.tmp_fk_parent_id,
        parent: filterMap.value[event.tmp_fk_parent_id],
      }
      filterMap.value[newFilter.tmp_id] = newFilter
      if (event.tmp_fk_parent_id) {
        filterMap.value[event.tmp_fk_parent_id].children.push(newFilter)
      } else {
        filters.value.push(newFilter)
      }
    },
    addFilterGroup: async (event: FilterGroupChangeEvent) => {
      const newFilter = {
        tmp_id: Math.random().toString(36).substring(2, 15),
        is_group: true,
        logical_op: 'and',
        children: [],
        fk_parent_id: event.fk_parent_id,
        tmp_fk_parent_id: event.tmp_fk_parent_id,
        parent: filterMap.value[event.tmp_fk_parent_id],
      }
      filterMap.value[newFilter.tmp_id] = newFilter
      if (event.tmp_fk_parent_id) {
        filterMap.value[event.tmp_fk_parent_id].children.push(newFilter)
      } else {
        filters.value.push(newFilter)
      }
    },
    deleteFilter: async (event: FilterGroupChangeEvent) => {
      if (event.filter.parent) {
        event.filter.parent.children = event.filter.parent.children?.filter((child) => child.tmp_id !== event.filter?.tmp_id)
      } else if (!event.filter?.tmp_fk_parent_id) {
        filters.value = filters.value.filter((filter) => filter.tmp_id !== event.filter.tmp_id)
      }
    },
    rowChange: async (event: FilterRowChangeEvent) => {
      event.filter[event.type] = event.value
      const evalColumn = columns.value.find((k) => k.id === event.filter.fk_column_id)
      if (evalColumn && event.type === 'fk_column_id') {
        adjustFilterWhenColumnChange({
          column: evalColumn,
          filter: event.filter,
          showNullAndEmptyInFilter: options1.showNullAndEmptyInFilter,
        })
      }
    },
  },
})
const lastChangeEvent1 = ref({})
const lastRowChangeEvent1 = ref({})

const onChange = (event) => {
  lastChangeEvent1.value = event
}
const onRowChange = (event) => {
  lastRowChangeEvent1.value = event
}
onMounted(async () => {
  const setup = await mockSetupInit()
  rootMeta.value = setup.meta
})
</script>

<template>
  <MockInjection>
    <div class="bg-atm-bg-gray-light pb-8 overflow-y-auto">
      <a-card>
        <h4>Simple</h4>

        <div class="flex gap-4">
          <div class="flex flex-col gap-2">
            <div><AtSwitch v-model:checked="options1.disabled">disabled</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.isLogicalOpChangeAllowed">isLogicalOpChangeAllowed</AtSwitch><br /></div>
            <div><AtSwitch v-model:checked="options1.isLockedView">isLockedView</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.showNullAndEmptyInFilter">showNullAndEmptyInFilter</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.isFullWidth">isFullWidth</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.webHook">webHook</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.link">link</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.isForm">isForm</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.isPublic">isPublic</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.queryFilter">queryFilter</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.disableAddNewFilter">disableAddNewFilter</AtSwitch></div>
          </div>
          <div class="flex-col gap-2">
            <div class="flex-col space-y-2">
              <div>dbClientType: <AtSelect v-model:value="options1.dbClientType"></AtSelect></div>
              <div>
                actionBtnType:
                <AtSelect v-model:value="options1.actionBtnType">
                  <a-select-option value="text"> Text </a-select-option>
                  <a-select-option value="secondary"> Secondary </a-select-option>
                </AtSelect>
              </div>

              <div>
                Index: <input v-model="options1.index" type="number" class="text-xs p-1 border-atm-border-gray-medium" /><br />
              </div>
              <div>
                NestedLevel:
                <input v-model="options1.nestedLevel" type="number" class="text-xs p-1 border-atm-border-gray-medium" /><br />
              </div>
              <div>
                filterPerViewLimit:
                <input
                  v-model="options1.filterPerViewLimit"
                  type="number"
                  class="text-xs p-1 border-atm-border-gray-medium"
                /><br />
              </div>
              <div>
                filtersCount:
                <input v-model="options1.filtersCount" type="number" class="text-xs p-1 border-atm-border-gray-medium" /><br />
              </div>
            </div>
          </div>
          <div class="flex-col flex-grow space-y-2">
            Last event:
            <div class="min-w-[300px] max-h-[200px] overflow-wrap bg-atm-bg-gray-dark overflow-y-scroll">
              <pre>{{ JSON.stringify(lastRowChangeEvent1, null, 2) }}</pre>
            </div>
            <div class="min-w-[300px] max-h-[200px] overflow-wrap bg-atm-bg-gray-dark overflow-y-scroll">
              <pre>{{ JSON.stringify(lastChangeEvent1, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </a-card>
      <div class="p-4">
        <SmartsheetToolbarFilterGroup
          v-model="filters"
          :index="options1.index"
          :nested-level="options1.nestedLevel"
          :columns="columns"
          :disabled="options1.disabled"
          :is-locked-view="options1.isLockedView"
          :is-logical-op-change-allowed="options1.isLogicalOpChangeAllowed"
          :is-full-width="options1.isFullWidth"
          :action-btn-type="options1.actionBtnType"
          :web-hook="options1.webHook"
          :link="options1.link"
          :is-form="options1.isForm"
          :is-public="options1.isPublic"
          :filter-per-view-limit="options1.filterPerViewLimit"
          :disable-add-new-filter="options1.disableAddNewFilter"
          :filters-count="options1.filtersCount"
          :query-filter="options1.queryFilter"
          @change="onChange"
          @row-change="onRowChange"
        />
      </div>
      <a-card>
        <h4>With handler</h4>
      </a-card>
      <div class="p-4">
        <SmartsheetToolbarFilterGroup
          v-model="filters"
          :index="options1.index"
          :nested-level="options1.nestedLevel"
          :columns="columns"
          :disabled="options1.disabled"
          :is-locked-view="options1.isLockedView"
          :is-logical-op-change-allowed="options1.isLogicalOpChangeAllowed"
          :is-full-width="options1.isFullWidth"
          :action-btn-type="options1.actionBtnType"
          :web-hook="options1.webHook"
          :link="options1.link"
          :is-form="options1.isForm"
          :is-public="options1.isPublic"
          :filter-per-view-limit="options1.filterPerViewLimit"
          :disable-add-new-filter="options1.disableAddNewFilter"
          :filters-count="options1.filtersCount"
          :query-filter="options1.queryFilter"
          :handler="options1.handler"
          @change="onChange"
          @row-change="onRowChange"
        />
      </div>
      <a-card>
        <h4>Custom toolbar (root only)</h4>
      </a-card>
      <div class="p-4">
        <SmartsheetToolbarFilterGroup
          v-model="filters"
          :index="options1.index"
          :nested-level="options1.nestedLevel"
          :columns="columns"
          :disabled="options1.disabled"
          :is-locked-view="options1.isLockedView"
          :is-logical-op-change-allowed="options1.isLogicalOpChangeAllowed"
          :is-full-width="options1.isFullWidth"
          :action-btn-type="options1.actionBtnType"
          :web-hook="options1.webHook"
          :link="options1.link"
          :is-form="options1.isForm"
          :is-public="options1.isPublic"
          :filter-per-view-limit="options1.filterPerViewLimit"
          :disable-add-new-filter="options1.disableAddNewFilter"
          :filters-count="options1.filtersCount"
          :query-filter="options1.queryFilter"
          @change="onChange"
          @row-change="onRowChange"
        >
          <template #root-header>
            <div>Hello</div>
          </template>
        </SmartsheetToolbarFilterGroup>
      </div>
    </div>
  </MockInjection>
</template>
