<script lang="ts" setup>
provide(IsMiniSidebarInj, ref(true))

const router = useRouter()

const route = router.currentRoute

const { navigateToProject, isMobileMode, appInfo } = useGlobal()

const { meta: metaKey, control } = useMagicKeys()

const workspaceStore = useWorkspace()

const {
  activeWorkspaceId,
  activeWorkspace,
  isWorkspaceSettingsPageOpened,
  isIntegrationsPageOpened,
  isWorkspacesLoading,
  isTemplatesPageOpened,
} = storeToRefs(workspaceStore)

const {
  navigateToWorkspaceSettings,
  navigateToIntegrations: _navigateToIntegrations,
  navigateToTemplates: _navigateToTemplates,
  isTemplatesFeatureEnabled,
} = workspaceStore

const { basesList } = storeToRefs(useBases())

const { isSharedBase } = storeToRefs(useBase())

const { isUIAllowed } = useRoles()

const { setActiveCmdView } = useCommand()

const { isChatWootEnabled } = useProvideChatwoot()

const {
  isPanelExpanded: isChatPanelExpanded,
  hasWorkspaceContext: hasChatWorkspaceContext,
  hasBaseContext: hasChatBaseContext,
  toggleChatPanel,
} = useChatPanel()

const { blockAiChat } = useEeConfig()

const handleChatToggle = () => {
  toggleChatPanel()
}

const navigateToProjectPage = () => {
  if (route.value.name?.startsWith('index-typeOrId-baseId-')) {
    return
  }

  const lastVisitedBase = ncLastVisitedBase().get()

  const baseToNavigate = lastVisitedBase
    ? basesList.value?.find((b) => b.id === lastVisitedBase) ?? basesList.value[0]
    : basesList.value[0]

  navigateToProject({ workspaceId: isEeUI ? activeWorkspaceId.value : undefined, baseId: baseToNavigate?.id })
}

const navigateToSettings = () => {
  if (isEeUI && !appInfo.value?.ee && !appInfo.value?.isOnPrem) {
    navigateTo('/account/users/list')
    return
  }

  const cmdOrCtrl = isMac() ? metaKey.value : control.value

  navigateToWorkspaceSettings('', cmdOrCtrl)
}

const navigateToTemplates = () => {
  const cmdOrCtrl = isMac() ? metaKey.value : control.value

  _navigateToTemplates('', cmdOrCtrl)
}

const navigateToIntegrations = () => {
  const cmdOrCtrl = isMac() ? metaKey.value : control.value

  _navigateToIntegrations('', cmdOrCtrl)
}

useEventListener(document, 'keydown', async (e: KeyboardEvent) => {
  const isBaseSearchInput = e.target instanceof HTMLInputElement && e.target.closest('.atm-base-search-input')

  if (
    !e.altKey ||
    (!isBaseSearchInput &&
      (isActiveInputElementExist(e) ||
        cmdKActive() ||
        isCmdJActive() ||
        isNcDropdownOpen() ||
        isActiveElementInsideExtension() ||
        isActiveElementInsideScriptPane() ||
        isDrawerOrModalExist() ||
        isExpandedFormOpenExist()))
  ) {
    return
  }

  switch (e.code) {
    case 'KeyB': {
      e.preventDefault()
      navigateToProjectPage()
      break
    }
  }
})

// Cmd/Ctrl + Shift + A — toggle AI chat
useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if (!isEeUI || blockAiChat.value) return
  const cmdOrCtrl = isMac() ? e.metaKey : e.ctrlKey
  if (
    cmdOrCtrl &&
    e.shiftKey &&
    e.code === 'KeyA' &&
    !isActiveInputElementExist(e) &&
    !isNcDropdownOpen() &&
    !isDrawerOrModalExist()
  ) {
    e.preventDefault()
    handleChatToggle()
  }
})
</script>

