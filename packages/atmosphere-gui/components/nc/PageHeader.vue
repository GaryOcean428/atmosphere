<script lang="ts" setup>
interface Props {
  bottomBorder?: boolean
}
withDefaults(defineProps<Props>(), {
  bottomBorder: true,
})
</script>

<template>
  <div
    class="atm-page-header"
    :class="{
      'border-b-1 border-atm-border-gray-medium': bottomBorder,
    }"
  >
    <div class="flex-1 flex items-start gap-3">
      <div v-if="$slots.icon" class="h-7 flex items-center children:flex-none text-atm-content-gray-subtle">
        <slot name="icon"></slot>
      </div>

      <div class="flex flex-col gap-3">
        <h1 class="atm-page-header-title truncate">
          <slot name="title"></slot>
        </h1>
        <p v-if="$slots.subtitle" class="atm-page-header-subtitle">
          <slot name="subtitle"></slot>
        </p>
      </div>
    </div>
    <div v-if="$slots.action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-page-header {
  @apply h-12 flex items-center gap-3 px-3 py-2 min-h-[var(--topbar-height)];

  .atm-page-header-title {
    @apply text-xl font-semibold text-atm-content-gray my-0;
  }
  .atm-page-header-subtitle {
    @apply text-sm font-weight-500 text-atm-content-gray-subtle;
  }
}
</style>
