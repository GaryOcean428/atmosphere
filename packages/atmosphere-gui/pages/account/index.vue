<script lang="ts" setup>
definePageMeta({
  hideHeader: true,
})

const $route = useRoute()

const { signedIn, signOut } = useGlobal()

const selectedKeys = computed(() => [$route.params.nestedPage ?? $route.params.page])

const openKeys = ref([])

const backRoute = computed(() => ncBackRoute().get())

const logout = async () => {
  await signOut({
    redirectToSignin: true,
  })
}
</script>

<template>
  <div>
    <NuxtLayout name="empty">
      <div class="mx-auto h-full">
        <div class="h-full flex">
          <!-- Side tabs -->

          <div class="h-full bg-atm-bg-gray-sidebar atm-user-sidebar overflow-y-auto atm-scrollbar-thin min-w-[312px]">
            <AtMenu
              v-model:open-keys="openKeys"
              v-model:selected-keys="selectedKeys"
              :inline-indent="16"
              class="tabs-menu h-full"
              mode="inline"
            >
              <div class="h-[var(--topbar-height)] flex items-center children:flex-none">
                <AtButton
                  v-if="!$route.params.baseType"
                  v-e="['c:navbar:home']"
                  type="text"
                  size="small"
                  class="transition-all duration-200 mx-2 cursor-pointer transform hover:bg-atm-bg-gray-light atm-atmosphere-brand-icon"
                  data-testid="atm-atmosphere-brand-icon"
                  @click="navigateTo(backRoute)"
                >
                  <div class="flex flex-row gap-x-2 items-center">
                    <GeneralIcon icon="ncArrowLeft" />
                    <div class="flex text-small leading-[18px] font-semibold">{{ $t('labels.back') }}</div>
                  </div>
                </AtButton>
              </div>
              <AtDivider class="!mt-0" />

              <div class="text-sm text-atm-content-gray-muted font-semibold ml-4 py-1.5 mt-2">{{ $t('labels.account') }}</div>

              <AtMenuItem
                key="profile"
                class="item"
                :class="{
                  active: $route.params.page === 'profile',
                }"
                @click="navigateTo('/account/profile')"
              >
                <div class="flex items-center space-x-2">
                  <GeneralIcon icon="ncUser" class="!h-4 !w-4" />

                  <div class="select-none">{{ $t('labels.profile') }}</div>
                </div>
              </AtMenuItem>
              <AtMenuItem
                key="tokens"
                class="item"
                :class="{
                  active: $route.params.page === 'tokens' || $route.path.startsWith('/account/tokens'),
                }"
                @click="navigateTo('/account/tokens')"
              >
                <div class="flex items-center space-x-2">
                  <GeneralIcon icon="ncKey2" class="h-4 w-4 flex-none" />

                  <div class="select-none">{{ $t('title.apiTokens') }}</div>
                </div>
              </AtMenuItem>
              <AtMenuItem
                key="mcp"
                :class="{
                  active: $route.params.page === 'mcp',
                }"
                class="item"
                @click="navigateTo('/account/mcp')"
              >
                <div class="flex items-center space-x-2">
                  <GeneralIcon icon="mcp" class="h-4 w-4 flex-none" />

                  <div class="select-none">{{ $t('title.mcpServer') }}</div>
                </div>
              </AtMenuItem>
              <AtMenuItem
                key="password-reset"
                class="item"
                :class="{
                  active: $route.params.nestedPage === 'password-reset',
                }"
                @click="navigateTo('/account/users/password-reset')"
              >
                <div class="flex items-center space-x-2">
                  <GeneralIcon icon="ncLock" class="!h-4 !w-4" />
                  <div class="select-none">{{ $t('title.resetPasswordMenu') }}</div>
                </div>
              </AtMenuItem>
            </AtMenu>
          </div>

          <!-- Sub Tabs -->

          <div class="h-full flex-1 flex flex-col overflow-y-auto atm-scrollbar-thin">
            <div class="flex flex-row pt-2 px-2 items-center">
              <div class="flex-1">
                <AccountBreadcrumb />
              </div>

              <DashboardMiniSidebarTheme placement="bottom" render-as-btn class="mr-3" button-class="h-8 w-8" />

              <GeneralReleaseInfo />

              <AtTooltip placement="bottom" class="mr-3">
                <template #title>{{ $t('labels.community.communityTranslated') }}</template>

                <div class="flex items-center">
                  <GeneralLanguage button class="cursor-pointer text-2xl hover:text-atm-content-gray" />
                </div>
              </AtTooltip>

              <template v-if="signedIn">
                <AtDropdown :trigger="['click']" overlay-class-name="atm-dropdown-user-accounts-menu">
                  <AtButton type="text" size="small">
                    <component
                      :is="iconMap.threeDotVertical"
                      data-testid="atm-menu-accounts"
                      class="md:text-lg cursor-pointer hover:text-atm-content-gray atm-menu-accounts"
                      @click.prevent
                    />
                  </AtButton>

                  <template #overlay>
                    <AtMenu variant="medium">
                      <AtMenuItem data-testid="atm-menu-accounts__sign-out" class="group" @click="logout">
                        <component :is="iconMap.signout" class="group-hover:text-accent" />
                        <span class="group-hover:text-primary">
                          {{ $t('general.signOut') }}
                        </span>
                      </AtMenuItem>
                    </AtMenu>
                  </template>
                </AtDropdown>
              </template>
            </div>
            <div
              class="flex flex-col w-full"
              :style="{
                height: 'calc(100vh - 3.5rem)',
              }"
            >
              <div class="h-full">
                <NuxtPage />
              </div>
            </div>
          </div>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<style lang="scss" scoped>
