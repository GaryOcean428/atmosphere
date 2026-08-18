<script lang="ts" setup>
/**
 * Reusable user menu content — logout, dock mode, feature preview,
 * keyboard shortcuts, API tokens, language, theme, account settings.
 *
 * Used by both the mini-sidebar UserInfo and the HomeSidebar.
 * Expects to be placed inside an AtDropdown overlay slot.
 */

const emits = defineEmits<{
  (e: 'closeMenu'): void
}>()

const isMiniSidebar = inject(IsMiniSidebarInj, undefined)

const { user, signOut, isMobileMode } = useGlobal()

const { toggleMode } = useMiniSidebarMode()

const { toggleTheme, isThemeEnabled, selectedTheme } = useTheme()

const themeLabel = computed(
  () =>
    ({
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    }[selectedTheme.value]),
)

const themeIcon = computed(
  () =>
    ({
      light: 'ncSun',
      dark: 'ncMoon',
      system: 'ncSunMoon',
    }[selectedTheme.value] as IconMapKey),
)

const { isExperimentalFeatureModalOpen } = useBetaFeatureToggle()

const auditsStore = useAuditsStore()

const isLoggingOut = ref(false)

const copyBtnRef = ref()

const { $e } = useNuxtApp()

const logout = async () => {
  isLoggingOut.value = true
  try {
    const isSsoUser = !!(user?.value as any)?.sso_client_id
    await signOut({
      redirectToSignin: true,
      signinUrl: isSsoUser ? '/sso' : '/signin',
    })
  } catch (e) {
    console.error(e)
  } finally {
    isLoggingOut.value = false
  }
}

const openExperimentationMenu = () => {
  emits('closeMenu')
  isExperimentalFeatureModalOpen.value = true
}

const route = useRoute()

const accountUrl = computed(() => '/account/profile')

const saveBackRoute = () => {
  ncBackRoute().set(route.fullPath)
}

const copyEmail = () => {
  if (!user?.value?.email) return
  copyBtnRef.value?.copyContent?.(user.value?.email)
}

const openKeyboardShortcutDialog = () => {
  emits('closeMenu')
  $e('a:actions:keyboard-shortcut')

  const isOpen = ref(true)

  const { close } = useDialog(resolveComponent('DlgKeyboardShortcuts'), {
    'modelValue': isOpen,
    'onUpdate:modelValue': closeDialog,
  })

  function closeDialog() {
    isOpen.value = false
    close(300)
  }
}
</script>

