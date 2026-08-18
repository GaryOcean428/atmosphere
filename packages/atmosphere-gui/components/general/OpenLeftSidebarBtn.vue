<script lang="ts" setup>
const { isLeftSidebarOpen } = storeToRefs(useSidebarStore())

const { isMobileMode } = useGlobal()

const onClick = () => {
  if (isLeftSidebarOpen.value) return

  isLeftSidebarOpen.value = !isLeftSidebarOpen.value
}
</script>

<template>
  <div v-if="isMobileMode || !isLeftSidebarOpen" v-e="['c:leftSidebar:hideToggle']">
    <AtTooltip
      placement="topLeft"
      hide-on-click
      class="transition-all duration-150"
      :class="{
        'opacity-0 w-0 pointer-events-none': !isMobileMode && isLeftSidebarOpen,
        'opacity-100 max-w-10': isMobileMode || !isLeftSidebarOpen,
      }"
      :disabled="!!isMobileMode"
    >
      <template #title>
        {{ isLeftSidebarOpen ? `${$t('title.hideSidebar')}` : `${$t('title.showSidebar')}` }}
      </template>
      <AtButton
        :type="isMobileMode ? 'secondary' : 'text'"
        :size="isMobileMode ? 'medium' : 'small'"
        class="atm-sidebar-left-toggle-icon !text-atm-content-gray-subtle2 !hover:text-atm-content-gray w-8"
        @click="onClick"
      >
        <div class="flex items-center text-inherit">
          <GeneralIcon v-if="isMobileMode" icon="menu" class="text-lg -mt-0.25" />
          <GeneralIcon
            v-else
            icon="doubleRightArrow"
            class="duration-150 transition-all !text-lg -mt-0.25 !text-atm-content-gray-subtle2 bg-opacity-50 rtl:transform rtl:rotate-180"
          />
        </div>
      </AtButton>
    </AtTooltip>
  </div>
</template>
