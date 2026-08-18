<script setup lang="ts">
interface Props {
  height?: string
}

withDefaults(defineProps<Props>(), {
  height: 'h-full',
})
</script>

<template>
  <div class="w-full flex items-center justify-center bg-atm-bg-gray-extralight" :class="[height]">
    <div class="text-center">
      <a-spin size="large" />
      <div class="mt-4 text-atm-content-gray-subtle2">Loading Monaco Editor...</div>
    </div>
  </div>
</template>
