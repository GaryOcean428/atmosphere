<script setup lang="ts">
interface Props {
  tableId: string
  permissionsFieldWrapperClass?: string
  permissionsTableWrapperClass?: string
}

defineProps<Props>()
</script>

<template>
  <AtSpanHidden />
</template>
