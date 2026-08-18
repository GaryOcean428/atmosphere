<script setup lang="ts">
import { onKeyDown } from '@vueuse/core'

const props = defineProps<{
  modelValue: boolean
  /** Titles of the link fields the copy can't share with the original. */
  links: string[]
}>()

const emit = defineEmits(['update:keepLinks', 'cancel', 'update:modelValue'])

const dialogShow = useVModel(props, 'modelValue', emit)

const { links } = toRefs(props)

// Default to the non-destructive choice — the original keeps its linked records.
const keepLinks = ref(false)

const linkList = computed(() => links.value.join(', '))

const updateKeepLinks = () => {
  emit('update:keepLinks', keepLinks.value)
  dialogShow.value = false
}

onKeyDown('esc', () => {
  dialogShow.value = false
  emit('update:modelValue', false)
})

const close = () => {
  dialogShow.value = false
  emit('cancel')
}
</script>

<template>
  <AtModal v-if="dialogShow" v-model:visible="dialogShow" :show-separator="false" size="small" @keydown.esc="dialogShow = false">
    <div class="flex justify-between w-full text-base font-semibold mb-2 text-atm-content-gray-emphasis items-center">
      {{ $t('msg.info.duplicateLinks.title') }}
    </div>
    <div data-testid="atm-duplicate-links-modal" class="flex flex-col">
      <div class="mb-2 atm-content-gray">
        {{ $t('msg.info.duplicateLinks.subtitle') }}
      </div>
      <div class="mb-3 font-bold atm-content-gray max-h-20 atm-scrollbar-thin">
        {{ linkList }}
      </div>

      <a-radio-group v-model:value="keepLinks">
        <a-radio
          data-testid="atm-duplicate-links-skip"
          :style="{
            display: 'flex',
            lineHeight: '30px',
          }"
          :value="false"
        >
          <div class="atm-content-gray leading-5">
            <span class="font-semibold"> {{ $t('msg.info.duplicateLinks.skipLabel') }} </span>
            {{ $t('msg.info.duplicateLinks.skipHint') }}
          </div>
        </a-radio>
        <a-radio
          data-testid="atm-duplicate-links-move"
          :style="{
            display: 'flex',
            lineHeight: '30px',
          }"
          :value="true"
        >
          <div class="atm-content-gray leading-5">
            <span class="font-semibold"> {{ $t('msg.info.duplicateLinks.moveLabel') }} </span>
            {{ $t('msg.info.duplicateLinks.moveHint') }}
          </div>
        </a-radio>
      </a-radio-group>
    </div>
    <div class="flex flex-row mt-5 justify-end gap-x-2">
      <div class="flex gap-2 items-center">
        <AtButton data-testid="atm-duplicate-links-cancel" type="secondary" size="small" @click="close">
          {{ $t('labels.cancel') }}
        </AtButton>
      </div>
      <div class="flex gap-2 items-center">
        <AtButton data-testid="atm-duplicate-links-continue" type="primary" size="small" @click="updateKeepLinks">
          {{ $t('labels.continue') }}
        </AtButton>
      </div>
    </div>
  </AtModal>
</template>
