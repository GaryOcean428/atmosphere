<script lang="ts" setup>
import type { VNodeRef } from '@vue/runtime-core'
import { IntegrationCategoryType, PlanFeatureTypes } from 'atmosphere-sdk'
import AtModal from '~/components/nc/Modal.vue'

import { type IntegrationItemType, SyncDataType } from '#imports'

const props = withDefaults(
  defineProps<{
    isModal?: boolean
    filterCategory?: (c: IntegrationCategoryItemType) => boolean
    filterIntegration?: (i: IntegrationItemType) => boolean
    showFilter?: boolean
    showTitle?: boolean
    showActiveConnections?: boolean
  }>(),
  {
    isModal: false,
    filterCategory: () => true,
    filterIntegration: () => true,
    showFilter: false,
    showTitle: false,
    showActiveConnections: false,
  },
)

const emits = defineEmits<{
  (e: 'view-all-connections'): void
}>()

const { isModal, filterCategory, filterIntegration } = props

const { $e } = useNuxtApp()

const { t } = useI18n()

const { syncDataUpvotes, updateSyncDataUpvotes } = useGlobal()

const { isFeatureEnabled } = useBetaFeatureToggle()

const { activeWorkspace } = storeToRefs(useWorkspace())

const { isSyncFeatureEnabled } = storeToRefs(useSyncStore())

const { isEEFeatureBlocked, blockAiIntegrations, showUpgradeToUseAiIntegrations, showEEFeatures } = useEeConfig()

const easterEggToggle = computed(() => isFeatureEnabled(FEATURE_FLAG.INTEGRATIONS))

const router = useRouter()
const route = router.currentRoute

const {
  pageMode,
  IntegrationsPageMode,
  requestIntegration,
  addIntegration,
  saveIntegrationRequest,
  integrationsRefreshKey,
  integrations,
  isLoadedIntegrations,
  integrationPaginationData,
  integrationsCategoryFilter,
  activeViewTab,
  loadDynamicIntegrations,
  availableSyncAuthIntegrationSubtypes,
} = useIntegrationStore()

const focusTextArea: VNodeRef = (el) => el && el?.focus?.()

const showComingSoonIntegrations = ref(false)

const activeCategory = ref<IntegrationCategoryItemType | null>(null)

const searchQuery = ref<string>('')

const searchInputRef = ref<HTMLInputElement>()

const integrationListRef = ref<HTMLDivElement>()

const { width: integrationListContainerWidth } = useElementSize(integrationListRef)

const upvotesData = computed(() => {
  return new Set(syncDataUpvotes.value)
})

const integrationCategoriesRef = computed(() => {
  return integrationCategories
    .filter((c) => {
      if (isEEFeatureBlocked.value && c.value !== IntegrationCategoryType.DATABASE) return false

      if (!showComingSoonIntegrations.value && !c.isAvailable) return false

      const filterByActiveCategory = activeCategory.value ? c.value === activeCategory.value.value : true

      return filterCategory(c) && filterByActiveCategory && !c.value.endsWith('-coming-soon')
    })
    .map((c) => {
      return {
        label: t(c.title),
        value: c.value,
      }
    })
})

const isOpenFilter = ref(false)

const categoriesQuery = computed({
  get: () => {
    const availableCategories = integrationCategoriesRef.value.map((c) => c.value)

    if (route.value.query.categories === undefined) {
      return integrationsCategoryFilter.value
    }

    const query = ((route.value.query.categories as string) || '')
      .split(',')
      .map((c) => c.trim())
      .filter((c) => availableCategories.includes(c))

    integrationsCategoryFilter.value = query

    router.push({ query: { ...route.value.query, categories: undefined } })

    return integrationsCategoryFilter.value
  },
  set: (value: Array<string>) => {
    if (!ncIsArray(value)) return

    integrationsCategoryFilter.value = value
  },
})

const isDataReflectionEnabled = computed(() => {
  return isFeatureEnabled(FEATURE_FLAG.DATA_REFLECTION)
})

