<script setup lang="ts">
import { type ColumnType, UITypes, UITypesName, isAIPromptCol, substituteColumnIdWithAliasInPrompt } from 'atmosphere-sdk'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue', 'navigateToIntegrations'])

const { appInfo } = useGlobal()

const { t } = useI18n()

const meta = inject(MetaInj)!

const workspaceStore = useWorkspace()
const { activeWorkspaceId } = storeToRefs(workspaceStore)

const { showEEFeatures } = useEeConfig()

const vModel = useVModel(props, 'modelValue', emit)

const availableFields = computed(() => {
  if (!meta.value?.columns) return []
  return meta.value.columns.filter(
    (c) =>
      c.title &&
      !c.system &&
      (!vModel.value?.id || c.id !== vModel.value.id) &&
      ![UITypes.Button, UITypes.ID].includes(c.uidt as UITypes),
  )
})

const {
  isEdit,
  setAdditionalValidations,
  column,
  formattedData,
  loadData,
  disableSubmitBtn,
  updateFieldName,
  isSyncedField,
  isPg,
  isXcdbBase,
} = useColumnCreateStoreOrThrow()

const { isAiBetaFeaturesEnabled, aiIntegrationAvailable, generateRows } = useAtmosphereAi()

const previewRow = ref<Row>({
  row: {},
  oldRow: {},
  rowMeta: { new: true },
})

const previewFieldTitle = ref(vModel.value.title || 'temp_title')

const generatingPreview = ref(false)

const isAlreadyGenerated = ref(false)

const isPreviewEnabled = computed(() => {
  const isFieldAddedInPromt = availableFields.value.some((f) => {
    return vModel.value.prompt_raw?.includes(`{${f.title}}`)
  })

  return isFieldAddedInPromt
})

const isEnabledGenerateText = computed({
  get: () => {
    return vModel.value.meta?.[LongTextAiMetaProp]
  },
  set: (value: boolean) => {
    vModel.value.meta[LongTextAiMetaProp] = value
    vModel.value.prompt_raw = ''
    previewRow.value.row = {}
    isAlreadyGenerated.value = false
    if (value) vModel.value.meta.smartMode = false
  },
})

const isPvColumn = computed(() => {
  if (!isEdit.value) return false

  return !!column.value?.pv
})

const loadViewData = async () => {
  if (!formattedData.value.length) {
    await loadData(undefined, false)
  }
}

const generate = async () => {
  generatingPreview.value = true

  await loadViewData()

  const pk = formattedData.value.length ? extractPkFromRow(unref(formattedData.value[0].row), meta.value?.columns || []) : ''

  if (!formattedData.value.length || !pk) {
    message.error(t('msg.error.includeSampleRecordToGenerate'))
    generatingPreview.value = false

    return
  }

  previewFieldTitle.value = vModel.value?.title || 'temp_title'

  const res = await generateRows(
    meta.value.id!,
    {
      title: previewFieldTitle.value,
      prompt_raw: vModel.value.prompt_raw,
      fk_integration_id: vModel.value.fk_integration_id,
      uidt: UITypes.LongText,
    },
    [pk],
  )

  if (res?.length && res[0]?.[previewFieldTitle.value]) {
    previewRow.value.row = {
      ...res[0],
      [previewFieldTitle.value]: {
        value: res[0]?.[previewFieldTitle.value],
      },
    }
    isAlreadyGenerated.value = true
  }

  generatingPreview.value = false
}

const isPromptEnabled = computed(() => {
  if (!showEEFeatures.value) return false

  if (isEdit.value) {
    return isAIPromptCol(column.value) || isAiBetaFeaturesEnabled.value
  }

  return isAiBetaFeaturesEnabled.value
})

onMounted(() => {
  // set default value
  vModel.value.prompt_raw =
    substituteColumnIdWithAliasInPrompt(
      (column.value?.colOptions as Record<string, any>)?.prompt ?? '',
      meta?.value?.columns as ColumnType[],
      (column.value?.colOptions as Record<string, any>)?.prompt_raw,
    ).substituted || ''
})

