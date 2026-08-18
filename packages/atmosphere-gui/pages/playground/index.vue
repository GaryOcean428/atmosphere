<script setup lang="ts">
// Redirect to development environment only
if (import.meta.env.PROD) {
  navigateTo('/')
}

const navItems = [
  {
    name: 'Icons',
    path: '/playground/icons',
    description: 'Browse all icons from iconUtils',
    icon: 'star',
  },
  {
    name: 'Components',
    path: '/playground/components',
    description: 'Test AtComponents',
    icon: 'appStore',
  },
  {
    name: 'Plans',
    path: '/playground/plans',
    description: 'Plan badges & billing tables in light + dark',
    icon: 'ncArrowUpCircle',
  },
]
</script>

<template>
  <div class="h-screen w-screen bg-atm-bg-gray-light overflow-auto">
    <div class="max-w-6xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-atm-content-gray-emphasis mb-2">Atmosphere Playground</h1>
        <div>
          <AtBadge color="purple" :border="false" class="!h-5 max-w-34 text-atm-content-purple-dark"> Development Only </AtBadge>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="item.path"
          class="group block p-6 !no-underline bg-atm-bg-default rounded-lg border-1 border-atm-border-gray-medium hover:border-atm-border-brand transition-all"
        >
          <div class="flex items-start gap-3">
            <div class="flex-none w-10 h-10 rounded-lg bg-atm-bg-brand-light flex items-center justify-center">
              <GeneralIcon :icon="item.icon" class="w-5 h-5 text-atm-content-brand" />
            </div>
            <div class="flex-1">
              <h2
                class="text-lg font-semibold text-atm-content-gray-emphasis mb-1 group-hover:text-atm-content-brand transition-colors"
              >
                {{ item.name }}
              </h2>
              <p class="text-sm text-atm-content-gray-subtle">
                {{ item.description }}
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>
