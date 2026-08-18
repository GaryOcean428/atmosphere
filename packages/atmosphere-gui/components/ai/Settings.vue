<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    fkIntegrationId?: string
    model?: string
    randomness?: string
    workspaceId: string
    scope?: string
    showTooltip?: boolean
    isEditColumn?: boolean
  }>(),
  {
    showTooltip: true,
    isEditColumn: false,
  },
)

const emits = defineEmits(['update:fkIntegrationId', 'update:model', 'update:randomness'])

const vFkIntegrationId = useVModel(props, 'fkIntegrationId', emits)

const vModel = useVModel(props, 'model', emits)

const { isEditColumn } = toRefs(props)

// const vRandomness = useVModel(props, 'randomness', emits)

const { $api } = useNuxtApp()

const { aiIntegrations } = useAtmosphereAi()

const lastIntegrationId = ref<string | null>(null)

const isDropdownOpen = ref(false)

const availableModels = ref<{ value: string; label: string }[]>([])

const isLoadingAvailableModels = ref<boolean>(false)

const isGlobalIntegration = computed(() => !!vFkIntegrationId.value?.startsWith('global_'))

const onIntegrationChange = async (newFkINtegrationId?: string) => {
  if (!vFkIntegrationId.value && !newFkINtegrationId) return

  if (!newFkINtegrationId) {
    newFkINtegrationId = vFkIntegrationId.value
  }

  availableModels.value = []

  if (lastIntegrationId.value !== newFkINtegrationId) {
    vModel.value = undefined
  }

  if (newFkINtegrationId?.startsWith('global_')) {
    vModel.value = undefined
    return
  }

  isLoadingAvailableModels.value = true

  try {
    const response = await $api.integrations.endpoint(newFkINtegrationId, 'availableModels', {})
    availableModels.value = (response || []) as { value: string; label: string }[]

    if (!vModel.value && availableModels.value.length > 0) {
      vModel.value = availableModels.value[0].value
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingAvailableModels.value = false
  }
}

onMounted(async () => {
  if (!vFkIntegrationId.value && !isEditColumn.value) {
    if (aiIntegrations.value.length > 0 && aiIntegrations.value[0].id) {
      vFkIntegrationId.value = aiIntegrations.value[0].id
      nextTick(() => {
        onIntegrationChange()
      })
    }
  } else if (vFkIntegrationId.value) {
    lastIntegrationId.value = vFkIntegrationId.value

    if (!vModel.value || !availableModels.value.length) {
      onIntegrationChange()
    }
  }
})
</script>

<template>
  <AtDropdown v-model:visible="isDropdownOpen" :trigger="['click']" placement="bottomRight" overlay-class-name="overflow-hidden">
    <slot>
      <GeneralIcon icon="ncSettings" class="text-atm-content-gray-muted cursor-pointer" />
    </slot>

    <template #overlay>
      <div class="flex flex-col w-[320px] overflow-hidden">
        <div class="flex items-center justify-between w-full p-3 bg-atm-bg-purple-light">
          <span class="text-sm font-bold text-atm-content-gray">{{ $t('labels.settings') }}</span>
          <!-- Todo: add docs link  -->
          <a
            target="_blank"
            rel="noopener noreferrer"
            class="!no-underline !hover:(underline text-atm-content-purple-dark) text-atm-content-purple-dark"
            >{{ $t('title.docs') }}</a
          >
        </div>
        <div class="flex flex-col p-3 text-sm gap-3">
          <!-- Integration Select -->
          <div class="flex items-center gap-2">
            <span class="text-atm-content-gray w-2/6">{{ $t('general.integration') }}</span>
            <div v-if="showTooltip" class="w-1/6 flex justify-end">
              <AtTooltip placement="top">
                <template #title>
                  <span>Integration to use for this operation</span>
                </template>
                <GeneralIcon icon="info" class="text-sm text-atm-content-gray-muted" />
              </AtTooltip>
            </div>
            <a-form-item class="flex-1 !my-0 min-w-0">
              <AtSelect
                v-model:value="vFkIntegrationId"
                class="w-full atm-select-shadow atm-ai-input"
                size="middle"
                placeholder="- select integration -"
                @change="onIntegrationChange"
              >
                <a-select-option v-for="integration in aiIntegrations" :key="integration.id" :value="integration.id">
                  <div class="w-full flex gap-2 items-center">
                    <GeneralIntegrationIcon v-if="integration?.sub_type" :type="integration.sub_type" />
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>
                        {{ integration.title }}
                      </template>
                      {{ integration.title }}
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="vFkIntegrationId === integration.id"
                      id="atm-selected-item-icon"
                      class="text-atm-content-purple-medium w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>
            </a-form-item>
          </div>
          <!-- Model Select -->
          <div v-if="isGlobalIntegration" class="flex items-center gap-2">
            <span class="text-atm-content-gray w-2/6">Model</span>
            <span class="flex-1 text-atm-content-gray-muted atm-ai-model-auto-note">
              {{ $t('labels.aiModelAutoSelected') }}
            </span>
          </div>
          <div v-else class="flex items-center gap-2">
            <span class="text-atm-content-gray w-2/6">Model</span>
            <div v-if="showTooltip" class="w-1/6 flex justify-end">
              <AtTooltip placement="top">
                <template #title>
                  <span>Model to use for this operation</span>
                </template>
                <GeneralIcon icon="info" class="text-sm text-atm-content-gray-muted" />
              </AtTooltip>
            </div>

            <a-form-item class="flex-1 !my-0 min-w-0">
              <AtSelect
                v-model:value="vModel"
                class="w-full atm-select-shadow atm-ai-input"
                size="middle"
                placeholder="- select model -"
                :disabled="!vFkIntegrationId || availableModels.length === 0"
                :loading="isLoadingAvailableModels"
              >
                <a-select-option v-for="md in availableModels" :key="md.label" :value="md.value">
                  <div class="w-full flex gap-2 items-center">
                    <AtTooltip class="flex-1 truncate" show-on-truncate-only>
                      <template #title>
                        {{ md.label }}
                      </template>
                      {{ md.label }}
                    </AtTooltip>
                    <component
                      :is="iconMap.check"
                      v-if="vModel === md.value"
                      id="atm-selected-item-icon"
                      class="text-atm-content-purple-medium w-4 h-4"
                    />
                  </div>
                </a-select-option>
              </AtSelect>
            </a-form-item>
          </div>
          <!-- Randomness 
          <div class="flex items-center gap-2">
            <span class="text-atm-content-gray w-2/6">Randomness</span>
            <div v-if="showTooltip" class="w-1/6 flex justify-end">
              <AtTooltip placement="top">
                <template #title>
                  <span>Randomness of the response</span>
                </template>
                <GeneralIcon icon="info" class="text-sm text-atm-content-gray-muted" />
              </AtTooltip>
            </div>
            <div class="flex-1">
              <AtSelect v-model:value="vModel.randomness" class="w-full" size="middle" :disabled="!vModel.fk_integration_id">
                <a-select-option value="high">High</a-select-option>
                <a-select-option value="medium">Medium</a-select-option>
                <a-select-option value="low">Low (Default)</a-select-option>
              </AtSelect>
            </div>
          </div>
          -->
        </div>
      </div>
    </template>
  </AtDropdown>
</template>

<style lang="scss" scoped>
:deep(.atm-select.ant-select) {
  .ant-select-selector {
    @apply !rounded-lg;
  }
}
</style>
