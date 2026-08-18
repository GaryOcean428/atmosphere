<script setup lang="ts">
import { useAttachmentCell } from './utils'

const props = defineProps<{
  value: boolean
}>()

const { isMobileMode } = useGlobal()

const dialogShow = useVModel(props, 'value')

const { onDrop: saveAttachment, isPublic, stopCamera } = useAttachmentCell()!

const { showStoragePlanLimitExceededModal } = useEeConfig()

const activeMenu = ref('local')

const selectMenu = (option: string) => {
  activeMenu.value = option
}

const closeModal = (value: boolean) => {
  dialogShow.value = value
}

const saveAttachments = async (files: File[]) => {
  if (showStoragePlanLimitExceededModal()) return

  await saveAttachment(files, {} as any)
  dialogShow.value = false
}

watch(activeMenu, (newVal, oldValue) => {
  // Stop camera when switching to another menu
  if (oldValue === 'webcam' && newVal !== 'webcam') {
    // When the menu is switched when the startCamera function is called, the videoStream might not have initialized yet
    // So, we need to wait for a while before stopping the camera
    setTimeout(() => {
      stopCamera()
    }, 1000)
  }
})
</script>

<template>
  <AtModal
    v-model:visible="dialogShow"
    :show-separator="false"
    size="medium"
    width="50rem"
    wrap-class-name="atm-modal-attachment-create"
    class="!rounded-md"
    @keydown.esc="dialogShow = false"
  >
    <div class="flex h-full" :class="isMobileMode ? 'flex-col' : 'flex-row'">
      <div
        style="border-top-left-radius: 1rem; border-bottom-left-radius: 1rem"
        class="px-2 !-full flex-grow bg-atm-bg-gray-extralight"
      >
        <AtMenu class="!h-full !bg-atm-bg-gray-extralight flex flex-col" :class="{ '!flex-row overflow-x-scroll': isMobileMode }">
          <AtMenuItem
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
            v-if="!isPublic"
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

      <div style="height: 425px" class="w-full p-2">
        <LazyCellAttachmentUploadProvidersLocal
          v-show="activeMenu === 'local'"
          @update:visible="closeModal"
          @upload="(e) => saveAttachments(e)"
        />

        <LazyCellAttachmentUploadProvidersCamera
          v-if="activeMenu === 'webcam'"
          @update:visible="closeModal"
          @upload="(e) => saveAttachments(e)"
        />

        <LazyCellAttachmentUploadProvidersUrl
          v-if="activeMenu === 'url'"
          @update:visible="closeModal"
          @upload="(e) => saveAttachments(e)"
        />
      </div>
    </div>
  </AtModal>
</template>

<style lang="scss">
.atm-modal-attachment-create {
  .active-menu {
    @apply bg-atm-bg-brand-inverted font-semibold text-atm-content-brand rounded-md;
  }
}

.atm-modal-attachment-create {
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
