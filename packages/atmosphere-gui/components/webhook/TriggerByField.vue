<script setup lang="ts">
import type { ColumnType } from 'atmosphere-sdk'

interface Props {
  columns: ColumnType[]
  triggerField?: boolean
  triggerFields?: string[]
}

const props = defineProps<Props>()

const emits = defineEmits(['update:triggerFields', 'update:triggerField'])

const columns = toRef(props, 'columns')

const triggerFields = useVModel(props, 'triggerFields', emits, { defaultValue: [] })
const triggerField = useVModel(props, 'triggerField', emits)

const isDropdownOpen = ref(false)

const computedTags = computed(() => {
  return triggerFields.value
    ?.map((colId) => {
      return columns.value.find((k) => k.id === colId)
    })
    .filter(Boolean)
})

const removeColumnId = (colId: string) => {
  triggerFields.value = triggerFields.value?.filter((k) => k !== colId)
}
</script>

<template>
  <div class="w-full flex items-center justify-between h-[28px]">
    <label class="cursor-pointer flex items-center" @click.prevent="triggerField = !triggerField">
      <AtSwitch :checked="triggerField" class="atm-check-box-trigger-field">
        <span class="!text-atm-content-gray-subtle font-semibold"> Trigger only when specific fields change </span>
      </AtSwitch>
    </label>
    <AtDropdown v-if="triggerField" v-model:visible="isDropdownOpen" overlay-class-name="!pt-0">
      <AtButton
        size="xs"
        type="secondary"
        :class="{
          '!shadow-selected !border-atm-border-brand': isDropdownOpen,
        }"
      >
        <div class="flex items-center justify-center gap-2">
          <GeneralIcon icon="plus" />
          {{ $t('activity.addFieldFromFormView') }}
        </div>
      </AtButton>
      <template #overlay>
        <AtList
          v-model:value="triggerFields"
          v-model:open="isDropdownOpen"
          class="atm-list-field"
          is-multi-select
          :close-on-select="false"
          :list="columns"
          variant="small"
          option-value-key="id"
          option-label-key="title"
        >
          <template #headerExtraRight>
            <AtBadge :border="false" color="brand" class="mr-2"> {{ triggerFields.length }} fields </AtBadge>
          </template>

          <template #listItem="{ option }">
            <div
              class="flex items-center w-full truncate gap-3 text-atm-content-gray-subtle hover:text-atm-content-gray-extreme transition-colors"
            >
              <SmartsheetHeaderIcon :column="option" />

              <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                <template #title>
                  {{ option?.title }}
                </template>
                <div class="flex-1 font-550 leading-5 text-small">
                  {{ option?.title }}
                </div>
              </AtTooltip>

              <AtCheckbox :checked="!!triggerFields.includes(option.id)" />
            </div>
          </template>
        </AtList>
      </template>
    </AtDropdown>
  </div>
  <div v-if="triggerField">
    <div v-if="triggerFields?.length" class="mt-2 gap-2 flex flex-wrap min-h-5.5">
      <div
        v-for="col of computedTags"
        :key="col.id"
        class="bg-atm-bg-gray-medium text-atm-content-gray-subtle2 px-1 py-0.5 rounded-md flex gap-1 items-center"
      >
        <SmartsheetHeaderIcon :column="col" />

        <div class="text-[13px] font-default leading-4.5">
          {{ col.title }}
        </div>

        <div class="w-0.25 h-4 bg-atm-border-gray-dark" />

        <GeneralIcon class="cursor-pointer opacity-70 hover:opacity-100" icon="close" @click="removeColumnId(col.id)" />
      </div>
    </div>
    <div v-else class="flex flex-row text-atm-content-gray-disabled mt-2">
      {{ $t('title.noFieldsSelected') }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.atm-list-field {
  :deep(.atm-list-item) {
    .ant-checkbox-checked .ant-checkbox-inner {
      background-color: var(--atm-brand-accent) !important;
      border-color: var(--atm-brand-accent) !important;
    }

    .ant-checkbox {
      @apply !mr-0;
    }

    .atm-icon {
      @apply mx-0;
    }
  }
}
.atm-dropdown {
  [prefixcls='ant-dropdown-menu'] {
    @apply !pt-1;
  }
}
</style>
