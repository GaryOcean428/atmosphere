<script lang="ts" setup>
const props = defineProps<{
  centered?: boolean
  theme?: 'default' | 'ai'
}>()
</script>

<template>
  <a-tabs
    class="atm-tabs"
    :class="{
      'centered': props.centered,
      'theme-ai': props.theme === 'ai',
    }"
  >
    <slot />

    <template v-if="$slots.leftExtra" #leftExtra>
      <slot name="leftExtra" />
    </template>
    <template v-if="$slots.rightExtra" #rightExtra>
      <slot name="rightExtra" />
    </template>
  </a-tabs>
</template>

<style lang="scss">
.atm-tabs.centered {
  > .ant-tabs-nav {
    @apply justify-center mb-0;

    .ant-tabs-nav-wrap {
      @apply w-full flex flex-row justify-center;
    }
  }
}

.ant-tabs-tab + .ant-tabs-tab {
  @apply ml-4;
}

.atm-tabs {
  .ant-tabs-tab {
    @apply px-2 text-atm-content-gray-subtle2 !hover:text-atm-content-gray;
  }
  .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    @apply text-atm-content-brand;
  }
  .ant-tabs-tab.ant-tabs-tab-active:hover .ant-tabs-tab-btn {
    @apply text-atm-content-brand-disabled;
  }

  .ant-tabs-nav {
    @apply pl-2.5 mb-0;
  }

  .ant-tabs-ink-bar {
    @apply bg-atm-content-brand !rounded-t-xl;
  }

  &.theme-ai {
    .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
      @apply text-atm-purple-600 dark:text-atm-content-purple-medium;
    }
    .ant-tabs-tab.ant-tabs-tab-active:hover .ant-tabs-tab-btn {
      @apply text-atm-content-purple-dark dark:text-atm-content-purple-medium;
    }
    .ant-tabs-ink-bar {
      @apply bg-atm-fill-purple-medium;
    }
  }
}
</style>
