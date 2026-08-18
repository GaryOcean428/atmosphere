<script setup lang="ts">
interface FilterTab {
  key: string
  label: string
  count?: number
  tooltip?: string
}

interface Props {
  activeKey: string
  tabs: FilterTab[]
}

const props = defineProps<Props>()

const emits = defineEmits(['update:activeKey'])

const activeKey = useVModel(props, 'activeKey', emits)
</script>

<template>
  <AtTabs v-model:activeKey="activeKey" class="atm-filter-tabs">
    <a-tab-pane v-for="tab in tabs" :key="tab.key">
      <template #tab>
        <div class="flex items-center gap-1">
          {{ tab.label }}
          <span
            v-if="tab.count"
            class="atm-filter-tab-count"
            :class="activeKey === tab.key ? 'atm-filter-tab-count-active' : 'atm-filter-tab-count-inactive'"
          >
            {{ tab.count }}
          </span>
          <AtTooltip v-if="tab.tooltip" :title="tab.tooltip" placement="top" class="flex">
            <GeneralIcon icon="ncInfo" class="atm-filter-tab-info-icon !w-3.5 !h-3.5" />
          </AtTooltip>
        </div>
      </template>
    </a-tab-pane>
  </AtTabs>
</template>

<style lang="scss" scoped>
.atm-filter-tabs {
  :deep(.ant-tabs-nav) {
    @apply !px-2 !mb-0;
  }
}

.atm-filter-tab-count {
  @apply text-tiny min-w-4 h-5 px-1 rounded-md inline-flex items-center justify-center;
}

.atm-filter-tab-count-active {
  @apply bg-atm-bg-brand text-atm-content-brand;
}

.atm-filter-tab-count-inactive {
  @apply bg-atm-bg-gray-medium text-atm-content-gray-muted;
}

.atm-filter-tab-info-icon {
  color: var(--atm-content-gray-muted);
}
</style>
