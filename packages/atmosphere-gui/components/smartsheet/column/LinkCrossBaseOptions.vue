<script setup lang="ts">
defineProps<{
  value: any
  meta?: any
  isEdit?: boolean
}>()

defineEmits(['update:value', 'baseChange'])
</script>

<template>
  <AtSpanHidden />
</template>
