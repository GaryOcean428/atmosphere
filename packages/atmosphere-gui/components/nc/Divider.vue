<script lang="ts" setup>
const props = defineProps<{
  dividerClass?: string
}>()

const dividerClass = toRef(props, 'dividerClass')
</script>

<template>
  <a-divider :class="dividerClass" class="atm-divider" />
</template>

<style lang="scss">
.atm-divider.ant-divider {
  @apply my-1.25;
}
</style>
