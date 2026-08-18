<script lang="ts" setup>
const route = useRoute()

const router = useRouter()

const { isDark } = useTheme()

const { isWhiteLabelled, productName, logoUrl, logoDarkUrl, faviconUrl } = useBranding()

const brandIcon = computed(() => {
  if (!isWhiteLabelled.value) return null
  return faviconUrl.value || (isDark.value ? logoDarkUrl.value || logoUrl.value : logoUrl.value)
})

// Both sinks (the <a :href> and window.location.href) must use the shared
// guard — the previous bespoke isHttpUrl() was bypassed by scheme smuggling
// (e.g. `j\tavascript:`, which browsers strip back to javascript:).
const redirectUrl = computed(() => {
  const url = (route.query.ncRedirectUrl as string) ?? ''
  return isSafeRedirectUrl(url) ? url : ''
})

const backUrl = computed(() => {
  const url = (route.query.ncBackUrl as string) ?? ''
  return isSafeRedirectUrl(url) && isSameOriginUrl(url, true) ? url : ''
})

if (!redirectUrl.value || !backUrl.value) {
  router.replace('/error/404')
}

const handleRedirect = (proceedToLink = false) => {
  const url = proceedToLink ? redirectUrl.value : backUrl.value

  if (isSameOriginUrl(url, true)) {
    window.history.pushState('object', document.title, url)
    window.location.reload()
  } else {
    window.location.href = url
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 max-w-[420px] mx-auto text-center">
    <div>
      <img
        v-if="isWhiteLabelled && brandIcon"
        width="56px"
        height="56px"
        :alt="productName"
        :src="brandIcon"
        class="object-contain"
      />
      <img v-else class="dark:hidden" width="56px" height="56px" alt="Atmosphere" src="~/assets/img/icons/256x256.png" />
    </div>
    <div class="text-xl font-bold text-atm-content-gray">{{ $t('title.youAreLeavingAtmosphere') }}</div>
    <div class="text-sm font-weight-500 text-atm-content-gray-subtle2">{{ $t('title.onlyProceedIfYouTrustThisLink') }}</div>
    <a class="text-sm font-weight-500 text-atm-content-gray-subtle" :href="redirectUrl">{{ redirectUrl }}</a>
    <div class="flex items-center gap-3 mt-3">
      <AtButton type="secondary" size="small" @click="handleRedirect(false)">
        {{ $t('general.back') }}
      </AtButton>
      <AtButton size="small" @click="handleRedirect(true)">
        {{ $t('labels.proceedToLink') }}
      </AtButton>
    </div>
  </div>
</template>
