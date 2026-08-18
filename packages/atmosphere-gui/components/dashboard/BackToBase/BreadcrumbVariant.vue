<!-- Back to Base: breadcrumb variant.
     Full-width bar rendered between the breadcrumb row and the page tabs.
     Only visible when shouldShow is true and variant is 'breadcrumb'. -->
<script lang="ts" setup>
interface Props {
  disableTransition?: boolean
}

withDefaults(defineProps<Props>(), {
  disableTransition: true,
})

const { shouldShow, navigateToBase, lastVisitedBase } = useBackToBase()
</script>

<template>
  <Transition :name="disableTransition ? '' : 'atm-btb-bc'">
    <div
      v-if="shouldShow"
      class="atm-btb-bar w-full flex items-center gap-2 pl-3 pr-4 h-9 border-b-1 border-atm-border-gray-medium bg-atm-bg-gray-extralight cursor-pointer select-none group hover:bg-atm-bg-brand-light transition-colors duration-150"
      data-testid="atm-btb-bar"
      @click="navigateToBase"
    >
      <GeneralIcon
        icon="chevronLeft"
        class="flex-none h-4 w-4 text-atm-content-gray-muted group-hover:text-atm-content-brand transition-colors duration-150"
      />
      <span
        class="text-small font-medium text-atm-content-gray-subtle group-hover:text-atm-content-brand transition-colors duration-150 whitespace-nowrap"
      >
        {{ $t('labels.backToBase') }}
      </span>
      <template v-if="lastVisitedBase?.title">
        <span class="text-atm-content-gray-muted group-hover:text-atm-content-brand transition-colors duration-150">-</span>
        <span
          class="text-small font-semibold text-atm-content-gray group-hover:text-atm-content-brand transition-colors duration-150 truncate"
        >
          {{ lastVisitedBase.title }}
        </span>
      </template>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.atm-btb-bc-enter-active,
.atm-btb-bc-leave-active {
  transition: opacity 0.15s ease, max-height 0.15s ease;
  max-height: 2.25rem; /* h-9 */
  overflow: hidden;
}
.atm-btb-bc-enter-from,
.atm-btb-bc-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
