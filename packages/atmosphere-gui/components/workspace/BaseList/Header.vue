<script lang="ts" setup>
import { OrgUserRoles } from 'atmosphere-sdk'

type FilterType = 'all' | 'starred' | 'private' | 'owned' | 'managed'

const props = defineProps<{
  baseCount: number
  activeFilter: FilterType
  searchQuery?: string
}>()

const emit = defineEmits<{
  'update:activeFilter': [filter: FilterType]
  'update:searchQuery': [query: string]
}>()

const vSearchQuery = useVModel(props, 'searchQuery', emit)

const { t } = useI18n()

const { appInfo, isMobileMode, activeBreakpoint } = useGlobal()

const { orgRoles } = useRoles()

const { showEEFeatures, isEEFeatureBlocked } = useEeConfig()

const { isFeatureEnabled } = useBetaFeatureToggle()

const isFilterDropdownOpen = ref(false)

const isSuperAdmin = computed(() => !!orgRoles.value?.[OrgUserRoles.SUPER_ADMIN])

const filterOptions = computed<AtListItemType[]>(() => {
  const result = [
    { value: 'all', label: t('activity.allBases'), icon: 'ncList' },
    ...(appInfo.value.ee
      ? [
          { value: 'starred', label: t('general.starred'), icon: 'star' },
          ...(showEEFeatures.value && !isEEFeatureBlocked.value
            ? [
                { value: 'private', label: t('general.private'), icon: 'ncLock' },
                ...(isFeatureEnabled(FEATURE_FLAG.MANAGED_APPS)
                  ? [{ value: 'managed', label: t('labels.managed'), icon: 'ncBox' }]
                  : []),
              ]
            : []),
        ]
      : []),
    ...(!isSuperAdmin.value ? [{ value: 'owned', label: t('activity.ownedByMe'), icon: 'ncUser' }] : []),
  ]

  // If there is only one filter option and it is the 'all' filter, return an empty array
  if (result.length === 1 && result[0]!.value === 'all') {
    return []
  }

  return result
})

const selectedFilter = computed(() => {
  return filterOptions.value.find((option) => option.value === props.activeFilter)
})

const activeFilterIcon = computed(() => {
  return selectedFilter.value?.icon || 'ncList'
})

const isFilterActive = computed(() => props.activeFilter !== 'all')

const onFilterChange = (value: string) => {
  emit('update:activeFilter', value as FilterType)
}

const clearFilter = () => {
  emit('update:activeFilter', 'all')
}
</script>

<template>
  <div class="atm-base-list-header flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <!-- Search Input (mobile only) -->
      <a-input
        v-if="['xs', 'sm'].includes(activeBreakpoint)"
        v-model:value="vSearchQuery"
        class="atm-bases-search atm-input-sm flex-1"
        :placeholder="$t('activity.searchProject')"
        allow-clear
      >
        <template #prefix>
          <GeneralIcon icon="search" class="text-atm-content-gray-muted" />
        </template>
      </a-input>

      <!-- Bases count (desktop only) -->
      <div class="hidden md:flex items-baseline flex-1 gap-1.5 min-w-0 truncate overflow-hidden">
        <slot name="label">
          <h2 class="text-subHeading1 text-atm-content-gray-extreme mb-0 truncate">
            {{ $t('objects.projects') }}
          </h2>
        </slot>
        <span class="flex-shrink-0 text-atm-content-gray-muted text-bodyDefaultSm">({{ baseCount }})</span>
      </div>

      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Active filter pill (desktop only) -->
        <div v-if="isFilterActive && !isMobileMode && filterOptions.length" class="atm-filter-pill" @click.stop>
          <GeneralIcon :icon="activeFilterIcon" class="w-3.5 h-3.5" />
          <span class="text-bodyDefaultSm font-medium">{{ selectedFilter?.label }}</span>
          <GeneralIcon icon="close" class="atm-filter-pill-close w-3.5 h-3.5 cursor-pointer" @click="clearFilter" />
        </div>

        <!-- Filter Dropdown -->
        <AtListDropdown
          v-if="(!isFilterActive || isMobileMode) && filterOptions.length"
          v-model:is-open="isFilterDropdownOpen"
          :default-slot-wrapper="false"
          placement="bottomRight"
        >
          <AtButton size="small" type="secondary">
            <div class="flex items-center gap-1">
              <GeneralIcon
                :icon="activeFilterIcon"
                class="w-4 h-4"
                :class="{ 'text-atm-content-brand': activeFilterIcon !== 'ncList' }"
              />
              <span class="text-bodyDefaultSm hidden sm:inline">{{ $t('activity.allBases') }}</span>
              <GeneralIcon
                icon="chevronDown"
                class="w-4 h-4 transition-transform"
                :class="{ 'transform rotate-180': isFilterDropdownOpen }"
              />
            </div>
          </AtButton>
          <template #overlay="{ onEsc }">
            <AtList
              v-model:open="isFilterDropdownOpen"
              :value="activeFilter"
              :list="filterOptions"
              variant="medium"
              class="!w-auto min-w-[190px]"
              wrapper-class-name="!h-auto"
              :min-items-for-search="10"
              @update:value="onFilterChange"
              @escape="onEsc"
            >
              <template #listItemExtraLeft="{ option }">
                <GeneralIcon :icon="option.icon" class="w-4 h-4 text-atm-content-gray-muted" />
              </template>
            </AtList>
          </template>
        </AtListDropdown>

        <WorkspaceCreateProjectBtn type="primary" placement="bottomRight" centered inner-class="children:justify-center">
          <div class="flex items-center gap-1.5">
            <GeneralIcon icon="plus" />
            <span class="hidden sm:inline">{{ $t('title.newProj') }}</span>
          </div>
        </WorkspaceCreateProjectBtn>
      </div>
    </div>

    <!-- Search indicator banner -->
    <div v-if="searchQuery && !isMobileMode" class="flex items-center gap-2 pb-1 text-body text-atm-content-gray-subtle">
      <GeneralIcon icon="search" class="w-3.5 h-3.5 flex-none" />
      <i18n-t keypath="title.showingResultsForSearch" tag="span" scope="global">
        <template #search>
          <strong>{{ searchQuery }}</strong>
        </template>
      </i18n-t>
      <AtTooltip class="flex">
        <template #title>{{ $t('activity.clearSearch') }}</template>
        <AtButton type="text" size="xxsmall" class="!rounded-md" icon-only @click="vSearchQuery = ''">
          <template #icon>
            <GeneralIcon icon="close" class="w-4 h-4" />
          </template>
        </AtButton>
      </AtTooltip>
    </div>
  </div>
</template>

<style scoped lang="scss">
.atm-filter-pill {
  @apply flex items-center gap-1.5 px-2 py-1 rounded-full
    bg-atm-bg-brand-soft text-atm-content-brand text-xs font-medium
    border-1 border-atm-border-brand;

  .atm-filter-pill-close {
    @apply rounded-full opacity-70 transition-opacity;

    &:hover {
      @apply opacity-100;
    }
  }
}
</style>
