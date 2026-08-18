<script lang="ts" setup>
interface ManagedAppType {
  id: string
  title: string
  description?: string
  category?: string
  version?: string
  install_count?: number
}

interface Props {
  workspaceId: string
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits(['update:visible', 'installed'])

const visible = useVModel(props, 'visible', emit)

const { $api } = useNuxtApp()
const { t } = useI18n()

const managedApps = ref<ManagedAppType[]>([])
const loading = ref(false)
const installing = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref<string | undefined>(undefined)

// Variable setup state
const isVariableSetupVisible = ref(false)
const setupVariables = ref<any[]>([])
const setupBaseId = ref('')
const setupBaseTitle = ref('')

const categories = computed(() => {
  const cats = new Set<string>()
  managedApps.value.forEach((ma) => {
    if (ma.category) {
      // Split comma-separated categories
      ma.category.split(',').forEach((cat) => {
        const trimmed = cat.trim()
        if (trimmed) cats.add(trimmed)
      })
    }
  })
  return Array.from(cats).sort()
})

const filteredManagedApps = computed(() => {
  let filtered = managedApps.value

  if (selectedCategory.value) {
    const selected = selectedCategory.value
    filtered = filtered.filter((ma) => {
      if (!ma.category) return false
      // Check if selected category exists in comma-separated list
      const categories = ma.category.split(',').map((c) => c.trim())
      return categories.includes(selected)
    })
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((ma) => searchCompare([ma.title, ma.description, ma.category], query))
  }

  return filtered
})

const loadManagedApps = async () => {
  if (!props.workspaceId) {
    console.error('WorkspaceId is required')
    return
  }

  if (typeof props.workspaceId !== 'string') {
    console.error('WorkspaceId must be a string, got:', typeof props.workspaceId, props.workspaceId)
    return
  }

  loading.value = true
  try {
    const response = await $api.internal.getOperation(props.workspaceId, NO_SCOPE, {
      operation: 'managedAppStoreList',
    })

    managedApps.value = response?.list || []
  } catch (e: any) {
    console.error('API error:', e)
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    loading.value = false
  }
}

const installManagedApp = async (managedApp: ManagedAppType) => {
  installing.value = managedApp.id
  try {
    const response = (await $api.internal.postOperation(
      props.workspaceId,
      NO_SCOPE,
      {
        operation: 'managedAppInstall',
      },
      {
        managedAppId: managedApp.id,
        target_workspace_id: props.workspaceId,
      },
    )) as any

    message.success(t('msg.success.baseInstalled'))
    emit('installed', managedApp)
    visible.value = false

    // If setup is required, show variable configuration modal
    if (response?.setupRequired && response?.setupVariables?.length) {
      setupVariables.value = response.setupVariables
      setupBaseId.value = response.installedBaseId
      setupBaseTitle.value = managedApp.title
      isVariableSetupVisible.value = true
    }
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    installing.value = null
  }
}

const formatInstallCount = (count: number | null | undefined): string => {
  const num = count || 0
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

watch(
  () => props.workspaceId,
  (newVal) => {
    if (newVal) {
      loadManagedApps()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="atm-app-market flex flex-col h-full">
    <!-- Header -->
    <div class="atm-app-market-header">
      <div class="flex items-center gap-3">
        <div class="atm-app-market-icon">
          <GeneralIcon icon="ncBox" class="h-5 w-5" />
        </div>
        <div class="flex-1">
          <div class="text-lg font-semibold text-atm-content-gray-emphasis">{{ t('title.appStore') }}</div>
          <div class="text-xs text-atm-content-gray-subtle2">Discover and install managed applications</div>
        </div>

        <AtButton size="small" type="text" @click="visible = false">
          <GeneralIcon icon="close" class="text-atm-content-gray-muted h-4 w-4" />
        </AtButton>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="atm-app-market-filters">
      <div class="flex gap-3">
        <a-input
          v-model:value="searchQuery"
          class="flex-1 atm-input-sm atm-input-shadow !rounded-lg"
          :placeholder="t('placeholder.searchByTitle')"
          allow-clear
        >
          <template #prefix>
            <GeneralIcon icon="search" class="h-4 w-4 text-atm-content-gray-muted" />
          </template>
        </a-input>

        <AtSelect
          v-model:value="selectedCategory"
          class="xs:max-w-30 md:w-48 atm-select-sm"
          :placeholder="t('labels.category')"
          allow-clear
        >
          <a-select-option v-for="cat in categories" :key="cat" :value="cat" class="items-center">
            {{ cat }}
          </a-select-option>
        </AtSelect>
      </div>

      <!-- Results count -->
      <div v-if="!loading && filteredManagedApps.length > 0" class="mt-3 text-xs text-atm-content-gray-muted">
        {{ filteredManagedApps.length }} {{ filteredManagedApps.length === 1 ? 'app' : 'apps' }} available
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto atm-scrollbar-thin">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3">
          <a-spin size="large" />
          <div class="text-sm text-atm-content-gray-muted">Loading applications...</div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredManagedApps.length === 0" class="atm-app-market-empty">
        <div class="atm-empty-icon">
          <GeneralIcon icon="ncBox" class="h-10 w-10 text-atm-content-gray-muted" />
        </div>
        <div class="text-base font-semibold text-atm-content-gray mb-2">No applications found</div>
        <div class="text-sm text-atm-content-gray-subtle text-center max-w-md">
          {{
            searchQuery || selectedCategory
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'No managed applications are available yet. Be the first to publish one!'
          }}
        </div>
      </div>

      <!-- App List -->
      <div v-else class="atm-app-market-list">
        <div v-for="managedApp in filteredManagedApps" :key="managedApp.id" class="atm-app-item">
          <div class="atm-app-item-content">
            <!-- App Icon & Info -->
            <div class="atm-app-info">
              <div class="atm-app-icon">
                <GeneralIcon icon="ncBox" />
              </div>
              <div class="atm-app-details">
                <div class="atm-app-title-row">
                  <h3 class="atm-app-title">{{ managedApp.title }}</h3>
                  <div v-if="managedApp.category" class="atm-app-categories">
                    <div
                      v-for="cat in managedApp.category
                        .split(',')
                        .map((c) => c.trim())
                        .filter(Boolean)"
                      :key="cat"
                      class="atm-app-category"
                    >
                      <GeneralIcon icon="ncHash" class="h-3 w-3" />
                      <span>{{ cat }}</span>
                    </div>
                  </div>
                </div>
                <p
                  class="atm-app-description"
                  :class="{
                    '!text-atm-content-gray-muted': !managedApp.description,
                  }"
                >
                  {{ managedApp.description || 'No description available' }}
                </p>
                <div class="atm-app-meta-row">
                  <div class="atm-app-meta">
                    <span class="atm-app-meta-item">
                      <GeneralIcon icon="download" class="h-3.5 w-3.5" />
                      <span class="font-medium">{{ formatInstallCount(managedApp.install_count || 0) }}</span>
                      <span class="text-atm-content-gray-muted">installs</span>
                    </span>
                    <span v-if="managedApp.version" class="atm-app-meta-item">
                      <GeneralIcon icon="gitCommit" class="h-3.5 w-3.5" />
                      <span>v{{ managedApp.version }}</span>
                    </span>
                  </div>

                  <!-- Install Button (inline on mobile) -->
                  <div class="atm-app-action md:hidden">
                    <AtButton
                      :loading="installing === managedApp.id"
                      :disabled="!!installing"
                      size="xs"
                      type="primary"
                      @click="installManagedApp(managedApp)"
                    >
                      <template #icon>
                        <GeneralIcon icon="download" class="h-3.5 w-3.5" />
                      </template>
                      {{ installing === managedApp.id ? 'Installing...' : t('general.install') }}
                    </AtButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Install Button (desktop) -->
            <div class="atm-app-action hidden md:block">
              <AtButton
                :loading="installing === managedApp.id"
                :disabled="!!installing"
                size="small"
                type="primary"
                @click="installManagedApp(managedApp)"
              >
                <template #icon>
                  <GeneralIcon icon="download" class="h-4 w-4" />
                </template>
                {{ installing === managedApp.id ? 'Installing...' : t('general.install') }}
              </AtButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DlgManagedAppVariableSetup
      v-if="isVariableSetupVisible"
      v-model:visible="isVariableSetupVisible"
      :variables="setupVariables"
      :base-id="setupBaseId"
      :base-title="setupBaseTitle"
      :workspace-id="props.workspaceId"
      @configured="isVariableSetupVisible = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.atm-app-market {
  @apply bg-atm-bg-gray-extralight;
}

.atm-app-market-header {
  @apply px-4 md:px-6 py-3 md:py-4 bg-atm-bg-default border-b-1 border-atm-border-gray-light;
}

.atm-app-market-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm;
  background: linear-gradient(135deg, var(--atm-content-brand) 0%, var(--atm-content-blue-medium) 100%);
  box-shadow: 0 2px 4px rgba(var(--atm-brand-accent-rgb), 0.15);
}

.atm-app-market-filters {
  @apply px-4 md:px-6 py-4 bg-atm-bg-default border-b-1 border-atm-border-gray-light;
}

.atm-app-market-empty {
  @apply flex flex-col items-center justify-center h-full p-8;
}

.atm-empty-icon {
  @apply w-20 h-20 rounded-full bg-atm-bg-gray-light flex items-center justify-center mb-4;
}

.atm-app-market-list {
  @apply p-4 md:p-6;
}

.atm-app-item {
  @apply bg-atm-bg-default border-1 border-atm-border-gray-medium rounded-xl mb-3 relative overflow-hidden;
  @apply transition-all duration-200 ease-in-out;

  &::before {
    @apply absolute left-0 top-0 bottom-0 w-1 bg-atm-content-brand opacity-0;
    @apply transition-opacity duration-200 ease-in-out;
    content: '';
  }

  &:hover {
    @apply border-atm-border-brand transform translate-x-0.5;
    box-shadow: 0 4px 12px rgba(var(--atm-brand-accent-rgb), 0.08);

    &::before {
      @apply opacity-100;
    }

    .atm-app-icon {
      @apply transform scale-105;
      box-shadow: 0 4px 8px rgba(var(--atm-brand-accent-rgb), 0.15);
    }
  }

  &:last-child {
    @apply mb-0;
  }
}

.atm-app-item-content {
  @apply flex items-center gap-4 px-4 py-3;
}

.atm-app-info {
  @apply flex gap-3 flex-1 min-w-0;
}

.atm-app-icon {
  @apply w-10 h-10 rounded-lg border-1 border-atm-border-gray-light flex items-center justify-center flex-shrink-0 text-atm-content-brand;
  @apply transition-all duration-200 ease-in-out;
  background: linear-gradient(135deg, var(--atm-bg-brand) 0%, var(--atm-bg-blue-light) 100%);

  :deep(svg) {
    @apply w-5 h-5;
  }
}

.atm-app-details {
  @apply flex-1 min-w-0;
}

.atm-app-title-row {
  @apply flex items-center gap-2 mb-1.5;
}

.atm-app-title {
  @apply text-base font-semibold text-atm-content-gray-emphasis m-0 truncate flex-shrink-0;
}

.atm-app-categories {
  @apply flex items-center gap-2 flex-wrap;
}

.atm-app-category {
  @apply inline-flex items-center gap-1 px-2.5 py-0.5 bg-atm-bg-gray-light border-1 border-atm-border-gray-light;
  @apply rounded-full text-xs text-atm-content-gray-subtle whitespace-nowrap flex-shrink-0;
}

.atm-app-description {
  @apply text-sm text-atm-content-gray-subtle m-0 mb-2 leading-normal line-clamp-2;
}

.atm-app-meta-row {
  @apply flex items-center justify-between gap-3;
}

.atm-app-meta {
  @apply flex items-center gap-4 text-xs text-atm-content-gray-subtle2;
}

.atm-app-meta-item {
  @apply flex items-center gap-1.5;
}

.atm-app-action {
  @apply flex-shrink-0;
}

// Responsive adjustments
@media (max-width: 819px) {
  .atm-app-title-row {
    @apply flex-wrap;
  }
}
</style>
