<script setup lang="ts">
import { PlanLimitTypes, PlanTitles } from 'atmosphere-sdk'

interface Props {
  isFullscreen?: boolean
}

defineProps<Props>()

const emits = defineEmits(['rename', 'duplicate', 'showDetails', 'clearData', 'delete'])

const { activeError, extension } = useExtensionHelperOrThrow()

const { extensionAccess } = useExtensions()

const { showEEFeatures, blockExtensions, blockAddNewExtension, handleUpgradePlan } = useEeConfig()

const { t } = useI18n()

const isDuplicateBlocked = computed(() => blockExtensions.value || blockAddNewExtension.value)

const onDuplicate = () => {
  if (isDuplicateBlocked.value) {
    handleUpgradePlan({
      content: t('upgrade.upgradeToAddMoreExtensions'),
      limitOrFeature: PlanLimitTypes.LIMIT_EXTENSION_PER_WORKSPACE,
      newPlanTitle: PlanTitles.PLUS,
      triggerSource: 'extensions-duplicate',
    })
    return
  }
  emits('duplicate')
}
</script>

<template>
  <div class="flex items-center" @click.stop>
    <AtDropdown :trigger="['click']" placement="bottomRight">
      <AtButton type="text" :size="isFullscreen ? 'small' : 'xs'" class="!px-1">
        <GeneralIcon icon="threeDotVertical" />
      </AtButton>

      <template #overlay>
        <AtMenu variant="small">
          <AtMenuItemCopyId
            :id="extension.id!"
            data-testid="atm-extension-item-action-copy-id"
            :tooltip="$t('labels.clickToCopyExtensionID')"
            :label="
              $t('labels.extensionIdColon', {
                extensionId: extension.id,
              })
            "
          />
          <AtDivider v-if="extensionAccess.create || extensionAccess.update || extensionAccess.delete" />
          <template v-if="!activeError">
            <AtMenuItem v-if="extensionAccess.create" data-rec="true" @click="emits('rename')">
              <GeneralIcon icon="edit" />
              {{ $t('general.rename') }}
            </AtMenuItem>

            <AtMenuItem
              v-if="extensionAccess.create && showEEFeatures"
              data-rec="true"
              class="group"
              inner-class="w-full"
              @click="onDuplicate"
            >
              <GeneralIcon icon="duplicate" />

              <div class="flex-1">{{ $t('general.duplicate') }}</div>

              <LazyPaymentUpgradeBadge
                :plan-title="PlanTitles.PLUS"
                :limit-or-feature="PlanLimitTypes.LIMIT_EXTENSION_PER_WORKSPACE"
                :feature-enabled-callback="() => !isDuplicateBlocked"
                :content="$t('upgrade.upgradeToAddMoreExtensions')"
                remove-click
              />
            </AtMenuItem>

            <AtMenuItem data-rec="true" @click="emits('showDetails')">
              <GeneralIcon icon="info" />
              {{ $t('general.details') }}
            </AtMenuItem>

            <AtDivider v-if="extensionAccess.update || extensionAccess.delete" />
          </template>
          <AtMenuItem v-if="extensionAccess.update" data-rec="true" danger @click="emits('clearData')">
            <GeneralIcon icon="reload" />
            Clear data
          </AtMenuItem>
          <AtMenuItem v-if="extensionAccess.delete" data-rec="true" danger @click="emits('delete')">
            <GeneralIcon icon="delete" />
            {{ $t('general.delete') }}
          </AtMenuItem>
        </AtMenu>
      </template>
    </AtDropdown>
  </div>
</template>
