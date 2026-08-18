<script setup lang="ts">
defineProps<{
  isInToolbar?: boolean
}>()
</script>

<template>
  <AtDropdown :trigger="['click']" overlay-class-name="atm-dropdown-actions-menu">
    <AtButton
      v-e="['c:actions']"
      class="atm-download-actions-menu-btn atm-toolbar-btn"
      :class="{
        '!border-0 !h-7': isInToolbar,
      }"
      :size="isInToolbar ? 'small' : 'xs'"
      type="secondary"
    >
      <div class="flex gap-2 items-center text-atm-content-gray-subtle">
        <component :is="iconMap.download" class="h-4 w-4" />
        <span class="text-capitalize !text-[13px] font-medium xs:hidden">{{ $t('general.download') }}</span>
      </div>
    </AtButton>

    <template #overlay>
      <AtMenu variant="small" class="ml-6 !text-sm !rounded-lg overflow-hidden">
        <LazySmartsheetToolbarExportSubActions />
      </AtMenu>
    </template>
  </AtDropdown>
</template>
