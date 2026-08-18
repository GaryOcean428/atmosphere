<template>
  <div class="atm-ant-dropdown-menu-item-label">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.atm-ant-dropdown-menu-item-label {
  @apply flex items-center min-h-7 py-3 px-2 mx-2 xs:(text-base px-3.5 mx-0) font-bold uppercase text-xs text-atm-content-gray-muted;
}
</style>