const validators = {
  fk_integration_id: [
    {
      validator: (_: any, value: any) => {
        return new Promise<void>((resolve, reject) => {
          if (isEnabledGenerateText.value && !value) {
            reject(new Error(t('title.aiIntegrationMissing')))
          }
          resolve()
        })
      },
    },
  ],
}

if (isEdit.value) {
  vModel.value.fk_integration_id = vModel.value?.colOptions?.fk_integration_id
}

setAdditionalValidations({
  ...validators,
})

provide(EditColumnInj, ref(true))

const richMode = computed({
  get: () => !!vModel.value.meta?.richMode,
  set: (value) => {
    if (!vModel.value.meta) vModel.value.meta = {}

    vModel.value.meta.richMode = value
    if (value) vModel.value.meta.smartMode = false
  },
})

const smartMode = computed({
  get: () => !!vModel.value.meta?.smartMode,
  set: (value) => {
    if (!vModel.value.meta) vModel.value.meta = {}

    vModel.value.meta.smartMode = value
    if (value) {
      vModel.value.meta.richMode = false
      vModel.value.meta[LongTextAiMetaProp] = false
    }
  },
})

// SmartText requires atm_row_meta — only available on internal PG sources.
const isSmartTextEligible = computed(() => isXcdbBase.value && isPg.value && appInfo.value.ee)

const smartTextDisableReason = computed(() => {
  // Gate only *enabling* SmartText on eligibility. An already-enabled column must
  // stay toggleable so it can be turned off where SmartText isn't available (e.g.
  // unlicensed on-prem) — otherwise the column is locked to SmartText with no way back.
  if (!isSmartTextEligible.value && !smartMode.value) return t('labels.smartText.disableReason.notInternalPg')
  if (richMode.value) return t('labels.smartText.disableReason.mutuallyExclusiveRichText')
  if (isEnabledGenerateText.value) return t('labels.smartText.disableReason.mutuallyExclusiveAi')
  if (isPvColumn.value && !smartMode.value)
    return t('tooltip.fieldCannotBeUsedAsDisplayValueField', { field: UITypesName.SmartText })
  return ''
})

const isSmartTextDisabled = computed(() => !!smartTextDisableReason.value)

const handleDisableSubmitBtn = () => {
  updateFieldName()

  if (!isEnabledGenerateText.value) {
    if (disableSubmitBtn.value) {
      disableSubmitBtn.value = false
    }

    return
  }

  if (isPreviewEnabled.value) {
    disableSubmitBtn.value = false
  } else {
    disableSubmitBtn.value = true
  }
}

watch(richMode, () => {
  vModel.value.cdf = null
})

