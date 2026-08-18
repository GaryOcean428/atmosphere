<script setup lang="ts">
defineProps<{
  /** Render in compact mode (flat cells, tight spacing, uppercase labels,
   * blank-placeholder). Forwarded straight to Columns. */
  compactMode?: boolean
}>()

const { fields, hiddenFields } = useExpandedFormStoreOrThrow()
</script>

<template>
  <SmartsheetExpandedFormPresentorsFieldsColumns
    :fields="fields"
    :hidden-fields="hiddenFields"
    :is-loading="false"
    :compact-mode="compactMode"
    force-vertical-mode
    class="mini-columns-wrapper"
  />
</template>

<style lang="scss">
.mini-columns-wrapper {
  .atm-expanded-cell-header {
    @apply !bg-transparent;
    .atm-cell-name-wrapper,
    .atm-virtual-cell-name-wrapper {
      @apply !px-0;
      .name.truncate {
        @apply flex items-center pl-2;
        span {
          @apply !text-xs font-weight-500 !leading-[14px];
        }
      }
      svg.atm-icon:not(.invisible):not(.atm-column-context-menu):not(.atm-column-lock-icon) {
        @apply !w-4 !h-4 !mx-0;
      }
    }
  }
}
</style>
