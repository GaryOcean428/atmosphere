<template>
  <div
    class="flex items-center gap-4 p-4 border-t border-atm-border-gray-medium text-xs text-atm-content-gray-muted dark:bg-atm-bg-gray-extralight"
  >
    <div class="flex items-center gap-1">
      <kbd class="atm-keyboard-shortcut">Tab</kbd>
      <span>{{ $t('labels.navigate') }}</span>
    </div>
    <div class="flex items-center gap-1">
      <kbd class="atm-keyboard-shortcut">{{ $t('general.enter') }}</kbd>
      <span>{{ $t('labels.select') }}</span>
    </div>
    <div class="flex items-center gap-1">
      <kbd class="atm-keyboard-shortcut">Esc</kbd>
      <span>{{ $t('general.close') }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-keyboard-shortcut {
  @apply px-2 py-1 bg-atm-bg-gray-light rounded border-1 border-atm-border-gray-medium text-tiny;
}
</style>
