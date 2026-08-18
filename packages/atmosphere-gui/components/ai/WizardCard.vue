<script lang="ts" setup>
interface Props {
  activeTab: string
  tabs: {
    title: string
    key: string
    hidden?: boolean
  }[]
  as?: 'default' | 'tabs'
  contentClassName?: string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'default',
  contentClassName: '',
})

const emits = defineEmits(['update:activeTab', 'navigateToIntegrations'])

const activeTab = useVModel(props, 'activeTab', emits)

const { tabs, as, contentClassName } = toRefs(props)

const { aiIntegrationAvailable, aiLoading } = useAtmosphereAi()

const handleChangeTab = (tab: string) => {
  if (aiLoading.value) return
  activeTab.value = tab
}
</script>

<template>
  <div class="atm-ai-wizard-card">
    <div class="atm-ai-wizard-card-tab-header">
      <div class="flex atm-ai-wizard-card-tab-wrapper">
        <template v-for="tab of tabs" :key="tab.key">
          <div
            v-if="!tab.hidden"
            class="atm-ai-wizard-card-tab"
            :class="{
              'active-tab': activeTab === tab.key,
              '!cursor-wait': aiLoading,
            }"
            @click="handleChangeTab(tab.key)"
          >
            {{ tab.title }}
          </div>
        </template>
      </div>
      <div class="atm-ai-wizard-card-tab-extra-right">
        <slot name="tabExtraRight"></slot>
      </div>
    </div>
    <div class="atm-ai-wizard-card-tab-content" :class="contentClassName">
      <div v-if="as === 'default' && !aiIntegrationAvailable" class="py-2.5 pl-3 pr-2 flex items-center gap-3">
        <GeneralIcon icon="alertTriangleSolid" class="!text-atm-content-orange-medium w-4 h-4" />
        <div class="text-sm text-atm-content-gray-subtle flex-1">{{ $t('title.noAiIntegrationAvailable') }}</div>

        <AtButton size="small" type="text" class="!text-atm-content-brand" @click.stop="emits('navigateToIntegrations')">
          {{ $t('labels.createAiIntegration') }}
        </AtButton>
      </div>
      <slot v-else name="tabContent"> </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-ai-wizard-card {
  @apply border-1 border-atm-border-purple-medium rounded-lg overflow-y-auto atm-scrollbar-thin transition-colors relative;

  .atm-ai-wizard-card-tab-header {
    @apply bg-atm-bg-purple-light flex justify-between h-10 -mt-[1px] -ml-[1px] border-b-1 border-atm-border-purple-medium sticky -top-[1px] z-1;

    .atm-ai-wizard-card-tab {
      @apply relative px-4 py-2 text-sm cursor-pointer rounded-t-lg border-t-1 border-x-1;

      &.active-tab {
        @apply text-atm-content-purple-dark dark:text-atm-content-purple-medium bg-atm-bg-default border-atm-border-purple-medium font-semibold;

        &::after {
          @apply absolute content-[''] -bottom-[1px] left-0 right-0 border-b-1 border-atm-bg-default;
        }
      }
      &:not(.active-tab) {
        @apply text-atm-content-purple-medium border-transparent font-weight-500;
      }
    }

    .atm-ai-wizard-card-tab-extra-right {
      @apply flex items-center gap-2 pr-2 text-atm-content-purple-dark;
    }
  }

  .atm-ai-wizard-card-tab-content {
    @apply bg-atm-bg-default;
  }
}
</style>
