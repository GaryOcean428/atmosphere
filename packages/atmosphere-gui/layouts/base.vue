<script lang="ts" setup>
const { signOut, signedIn, isLoading, user, currentVersion, appInfo } = useGlobal()

useSidebar('atm-left-sidebar', { hasSidebar: false })

const route = useRoute()

const email = computed(() => user.value?.email ?? '---')

const hasSider = ref(false)

const sidebar = ref<HTMLDivElement>()

const logout = async () => {
  await signOut({
    redirectToSignin: true,
  })
}

const { hooks } = useNuxtApp()

const isDashboard = computed(() => !!route.params.typeOrId)

const { productName, logoUrl, faviconUrl, isWhiteLabelled } = useBranding()

/** when page suspensions have finished, check if a sidebar element was teleported into the layout */
hooks.hook('page:finish', () => {
  if (sidebar.value) {
    hasSider.value = sidebar.value?.children.length > 0
  }
})
</script>

<template>
  <a-layout id="atm-app" class="atm-app" has-sider>
    <Transition name="slide">
      <div v-show="hasSider" id="atm-sidebar-left" ref="sidebar" />
    </Transition>

    <a-layout class="!flex-col atm-h-screen">
      <a-layout-header v-if="!route.meta.public && signedIn && !route.meta.hideHeader" class="atm-navbar">
        <div
          v-if="!route.params.baseType"
          v-e="['c:navbar:home']"
          data-testid="atm-atmosphere-brand-icon"
          class="transition-all duration-200 p-2 cursor-pointer transform hover:scale-105 atm-atmosphere-brand-icon"
          @click="navigateTo('/')"
        >
          <a-tooltip placement="bottom">
            <template #title>
              {{ currentVersion }}
            </template>
            <div class="flex items-center gap-2">
              <template v-if="isWhiteLabelled && logoUrl">
                <img
                  :width="isDashboard ? 25 : 120"
                  :alt="productName"
                  :src="logoUrl"
                  :class="isDashboard ? 'h-6 object-contain' : 'max-h-10 object-contain'"
                />
              </template>
              <template v-else-if="isWhiteLabelled && isDashboard && faviconUrl">
                <img width="25" :alt="productName" :src="faviconUrl" class="object-contain" />
              </template>
              <template v-else>
                <img v-if="!isDashboard" width="120" alt="Atmosphere" src="~/assets/img/brand/atmosphere-full.png" />
                <img v-else width="25" alt="Atmosphere" src="~/assets/img/icons/256x256.png" />
              </template>
            </div>
          </a-tooltip>
        </div>

        <div class="!text-atm-content-inverted-primary flex justify-center">
          <div v-show="isLoading" class="flex items-center gap-2 ml-3" data-testid="atm-loading">
            {{ $t('general.loading') }}

            <component :is="iconMap.reload" :class="{ 'animate-infinite animate-spin': isLoading }" />
          </div>
        </div>

        <div class="flex-1" />

        <DashboardMiniSidebarTheme placement="bottom" render-as-btn button-class="h-8 w-8" class="mr-3" />

        <GeneralReleaseInfo />

        <a-tooltip placement="bottom" :mouse-enter-delay="1" class="mr-4">
          <template #title>{{ $t('labels.community.communityTranslated') }}</template>

          <div class="flex items-center">
            <GeneralLanguage class="cursor-pointer text-2xl text-atm-content-gray hover:text-accent" />
          </div>
        </a-tooltip>

        <template v-if="signedIn">
          <a-dropdown :trigger="['click']" overlay-class-name="atm-dropdown-user-accounts-menu">
            <component
              :is="iconMap.threeDotVertical"
              data-testid="atm-menu-accounts"
              class="md:text-xl cursor-pointer text-atm-content-gray hover:text-accent atm-menu-accounts"
              @click.prevent
            />

            <template #overlay>
              <a-menu class="!py-0 leading-8 !rounded">
                <a-menu-item key="0" data-testid="atm-menu-accounts__user-settings" class="!rounded-t">
                  <nuxt-link
                    v-e="['c:navbar:user:email']"
                    class="atm-base-menu-item group !no-underline"
                    :to="appInfo.isCloud ? '/account/users' : '/admin?tab=users-list'"
                  >
                    <component :is="iconMap.accountCircle" class="mt-1 group-hover:text-accent" />&nbsp;
                    <div class="prose group-hover:text-primary">
                      <div>{{ $t('labels.account') }}</div>
                      <div class="text-xs text-gray-500">{{ email }}</div>
                    </div>
                  </nuxt-link>
                </a-menu-item>

                <!-- <a-menu-divider class="!m-0" />
                <a-menu-item v-if="isUIAllowed('superAdminAppStore')" key="0" class="!rounded-t">
                  <nuxt-link
                    v-e="['c:settings:appstore', { page: true }]"
                    class="atm-base-menu-item group !no-underline"
                    to="/admin/users"
                  >
                    <MdiShieldAccountOutline class="mt-1 group-hover:text-accent" />&nbsp;
                    <span class="prose group-hover:text-primary">{{ $t('title.accountManagement') }}</span>
                  </nuxt-link>
                </a-menu-item>

                <a-menu-divider class="!m-0" /> -->

                <a-menu-item key="1" class="!rounded-b group" data-testid="atm-menu-accounts__sign-out">
                  <div v-e="['a:navbar:user:sign-out']" class="atm-base-menu-item group" @click="logout">
                    <component :is="iconMap.signout" class="group-hover:text-accent" />&nbsp;

                    <span class="prose group-hover:text-primary">
                      {{ $t('general.signOut') }}
                    </span>
                  </div>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </a-layout-header>

      <AtTooltip
        v-if="!signedIn && !route.params.baseId && !route.params.erdUuid && !ncIsIframe()"
        placement="left"
        class="atm-lang-btn-wrapper"
      >
        <template #title>{{ $t('labels.community.communityTranslated') }}</template>

        <GeneralLanguage class="atm-lang-btn text-white" />
      </AtTooltip>

      <div class="w-full h-full overflow-hidden atm-layout-base-inner">
        <slot />
      </div>
    </a-layout>
  </a-layout>
</template>

<style lang="scss">
.atm-lang-btn-wrapper {
  @apply fixed bottom-10 right-10 z-99 w-12 h-12;
}

.atm-lang-btn {
  @apply color-transition flex items-center justify-center w-full h-full rounded-full shadow-md shadow-atm-content-gray-muted p-2 !bg-primary text-white ring-opacity-100 active:(ring ring-accent) hover:(ring ring-accent);

  &::after {
    @apply rounded-full absolute top-0 left-0 right-0 bottom-0 transition-all duration-150 ease-in-out bg-primary;
    content: '';
    z-index: -1;
  }

  &:hover::after {
    @apply transform scale-110 ring ring-accent ring-opacity-100;
  }

  &:active::after {
    @apply ring ring-accent ring-opacity-100;
  }
}

.atm-navbar {
  @apply flex !bg-atm-bg-default items-center !pl-2 !pr-5;
}

.atm-layout-base-inner > div {
  @apply h-full;
}
</style>
