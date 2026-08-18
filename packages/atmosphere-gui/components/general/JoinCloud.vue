<script lang="ts" setup>
import type { CloudFeaturesType } from '~/lib/types'

const { $api } = useNuxtApp()

const { isDark } = useTheme()

const { cloudFeatures: _cloudFeatures } = useEeConfig()

const isLoading = ref(false)

const error = ref(false)

/**
 * This hardcoded list will be used as fallback in case of api error
 * Todo: @ramesh udpate coming soon once that feature is available
 */
const descriptions: CloudFeaturesType[] = [
  {
    Title: 'SAML based Single Sign-On',
    Highlight: true,
  },
  {
    Title: 'Form view branding',
  },
  {
    Title: 'Personal views',
  },
  {
    Title: 'Extensions',
  },
  {
    Title: 'Scripts',
  },
  {
    Title: 'AI Integrations',
    Highlight: true,
  },
]

const cloudFeatures = computed(() => {
  if (error.value && !_cloudFeatures.value) return descriptions

  return _cloudFeatures.value
})

const onMouseover = async () => {
  if (isLoading.value) return

  if (cloudFeatures.value.length && !error.value) {
    isLoading.value = false
    return
  }

  error.value = false
  isLoading.value = true

  try {
    const res = await $api.utils.cloudFeatures()

    _cloudFeatures.value = res
  } catch (e: any) {
    error.value = true
    console.error(await extractSdkResponseErrorMsg(e))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-row items-center w-full bg-bg-atm-bg-default rounded-lg border-1 border-atm-border-brand shadow-sm mb-0.5 overflow-hidden"
  >
    <a
      v-e="['c:navbar:join-cloud']"
      class="flex flex-grow !no-underline items-center justify-center border-r-1 h-full hover:bg-atm-bg-gray-light"
      href="https://app.atmosphere.dev/signin?utm_source=OSS&utm_medium=OSS&utm_campaign=OSS&utm_content=OSS"
    >
      <div class="px-1 text-atm-content-gray-muted prose-sm" style="line-height: 1.3125rem">Try Atmosphere Cloud</div>
    </a>

    <a-tooltip arrow-point-at-center overlay-class-name="atm-join-cloud-tooltip">
      <AtButton type="text" size="small" class="!rounded-l-none !rounded-r-lg" @mouseover="onMouseover">
        <GeneralIcon icon="help" class="!text-lg -mt-0.5 text-atm-content-gray-subtle" />
      </AtButton>
      <template #title>
        <div class="w-70.5 bg-transparent overflow-hidden rounded-2xl shadow border-1 border-atm-border-gray-medium">
          <div class="p-4 bg-atm-bg-default gap-4 inline-flex flex-col w-full">
            <div class="flex items-center gap-3">
              <div class="text-base text-atm-content-gray-emphasis font-bold flex-1">Atmosphere Cloud</div>
              <div class="text-caption px-1 rounded-md bg-atm-bg-brand text-atm-content-brand">Usage based</div>
            </div>

            <div class="text-sm font-bold text-atm-content-gray-emphasis">Includes</div>

            <div v-if="!isLoading" class="flex flex-col gap-2">
              <div
                v-for="(feature, idx) of cloudFeatures"
                :key="idx"
                class="flex items-start text-atm-content-gray text-sm font-weight-500"
              >
                <span class="mr-2 h-5 inline-flex items-center">
                  <span class="rounded text-atm-content-brand bg-atm-bg-brand inline-flex items-center justify-center h-4 w-4">
                    <GeneralIcon icon="ncCheck" class="h-3 w-3" />
                  </span>
                </span>
                <span class="relative">
                  {{ feature.Title }}

                  <div v-if="feature.Highlight" class="atm-plan-description-gradient" :class="{ 'atm-dark': isDark }"></div>
                </span>
                <span v-if="feature['Coming Soon']" class="flex-1 inline-flex justify-end">
                  <span class="inline-block px-1 rounded-md bg-atm-bg-gray-medium text-sm text-atm-content-gray-subtle2">
                    Soon
                  </span>
                </span>
              </div>
            </div>
            <div v-else class="h-35 grid place-items-center">
              <GeneralLoader size="large" />
            </div>

            <div class="flex flex-col gap-2">
              <div class="text-xs leading-[18px] font-normal text-atm-content-gray-muted text-center">
                (no credit card required)
              </div>
              <a href="https://app.atmosphere.dev/signin" target="_blank" class="!no-underline" rel="noopener">
                <AtButton type="secondary" class="w-full">Start for Free</AtButton>
              </a>
            </div>
          </div>
        </div>
      </template>
    </a-tooltip>
  </div>
</template>

<style lang="scss" scoped>
.atm-plan-description-gradient {
  @apply absolute rounded-[30px] inset-0 z-0 pointer-events-none;

  background: linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(252, 58, 198, 0.2) 47.08%, rgba(255, 255, 255, 0.2) 100%);
  filter: blur(2px);

  &.atm-dark {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.06) 0%,
      rgba(252, 58, 198, 0.1) 47.08%,
      rgba(255, 255, 255, 0.06) 100%
    );
  }
}
</style>

<style lang="scss">
.atm-join-cloud-tooltip {
  @apply max-w-none;

  .ant-tooltip-inner {
    @apply !bg-transparent !p-0 rounded-2xl;
  }
  .ant-tooltip-arrow-content {
    @apply !bg-atm-bg-default;
  }
}
</style>
