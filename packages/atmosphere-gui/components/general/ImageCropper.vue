<script lang="ts" setup>
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import 'vue-advanced-cropper/dist/theme.classic.css'
import type { AttachmentReqType } from 'atmosphere-sdk'
import type { ImageCropperProps } from '#imports'

const { imageConfig, uploadConfig, ...props } = defineProps<ImageCropperProps>()

const emit = defineEmits(['update:showCropper', 'submit'])

const showCropper = useVModel(props, 'showCropper', emit)

const { cropperConfig } = toRefs(props)

const imageRestriction = computed(() => {
  return cropperConfig.value.imageRestriction || 'fit-area'
})

const { api, isLoading } = useApi()

const cropperRef = ref()

const previewImage = ref({
  canvas: {},
  src: '',
})

const fileSize = ref<number>(0)

const isValidFileSize = computed(() => {
  return uploadConfig?.maxFileSize ? !!fileSize.value && fileSize.value <= uploadConfig?.maxFileSize : true
})

const handleCropImage = () => {
  const { canvas } = cropperRef.value.getResult()

  if (!canvas) return

  previewImage.value = {
    canvas,
    src: canvas.toDataURL(imageConfig.type),
  }
  ;(canvas as any).toBlob((blob: Blob) => {
    fileSize.value = blob.size
  }, imageConfig.type)
}

const handleUploadImage = async (fileToUpload: AttachmentReqType[]) => {
  if (uploadConfig?.path) {
    try {
      const uploadResult = await api.storage.uploadByUrl(
        {
          path: uploadConfig?.path as string,
          scope: uploadConfig?.scope,
        },
        fileToUpload,
      )
      if (uploadResult?.[0]) {
        emit('submit', {
          ...uploadResult[0],
          data: fileToUpload[0].data,
        })
      } else {
        emit('submit', fileToUpload[0])
      }
    } catch (error: any) {
      console.error(error)
      message.error(await extractSdkResponseErrorMsg(error))
    }
  } else {
    emit('submit', fileToUpload[0])
  }

  showCropper.value = false
}

const handleSaveImage = async () => {
  if (previewImage.value.canvas) {
    await handleUploadImage([
      {
        title: imageConfig.name,
        fileName: imageConfig.name,
        mimetype: imageConfig.type,
        size: fileSize.value,
        url: previewImage.value.src,
        data: previewImage.value.src,
      },
    ])
  }
}

const defaultSize = ({ imageSize, visibleArea }: { imageSize: Record<string, any>; visibleArea: Record<string, any> }) => {
  return {
    width: (visibleArea || imageSize).width,
    height: (visibleArea || imageSize).height,
  }
}

watch(
  showCropper,
  () => {
    if (!showCropper.value) {
      previewImage.value = {
        canvas: {},
        src: '',
      }
    } else {
      until(() => !!cropperRef.value?.getResult?.()?.canvas)
        .toBeTruthy({ timeout: 2000 })
        .then((canvas) => {
          if (!canvas) return

          nextTick(() => {
            handleCropImage()
          })
        })
    }
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <AtModal v-model:visible="showCropper" :mask-closable="false" wrap-class-name="!z-1050">
    <div class="atm-image-cropper-wrapper relative">
      <Cropper
        ref="cropperRef"
        class="atm-cropper relative"
        :src="imageConfig.src"
        :auto-zoom="true"
        :stencil-props="cropperConfig?.stencilProps || {}"
        :min-height="cropperConfig?.minHeight"
        :min-width="cropperConfig?.minWidth"
        :image-restriction="imageRestriction"
        v-bind="
          cropperConfig.stencilProps?.fillDefault || cropperConfig.stencilProps?.fillDefault === undefined ? { defaultSize } : {}
        "
      />
      <div
        v-if="previewImage.src"
        class="result_preview"
        :class="{
          'rounded-full overflow-hidden': cropperConfig?.stencilProps?.circlePreview,
        }"
      >
        <img :src="previewImage.src" alt="Preview Image" />
      </div>
    </div>
    <div class="flex justify-between items-center space-x-4 mt-4">
      <div class="flex items-center space-x-4">
        <AtButton type="secondary" size="small" :disabled="isLoading" @click="showCropper = false">
          {{ $t('general.cancel') }}
        </AtButton>
      </div>
      <div class="flex items-center space-x-4">
        <AtButton type="secondary" size="small" :disabled="isLoading" @click="handleCropImage">
          <GeneralIcon icon="crop"></GeneralIcon>
          <span class="ml-2">Crop</span>
        </AtButton>

        <AtTooltip :disabled="isValidFileSize">
          <template #title> Cropped file size is greater than max file size </template>

          <AtButton size="small" :loading="isLoading" :disabled="!previewImage.src || !isValidFileSize" @click="handleSaveImage">
            {{ $t('general.save') }}
          </AtButton>
        </AtTooltip>
      </div>
    </div>
  </AtModal>
</template>

<style lang="scss" scoped>
.atm-cropper {
  min-height: 400px;
  max-height: 400px;
}
.atm-image-cropper-wrapper {
  .result_preview {
    @apply absolute right-4 bottom-4 border-1 border-dashed border-white/50 w-28 h-28 opacity-90 pointer-events-none;
    img {
      @apply w-full h-full object-contain;
    }
  }
}
</style>