<template>
  <div class="atm-mini-sidebar" data-testid="atm-mini-sidebar">
    <div class="flex flex-col items-center">
      <DashboardMiniSidebarItemWrapper size="small" show-in-mobile>
        <div
          class="min-h-9 sticky top-0 bg-atm-bg-gray-minisidebar"
          :class="{
            'pt-1.5 pb-1': isMobileMode,
          }"
        >
          <GeneralLoader v-if="isWorkspacesLoading" size="large" />
          <AtTooltip v-else placement="right" hide-on-click :arrow="false" :disabled="!activeWorkspace">
            <template #title>
              <div class="capitalize">{{ activeWorkspace?.title ?? '' }}</div>
            </template>
            <WorkspaceMenu />
          </AtTooltip>
        </div>
      </DashboardMiniSidebarItemWrapper>

      <DashboardMiniSidebarItemWrapper>
        <AtTooltip placement="right" hide-on-click :arrow="false">
          <template #title>
            <div class="flex items-center gap-1">{{ $t('labels.quickSearch') }} {{ renderCmdOrCtrlKey(true) }} K</div>
          </template>
          <div
            v-e="['c:quick-actions']"
            class="atm-mini-sidebar-btn-full-width"
            data-testid="atm-sidebar-cmd-k-btn"
            @click="setActiveCmdView('cmd-k')"
          >
            <div class="atm-mini-sidebar-btn">
              <GeneralIcon icon="search" class="h-4 w-4" />
            </div>
          </div>
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>
      <DashboardMiniSidebarItemWrapper>
        <AtTooltip placement="right" hide-on-click :arrow="false">
          <template #title>
            <div class="flex items-center gap-1">{{ $t('labels.recentViews') }} {{ renderCmdOrCtrlKey(true) }} L</div>
          </template>
          <div
            v-e="['c:quick-actions']"
            class="atm-mini-sidebar-btn-full-width"
            data-testid="atm-sidebar-cmd-l-btn"
            @click="setActiveCmdView('cmd-l')"
          >
            <div class="atm-mini-sidebar-btn">
              <MdiClockOutline class="h-4 w-4" />
            </div>
          </div>
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>
      <DashboardMiniSidebarItemWrapper>
        <AtTooltip placement="right" hide-on-click :arrow="false">
          <template #title>
            <div class="flex items-center gap-1">{{ $t('labels.searchDocumentation') }} {{ renderCmdOrCtrlKey(true) }} J</div>
          </template>
          <div
            v-e="['c:quick-actions']"
            class="atm-mini-sidebar-btn-full-width"
            data-testid="atm-sidebar-cmd-j-btn"
            @click="setActiveCmdView('cmd-j')"
          >
            <div class="atm-mini-sidebar-btn">
              <GeneralIcon icon="ncFile" class="h-4 w-4" />
            </div>
          </div>
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>
      <div
        v-if="(!isMobileMode || isEeUI) && (isUIAllowed('workspaceSettings') || isUIAllowed('workspaceCollaborators'))"
        class="px-2 my-2 w-full"
      >
        <AtDivider class="!my-0 !border-atm-border-gray-dark" />
      </div>
      <DashboardMiniSidebarItemWrapper
        v-if="isUIAllowed('workspaceSettings') || isUIAllowed('workspaceCollaborators')"
        :show-in-mobile="isEeUI"
      >
        <AtTooltip
          :title="isEeUI ? `${$t('objects.workspace')} ${$t('labels.settings')}` : $t('title.teamAndSettings')"
          placement="right"
          hide-on-click
          :arrow="false"
        >
          <div
            v-e="['c:team:settings']"
            class="atm-mini-sidebar-btn-full-width"
            data-testid="atm-sidebar-team-settings-btn"
            @click="navigateToSettings"
          >
            <div
              class="atm-mini-sidebar-btn"
              :class="{
                active: isWorkspaceSettingsPageOpened,
              }"
            >
              <GeneralIcon icon="ncSettings" class="h-4 w-4" />
            </div>
          </div>
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>
      <DashboardMiniSidebarItemWrapper v-if="isUIAllowed('workspaceIntegrations')">
        <AtTooltip
          :title="isEeUI ? `${$t('objects.workspace')} ${$t('general.integrations')}` : $t('general.integrations')"
          placement="right"
          hide-on-click
          :arrow="false"
        >
          <div
            v-e="['c:integrations']"
            class="atm-mini-sidebar-btn-full-width"
            data-testid="atm-sidebar-integrations-btn"
            @click="navigateToIntegrations"
          >
            <div
              class="atm-mini-sidebar-btn"
              :class="{
                active: isIntegrationsPageOpened,
              }"
            >
              <GeneralIcon icon="integration" class="h-4 w-4" />
            </div>
          </div>
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>
      <div v-if="!isMobileMode" class="px-2 w-full">
        <AtDivider class="!my-0 !border-atm-border-gray-dark !my-2" />
      </div>
      <DashboardMiniSidebarItemWrapper v-if="isTemplatesFeatureEnabled">
        <AtTooltip :title="$t('general.templates')" placement="right" hide-on-click :arrow="false">
          <div
            v-e="['c:templates']"
            class="atm-mini-sidebar-btn-full-width"
            data-testid="atm-sidebar-templates-btn"
            @click="navigateToTemplates"
          >
            <div
              class="atm-mini-sidebar-btn"
              :class="{
                active: isTemplatesPageOpened,
              }"
            >
              <GeneralIcon icon="globe" class="h-4 w-4" />
            </div>
          </div>
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>

      <DashboardMiniSidebarItemWrapper>
        <AtTooltip :title="$t('labels.myNotifications')" placement="right" hide-on-click :arrow="false">
          <NotificationMenu />
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>

      <DashboardMiniSidebarItemWrapper v-if="isEeUI && !blockAiChat && hasChatWorkspaceContext && hasChatBaseContext">
        <AtTooltip placement="right" hide-on-click :arrow="false">
          <template #title>
            <div class="flex items-center gap-1">{{ $t('labels.aiChat') }} {{ renderCmdOrCtrlKey(true) }} ⇧ A</div>
          </template>
          <div
            v-e="['c:chat:toggle']"
            class="atm-mini-sidebar-btn-full-width relative"
            data-testid="atm-sidebar-chat-btn"
            @click="handleChatToggle"
          >
            <div class="atm-mini-sidebar-btn" :class="{ active: isChatPanelExpanded }">
              <GeneralIcon icon="ncAutoAwesome" class="h-4 w-4" />
            </div>
          </div>
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>
    </div>
    <div class="flex flex-col items-center">
      <DashboardMiniSidebarItemWrapper>
        <DashboardMiniSidebarTheme />
      </DashboardMiniSidebarItemWrapper>

      <DashboardMiniSidebarItemWrapper>
        <AtTooltip :title="$t('general.help')" placement="right" hide-on-click :arrow="false">
          <DashboardMiniSidebarHelp />
        </AtTooltip>
      </DashboardMiniSidebarItemWrapper>
      <template v-if="!isMobileMode">
        <!--   Disabled for now since feed is not actively maintained -->
        <!--
        <DashboardMiniSidebarItemWrapper>
          <AtTooltip
            v-if="appInfo.feedEnabled"
            :title="`${$t('title.whatsNew')}!`"
            placement="right"
            hide-on-click
            :arrow="false"
          >
            <DashboardSidebarFeed />
          </AtTooltip>
        </DashboardMiniSidebarItemWrapper> -->
        <DashboardMiniSidebarItemWrapper v-if="isChatWootEnabled">
          <AtTooltip :title="`${$t('labels.chatWithAtmosphereSupport')}!`" placement="right" hide-on-click :arrow="false">
            <DashboardSidebarChatSupport />
          </AtTooltip>
        </DashboardMiniSidebarItemWrapper>
        <div class="px-2 w-full">
          <AtDivider class="!my-2 !border-atm-border-gray-dark" />
        </div>
        <DashboardMiniSidebarItemWrapper>
          <AtTooltip v-if="!isSharedBase" :title="$t('labels.createNew')" placement="right" hide-on-click :arrow="false">
            <DashboardMiniSidebarCreateNewActionMenu />
          </AtTooltip>
        </DashboardMiniSidebarItemWrapper>
      </template>
      <div v-else class="px-2 w-full">
        <AtDivider class="!my-2 !border-atm-border-gray-dark" />
      </div>

      <DashboardSidebarUserInfo />
    </div>
  </div>