const getIntegrationsByCategory = (category: IntegrationCategoryType, query: string) => {
  return allIntegrations.filter((i) => {
    // OSS-only integrations (e.g. SQLite) are available only on free, self-hosted deployments
    // (CE + unlicensed On-Prem) — hidden on licensed On-Prem and Cloud. isEEFeatureBlocked is
    // true exactly for that free non-cloud case. Gate on it — NOT isEeUI — since the self-hosted
    // one-docker image is an EE build (isEeUI === true) regardless of license.
    const isOssOnlyAllowed = isEEFeatureBlocked.value || !i?.isOssOnly

    if (!isDataReflectionEnabled.value && i.sub_type === SyncDataType.ATMOSPHERE) return false

    if (i.hidden) return false

    // EE-only data sources (e.g. MSSQL, Oracle) are hidden in CE; in EE they're gated by their paid add-on.
    // EE-only sources (MSSQL, Oracle) are hidden in CE and in community mode.
    if (!showEEFeatures.value && i.isEeOnly) return false

    return (
      isOssOnlyAllowed &&
      filterIntegration(i) &&
      i.type === category &&
      t(i.title).toLowerCase().includes(query.trim().toLowerCase())
    )
  })
}

const integrationsMapByCategory = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  integrationsRefreshKey.value

  return integrationCategories
    .filter((c) => {
      if (isEEFeatureBlocked.value && c.value !== IntegrationCategoryType.DATABASE) return false

      if (!showComingSoonIntegrations.value && !c.isAvailable) return false

      const filterByActiveCategory = activeCategory.value ? c.value === activeCategory.value.value : true

      const filterByUrlQuery =
        categoriesQuery.value.includes(c.value) || categoriesQuery.value.some((q) => `${q}-coming-soon` === c.value)

      return filterCategory(c) && filterByActiveCategory && filterByUrlQuery
    })
    .reduce(
      (acc, curr) => {
        acc[curr.value] = {
          title: curr.title,
          subtitle: curr.subtitle,
          list: getIntegrationsByCategory(curr.value, searchQuery.value),
          isAvailable: curr.isAvailable,
          teleEventName: curr.teleEventName,
          value: curr.value,
        }

        return acc
      },
      {} as Record<
        string,
        {
          title: string
          subtitle?: string
          list: IntegrationItemType[]
          isAvailable?: boolean
          teleEventName?: IntegrationCategoryType
          value: IntegrationCategoryType
        }
      >,
    )
})

const hasIntegrationResults = computed(() => {
  const categories = Object.keys(integrationsMapByCategory.value)
  return categories.some((category) => integrationsMapByCategory.value[category]?.list?.length > 0)
})

const hasConnectionResults = computed(() => {
  if (!props.showActiveConnections || isModal || !integrations.value.length) return false

  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return integrations.value.length > 0

  return integrations.value.some((i) => i.title?.toLowerCase().includes(query))
})

const isEmptyList = computed(() => {
  // If active connections have results, don't show empty state
  if (hasConnectionResults.value) return false

  return !hasIntegrationResults.value
})

const isAddNewIntegrationModalOpen = computed({
  get: () => {
    return pageMode.value === IntegrationsPageMode.LIST
  },
  set: (value: boolean) => {
    if (!value) {
      pageMode.value = null
    }
  },
})

const handleUpvote = (category: IntegrationCategoryType, syncDataType: SyncDataType) => {
  if (upvotesData.value.has(syncDataType)) return

  $e(`a:integration-request:${integrationsMapByCategory.value[category]?.teleEventName || category}:${syncDataType}`)

  updateSyncDataUpvotes([...syncDataUpvotes.value, syncDataType])
}

const handleAddIntegration = async (category: IntegrationCategoryType, integration: IntegrationItemType) => {
  if (!integration.isAvailable) {
    handleUpvote(category, integration.sub_type)
    return
  }

  if (category === IntegrationCategoryType.AI && blockAiIntegrations.value) {
    showUpgradeToUseAiIntegrations({ triggerSource: 'integrations-ai-integrations' })
    return
  }

  await addIntegration(integration)
}

const isVisibleAllCategory = computed(() => {
  return integrationCategoriesRef.value.length === categoriesQuery.value.length
})

const toggleShowOrHideAllCategory = () => {
  if (isVisibleAllCategory.value) {
    categoriesQuery.value = []
  } else {
    categoriesQuery.value = integrationCategoriesRef.value.map((c) => c.value)
  }
}

