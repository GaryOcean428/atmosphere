<script lang="ts" setup>
import Table from '~/components/dashboard/TreeView/Table/index.vue'

const sidebarStore = useSidebarStore()

const { activeSidebarTab } = storeToRefs(sidebarStore)

const { isSharedBase } = storeToRefs(useBase())

const { isMobileMode } = useGlobal()

const base = inject(ProjectInj)!

const baseRole = inject(ProjectRoleInj)!

const { isUIAllowed } = useRoles()

const { isDark } = useTheme()

const projectNodeRef = ref()

async function addNewProjectChildEntity(showSourceSelector = true) {
  if (!projectNodeRef.value) return

  projectNodeRef.value?.addNewProjectChildEntity?.(showSourceSelector)
}

const isVisibleCreateNew = ref(false)

const hasTableCreatePermission = computed(() => {
  return isUIAllowed('tableCreate', { roles: baseRole.value, source: base.value?.sources?.[0] })
})
</script>

<template>
  <div v-if="base?.id && !base.isLoading" class="atm-treeview-active-base">
    <div>
      <DashboardSidebarHeaderWrapper>
        <div v-if="isSharedBase" class="flex-1">
          <div
            data-testid="atm-workspace-menu"
            class="flex items-center atm-workspace-menu overflow-hidden py-1.25 pr-0.25 justify-center w-full"
          >
            <a
              class="w-24 min-w-10 transition-all duration-200 p-1 transform"
              href="https://github.com/GaryOcean428/atmosphere"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img v-if="isDark" width="96" alt="Atmosphere" src="~/assets/img/brand/text.png" />
              <img v-else width="96" alt="Atmosphere" src="~/assets/img/brand/atmosphere.png" />
            </a>

            <div class="flex flex-grow"></div>
          </div>
        </div>
        <DashboardTreeViewProjectNode v-else ref="projectNodeRef" is-project-header />
      </DashboardSidebarHeaderWrapper>

      <div
        v-if="hasTableCreatePermission && !isSharedBase && activeSidebarTab !== 'settings'"
        class="atm-project-home-section !py-0 xs:mt-1 flex items-center min-h-[var(--toolbar-height)]"
      >
        <div class="flex items-center w-full">
          <AtDropdown v-model:visible="isVisibleCreateNew">
            <AtButton
              type="text"
              size="small"
              mobile-size="medium"
              full-width
              class="atm-home-create-new-btn atm-home-create-new-dropdown-btn !text-atm-content-gray-subtle !hover:(text-atm-content-gray) !xs:hidden !w-full !px-3"
              :class="isVisibleCreateNew ? 'active' : ''"
              data-testid="atm-home-create-new-btn"
            >
              <div class="flex items-center gap-2">
                <GeneralIcon icon="ncPlusCircle" class="!text-atm-content-brand" />

                <div>{{ $t('labels.createNew') }}</div>
              </div>
            </AtButton>

            <template #overlay>
              <DashboardTreeViewProjectCreateNewMenu
                v-model:visible="isVisibleCreateNew"
                @new-table="addNewProjectChildEntity()"
              />
            </template>
          </AtDropdown>
        </div>
      </div>
      <div v-else class="h-1">&nbsp;</div>
    </div>

    <div class="flex-1 relative overflow-y-auto atm-scrollbar-thin">
      <!-- Data tab -->
      <template v-if="activeSidebarTab === 'data'">
        <Table :base-id="base.id" hide-header @create-table="addNewProjectChildEntity()" />
      </template>

      <!-- Settings panel -->
      <template v-else-if="activeSidebarTab === 'settings'">
        <DashboardTreeViewProjectBaseSettingsMenu v-if="!isSharedBase" />
        <template v-if="showWsSettingsInBase">
          <div v-if="!isSharedBase && !isMobileMode" class="mx-3 border-t border-atm-border-gray-medium"></div>
          <DashboardTreeViewProjectWsSettingsMenu />
        </template>
      </template>

      <!-- Fallback to data -->
      <template v-else>
        <Table :base-id="base.id" hide-header @create-table="addNewProjectChildEntity()" />
      </template>
    </div>

    <slot name="footer"> </slot>
  </div>
</template>

<style lang="scss" scoped>
:deep(.atm-sidebar-header) {
  @apply border-b-1 border-atm-border-gray-medium;
}

:deep(.ant-collapse-header) {
  @apply !mx-0 !pl-2 h-7 !xs:(pl-2 h-[3rem]) !pr-0.5 !py-0 hover:bg-atm-bg-gray-medium xs:(hover:bg-atm-bg-brand) !rounded-md;

  .ant-collapse-arrow {
    @apply !right-1 !xs:(flex-none border-1 border-atm-border-gray-medium w-6.5 h-6.5 mr-1);
  }
}

:deep(.ant-collapse-item) {
  @apply h-full;
}

:deep(.ant-collapse-header) {
  .atm-sidebar-upgrade-badge {
    @apply -mr-6;

    &.atm-sidebar-option-open {
      @apply mr-0.5;
    }
  }

  &:hover {
    .atm-sidebar-node-btn {
      &:not(.atm-sidebar-upgrade-badge) {
        @apply !opacity-100 !inline-block;
      }

      &.atm-sidebar-upgrade-badge {
        @apply mr-0.5;
      }

      &:not(.atm-sidebar-expand) {
        @apply !xs:hidden;
      }
    }
  }
}

:deep(.ant-collapse-content-box) {
  @apply !px-0 !pb-0 !pt-0.25;
}

:deep(.atm-home-create-new-btn.atm-button) {
  @apply hover:bg-atm-bg-brand !pr-1.5;

  &.active {
    @apply !bg-atm-bg-brand;
  }
}
</style>
