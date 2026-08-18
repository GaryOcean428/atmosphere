<script setup lang="ts">
const props = defineProps<{
  category: string
}>()

const { categorizeApps, resetPlugin: _resetPlugin, showPluginUninstallModal, activePlugin } = useAccountSetupStoreOrThrow()

const isAdminPanel = inject(IsAdminPanelInj, ref(false))

const apps = computed(() => categorizeApps.value?.[props.category?.toLowerCase()] || [])
const configuredApp = computed(() => apps.value.find((app: any) => app.active))

const showResetActiveAppMsg = ref(false)
const switchingTo = ref(null)

const showResetPluginModal = async (app: any, resetActiveAppMsg = false) => {
  showResetActiveAppMsg.value = resetActiveAppMsg
  showPluginUninstallModal.value = true
  activePlugin.value = app
}

const navigateToApp = (app: any) => {
  if (isAdminPanel.value) {
    navigateTo({ path: '/admin', query: { tab: `setup-${props.category.toLowerCase()}`, app: app.title } })
  } else {
    navigateTo(`/account/setup/${props.category}/${app.title}`)
  }
}

const selectApp = (app: any) => {
  const activeApp = app !== configuredApp.value && configuredApp.value
  if (activeApp) {
    switchingTo.value = app
    return showResetPluginModal(activeApp, true)
  }

  navigateToApp(app)
}

const resetPlugin = async () => {
  await _resetPlugin(activePlugin.value)
  if (showResetActiveAppMsg.value) {
    await selectApp(switchingTo.value)
    switchingTo.value = null
    showResetActiveAppMsg.value = false
  }
}

const closeResetModal = () => {
  activePlugin.value = null
  switchingTo.value = null
  showResetActiveAppMsg.value = false
  showPluginUninstallModal.value = false
}
</script>

<template>
  <div class="flex flex-col" data-testid="atm-setup-list">
    <AtPageHeader>
      <template #title>
        <span data-rec="true">
          {{ category }}
        </span>
      </template>
    </AtPageHeader>
    <div class="h-[calc(100%_-_58px)] flex">
      <div class="w-full">
        <div class="w-950px px-4 mt-3 mx-auto text-lg font-weight-bold">{{ category }} Services</div>
        <div class="container">
          <div
            v-for="app in apps"
            :key="app.title"
            class="item group"
            :data-testid="`atm-setup-list-item-${app.title}`"
            @click="selectApp(app)"
          >
            <AccountSetupAppIcon :app="app" class="icon" />
            <span class="title">{{ app.title }}</span>
            <div class="flex-grow" />

            <GeneralIcon
              v-if="app.active"
              icon="delete"
              class="text-error min-w-6 h-6 !hidden !group-hover:!inline cursor-pointer"
            />
            <GeneralIcon v-if="app === configuredApp" icon="circleCheckSolid" class="text-success min-w-5 h-5 atm-configured" />

            <AtDropdown :trigger="['click']" overlay-class-name="!rounded-md" @click.stop>
              <GeneralIcon
                v-if="app.active"
                icon="threeDotVertical"
                class="min-w-5 h-5 text-atm-content-gray-muted hover:text-current atm-setup-plugin-menu"
              />

              <template #overlay>
                <AtMenu class="min-w-20" variant="small">
                  <AtMenuItem data-testid="atm-config-reset" @click.stop="showResetPluginModal(app)">
                    <span> {{ $t('general.reset') }} </span>
                  </AtMenuItem>
                </AtMenu>
              </template>
            </AtDropdown>
          </div>
        </div>
      </div>
    </div>

    <a-modal
      v-model:visible="showPluginUninstallModal"
      :closable="false"
      width="448px"
      centered
      :footer="null"
      wrap-class-name="atm-modal-plugin-reset-conform"
    >
      <div class="flex flex-col h-full">
        <div v-if="showResetActiveAppMsg" class="text-base font-weight-bold">
          Switch to {{ switchingTo && switchingTo.title }}
        </div>
        <div v-else class="text-base font-weight-bold">Reset {{ activePlugin && activePlugin.title }} Configuration</div>
        <div class="flex flex-row mt-2 w-full">
          <template v-if="showResetActiveAppMsg">
            Switching to {{ switchingTo && switchingTo.title }} will reset your {{ activePlugin && activePlugin.title }}
            settings. Continue?
          </template>
          <template v-else>Resetting will erase your current configuration.</template>
        </div>
        <div class="flex mt-6 justify-end space-x-2">
          <AtButton size="small" type="secondary" @click="closeResetModal"> {{ $t('general.cancel') }}</AtButton>
          <AtButton size="small" type="danger" data-testid="atm-reset-confirm-btn" @click="resetPlugin">
            {{ showResetActiveAppMsg ? `${$t('general.reset')} & ${$t('general.switch')}` : $t('general.reset') }}
          </AtButton>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.container {
  @apply p-4 w-950px gap-5 mx-auto my-2 grid grid-cols-3;

  .item {
    @apply text-base w-296px max-w-296px flex gap-3 border-1 border-atm-border-gray-medium py-4 px-5 rounded-xl items-center cursor-pointer hover:(shadow bg-atm-bg-gray-extralight);

    .icon {
      @apply !w-8 !h-8 object-contain;
    }

    .title {
      @apply font-weight-bold;
    }
  }
}
</style>