const isIntegrationVisible = (integration: IntegrationItemType, category: any) => {
  if (!showComingSoonIntegrations.value && !integration.isAvailable) return false

  // AUTH category: always filter by available sync auth subtypes, even when easterEggToggle is on
  if (isSyncFeatureEnabled.value && category.value === IntegrationCategoryType.AUTH) {
    return availableSyncAuthIntegrationSubtypes.value.includes(integration.sub_type)
  }

  if (easterEggToggle.value) return true

  return !!integration.isAvailable
}

onMounted(() => {
  loadDynamicIntegrations()

  if (!integrationsCategoryFilter.value.length) {
    integrationsCategoryFilter.value = integrationCategoriesRef.value.map((c) => c.value)
  }
})

if (!isModal) {
  watch(searchInputRef, (el) => {
    if (el) {
      forcedNextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  })
}

const dataReflectionEnabled = computed(() => {
  return !!activeWorkspace.value?.data_reflection_enabled
})

watch(activeViewTab, (value) => {
  if (value !== 'integrations' && isOpenFilter.value) {
    isOpenFilter.value = false
  }
})
</script>

<template>
  <component
    :is="isModal ? AtModal : 'div'"
    v-model:visible="isAddNewIntegrationModalOpen"
    centered
    size="large"
    :class="{
      'h-full': !isModal,
    }"
    wrap-class-name="atm-modal-available-integrations-list"
    @keydown.esc="isAddNewIntegrationModalOpen = false"
  >
    <a-layout>
      <a-layout-content class="atm-integration-layout-content">
        <div v-if="isModal" class="p-4 w-full flex items-center justify-between gap-3 border-b-1 border-atm-border-gray-medium">
          <AtButton type="text" size="small" @click="isAddNewIntegrationModalOpen = false">
            <GeneralIcon icon="arrowLeft" />
          </AtButton>
          <GeneralIcon icon="gitCommit" class="flex-none h-5 w-5" />
          <div class="flex-1 text-base font-weight-700">{{ $t('labels.newConnection') }}</div>
          <div class="flex items-center gap-3">
            <AtButton size="small" type="text" @click="isAddNewIntegrationModalOpen = false">
              <GeneralIcon icon="close" class="text-atm-content-gray-subtle2" />
            </AtButton>
          </div>
        </div>
        <div
          class="w-full flex flex-col gap-6"
          :class="{
            'h-[calc(100%_-_66px)]': isModal,
            'h-full': !isModal,
          }"
        >
          <div v-if="integrationListContainerWidth" class="px-6 pt-4">
            <div
              class="flex justify-end flex-wrap gap-3 m-auto atm-content-max-w"
              :class="{
                'items-start': showTitle,
                'items-center': !showTitle,
              }"
            >
              <div class="flex-1">
                <h2 v-if="showTitle" class="text-lg font-semibold text-atm-content-gray mb-2">
                  {{ $t('general.integrations') }}
                </h2>

                <div class="text-sm font-normal text-atm-content-gray-subtle2">
                  <div>
                    {{ showActiveConnections ? $t('msg.manageConnectionsAndIntegrations') : $t('msg.connectIntegrations') }}
                    <a href="https://atmosphere.dev/docs/product-docs/integrations" target="_blank" rel="noopener noreferrer">{{
                      $t('msg.learnMore')
                    }}</a>
                  </div>
                </div>
              </div>
              <AtButton
                v-if="easterEggToggle"
                type="ghost"
                size="small"
                class="!text-atm-content-brand"
                @click="requestIntegration.isOpen = true"
              >
                Request Integration
              </AtButton>
            </div>
            <!-- Search + filter — full width, outside the header row -->
            <div class="flex items-center gap-2 atm-content-max-w m-auto !mt-4">
              <a-input
                ref="searchInputRef"
                v-model:value="searchQuery"
                type="text"
                class="flex-1 atm-input-border-on-value atm-search-integration-input !rounded-lg !py-2 !h-9"
                :placeholder="
                  showActiveConnections
                    ? $t('placeholder.searchConnectionsOrIntegrations')
                    : `${$t('general.search')} ${$t('general.integrations').toLowerCase()}...`
                "
                allow-clear
              >
                <template #prefix>
                  <GeneralIcon icon="search" class="mr-2 h-4 w-4 text-atm-content-gray-muted" />
                </template>
              </a-input>
              <AtDropdown v-if="easterEggToggle && showFilter" v-model:visible="isOpenFilter" placement="bottomRight">
                <AtButton size="medium" type="secondary" class="!px-1 !min-h-9 !min-w-9 !h-9 !w-9">
                  <div class="flex items-center gap-2">
                    <GeneralIcon icon="filter" />
                    <div
                      v-if="integrationCategoriesRef.length - categoriesQuery.length"
                      class="bg-atm-bg-brand text-atm-content-brand p-1 text-xs rounded-md min-w-6"
                    >
                      {{ integrationCategoriesRef.length - categoriesQuery.length }}
                    </div>
                  </div>
                </AtButton>

                <template #overlay>
                  <AtList
                    v-model:value="categoriesQuery"
                    v-model:open="isOpenFilter"
                    :list="integrationCategoriesRef"
                    search-input-placeholder="Search category"
                    :close-on-select="false"
                    is-multi-select
                    variant="medium"
                  >
                    <template #listFooter>
                      <AtDivider class="!mt-0 !mb-2" />
                      <div class="px-2 mb-2">
                        <div
                          class="px-2 py-1.5 flex items-center justify-between gap-2 text-sm font-weight-500 !text-atm-content-brand hover:bg-atm-bg-gray-light rounded-md cursor-pointer"
                          @click="toggleShowOrHideAllCategory"
                        >
                          <div class="flex items-center gap-2">
                            <GeneralIcon :icon="isVisibleAllCategory ? 'eyeSlash' : 'eye'" />
                            <div>
                              {{ isVisibleAllCategory ? $t('general.hideAll') : $t('general.showAll') }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </template></AtList
                  >
                </template>
              </AtDropdown>
            </div>
          </div>

          <div
            ref="integrationListRef"
            class="flex-1 px-6 pb-8 flex flex-col atm-workspace-settings-integrations-list overflow-y-auto atm-scrollbar-thin"
          >
            <div
              v-if="integrationListContainerWidth"
              class="w-full flex justify-center"
              :class="{
                'flex-1': isEmptyList,
              }"
            >
              <div class="flex flex-col space-y-6 w-full atm-content-max-w">
                <!-- Full-page skeleton during initial load (non-modal only) -->
                <WorkspaceIntegrationsSkeleton v-if="showActiveConnections && !isModal && !isLoadedIntegrations" />

                <!-- Real content (shown after load or in modal mode) -->
                <template v-else>
                  <!-- Active connections section (shown as first section when not modal) -->
                  <WorkspaceIntegrationsActiveConnectionsSection
                    v-if="showActiveConnections && !isModal && isLoadedIntegrations && integrations.length"
                    :connections="integrations"
                    :total-count="integrationPaginationData.totalRows || 0"
                    :search-query="searchQuery"
                    show-divider
                    @view-all="emits('view-all-connections')"
                  />

                  <template v-for="(category, key) in integrationsMapByCategory">
                    <div
                      v-if="
                        (easterEggToggle ||
                          category.value === IntegrationCategoryType.DATABASE ||
                          (isSyncFeatureEnabled && category.value === IntegrationCategoryType.AUTH)) &&
                        category.list.length
                      "
                      :key="key"
                      class="integration-type-wrapper"
                      style="container-type: inline-size"
                    >
                      <div class="category-type-title flex gap-2">
                        {{ $t(category.title) }}
                        <LazyPaymentUpgradeBadge
                          v-if="category.value === IntegrationCategoryType.AI && blockAiIntegrations"
                          :feature="PlanFeatureTypes.FEATURE_AI_INTEGRATIONS"
                          :feature-enabled-callback="() => !blockAiIntegrations"
                          remove-click
                        />
                        <AtBadge
                          v-else-if="!category.isAvailable"
                          :border="false"
                          class="text-atm-content-brand !h-5 bg-atm-bg-brand text-xs font-normal px-2"
                          >{{ $t('msg.toast.futureRelease') }}</AtBadge
                        >
                      </div>
                      <div v-if="category.list.length" class="integration-type-list grid grid-cols-1 gap-3">
                        <template v-for="integration of category.list" :key="integration.sub_type">
                          <AtTooltip
                            v-if="isIntegrationVisible(integration, category)"
                            :disabled="integration?.isAvailable"
                            placement="bottom"
                          >
                            <template #title>{{ $t('tooltip.comingSoonIntegration') }}</template>

                            <div
                              :tabindex="0"
                              class="source-card focus-visible:outline-none outline-none h-full"
                              :class="{
                                'is-available': integration?.isAvailable,
                              }"
                              @click="handleAddIntegration(key, integration)"
                            >
                              <div class="integration-icon-wrapper">
                                <component :is="integration.icon" class="integration-icon" :style="integration.iconStyle" />
                              </div>
                              <div class="flex-1">
                                <div class="name">{{ $t(integration.title) }}</div>
                                <div v-if="integration.subtitle" class="subtitle flex-1">{{ $t(integration.subtitle) }}</div>
                              </div>
                              <div v-if="!isDataReflectionEnabled && integration?.sub_type === SyncDataType.ATMOSPHERE"></div>
                              <div v-else-if="integration?.sub_type === SyncDataType.ATMOSPHERE" class="flex items-center">
                                <AtButton
                                  v-if="dataReflectionEnabled"
                                  type="secondary"
                                  size="xs"
                                  class="integration-upvote-btn !rounded-lg !px-1 !py-0 selected"
                                >
                                  <div class="flex items-center gap-2">
                                    <GeneralIcon icon="ncCheck" class="text-primary flex-none" />
                                  </div>
                                </AtButton>
                                <AtButton v-else type="secondary" size="xs" class="action-btn !rounded-lg !px-1 !py-0">
                                  <div class="flex items-center gap-2">
                                    <GeneralIcon icon="ncPlus" class="flex-none" />
                                  </div>
                                </AtButton>
                              </div>

                              <AtButton
                                v-else-if="integration?.isAvailable"
                                type="secondary"
                                size="xs"
                                class="action-btn !rounded-lg !px-1 !py-0"
                              >
                                <div class="flex items-center gap-2">
                                  <GeneralIcon icon="ncPlus" class="flex-none" />
                                </div>
                              </AtButton>
                              <div v-else class="">
                                <AtButton
                                  type="secondary"
                                  size="xs"
                                  class="integration-upvote-btn !rounded-lg !px-1 !py-0"
                                  :class="{
                                    selected: upvotesData.has(integration.sub_type),
                                  }"
                                >
                                  <div class="flex items-center gap-2">
                                    <GeneralIcon icon="ncArrowUp" />
                                  </div>
                                </AtButton>
                              </div>
                            </div>
                          </AtTooltip>
                        </template>
                      </div>
                    </div>
                  </template>

                  <div v-if="isEmptyList" class="h-full text-center flex items-center justify-center gap-3">
                    <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE" :description="$t('labels.noData')" class="!my-0" />
                  </div>
                </template>
              </div>
            </div>
            <div v-else class="h-full flex items-center justify-center"><GeneralLoader size="xlarge" /></div>
          </div>
        </div>
        <AtModal
          v-model:visible="requestIntegration.isOpen"
          centered
          size="medium"
          @keydown.esc="requestIntegration.isOpen = false"
        >
          <div v-show="requestIntegration.isOpen" class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-4">
              <div class="text-base font-bold text-atm-content-gray">Request Integration</div>
              <AtButton size="small" type="text" @click="requestIntegration.isOpen = false">
                <GeneralIcon icon="close" class="text-atm-content-gray-subtle2" />
              </AtButton>
            </div>
            <div class="flex flex-col gap-2">
              <a-textarea
                :ref="focusTextArea"
                v-model:value="requestIntegration.msg"
                class="!rounded-md !text-sm !min-h-[120px] max-h-[500px] atm-scrollbar-thin"
                size="large"
                hide-details
                placeholder="Provide integration name and your use-case."
              />
            </div>
            <div class="flex items-center justify-end gap-3">
              <AtButton size="small" type="secondary" @click="requestIntegration.isOpen = false">
                {{ $t('general.cancel') }}
              </AtButton>
              <AtButton
                :disabled="!requestIntegration.msg?.trim()"
                :loading="requestIntegration.isLoading"
                size="small"
                @click="saveIntegrationRequest(requestIntegration.msg)"
              >
                {{ $t('general.submit') }}
              </AtButton>
            </div>
          </div>
        </AtModal>
      </a-layout-content>
    </a-layout>
  </component>