<template>
  <AtMenu variant="medium">
    <!-- Desktop menu -->
    <template v-if="!isMobileMode">
      <!-- Log Out -->
      <AtMenuItem data-testid="atm-sidebar-user-logout" @click="logout">
        <div v-e="['c:user:logout']" class="flex gap-2 items-center min-w-40 md:min-w-70">
          <GeneralLoader v-if="isLoggingOut" class="!ml-0.5 !mr-0.5 !max-h-4.5 !-mt-0.5" />
          <GeneralIcon v-else icon="signout" class="menu-icon" />
          <span class="menu-btn">{{ $t('general.logout') }}</span>
        </div>
      </AtMenuItem>

      <AtDivider />

      <!-- Dock Mode -->
      <AtMenuItem v-if="isMiniSidebar" @click="toggleMode">
        <GeneralIcon icon="ncPlaceholderIcon" class="menu-icon" />
        <span class="menu-btn">Dock Mode</span>
        <AtBadgeBeta />
      </AtMenuItem>

      <!-- Experimental Features -->
      <AtMenuItem @click="openExperimentationMenu">
        <GeneralIcon icon="bulb" class="menu-icon mt-0.5" />
        <span class="menu-btn">{{ $t('general.featurePreview') }}</span>
      </AtMenuItem>

      <!-- Keyboard Shortcuts -->
      <AtMenuItem
        v-e="['c:user:keyboard-shortcuts']"
        data-testid="atm-sidebar-keyboard-shortcuts"
        @click="openKeyboardShortcutDialog"
      >
        <GeneralIcon icon="ncKeyboard" class="menu-icon" />
        <div class="flex items-center justify-between flex-1">
          <span class="menu-btn">{{ $t('title.keyboardShortcut') }}</span>
          <span class="flex items-center gap-0.5 text-atm-content-gray-muted ml-1">
            <kbd class="atm-user-menu-kbd">{{ renderCmdOrCtrlKey() }}</kbd>
            <kbd class="atm-user-menu-kbd">/</kbd>
          </span>
        </div>
      </AtMenuItem>

      <!-- Admin Panel (EE) -->
      <DashboardSidebarEEMenuOption v-if="isEeUI" />

      <!-- API Tokens -->
      <nuxt-link v-e="['c:user:api-tokens']" class="!no-underline" to="/account/tokens" @click="saveBackRoute">
        <AtMenuItem>
          <GeneralIcon icon="ncKey2" class="menu-icon mt-0.5" />
          <span class="menu-btn">{{ $t('title.apiTokens') }}</span>
        </AtMenuItem>
      </nuxt-link>

      <AtDivider />

      <!-- Language -->
      <a-popover
        key="language"
        class="lang-menu !py-1.5"
        placement="rightBottom"
        overlay-class-name="atm-lang-menu-overlay !z-1050"
      >
        <AtMenuItem inner-class="w-full">
          <div v-e="['c:translate:open']" class="flex gap-2 items-center w-full">
            <GeneralIcon icon="translate" class="atm-language ml-0.25 menu-icon" />
            {{ $t('labels.language') }}
            <div class="flex items-center text-atm-content-gray-disabled text-xs">
              {{ $t('labels.community.communityTranslated') }}
            </div>
            <div class="flex-1" />
            <GeneralIcon icon="ncChevronRight" class="flex-none !text-atm-content-gray-muted" />
          </div>
        </AtMenuItem>
        <template #content>
          <div class="bg-atm-bg-default max-h-50vh min-w-64 mb-1 atm-scrollbar-thin -mr-1.5 pr-1.5">
            <LazyGeneralLanguageMenu />
          </div>
        </template>
      </a-popover>

      <!-- Theme -->
      <AtMenuItem v-if="isThemeEnabled" v-e="['c:atmosphere:theme']" data-testid="atm-sidebar-user-theme" @click="toggleTheme">
        <GeneralIcon :icon="themeIcon" class="menu-icon" />
        <span class="menu-btn">{{ themeLabel }}</span>
        <span class="text-atm-content-gray-muted text-xs ml-auto">{{ $t('general.appearance') }}</span>
      </AtMenuItem>

      <!-- Account Settings -->
      <nuxt-link
        v-e="['c:user:settings']"
        class="!no-underline"
        :to="accountUrl"
        @click="
          () => {
            saveBackRoute()
            auditsStore.handleReset()
          }
        "
      >
        <AtMenuItem>
          <GeneralIcon icon="ncSettings" class="menu-icon" />
          <div class="flex-1 flex flex-col">
            <div>{{ $t('title.accountSettings') }}</div>
            <AtTooltip show-on-truncate-only class="truncate text-bodySm text-atm-content-gray-muted max-w-68">
              <template #title>{{ user?.email }}</template>
              {{ user?.email }}
            </AtTooltip>
          </div>
        </AtMenuItem>
      </nuxt-link>
    </template>

    <!-- Mobile menu (mini-sidebar) -->
    <template v-else>
      <AtMenuItem data-testid="atm-sidebar-user-logout" @click="logout">
        <div v-e="['c:user:logout']" class="flex gap-2 items-center min-w-40">
          <GeneralLoader v-if="isLoggingOut" class="!ml-0.5 !mr-0.5 !max-h-4.5 !-mt-0.5" />
          <GeneralIcon v-else icon="signout" class="menu-icon" />
          <span class="menu-btn">{{ $t('general.logout') }}</span>
        </div>
      </AtMenuItem>

      <AtDivider />

      <AtMenuItem @click="openExperimentationMenu">
        <GeneralIcon icon="bulb" class="menu-icon mt-0.5" />
        <span class="menu-btn">{{ $t('general.featurePreview') }}</span>
      </AtMenuItem>

      <template v-if="isThemeEnabled">
        <AtDivider />
        <AtMenuItem v-e="['c:atmosphere:theme']" data-testid="atm-sidebar-user-theme" @click="toggleTheme">
          <GeneralIcon :icon="themeIcon" class="menu-icon" />
          <span class="menu-btn">{{ themeLabel }}</span>
          <span class="text-atm-content-gray-muted text-xs ml-auto">{{ $t('general.appearance') }}</span>
        </AtMenuItem>
      </template>

      <AtDivider />

      <AtMenuItemLabel>
        <span class="normal-case">{{ $t('labels.accountEmailID') }}</span>
      </AtMenuItemLabel>
      <AtMenuItem inner-class="w-full" @click="copyEmail">
        <GeneralIcon icon="ncMail" class="h-4 w-4" />
        <AtTooltip show-on-truncate-only class="flex-1 truncate max-w-68">
          <template #title>{{ user?.email }}</template>
          {{ user?.email }}
        </AtTooltip>
        <GeneralCopyButton v-if="user?.email" ref="copyBtnRef" type="secondary" :content="user?.email" :show-toast="false" />
      </AtMenuItem>
    </template>
  </AtMenu>
</template>

<style lang="scss" scoped>
.menu-btn {
  line-height: 1.5;
}

.menu-icon {
  @apply w-4 h-4;
  font-size: 1rem;
}

.atm-user-menu-kbd {
  @apply inline-flex items-center justify-center
    min-w-4.5 h-4.5 px-1
    text-[10px] font-medium leading-none
    text-atm-content-gray-muted
    bg-atm-bg-gray-light
    border-1 border-atm-border-gray-medium
    rounded;
}
</style>
