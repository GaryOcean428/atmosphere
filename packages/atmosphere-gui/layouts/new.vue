<script lang="ts" setup>
import { useTitle } from '@vueuse/core'

const route = useRoute()

const { te, t } = useI18n()

// todo: fix this
// const { hasSidebar, isOpen } = useSidebar('atm-left-sidebar')
const hasSidebar = ref(true)
const isOpen = ref(true)

const { signOut, user, appInfo } = useGlobal()
const { clearWorkspaces } = useWorkspace()

const email = computed(() => user.value?.email ?? '---')

const refreshSidebar = ref(false)

const { productName, logoUrl, isWhiteLabelled } = useBranding()

useTitle(computed(() => (route.meta?.title && te(route.meta.title) ? `${t(route.meta.title)}` : productName.value)))

const isPublic = computed(() => route.meta?.public)

watch(hasSidebar, (val) => {
  if (!val) {
    refreshSidebar.value = true
    nextTick(() => {
      refreshSidebar.value = false
    })
  }
})

const logout = async () => {
  await signOut({
    redirectToSignin: true,
  })
  await clearWorkspaces()
}
</script>

<script lang="ts">
export default {
  name: 'DefaultLayout',
}
</script>

<template>
  <a-layout>
    <a-layout-header class="max-h-[var(--new-header-height)] !px-2">
      <div class="flex w-full h-full items-center atm-header-content">
        <div class="flex-1 min-w-0 w-50">
          <nuxt-link :to="isPublic ? '' : '/'">
            <img v-if="isWhiteLabelled && logoUrl" :src="logoUrl" :alt="productName" class="h-11 max-w-[180px] object-contain" />
            <img v-else src="~/assets/img/brand/atmosphere-full.png" class="h-11" />
          </nuxt-link>
        </div>

        <div v-if="$route.name === 'index-index'" class="flex gap-1">
          <!-- <a-button class="!text-inherit" data-testid="atm-dash-nav-workspaces"> Projects</a-button -->
          <!-- <a-button ghost class="!text-inherit" data-testid="atm-dash-nav-explore"> {{ $t('general.template') }}</a-button>
          <a-button ghost class="!text-inherit" data-testid="atm-dash-nav-help"> {{ $t('general.help') }}</a-button> -->
        </div>
        <div class="flex-1 min-w-0 flex justify-end gap-2">
          <div class="flex flex-row flex-grow">
            <slot name="navbar" />
          </div>
          <!-- <div v-if="isHomeScreen" class="atm-quick-action-wrapper" data-testid="atm-quick-action-wrapper">
            <MaterialSymbolsSearch class="atm-quick-action-icon" />
            <input class="" placeholder="Quick Actions" />

            <span class="atm-quick-action-shortcut">⌘ K</span>
          </div> -->

          <div v-if="!isPublic" class="flex items-center">
            <NotificationMenu class="mr-2" data-testid="atm-notification-bell-icon" />
          </div>

          <a-dropdown v-if="!isPublic" :trigger="['click']" overlay-class-name="atm-dropdown-user-accounts-menu">
            <div class="flex items-center gap-1 cursor-pointer" data-testid="atm-ws-account-menu-dropdown">
              <div
                class="h-8.5 w-8.5 rounded-full text-xs bg-secondary flex items-center justify-center font-weight-bold text-atm-content-gray-extreme uppercase"
              >
                {{ email ? email.split('@')[0].slice(0, 2) : 'A' }}
              </div>
              <MaterialSymbolsKeyboardArrowDownRounded />
            </div>

            <template #overlay>
              <a-menu class="!py-0 leading-8 !rounded min-w-40">
                <a-menu-item key="0" data-testid="atm-menu-accounts__user-settings" class="!rounded-t">
                  <nuxt-link
                    v-e="['c:navbar:user:email']"
                    class="atm-base-menu-item group !no-underline"
                    :to="appInfo.isCloud ? '/account/users' : '/admin?tab=users-list'"
                  >
                    <MdiAccountCircleOutline class="mt-1 group-hover:text-accent" />&nbsp;
                    <div class="prose group-hover:text-primary">
                      <div>{{ $t('labels.account') }}</div>
                      <div class="text-xs text-atm-content-gray-muted">{{ email }}</div>
                    </div>
                  </nuxt-link>
                </a-menu-item>

                <a-menu-divider class="!m-0" />
                <!-- <a-menu-item v-if="isUIAllowed('superAdminAppStore')" key="0" class="!rounded-t">
                  <nuxt-link
                    v-e="['c:settings:appstore', { page: true }]"
                    class="atm-base-menu-item group !no-underline"
                    to="/admin/users"
                  >
                    <MdiShieldAccountOutline class="mt-1 group-hover:text-accent" />&nbsp;
                    <span class="prose group-hover:text-primary">{{ $t('title.accountManagement') }}</span>
                  </nuxt-link>
                </a-menu-item> -->

                <a-menu-divider class="!m-0" />

                <a-menu-item key="1" class="!rounded-b group" data-testid="atm-menu-accounts__sign-out">
                  <div
                    v-e="['a:navbar:user:sign-out']"
                    class="atm-base-menu-item group"
                    data-testid="atm-logout-btn"
                    @click="logout"
                  >
                    <MdiLogout class="group-hover:text-accent" />&nbsp;

                    <span class="prose group-hover:text-primary">
                      {{ $t('general.signOut') }}
                    </span>
                  </div>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </a-layout-header>
    <!--    todo: change class name -->
    <a-layout class="atm-root">
      <a-layout-sider
        v-if="hasSidebar"
        ref="sidebar"
        :collapsed="!isOpen"
        width="250"
        collapsed-width="50"
        class="relative shadow-md h-full z-1 atm-left-sidebar h-[calc(100vh_-_var(--new-header-height))] !shadow-none border-atm-border-gray-light border-r-1 !overflow-x-hidden"
        :trigger="null"
        collapsible
        theme="light"
      >
        <slot name="sidebar" />
      </a-layout-sider>
      <div class="w-full h-[calc(100vh_-_var(--new-header-height))]">
        <slot></slot>
      </div>
    </a-layout>
  </a-layout>