</template>

<style lang="scss" scoped>
.atm-integration-layout-sidebar {
  @apply !bg-atm-bg-default border-r-1 border-atm-border-gray-medium !min-w-[260px] !max-w-[260px];

  flex: 1 1 260px !important;

  .atm-integration-category-item {
    @apply flex gap-2 p-2 rounded-lg hover:bg-atm-bg-gray-light cursor-pointer transition-all;

    &.active {
      @apply bg-atm-bg-gray-light;
    }

    .atm-integration-category-item-icon-wrapper {
      @apply flex-none w-5 h-5 flex items-center justify-center rounded;

      .atm-integration-category-item-icon {
        @apply flex-none w-4 h-4;
      }
    }

    .atm-integration-category-item-content-wrapper {
      @apply flex-1 flex flex-col gap-1;

      .atm-integration-category-item-title {
        @apply text-sm text-atm-content-gray font-weight-500;
      }

      .atm-integration-category-item-subtitle {
        @apply text-xs text-atm-content-gray-muted font-weight-500;
      }
    }
  }
}

.source-card-request-integration {
  @apply flex flex-col gap-4 border-1 rounded-xl p-3 w-[280px] overflow-hidden transition-all duration-300 max-w-[576px];

  &.active {
    @apply w-full;
  }
  &:not(.active) {
    @apply cursor-pointer hover:bg-atm-bg-gray-extralight;

    &:hover {
      box-shadow: 0px 4px 8px -2px rgba(var(--rgb-base), 0.08), 0px 2px 4px -2px rgba(var(--rgb-base), 0.04);
    }
  }

  .source-card-item {
    @apply flex items-center gap-4;

    .name {
      @apply text-base font-semibold text-atm-content-gray;
    }
  }
}
.source-card-link {
  @apply !text-atm-content-gray-extreme !no-underline;
  .atm-new-integration-type-title {
    @apply text-sm font-weight-600 text-atm-content-gray-subtle2;
  }
}

