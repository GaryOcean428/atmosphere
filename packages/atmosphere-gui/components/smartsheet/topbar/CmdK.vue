<script setup lang="ts">
const { commandPalette } = useCommandPalette()
</script>

<template>
  <AtButton
    v-e="['c:quick-actions']"
    type="secondary"
    size="small"
    class="atm-topbar-cmd-k-btn"
    data-testid="atm-topbar-cmd-k-btn"
    @click="commandPalette?.open()"
  >
    <div class="flex items-center gap-1 text-sm">
      <GeneralIcon icon="ncCommand" class="h-3.5" />
      K
    </div>
  </AtButton>
</template>
