<script lang="ts" setup>
const isBaseListModalOpen = ref(false)
</script>

<template>
  <div class="atm-mini-sidebar-btn-full-width">
    <div
      data-testid="atm-workspace-menu"
      class="atm-workspace-menu atm-mini-sidebar-ws-item atm-small-shadow"
      @click="isBaseListModalOpen = true"
    >
      <GeneralWorkspaceIcon
        :workspace="{
          id: 'atm',
          meta: {},
        }"
        show-atmosphere-icon
        class="flex-none border-1 border-atm-border-gray-medium"
        size="mini-sidebar"
      />
    </div>
  </div>

  <WorkspaceBaseListModal v-model:visible="isBaseListModalOpen" />
</template>
