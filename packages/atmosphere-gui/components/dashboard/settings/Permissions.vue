<script setup lang="ts">
interface Props {
  state: string
  baseId: string
  reload?: boolean
}

defineProps<Props>()

defineEmits(['update:state', 'update:reload'])
</script>

<template>
  <AtSpanHidden />
</template>
