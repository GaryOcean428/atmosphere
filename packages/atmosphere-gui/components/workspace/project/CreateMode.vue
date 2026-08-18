<script lang="ts" setup>
import AtCreateBasePlaceholder from '~icons/atm-icons/create-base-placeholder'
import AtCreateBaseWithAiPlaceholder from '~icons/atm-icons/create-base-with-ai-placeholder'

type CreateMode = 'scratch' | 'ai' | 'market' | null

interface Props {
  aiMode: boolean | null
  workspaceId?: string
}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits(['update:aiMode', 'update:mode', 'managedAppInstalled', 'close'])

const aiMode = useVModel(props, 'aiMode', emit)

const { isAiFeaturesEnabled } = useAtmosphereAi()

const { isFeatureEnabled } = useBetaFeatureToggle()

const showAppMarket = ref(false)

// Reset showAppMarket when aiMode changes back to null (dialog reopened)
watch(
  () => props.aiMode,
  (newVal) => {
    if (newVal === null) {
      showAppMarket.value = false
    }
  },
)

const selectMode = (mode: CreateMode) => {
  if (mode === 'ai') {
    aiMode.value = true
  } else if (mode === 'scratch') {
    aiMode.value = false
  } else if (mode === 'market') {
    if (!props.workspaceId) {
      console.error('Cannot open market without workspaceId')
      message.error('Workspace not available')
      return
    }
    showAppMarket.value = true
    return
  }
  emit('update:mode', mode)
}

const onManagedAppInstalled = (managedApp: any) => {
  showAppMarket.value = false
  emit('managedAppInstalled', managedApp)
}

const onAppMarketClose = () => {
  showAppMarket.value = false
  emit('close')
}

onMounted(() => {
  if (!isAiFeaturesEnabled.value) {
    aiMode.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="isAiFeaturesEnabled" class="atm-create-base-wrapper">
      <div v-e="['c:base:create:scratch']" class="atm-create-base" @click="selectMode('scratch')">
        <div class="atm-placeholder-icon-wrapper">
          <component :is="AtCreateBasePlaceholder" class="atm-placeholder-icon stroke-transparent" />
        </div>
        <div class="atm-create-base-content">
          <div class="atm-create-base-content-title">
            <GeneralIcon icon="plus" class="h-4 w-4 !text-atm-content-gray-subtle" />
            Start from scratch
          </div>
          <div class="atm-create-base-content-subtitle">Build your Base according to your specific requirements.</div>
        </div>
      </div>
      <div v-e="['c:base:ai:create']" class="atm-create-base-ai" @click="selectMode('ai')">
        <div class="atm-placeholder-icon-wrapper">
          <component :is="AtCreateBaseWithAiPlaceholder" class="atm-placeholder-icon stroke-transparent" />
        </div>
        <div class="atm-create-base-content">
          <div class="atm-create-base-content-title">
            <GeneralIcon icon="ncAutoAwesome" class="h-4 w-4 !text-atm-fill-purple-dark" />
            Build Base with AI
          </div>
          <div class="atm-create-base-content-subtitle">Quickly build your ideal Base with all tables, views and fields.</div>
        </div>
      </div>
      <div
        v-if="isFeatureEnabled(FEATURE_FLAG.MANAGED_APPS)"
        v-e="['c:base:market:create']"
        class="atm-create-base-market"
        @click="selectMode('market')"
      >
        <div class="atm-placeholder-icon-wrapper">
          <GeneralIcon icon="ncBox" class="atm-placeholder-icon !h-20 !w-20" />
        </div>
        <div class="atm-create-base-content">
          <div class="atm-create-base-content-title">
            <GeneralIcon icon="ncBox" class="h-4 w-4 !text-atm-content-gray-subtle" />
            Install from App Market
          </div>
          <div class="atm-create-base-content-subtitle">Browse and install pre-built Bases from the App Market.</div>
        </div>
      </div>
    </div>

    <WorkspaceProjectAppMarket
      v-if="showAppMarket && workspaceId"
      :workspace-id="workspaceId"
      @close="onAppMarketClose"
      @installed="onManagedAppInstalled"
    />
  </div>
</template>

<style lang="scss" scoped>
.atm-create-base-wrapper {
  @apply flex gap-4;

  & > div {
    @apply rounded-xl flex flex-col border-1 w-[288px] overflow-hidden cursor-pointer transition-all;

    .atm-placeholder-icon-wrapper {
      @apply border-b-1 h-[180px] flex items-center justify-center;

      .atm-placeholder-icon {
        @apply flex-none;
      }
    }

    &.atm-create-base {
      @apply border-atm-border-brand-medium;

      &:hover {
        box-shadow: 0px 12px 16px -4px rgba(var(--atm-brand-accent-rgb), 0.12),
          0px 4px 6px -2px rgba(var(--atm-brand-accent-rgb), 0.08);
      }

      .atm-placeholder-icon-wrapper {
        @apply border-atm-border-brand-medium bg-atm-bg-brand;
      }
    }

    &.atm-create-base-market {
      @apply border-atm-border-gray-medium;

      &:hover {
        box-shadow: 0px 12px 16px -4px rgba(107, 114, 128, 0.12), 0px 4px 6px -2px rgba(107, 114, 128, 0.08);
      }

      .atm-placeholder-icon-wrapper {
        @apply border-atm-border-gray-medium bg-atm-bg-gray-light;
      }
    }

    &.atm-create-base-ai {
      @apply border-atm-border-purple-medium;

      &:hover {
        box-shadow: 0px 12px 16px -4px rgba(125, 38, 205, 0.12), 0px 4px 6px -2px rgba(125, 38, 205, 0.08);
      }

      .atm-placeholder-icon-wrapper {
        @apply border-atm-border-purple-medium bg-atm-bg-purple-light;
      }
    }

    .atm-create-base-content {
      @apply px-4 py-3 flex flex-col gap-2;

      .atm-create-base-content-title {
        @apply flex items-center gap-2 text-base text-atm-content-gray font-bold;
      }

      .atm-create-base-content-subtitle {
        @apply text-small leading-[18px] text-atm-content-gray-muted;
      }
    }
  }
}
</style>
