<script lang="ts">
export default {
  name: 'TopLayout',
}
</script>

<template>
  <NuxtLayout class="atm-h-screen">
    <DashboardTopbar />
    <div class="h-full overflow-auto">
      <slot></slot>
    </div>
  </NuxtLayout>
</template>
