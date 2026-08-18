<script lang="ts" setup>
import { IntegrationCategoryType, SyncDataType } from '#imports'

const props = defineProps<{ loadDatasourceInfo?: boolean; baseId?: string }>()

const { loadDatasourceInfo, baseId } = toRefs(props)

const { pageMode, IntegrationsPageMode, integrationType, activeIntegrationItem, activeIntegration } = useIntegrationStore()

const isEditOrAddIntegrationModalOpen = computed({
  get: () => {
    return pageMode.value === IntegrationsPageMode.ADD || pageMode.value === IntegrationsPageMode.EDIT
  },
  set: (value: boolean) => {
    if (!value) {
      pageMode.value = null
    }
  },
})

const activeIntegrationSubType = computed(() => {
  return pageMode.value === IntegrationsPageMode.EDIT
    ? activeIntegration.value?.sub_type || activeIntegration.value?.config?.client
    : activeIntegration.value?.type
})

const activeIntegrationType = computed(() => {
  switch (activeIntegrationSubType.value) {
    case integrationType.PostgreSQL:
      return IntegrationCategoryType.DATABASE
    case integrationType.MySQL:
      return IntegrationCategoryType.DATABASE
    case integrationType.SQLITE:
      return IntegrationCategoryType.DATABASE
    default: {
      return activeIntegrationItem.value?.type
    }
  }
})
</script>

<template>
  <AtModal
    v-model:visible="isEditOrAddIntegrationModalOpen"
    size="large"
    wrap-class-name="atm-modal-edit-or-add-integration"
    @keydown.esc="isEditOrAddIntegrationModalOpen = false"
  >
    <div
      v-if="activeIntegrationType === IntegrationCategoryType.DATABASE && activeIntegration?.sub_type !== SyncDataType.ATMOSPHERE"
      class="h-full"
    >
      <WorkspaceIntegrationsFormsEditOrAddDatabase
        v-model:open="isEditOrAddIntegrationModalOpen"
        :connection-type="activeIntegrationSubType"
        :load-datasource-info="loadDatasourceInfo"
        :base-id="baseId"
      />
    </div>
    <div v-else class="h-full">
      <WorkspaceIntegrationsFormsEditOrAddCommon
        v-model:open="isEditOrAddIntegrationModalOpen"
        :integration-type="activeIntegrationItem?.type"
        :integration-sub-type="activeIntegrationItem?.sub_type"
        :load-datasource-info="loadDatasourceInfo"
        :base-id="baseId"
      />
    </div>
  </AtModal>
</template>

<style lang="scss" scoped></style>

<style lang="scss">
.atm-modal-edit-or-add-integration {
  .atm-modal {
    @apply !p-0;
    height: min(calc(100vh - 100px), 1024px);
    max-height: min(calc(100vh - 100px), 1024px) !important;

    .atm-edit-or-add-integration-left-panel {
      @apply w-full p-6 flex-1 flex justify-center;
    }
    .atm-edit-or-add-integration-right-panel {
      @apply p-5 w-[320px] border-l-1 border-atm-border-gray-medium flex flex-col gap-4 bg-atm-bg-gray-extralight rounded-br-2xl;
    }
  }
}
</style>