:deep(.atm-user-sidebar .ant-menu-sub.ant-menu-inline) {
  @apply bg-transparent;
}

:deep(.atm-user-sidebar .ant-menu-item-only-child),
:deep(.ant-menu-submenu-title) {
  @apply !h-[28px] !leading-[28px];
}

:deep(.ant-menu-submenu-arrow) {
  @apply !text-atm-content-gray-disabled;
}

:deep(.ant-menu-submenu-selected .ant-menu-submenu-arrow) {
  @apply !text-inherit;
}
.tabs-menu {
  @apply bg-atm-bg-gray-sidebar;

  :deep(.item) {
    @apply select-none mx-2 !px-3 !text-bodyDefaultSm font-medium !rounded-md !mb-0.5 text-atm-content-gray-subtle !hover:(bg-atm-bg-gray-medium text-atm-content-gray-subtle) font-medium;

    width: calc(100% - 1rem);
  }

  :deep(.atm-menu-item-inner),
  :deep(.atm-submenu-title) {
    @apply !text-bodyDefaultSm font-medium;
  }
}

:deep(.ant-menu-submenu-title) {
  @apply select-none mx-2 !pl-3 !pr-1 !text-bodyDefaultSm font-medium !rounded-md !mb-0.5 !hover:(bg-atm-bg-gray-medium text-atm-content-gray-subtle);
  width: calc(100% - 1rem);

  & + ul {
    @apply !-mt-1;
  }
}

:deep(.ant-menu) {
  @apply !pt-0 !rounded-none !border-atm-border-gray-medium;
}

.atm-account-dropdown-item {
  @apply flex flex-row px-4 items-center py-2 gap-x-2 hover:bg-atm-bg-gray-light cursor-pointer;
}
</style>

<style lang="scss">
.atm-user-sidebar {
  .tabs-menu .active {
    @apply !bg-atm-bg-brand !text-atm-content-brand-disabled !hover:(bg-atm-bg-brand text-atm-content-brand-disabled) dark:(!bg-atm-bg-gray-medium !hover:bg-atm-bg-gray-medium) font-semibold;
  }
}
</style>
