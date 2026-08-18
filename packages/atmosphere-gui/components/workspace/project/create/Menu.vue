<script lang="ts" setup>
import { AtMenu } from '#components'
interface Props {
  visible: boolean
  variant: 'modal' | 'dropdown'
  baseCreateMode: AtBaseCreateMode | null
  workspaceId?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dropdown',
})

const emits = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:baseCreateMode', value: AtBaseCreateMode | null): void
}>()

const vVisible = useVModel(props, 'visible', emits)

const baseCreateMode = useVModel(props, 'baseCreateMode', emits)

const { isAiFeaturesEnabled } = useAtmosphereAi()

const onClickOption = (mode: AtBaseCreateMode) => {
  baseCreateMode.value = mode
}

onMounted(() => {
  if (!isAiFeaturesEnabled.value && props.variant === 'modal') {
    baseCreateMode.value = AtBaseCreateMode.FROM_SCRATCH
  }
})
</script>

<template>
  <component
    :is="variant === 'modal' ? 'div' : AtMenu"
    variant="large"
    :class="{
      'py-1 flex flex-col gap-0.5': variant === 'modal',
    }"
    data-testid="atm-home-create-new-menu"
    @click="vVisible = false"
  >
    <AtMenuItemLabel v-if="variant === 'modal'" class="!py-2" @click.stop> CREATE BASE </AtMenuItemLabel>
    <WorkspaceProjectCreateMenuItem
      v-e="['c:base:create:scratch']"
      :variant="variant"
      icon="plus"
      :label="$t('title.fromScratch')"
      subtext="Start with an empty base"
      @click="onClickOption(AtBaseCreateMode.FROM_SCRATCH)"
    />

    <WorkspaceProjectCreateMenuItem
      v-if="isAiFeaturesEnabled"
      v-e="['c:base:ai:create']"
      :variant="variant"
      icon="ncAutoAwesome"
      label="Build with AI"
      subtext="Pre-built structures for common use cases"
      @click="onClickOption(AtBaseCreateMode.BUILD_WITH_AI)"
    />
  </component>
</template>
