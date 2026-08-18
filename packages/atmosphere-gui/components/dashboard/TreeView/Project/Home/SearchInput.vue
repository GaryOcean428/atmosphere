<script lang="ts" setup>
interface Props {
  isLoading?: boolean
}

const props = defineProps<Props>()

const { isLoading } = toRefs(props)

const { baseHomeSearchQuery } = storeToRefs(useBases())

const { isSharedBase } = storeToRefs(useBase())

const { isShowEveryonePersonalViewsEnabled } = storeToRefs(useViewsStore())

const { commandPalette } = useCommandPalette()

const { isMobileMode } = useGlobal()

const { isFeatureEnabled } = useBetaFeatureToggle()

const isOpenOptionsDropdown = ref(false)

const isShowEveryonePersonalViewsFeatureEnabled = computed(() => {
  return isEeUI && isFeatureEnabled(FEATURE_FLAG.SHOW_EVERYONES_PERSONAL_VIEWS)
})

const handleClick = () => {
  if (isLoading.value) return

  commandPalette.value?.open()
}
</script>

<template>
  <div v-if="!isMobileMode && !isSharedBase" class="px-2 h-11 flex items-center gap-2">
    <div class="flex-1" @click="handleClick">
      <a-input
        v-model:value="baseHomeSearchQuery"
        type="text"
        class="atm-input-border-on-value atm-input-shadow !h-8 !pl-1.5 !pr-1 !py-1 !rounded-lg"
        placeholder="Quick search..."
        allow-clear
        readonly
        @keydown.stop
      >
        <template #prefix>
          <div class="flex items-center gap-1 mr-1">
            <GeneralIcon icon="search" class="h-4 w-4 text-atm-content-gray-muted group-hover:text-atm-content-gray-extreme" />
          </div>
        </template>
        <template #suffix>
          <div class="px-1 text-bodySmBold text-atm-content-gray-subtle bg-atm-bg-gray-medium rounded">
            {{ renderCmdOrCtrlKey(true) }} K
          </div>
        </template>
      </a-input>
    </div>
    <div v-if="isShowEveryonePersonalViewsFeatureEnabled" class="flex items-center gap-1">
      <AtDropdown v-model:visible="isOpenOptionsDropdown">
        <AtButton icon-only size="small" type="text" @click.stop>
          <template #icon> <GeneralIcon icon="ncSettings" class="opacity-80" /> </template>
        </AtButton>
        <template #overlay>
          <div class="p-4 flex flex-col gap-3">
            <div class="!capitalize text-captionBold font-semibold text-atm-content-gray-subtle2">
              {{ $t('general.options') }}
            </div>
            <div
              class="flex items-center text-bodyDefaultSm text-atm-content-gray-muted hover:text-atm-content-gray-subtle2 xs:(text-base px-3.5 mx-0) select-none"
            >
              <AtSwitch v-model:checked="isShowEveryonePersonalViewsEnabled" size="xsmall">
                {{ $t('labels.showEveryonesPersonalViews') }}
              </AtSwitch>
            </div>
          </div>
        </template>
      </AtDropdown>
    </div>
  </div>
</template>