</template>

<style scoped lang="scss">
.atm-workspace-avatar {
  @apply min-w-6 h-6 rounded-[6px] flex items-center justify-center text-atm-content-inverted-primary font-weight-bold uppercase;
  font-size: 0.7rem;
}

.atm-workspace-list {
  .atm-workspace-list-item {
    @apply flex gap-2 items-center;
  }

  :deep(.ant-menu-item) {
    @apply relative;

    & .color-band {
      @apply opacity-0 absolute w-2 h-7 -left-1 top-[6px] bg-[#4351E8] rounded-[99px] trasition-opacity;
    }
  }

  :deep(.ant-menu-item-selected, .ant-menu-item-active) .color-band {
    @apply opacity-100;
  }

  .atm-workspace-menu {
    @apply opacity-0 transition-opactity;
  }

  :deep(.ant-menu-item:hover) .atm-workspace-menu {
    @apply opacity-100;
  }
}

:deep(.atm-workspace-list .ant-menu-item) {
  @apply !my-0;
}

.atm-workspace-group {
  .atm-workspace-group-item {
    &:hover {
      @apply bg-primary bg-opacity-3 text-primary;
    }

    &.active {
      @apply bg-primary bg-opacity-8 text-primary;
    }

    @apply h-[40px] px-4 flex items-center gap-2 cursor-pointer;

    .atm-icon {
      @apply w-6;
    }
  }
}

// todo:  apply globally at windicss level
.atm-root {
  @apply text-[#4B5563];
}

.atm-collab-list {
  .atm-collab-list-item {
    @apply flex gap-2 py-2 px-4 items-center;

    .atm-collab-avatar {
      @apply w-6 h-6 rounded-full flex items-center justify-center text-atm-content-inverted-primary font-weight-bold uppercase;
      font-size: 0.7rem;
    }
  }
}

:deep(.ant-tabs-nav-list) {
  @apply ml-6;
}

.ant-layout-header {
  @apply !h-20 bg-transparent border-b-1 border-atm-border-gray-medium;
}

.atm-quick-action-wrapper {
  @apply relative;

  input {
    @apply h-10 w-60 bg-atm-bg-gray-light rounded-md pl-9 pr-5 mr-2;
  }

  .atm-quick-action-icon {
    @apply absolute left-2 top-6;
  }

  .atm-quick-action-shortcut {
    @apply text-atm-content-gray-disabled absolute right-4 top-0;
  }
}

:deep(.ant-tabs-tab:not(ant-tabs-tab-active)) {
  @apply !text-atm-content-gray-muted;
}

:deep(.ant-tabs-content) {
  @apply !min-h-25 !h-full;
}
</style>
