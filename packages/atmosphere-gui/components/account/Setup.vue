<script setup lang="ts">
const { t } = useI18n()

const { loadSetupApps, emailConfigured, storageConfigured, listModalDlg } = useAccountSetupStoreOrThrow()

const isAdminPanel = inject(IsAdminPanelInj, ref(false))

const openedCategory = ref<string | null>(null)

const navigateToSetup = (category: 'email' | 'storage', app?: string) => {
  if (isAdminPanel.value) {
    const query: Record<string, string> = { tab: `setup-${category}` }
    if (app) query.app = app
    navigateTo({ path: '/admin', query })
  } else {
    navigateTo(`/account/setup/${category}${app ? `/${app}` : ''}`)
  }
}

const configs = computed(() => [
  {
    title: t('labels.configLabel', { label: t('labels.email') }),
    key: 'email',
    description:
      'Configure your preferred email service to manage how your application sends alerts, notifications and other essential emails.',
    docsLink: 'https://atmosphere.dev/docs/product-docs/account-settings/oss-specific-details#configure-email',
    buttonClick: () => {
      navigateToSetup('email', emailConfigured.value?.title)
    },
    itemClick: () => {
      navigateToSetup('email')
    },
    configured: emailConfigured.value,
  },
  {
    title: t('labels.configLabel', { label: t('labels.storage') }),
    key: 'storage',
    description: "Set up and manage your preferred storage solution for securely handling and storing your application's data.",
    docsLink: 'https://atmosphere.dev/docs/product-docs/account-settings/oss-specific-details#configure-storage',
    buttonClick: () => {
      navigateToSetup('storage', storageConfigured.value?.title)
    },
    itemClick: () => {
      navigateToSetup('storage')
    },
    configured: storageConfigured.value,
  },
])

onMounted(async () => {
  await loadSetupApps()
})
</script>

<template>
  <div class="flex flex-col" data-test-id="atm-setup-main">
    <AtPageHeader>
      <template #icon>
        <div class="flex justify-center items-center h-5 w-5">
          <GeneralIcon icon="ncSliders" class="flex-none text-[20px]" />
        </div>
      </template>
      <template #title>
        <span data-rec="true">
          {{ $t('labels.setup') }}
        </span>
      </template>
    </AtPageHeader>

    <div
      class="atm-content-max-w flex-1 max-h-[calc(100vh_-_100px)] overflow-y-auto atm-scrollbar-thin flex flex-col items-center gap-6 p-6"
    >
      <div class="flex flex-col gap-6 w-150">
        <div
          v-for="config of configs"
          :key="config.key"
          class="flex flex-col border-1 rounded-2xl border-atm-border-gray-medium p-6 gap-2 hover:(shadow bg-gray-10 dark:bg-atm-bg-gray-extralight)"
          :class="{
            'cursor-pointer': config.itemClick,
          }"
          :data-testid="`atm-setup-${config.key}`"
          @click="config.itemClick"
        >
          <div class="flex gap-3 items-center" data-rec="true">
            <AtTooltip v-if="!config.configured || config.isPending">
              <template #title>
                <span>
                  {{ $t('activity.pending') }}
                </span>
              </template>
              <GeneralIcon icon="ncAlertCircle" class="text-atm-content-orange-medium -mt-1 w-6 h-6 atm-pending" />
            </AtTooltip>
            <GeneralIcon v-else icon="circleCheckSolid" class="text-success w-6 h-6 atm-configured" />

            <span class="font-bold text-base"> {{ config.title }}</span>
          </div>
          <div class="text-atm-content-gray-subtle2 text-sm">{{ config.description }}</div>

          <div class="flex justify-between mt-4">
            <AtButton
              size="small"
              type="text"
              :href="config.docsLink"
              target="_blank"
              class="!flex items-center !no-underline"
              rel="noopener noreferer"
              @click.stop
            >
              <div class="flex gap-2 items-center">
                {{ $t('activity.goToDocs') }}
                <GeneralIcon icon="ncExternalLink" />
              </div>
            </AtButton>
            <AtButton v-if="config.configured" size="small" type="text" @click.stop="config.buttonClick">
              <div class="flex gap-2 items-center">
                <GeneralIcon icon="ncEdit3" />
                {{ $t('general.edit') }}
              </div>
            </AtButton>
            <AtButton v-else size="small" @click.stop="config.buttonClick">{{ $t('general.configure') }}</AtButton>
          </div>
        </div>
      </div>
    </div>

    <LazyAccountSetupListModal v-if="openedCategory" v-model="listModalDlg" :category="openedCategory" />
  </div>
</template>
