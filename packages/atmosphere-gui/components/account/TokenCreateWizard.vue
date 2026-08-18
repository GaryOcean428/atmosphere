<script lang="ts" setup>
interface Props {
  editToken?: null
}

withDefaults(defineProps<Props>(), {
  editToken: null,
})

const emit = defineEmits(['created', 'saved', 'cancel'])

const { api } = useApi()
const { copy } = useCopy()
const { $e } = useNuxtApp()

const isCreating = ref(false)
const showResultModal = ref(false)
const createdTokenValue = ref('')

const tokenName = ref('')
const tokenCopied = ref(false)

const isFormValid = computed(() => {
  return tokenName.value.length > 0 && tokenName.value.length <= 255
})

const submitToken = async () => {
  isCreating.value = true
  try {
    const token = await api.orgTokens.create({
      description: tokenName.value,
    })

    createdTokenValue.value = (token as any).token
    showResultModal.value = true

    $e('a:api-token:create')
    emit('created', (token as any).token)
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    isCreating.value = false
  }
}

const copyToken = async () => {
  if (!createdTokenValue.value) return
  try {
    await copy(createdTokenValue.value)
    tokenCopied.value = true
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  }
}

const onResultDone = () => {
  showResultModal.value = false
  createdTokenValue.value = ''
  emit('cancel')
}
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="atm-token-create-form">
    <span class="text-sm text-atm-content-gray-muted" data-rec="true">{{ $t('msg.apiTokenCreate') }}</span>

    <div class="max-w-150 flex flex-col gap-6">
      <!-- Name -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-bold text-atm-content-gray">{{ $t('general.name') }}</label>
        <a-input v-model:value="tokenName" class="!rounded-lg max-w-150" :maxlength="255" data-testid="atm-token-name-input" />
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-atm-border-gray-light">
        <AtButton type="text" size="small" data-testid="atm-token-cancel-btn" @click="emit('cancel')">
          {{ $t('general.cancel') }}
        </AtButton>
        <AtButton
          type="primary"
          size="small"
          :loading="isCreating"
          :disabled="!isFormValid"
          data-testid="atm-token-create-btn"
          @click="submitToken"
        >
          {{ $t('activity.createToken') }}
        </AtButton>
      </div>
    </div>

    <!-- Token Created Modal -->
    <AtModalConfirm
      v-model:visible="showResultModal"
      type="success"
      :title="$t('msg.info.tokenCreatedSuccessfully')"
      :ok-text="$t('general.done')"
      :ok-props="{ disabled: !tokenCopied }"
      :show-cancel-btn="false"
      :mask-closable="false"
      :keyboard="false"
      :closable="false"
      size="sm"
      :wrapper-props="{ 'data-testid': 'atm-token-result-modal' }"
      @ok="onResultDone"
    >
      <template #extraContent>
        <!-- Help text -->
        <p class="text-sm text-atm-content-gray-subtle2 mb-0 leading-5">
          {{ $t('msg.info.tokenResultHelpText') }}
        </p>

        <!-- Token value -->
        <div
          class="flex items-center gap-2 bg-atm-bg-gray-extralight border-1 border-atm-border-gray-medium rounded-lg px-3 py-2.5"
        >
          <code
            class="text-xs text-atm-content-gray-extreme select-all leading-5 flex-1 min-w-0 truncate"
            style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            data-testid="atm-token-created-value"
          >
            {{ createdTokenValue }}
          </code>
          <AtTooltip :title="tokenCopied ? $t('general.copied') : $t('general.copy')">
            <AtButton size="xs" type="secondary" class="flex-none !px-1.5" data-testid="atm-token-copy-btn" @click="copyToken">
              <GeneralIcon
                :icon="tokenCopied ? 'check' : 'copy'"
                class="w-4 h-4"
                :class="tokenCopied ? 'text-green-600' : 'text-atm-content-gray-subtle2'"
              />
            </AtButton>
          </AtTooltip>
        </div>

        <!-- Warning -->
        <AtAlert type="warning" :description="$t('msg.info.tokenWontBeDisplayedAgain')" />
      </template>
    </AtModalConfirm>
  </div>
</template>

<style lang="scss" scoped></style>
