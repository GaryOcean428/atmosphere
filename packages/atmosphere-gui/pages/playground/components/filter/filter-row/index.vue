<script lang="ts" setup>
import { ClientType } from 'atmosphere-sdk'
import { defaultColumns } from '../../../-helper/columns'
const columns = defaultColumns

const filter1 = ref({
  fk_column_id: columns[0]!.id,
  comparison_op: 'eq',
  comparison_sub_op: null,
  logical_op: 'and',
})
const column1Id = ref(columns[0]!.id)
const column1 = computed(() => {
  return columns.find((col) => col.id === column1Id.value)
})

const lastChangeEvent1 = ref({})
const options1 = ref({
  disabled: false,
  webHook: false,
  link: false,
  index: 0,
  isLockedView: false,
  isLogicalOpChangeAllowed: false,
  showNullAndEmptyInFilter: false,
  dbClientType: ClientType.PG,
})
const deleted1Times = ref(0)
const deleted1LastEvent = ref({})

const onFilter1Change = (event) => {
  lastChangeEvent1.value = event
  if (event.type === 'fk_column_id') {
    column1Id.value = event.value
  }
}
const onFilter1Delete = (event) => {
  deleted1LastEvent.value = event
  deleted1Times.value++
}
const isFieldInaccessible1 = ref(true)
</script>

<template>
  <div class="bg-atm-bg-gray-light overflow-y-scroll">
    <a-card>
      <div class="flex flex-col gap-2">
        <h4>Simple</h4>

        <div class="flex">
          <span>Filter:</span>

          <div class="w-[300px] max-h-[100px] overflow-wrap bg-atm-bg-gray-dark overflow-y-scroll">
            {{ filter1 }}
          </div>

          <span>Last change event:</span>
          <div class="w-[300px] max-h-[100px] overflow-wrap bg-atm-bg-gray-dark overflow-y-scroll">
            {{ lastChangeEvent1 }}
          </div>
        </div>
        <div class="flex">
          <span>Delete: {{ deleted1Times }}</span>

          <div class="w-[300px] max-h-[100px] overflow-wrap bg-atm-bg-gray-dark overflow-y-scroll">
            {{ deleted1LastEvent }}
          </div>
        </div>
        <div class="flex gap-2">
          <div class="flex flex-col gap-2">
            <div><AtSwitch v-model:checked="options1.disabled">disabled</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.webHook">webHook</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.link">link</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.isLogicalOpChangeAllowed">isLogicalOpChangeAllowed</AtSwitch><br /></div>
            <div><AtSwitch v-model:checked="options1.isLockedView">isLockedView</AtSwitch></div>
            <div><AtSwitch v-model:checked="options1.showNullAndEmptyInFilter">showNullAndEmptyInFilter</AtSwitch></div>
            <div>
              dbClientType:
              <AtSelect v-model:value="options1.dbClientType">
                <a-select-option :value="ClientType.PG"> PG </a-select-option>
                <a-select-option :value="ClientType.SQLITE"> sqlite </a-select-option>
                <a-select-option :value="ClientType.MYSQL"> mysql </a-select-option>
              </AtSelect>
            </div>
            <div>
              Index: <input v-model="options1.index" type="number" class="text-xs p-1 border-atm-border-gray-medium" /><br />
            </div>
          </div>
          <div class="flex">
            <AtSelect v-model:value="column1Id" @change="filter1.fk_column_id = column1Id">
              <a-select-option v-for="col of columns" :key="col.id" :value="col.id">
                {{ col.id }} - {{ col.uidt }}
              </a-select-option>
            </AtSelect>
            <div class="w-[300px] overflow-wrap">
              {{ column1 }}
            </div>
          </div>
        </div>
      </div>
    </a-card>
    <div class="p-4">
      <SmartsheetToolbarFilterRow
        :model-value="filter1"
        :index="options1.index"
        :columns="columns"
        :show-null-and-empty-in-filter="options1.showNullAndEmptyInFilter"
        :disabled="options1.disabled"
        :is-logical-op-change-allowed="options1.isLogicalOpChangeAllowed"
        :is-locked-view="options1.isLockedView"
        :db-client-type="options1.dbClientType"
        :web-hook="options1.webHook"
        :link="options1.link"
        @change="onFilter1Change($event)"
        @delete="onFilter1Delete($event)"
      />
    </div>
    <a-card>
      <div class="flex flex-col gap-2">
        <h4>Custom props</h4>
      </div>
    </a-card>
    <div class="p-4">
      <SmartsheetToolbarFilterRow
        :model-value="filter1"
        :index="options1.index"
        :columns="columns"
        :show-null-and-empty-in-filter="options1.showNullAndEmptyInFilter"
        :disabled="options1.disabled"
        :is-logical-op-change-allowed="options1.isLogicalOpChangeAllowed"
        :is-locked-view="options1.isLockedView"
        :db-client-type="options1.dbClientType"
        :container-props="{ class: ['!bg-red-500'] }"
        :logical-ops-props="{ class: ['bg-yellow-500'] }"
        :column-select-props="{ class: ['bg-blue-500'] }"
        :comparison-ops-props="{ class: ['bg-green-500'] }"
        :comparison-sub-ops-props="{ class: ['bg-gray-500'] }"
        :input-value-props="{ class: ['bg-cyan-500'] }"
        :delete-button-props="{ class: ['bg-magenta-500'] }"
        @change="onFilter1Change($event)"
        @delete="onFilter1Delete($event)"
      />
    </div>

    <a-card>
      <div class="flex flex-col gap-2">
        <h4>fieldInaccessibleError slot</h4>

        <div class="flex gap-2">
          <div class="flex flex-col gap-2">
            <div><AtSwitch v-model:checked="isFieldInaccessible1">isFieldInaccessible1</AtSwitch></div>
          </div>
        </div>
      </div>
    </a-card>
    <div class="p-4">
      <SmartsheetToolbarFilterRow
        :model-value="filter1"
        :index="options1.index"
        :columns="columns"
        :show-null-and-empty-in-filter="options1.showNullAndEmptyInFilter"
        :comparison-sub-ops="[]"
        :disabled="options1.disabled"
        :is-logical-op-change-allowed="options1.isLogicalOpChangeAllowed"
        :is-locked-view="options1.isLockedView"
        :db-client-type="options1.dbClientType"
        @change="onFilter1Change($event)"
        @delete="onFilter1Delete($event)"
      >
        <template v-if="isFieldInaccessible1" #fieldInaccessibleError>
          <AtTooltip class="flex-1 flex items-center gap-2 px-2 !text-atm-content-red-medium cursor-pointer" :disabled="false">
            <template #title> Field inaccessible error message</template>
            <GeneralIcon icon="alertTriangle" class="flex-none" />
            {{ $t('title.fieldInaccessible') }}
          </AtTooltip>
        </template>
      </SmartsheetToolbarFilterRow>
    </div>

    <div class="min-h-[64px] h-[64px] block"></div>
  </div>
</template>
