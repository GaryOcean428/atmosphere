<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSsoError } from '~/composables/useSsoError'

const props = defineProps<{
  title?: string
  message?: string
  /** Failure bucket, paired with errorRef so support can find the matching log line. */
  code?: string
  errorRef?: string
}>()

const { t } = useI18n()

const { clearError } = useSsoError()

const supportCode = computed(() => [props.code, props.errorRef].filter(Boolean).join(' · '))

const handleRetry = () => {
  clearError()
}
</script>

<template>
  <div class="flex flex-col items-center justify-center atm-min-h-screen bg-atm-bg-gray-extralight">
    <div class="w-full max-w-md p-8 space-y-8 bg-atm-bg-default rounded-lg shadow">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-atm-content-gray-emphasis" data-testid="atm-sso-error-title">
          {{ title || t('msg.noAccess') }}
        </h1>
        <p class="mt-2 text-sm text-atm-content-gray-subtle2" data-testid="atm-sso-error-message">
          {{ message || t('msg.noAccessDescription') }}
        </p>

        <div v-if="supportCode" class="mt-6 text-left">
          <p class="text-bodySm text-atm-content-gray-subtle2">
            {{ t('msg.sso.shareCode') }}
          </p>
          <div
            class="mt-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-atm-bg-gray-light border-1 border-atm-border-gray-medium"
          >
            <span class="flex-1 font-mono text-bodySm text-atm-content-gray break-all" data-testid="atm-sso-error-code">
              {{ supportCode }}
            </span>
            <GeneralCopyButton :content="supportCode" data-testid="atm-sso-error-copy" />
          </div>
        </div>

        <AtButton class="mt-4" type="primary" size="medium" data-testid="atm-sso-error-retry" @click="handleRetry">
          {{ t('msg.tryAgain') }}
        </AtButton>
      </div>
    </div>
  </div>
</template>