.atm-workspace-settings-integrations-list {
  .integration-type-wrapper {
    @apply flex flex-col gap-3;

    .integration-type-list {
      @supports not (container-type: inline-size) {
        @media (min-width: 540px) {
          @apply grid-cols-2;
        }

        @media (min-width: 1024px) {
          @apply grid-cols-3;
        }

        @media (min-width: 1440px) {
          @apply grid-cols-4;
        }
      }

      @container (min-width: 540px) {
        @apply grid-cols-2;
      }

      @container (min-width: 820px) {
        @apply grid-cols-3;
      }

      @container (min-width: 1140px) {
        @apply grid-cols-4;
      }

      .source-card {
        @apply flex items-center gap-4 border-1 border-atm-border-gray-medium rounded-xl p-3 cursor-pointer transition-all duration-300;

        .integration-icon-wrapper {
          @apply flex-none h-[44px] w-[44px] rounded-lg flex items-center justify-center;

          .integration-icon {
            @apply flex-none stroke-transparent;
          }
        }

        .name {
          @apply text-base font-bold;
        }

        .action-btn {
          @apply hidden;
        }

        &.is-available {
          &:hover {
            @apply bg-atm-bg-gray-extralight;

            box-shadow: 0px 4px 8px -2px rgba(var(--rgb-base), 0.08), 0px 2px 4px -2px rgba(var(--rgb-base), 0.04);

            .action-btn {
              @apply inline-block;
            }
          }

          // .integration-icon-wrapper {
          //   @apply bg-atm-bg-gray-light;
          // }
          .name {
            @apply text-atm-content-gray;
          }
        }
        &:not(.is-available) {
          &:not(:hover) {
            .integration-icon-wrapper {
              // @apply bg-atm-bg-gray-extralight;

              // .integration-icon {
              //   @apply !grayscale;

              //   filter: grayscale(100%) brightness(115%);
              // }
            }

            .name {
              @apply text-atm-content-gray;
            }
          }

          &:hover {
            .name {
              @apply text-atm-content-gray;
            }
          }

          .integration-upvote-btn {
            &.selected {
              @apply shadow-selected !text-atm-content-brand !border-atm-border-brand !cursor-not-allowed pointer-events-none;
            }
          }
        }
      }
    }

    .category-type-title {
      @apply text-sm text-atm-content-gray-subtle font-weight-700;
    }
  }
}
</style>

<style lang="scss">
.atm-modal-available-integrations-list {
  .atm-modal {
    @apply !p-0;
    height: min(calc(100vh - 100px), 1024px);
    max-height: min(calc(100vh - 100px), 1024px) !important;
  }
  .ant-modal-content {
    overflow: hidden;
  }
}
</style>
