<script setup lang="ts">
import { useUploadState } from './UploadProviders/useUploadState'

interface Props {
  visible: boolean
  enabledProviders?: ('local' | 'url' | 'webcam')[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  enabledProviders: () => ['local', 'url', 'webcam'],
})

const emit = defineEmits<Emits>()

const { isMobileMode } = useGlobal()

const dialogShow = useVModel(props, 'visible', emit)

const activeMenu = ref<'local' | 'url' | 'webcam'>('local')

const { clearFiles } = useUploadState()

const selectMenu = (option: 'local' | 'url' | 'webcam') => {
  clearFiles()
  activeMenu.value = option
}

// Set initial active menu based on enabled providers
onMounted(() => {
  if (props.enabledProviders.length > 0) {
    activeMenu.value = props.enabledProviders[0]
  }
})
</script>

<template>
  <AtModal
    v-model:visible="dialogShow"
    :show-separator="false"
    size="medium"
    width="50rem"
    wrap-class-name="atm-modal-file-upload"
    class="!rounded-md"
    @keydown.esc="dialogShow = false"
  >
    <div class="flex h-full" :class="isMobileMode ? 'flex-col' : 'flex-row'">
      <div
        v-if="enabledProviders.length > 1"
        style="border-top-left-radius: 1rem; border-bottom-left-radius: 1rem"
        class="px-2 bg-atm-bg-gray-extralight"
      >
        <AtMenu class="!h-full !bg-atm-bg-gray-extralight flex flex-col" :class="{ '!flex-row overflow-x-scroll': isMobileMode }">
          <AtMenuItem
            v-if="enabledProviders.includes('local')"
            key="local"
            class="!hover:bg-atm-bg-gray-medium !hover:text-atm-content-gray rounded-md"
            :class="{
              'active-menu': activeMenu === 'local',
            }"
            @click="selectMenu('local')"
          >
            <div class="flex gap-2 items-center">
              <GeneralIcon icon="file" />
              {{ $t('title.localFiles') }}
            </div>
          </AtMenuItem>

          <AtMenuItem
            v-if="enabledProviders.includes('url')"
            key="url"
            class="!hover:bg-atm-bg-gray-medium !hover:text-atm-content-gray rounded-md"
            :class="{
              'active-menu': activeMenu === 'url',
            }"
            @click="selectMenu('url')"
          >
            <div class="flex gap-2 items-center">
              <GeneralIcon icon="link2" />
              {{ $t('title.uploadViaUrl') }}
            </div>
          </AtMenuItem>

          <AtMenuItem
            v-if="enabledProviders.includes('webcam')"
            key="webcam"
            class="!hover:bg-atm-bg-gray-medium !hover:text-atm-content-gray rounded-md"
            :class="{
              'active-menu': activeMenu === 'webcam',
            }"
            @click="selectMenu('webcam')"
          >
            <div class="flex gap-2 items-center">
              <GeneralIcon icon="camera" />
              {{ $t('title.webcam') }}
            </div>
          </AtMenuItem>
        </AtMenu>
      </div>

      <div style="height: 425px" class="!w-full flex-grow p-2">
        <AtFileUploadProvidersLocal v-show="activeMenu === 'local'" />

        <AtFileUploadProvidersCamera v-if="activeMenu === 'webcam'" />

        <AtFileUploadProvidersUrl v-if="activeMenu === 'url'" />
      </div>
    </div>
  </AtModal>
</template>

<style lang="scss">
.atm-modal-file-upload {
  .active-menu {
    @apply bg-atm-bg-brand-inverted font-semibold text-atm-content-brand rounded-md;
  }
}

.atm-modal-file-upload {
  .atm-modal {
    @apply !p-0;
  }
}
</style>

<style scoped lang="scss">
:deep(.ant-menu-inline),
:deep(.ant-menu-vertical),
:deep(.ant-menu-vertical-left) {
  border-right: none !important;
}
</style>