</template>

<style lang="scss">
.atm-mini-sidebar {
  @apply w-[var(--mini-sidebar-width)] flex-none bg-atm-bg-gray-minisidebar flex flex-col justify-between items-center border-r-1 border-atm-border-gray-medium z-502 atm-scrollbar-thin overflow-x-hidden relative;

  .atm-mini-sidebar-ws-item {
    @apply cursor-pointer h-9 w-8 rounded py-1 flex items-center justify-center children:flex-none text-atm-content-gray-muted transition-all duration-200;

    .atm-workspace-avatar {
      img {
        @apply !cursor-pointer;
      }
    }

    &.atm-small-shadow .atm-workspace-avatar {
      box-shadow: 0px 5px 0px -2px rgba(var(--rgb-base), 0.4);
    }
    &.atm-medium-shadow .atm-workspace-avatar {
      box-shadow: 0px 4px 0px -2px rgba(var(--rgb-base), 0.4), 0px 7px 0px -3px rgba(var(--rgb-base), 0.2);
    }
  }

  .atm-mini-sidebar-btn-full-width {
    @apply w-[var(--mini-sidebar-width)] h-[var(--mini-sidebar-width)] flex-none flex justify-center items-center cursor-pointer transition-all duration-200;

    &:hover {
      .atm-mini-sidebar-btn:not(.active) {
        @apply bg-atm-bg-gray-medium;
      }
    }
  }

  .atm-mini-sidebar-btn {
    @apply cursor-pointer h-7 w-7 rounded !p-1.5 flex items-center justify-center children:flex-none !text-atm-content-gray-muted transition-all duration-200;

    &:not(.active) {
      @apply hover:bg-atm-bg-gray-medium;
    }

    &.active {
      @apply !bg-atm-brand-100 dark:!bg-atm-bg-gray-medium !text-atm-content-brand;
    }

    &.active-base {
      @apply !text-atm-content-brand;
    }

    &.hovered {
      @apply bg-atm-bg-gray-medium;
    }
  }
}
</style>