watch(isPreviewEnabled, handleDisableSubmitBtn, {
  immediate: true,
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <a-form-item>
      <AtTooltip :disabled="!(isEnabledGenerateText || smartMode || (isPvColumn && !richMode))">
        <template #title>
          {{
            isPvColumn && !richMode
              ? $t('tooltip.fieldCannotBeUsedAsDisplayValueField', { field: UITypesName.RichText })
              : smartMode
              ? $t('labels.smartText.richTextDisabledWhenSmart')
              : $t('labels.smartText.richTextDisabledWhenAi')
          }}
        </template>
        <div class="flex items-center gap-1">
          <AtSwitch v-model:checked="richMode" :disabled="isEnabledGenerateText || smartMode || (isPvColumn && !richMode)">
            <div class="text-sm text-atm-content-gray select-none">
              {{ $t('labels.enableRichText') }}
            </div>
          </AtSwitch>
        </div>
      </AtTooltip>
    </a-form-item>

    <a-form-item v-if="isSmartTextEligible || smartMode">
      <AtTooltip :disabled="!isSmartTextDisabled">
        <template #title>{{ smartTextDisableReason }}</template>
        <div class="flex items-center gap-1">
          <AtSwitch v-model:checked="smartMode" :disabled="isSmartTextDisabled" data-testid="atm-long-text-smart-mode-toggle">
            <div class="text-sm text-atm-content-gray select-none">{{ $t('labels.enableSmartText') }}</div>
          </AtSwitch>
          <AtTooltip class="ml-1 flex cursor-pointer">
            <template #title>
              {{ $t('labels.smartText.description') }}
            </template>
            <GeneralIcon
              icon="info"
              class="text-atm-content-gray-muted hover:text-atm-content-gray-subtle opacity-70 w-3.5 h-3.5"
            />
          </AtTooltip>
        </div>
      </AtTooltip>
    </a-form-item>

    <div v-if="isPromptEnabled" class="relative">
      <a-form-item class="flex items-center">
        <AtTooltip :disabled="!(richMode || (isPvColumn && !isEnabledGenerateText) || isSyncedField)" class="flex items-center">
          <template #title>
            {{
              isSyncedField
                ? $t('msg.info.cannotGenerateInSyncedField')
                : isPvColumn && !isEnabledGenerateText
                ? $t('tooltip.fieldCannotBeUsedAsDisplayValueField', { field: UITypesName.AIPrompt })
                : $t('msg.info.generateTextNotSupportedWithRichText')
            }}</template
          >

          <AtSwitch
            v-model:checked="isEnabledGenerateText"
            :disabled="richMode || (isPvColumn && !isEnabledGenerateText) || isSyncedField"
            class="atm-ai-field-generate-text atm-ai-input"
            @change="handleDisableSubmitBtn"
          >
            <span
              class="text-sm font-semibold pl-1"
              :class="{
                'text-atm-content-purple-dark': isEnabledGenerateText,
                'text-atm-content-gray': !isEnabledGenerateText,
              }"
            >
              {{ $t('labels.generateTextUsingAi') }}
            </span>
          </AtSwitch>
        </AtTooltip>
        <AtTooltip class="ml-2 mr-[40px] flex cursor-pointer">
          <template #title> {{ $t('tooltip.useAiToGenerateContent') }} </template>
          <GeneralIcon icon="info" class="text-atm-content-gray-muted hover:text-atm-content-gray-subtle opacity-70 w-3.5 h-3.5" />
        </AtTooltip>
        <div class="flex-1"></div>

        <!-- Todo @rameshmane7218 remove hidden after enabling other integrations, hidden for now as we allow only atmosphereai -->
        <div
          class="absolute right-0"
          :class="{
            hidden: appInfo.env !== 'development' && appInfo.ee,
          }"
        >
          <AiSettings
            v-model:fk-integration-id="vModel.fk_integration_id"
            v-model:model="vModel.model"
            v-model:randomness="vModel.randomness"
            :workspace-id="activeWorkspaceId"
            :show-tooltip="false"
            :is-edit-column="isEdit"
            placement="bottomRight"
          >
            <AtButton size="xs" theme="ai" class="!px-1" type="text">
              <GeneralIcon icon="settings" />
            </AtButton>
          </AiSettings>
        </div>
      </a-form-item>
    </div>
    <template v-if="isPromptEnabled && (!isEdit ? aiIntegrationAvailable && isEnabledGenerateText : isEnabledGenerateText)">
      <a-form-item class="flex">
        <div class="atm-prompt-input-wrapper bg-atm-bg-gray-light rounded-lg w-full">
          <AiPromptWithFields
            v-model="vModel.prompt_raw"
            :options="availableFields"
            :read-only="!aiIntegrationAvailable"
            :placeholder="$t('placeholder.writeCustomAiPrompt')"
            prompt-field-tag-class-name="!text-atm-content-purple-dark font-weight-500"
            suggestion-icon-class-name="!text-atm-content-purple-medium"
          />
          <div class="rounded-b-lg flex items-center gap-1.5 p-1">
            <GeneralIcon icon="info" class="!text-atm-content-purple-medium w-3.5 h-3.5" />
            <i18n-t keypath="msg.info.mentionFieldsUsingCurlyBraces" tag="span" class="text-xs text-atm-content-gray-subtle2">
              <template #fieldName>
                <span class="text-atm-content-purple-dark">{Field name}</span>
              </template>
            </i18n-t>
          </div>
        </div>
      </a-form-item>
      <div v-if="aiIntegrationAvailable && isEnabledGenerateText" class="atm-ai-options-preview overflow-hidden">
        <div>
          <div
            class="flex items-center gap-2 transition-all duration-300"
            :class="{
              'pl-3 py-2 pr-2': !isAlreadyGenerated,
              'pl-3 py-1 pr-1 border-b-1 border-atm-border-gray-medium': isAlreadyGenerated,
            }"
          >
            <div class="flex flex-col flex-1 gap-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-atm-content-gray-subtle">{{ $t('labels.preview') }}</span>
                <AtTooltip class="flex cursor-pointer">
                  <template #title> {{ $t('tooltip.previewGeneratedFromFirstRecord') }}</template>
                  <GeneralIcon
                    icon="info"
                    class="text-atm-content-gray-muted hover:text-atm-content-gray-subtle opacity-70 w-3.5 h-3.5"
                  />
                </AtTooltip>
              </div>
              <span v-if="!isAlreadyGenerated" class="text-[11px] leading-[18px] text-atm-content-gray-muted">
                {{ $t('msg.info.includeAtLeastOneFieldInPrompt') }}
              </span>
            </div>

            <AtTooltip :disabled="isPreviewEnabled">
              <template #title> {{ $t('tooltip.includeFieldInPromptToGenerate') }} </template>
              <AtButton
                class="atm-aioptions-preview-generate-btn"
                :class="{
                  'atm-is-already-generated': isAlreadyGenerated,
                  'atm-preview-enabled': isPreviewEnabled,
                }"
                size="xs"
                :type="isAlreadyGenerated ? 'text' : 'secondary'"
                :theme="isPreviewEnabled ? 'ai' : 'default'"
                :disabled="!isPreviewEnabled"
                :loading="generatingPreview"
                @click.stop="generate"
              >
                <div
                  :class="{
                    'atm-animate-dots min-w-[91px] text-left': generatingPreview,
                    'min-w-[102px]': isAlreadyGenerated && generatingPreview,
                    'min-w-[80px]': !isAlreadyGenerated && generatingPreview,
                  }"
                >
                  {{
                    isAlreadyGenerated
                      ? generatingPreview
                        ? $t('general.regenerating')
                        : $t('general.regenerate')
                      : generatingPreview
                      ? $t('labels.generating')
                      : $t('labels.generatePreview')
                  }}
                </div>
              </AtButton>
            </AtTooltip>
          </div>
          <div v-if="previewRow.row?.[previewFieldTitle]?.value">
            <div class="relative">
              <LazySmartsheetRow :row="previewRow">
                <LazySmartsheetCell
                  :edit-enabled="true"
                  :model-value="previewRow.row[previewFieldTitle]"
                  :column="{ ...vModel, title: vModel.title || $t('labels.untitledAiText') }"
                  class="!border-none h-auto my-auto pl-1"
                />
              </LazySmartsheetRow>
            </div>
          </div>
        </div>
      </div>
    </template>

    <AiIntegrationNotFound v-if="!aiIntegrationAvailable && isEnabledGenerateText && isPromptEnabled" />
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-form-item-control-input-content) {
  @apply flex items-center;
}

.atm-prompt-input-wrapper {
  @apply border-1 border-atm-border-gray-medium;
  box-shadow: 0px 0px 4px 0px rgba(var(--rgb-base), 0.08);
}

.atm-ai-options-preview {
  @apply rounded-lg border-1 border-atm-border-gray-medium;
  box-shadow: 0px 0px 4px 0px rgba(var(--rgb-base), 0.08);

  :deep(.atm-text-area-expand-btn) {
    @apply right-1;
  }
}

.atm-aioptions-preview-generate-btn {
  &:not(.atm-is-already-generated) {
    &.atm-preview-enabled {
      @apply !border-transparent;
    }
  }
}
</style>
