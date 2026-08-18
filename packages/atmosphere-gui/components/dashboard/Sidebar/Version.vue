<script lang="ts" setup>
const { appInfo } = useGlobal()
</script>

<template>
  <div>
    <div class="flex items-center text-xs text-atm-content-gray-disabled px-3 py-1">
      <span>Version {{ appInfo.version }}</span>
    </div>
  </div>
</template>
