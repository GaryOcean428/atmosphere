<script setup lang="ts">
import { integrationCategoryNeedDefault } from 'atmosphere-sdk'
import type { IntegrationType } from 'atmosphere-sdk'

interface Props {
  integration: IntegrationType
  /** 'workspace' = full actions (default), 'base' = edit + unlink only */
  mode?: 'workspace' | 'base'
  canEdit?: boolean
  canUnlink?: boolean
  baseId?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'workspace',
  canEdit: true,
  canUnlink: false,
})

const emits = defineEmits<{
  (e: 'delete', integration: IntegrationType): void
  (e: 'base-assignment', integration: IntegrationType): void
  (e: 'unlink', integrationId: string): void
}>()

const { t } = useI18n()

const { isFeatureEnabled } = useBetaFeatureToggle()

const { editIntegration, duplicateIntegration, setDefaultIntegration } = useIntegrationStore()

const openEditIntegration = (integration: IntegrationType) => {
  if (!isFeatureEnabled(FEATURE_FLAG.DATA_REFLECTION) && integration.sub_type === SyncDataType.ATMOSPHERE) {
    return
  }

  if (props.mode === 'base') {
    editIntegration(integration, true, props.baseId)
  } else {
    editIntegration(integration)
  }
}
</script>

<template>
  <AtDropdown placement="bottomRight">
    <slot>
      <AtButton size="small" type="secondary" @click.stop>
        <GeneralIcon icon="threeDotVertical" />
      </AtButton>
    </slot>
    <template #overlay>
      <AtMenu variant="small">
        <!-- Workspace mode: full actions -->
        <template v-if="mode === 'workspace'">
          <AtMenuItem
            v-if="
              props.integration.type && integrationCategoryNeedDefault(props.integration.type) && !props.integration.is_default
            "
            v-e="['c:integration:set-default']"
            @click="setDefaultIntegration(props.integration)"
          >
            <GeneralIcon class="text-current opacity-80" icon="star" />
            <span>{{ t('general.setAsDefault') }}</span>
          </AtMenuItem>
          <AtMenuItem
            v-if="props.integration?.sub_type !== SyncDataType.ATMOSPHERE"
            @click="emits('base-assignment', props.integration)"
          >
            <GeneralIcon class="text-current opacity-80" icon="ncDatabase" />
            <span>{{ t('labels.manageBaseAccess') }}</span>
          </AtMenuItem>
          <AtMenuItem
            v-e="['c:integration:edit']"
            :disabled="!isFeatureEnabled(FEATURE_FLAG.DATA_REFLECTION) && props.integration.sub_type === SyncDataType.ATMOSPHERE"
            @click="openEditIntegration(props.integration)"
          >
            <GeneralIcon class="text-current opacity-80" icon="edit" />
            <span>{{ t('general.edit') }}</span>
          </AtMenuItem>
          <AtTooltip :disabled="props.integration?.sub_type !== ClientType.SQLITE">
            <template #title>
              {{ t('msg.notAllowedForType') }}
              {{
                props.integration.sub_type && clientTypesMap[props.integration.sub_type]
                  ? clientTypesMap[props.integration.sub_type]?.text
                  : props.integration.sub_type
              }}
            </template>

            <AtMenuItem
              v-e="['c:integration:duplicate']"
              :disabled="props.integration?.sub_type === ClientType.SQLITE || props.integration?.sub_type === SyncDataType.ATMOSPHERE"
              @click="duplicateIntegration(props.integration)"
            >
              <GeneralIcon class="text-current opacity-80" icon="duplicate" />
              <span>{{ t('general.duplicate') }}</span>
            </AtMenuItem>
          </AtTooltip>
          <template v-if="props.integration?.sub_type !== SyncDataType.ATMOSPHERE">
            <AtDivider />
            <AtMenuItem v-e="['c:integration:delete']" danger @click="emits('delete', props.integration)">
              <GeneralIcon icon="delete" />
              {{ t('general.delete') }}
            </AtMenuItem>
          </template>
        </template>

        <!-- Base mode: edit + unlink -->
        <template v-else>
          <AtMenuItem v-if="canEdit" @click="openEditIntegration(props.integration)">
            <GeneralIcon class="text-current opacity-80" icon="edit" />
            <span>{{ t('general.edit') }}</span>
          </AtMenuItem>
          <template v-if="canUnlink">
            <AtDivider v-if="canEdit" />
            <AtMenuItem class="!text-atm-content-red-dark" @click="emits('unlink', props.integration.id!)">
              <GeneralIcon class="text-current" icon="linkRemove" />
              <span>{{ t('general.unlink') }}</span>
            </AtMenuItem>
          </template>
        </template>
      </AtMenu>
    </template>
  </AtDropdown>
</template>
