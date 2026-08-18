<script lang="ts" setup>
import { PlanFeatureTypes } from 'atmosphere-sdk'

const route = useRoute()

const { resolvedProject } = storeToRefs(useBases())

const { open: openBaseTrash } = useBaseTrash()

const { isUIAllowed } = useRoles()

const { undo, redo, isUndoRedoInFlight, inFlightDirection, isDisabledByEnv } = useUndoRedo()

const visible = ref(false)

const { showEEFeatures } = useEeConfig()

const canSeeBaseTrash = computed(() => isUIAllowed('baseTrashList') && showEEFeatures.value)

const canSeeSnapshots = computed(() => isUIAllowed('manageSnapshot') && showEEFeatures.value)

const canSeeUndoRedo = computed(() => isUIAllowed('undo'))

const showHistoryTrigger = computed(() => canSeeBaseTrash.value || canSeeSnapshots.value || canSeeUndoRedo.value)

const cmdKey = renderCmdOrCtrlKey(true)

const shiftKey = isMac() ? '⇧' : 'Shift'

const undoRedoActions = [
  {
    direction: 'undo' as const,
    icon: 'ncUndo',
    labelKey: 'labels.undo',
    shortcut: `${cmdKey} Z`,
    handler: undo,
  },
  {
    direction: 'redo' as const,
    icon: 'ncRedo',
    labelKey: 'labels.redo',
    shortcut: `${cmdKey} ${shiftKey} Z`,
    handler: redo,
  },
]

function openSnapshots() {
  const baseId = resolvedProject.value?.id
  const wsId = route.params.typeOrId
  if (!baseId || !wsId) return
  visible.value = false
  navigateTo(`/${wsId}/${baseId}/settings/snapshots`)
}

function onTrashClick() {
  visible.value = false
  openBaseTrash()
}
</script>

<template>
  <AtDropdown
    v-if="showHistoryTrigger"
    v-model:visible="visible"
    placement="bottomRight"
    overlay-class-name="!min-w-55"
    :align="{ offset: [0, 6] }"
  >
    <AtTooltip placement="bottom" :disabled="visible">
      <template #title>{{ $t('labels.history') }}</template>
      <AtButton
        v-e="['c:topbar:history']"
        type="text"
        size="small"
        class="atm-topbar-history-btn"
        :class="{ '!bg-atm-bg-brand !text-atm-content-brand': visible }"
        data-testid="atm-topbar-history-btn"
      >
        <GeneralIcon icon="ncHistory" class="w-4 h-4 !stroke-transparent" />
      </AtButton>
    </AtTooltip>

    <template #overlay>
      <AtMenu variant="small">
        <AtMenuItemLabel>
          <span class="normal-case">
            {{ $t('labels.history') }}
          </span>
        </AtMenuItemLabel>

        <AtTooltip v-if="canSeeUndoRedo" placement="left" :disabled="!isDisabledByEnv">
          <template #title>{{ $t('labels.undoRedoDisabledByAdmin') }}</template>
          <AtMenuItem
            v-for="action in undoRedoActions"
            :key="action.direction"
            :data-testid="`atm-topbar-history-menu-${action.direction}`"
            inner-class="w-full"
            :disabled="isDisabledByEnv || isUndoRedoInFlight"
            @click="action.handler"
          >
            <div v-e="[`c:topbar:history-menu:${action.direction}`]" class="flex gap-2 items-center w-full">
              <GeneralLoader v-if="inFlightDirection === action.direction" class="h-4 w-4" />
              <GeneralIcon v-else :icon="action.icon" class="h-4 w-4 text-atm-content-gray-subtle2" />
              <div class="flex-1">{{ $t(action.labelKey) }}</div>
              <span class="atm-shortcut-hint">{{ action.shortcut }}</span>
            </div>
          </AtMenuItem>
        </AtTooltip>

        <PaymentUpgradeBadgeProvider v-if="canSeeSnapshots" :feature="PlanFeatureTypes.FEATURE_EE_CORE">
          <template #default="{ click }">
            <AtMenuItem
              data-testid="atm-topbar-history-menu-snapshots"
              inner-class="w-full"
              @click="click(PlanFeatureTypes.FEATURE_EE_CORE, isEeUI ? openSnapshots : undefined)"
            >
              <div v-e="['c:topbar:history-menu:snapshots']" class="flex gap-2 items-center w-full">
                <GeneralIcon icon="camera" class="h-4 w-4 text-atm-content-gray-subtle2" />
                <div class="flex-1">{{ $t('labels.snapshots') }}</div>
                <LazyPaymentUpgradeBadge :feature="PlanFeatureTypes.FEATURE_EE_CORE" show-as-lock />
              </div>
            </AtMenuItem>
          </template>
        </PaymentUpgradeBadgeProvider>

        <PaymentUpgradeBadgeProvider v-if="canSeeBaseTrash" :feature="PlanFeatureTypes.FEATURE_EE_CORE">
          <template #default="{ click }">
            <AtMenuItem
              data-testid="atm-topbar-history-menu-trash"
              inner-class="w-full"
              @click="click(PlanFeatureTypes.FEATURE_EE_CORE, isEeUI ? onTrashClick : undefined)"
            >
              <div v-e="['c:topbar:history-menu:trash']" class="flex gap-2 items-center w-full">
                <GeneralIcon icon="ncTrash2" class="h-4 w-4 text-atm-content-gray-subtle2" />
                <div class="flex-1">{{ $t('title.baseTrash') }}</div>
                <LazyPaymentUpgradeBadge :feature="PlanFeatureTypes.FEATURE_EE_CORE" show-as-lock />
              </div>
            </AtMenuItem>
          </template>
        </PaymentUpgradeBadgeProvider>
      </AtMenu>
    </template>
  </AtDropdown>
</template>

<style scoped lang="scss">
.atm-shortcut-hint {
  @apply text-atm-content-gray-muted text-bodySm tracking-wide;
}
</style>
