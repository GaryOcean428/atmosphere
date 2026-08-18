<script lang="ts" setup>
const emits = defineEmits(['onNavigate'])

const workspaceStore = useWorkspace()

const navigateToAiIntegrations = () => {
  workspaceStore.navigateToIntegrations(undefined, undefined, {
    categories: 'ai',
  })

  emits('onNavigate')
}
</script>

<template>
  <div
    class="py-2 pl-3 pr-2 flex gap-2 bg-atm-bg-orange-light rounded-lg"
    :class="{
      'items-center': !$slots.description,
      'items-start': $slots.description,
    }"
  >
    <slot name="icon">
      <GeneralIcon icon="alertTriangleSolid" class="flex-none !text-atm-content-orange-medium w-4 h-4" />
    </slot>
    <div class="flex-1 flex flex-col gap-1">
      <slot name="title">
        <div class="text-sm text-atm-content-gray-subtle flex-1">No AI Integrations added.</div>
      </slot>
      <slot name="description"></slot>
    </div>
    <AtButton size="small" type="text" class="!text-atm-content-brand" @click.stop="navigateToAiIntegrations">
      Add integration
    </AtButton>
  </div>
</template>

<style lang="scss" scoped></style>
