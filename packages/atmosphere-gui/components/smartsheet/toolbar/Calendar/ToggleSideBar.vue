<script setup lang="ts">
const { showSideMenu } = useCalendarViewStoreOrThrow()

const { $e } = useNuxtApp()

const toggleSideMenu = () => {
  $e('c:calendar:toggle-sidebar', showSideMenu.value)
  showSideMenu.value = !showSideMenu.value
}
</script>

<template>
  <AtTooltip hide-on-click disable-in-mobile placement="left">
    <template #title> {{ $t('activity.toggleSidebar') }}</template>
    <AtButton :shadow="false" data-testid="atm-calendar-side-bar-btn" size="xs" type="text" class="!px-1" @click="toggleSideMenu">
      <GeneralIcon icon="sidebar" class="h-4 w-4 text-atm-content-subtle2 transition-all" />
    </AtButton>
  </AtTooltip>
</template>
