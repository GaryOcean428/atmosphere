<template>
  <div class="flex flex-col">
    <AtPageHeader>
      <template #icon>
        <GeneralIcon icon="appStore" class="flex-none text-[20px] h-5 w-5" />
      </template>
      <template #title>
        <span data-rec="true">
          {{ $t('title.appStore') }}
        </span>
      </template>
    </AtPageHeader>
    <div class="atm-content-max-w p-6 h-[calc(100vh_-_100px)] flex flex-col gap-6 overflow-auto atm-scrollbar-thin">
      <div>
        <DashboardSettingsAppStore />
      </div>
    </div>
  </div>
</template>
