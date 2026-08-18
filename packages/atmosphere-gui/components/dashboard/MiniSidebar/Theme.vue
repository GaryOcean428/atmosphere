<script setup lang="ts">
import type { TooltipPlacement } from 'ant-design-vue/lib/tooltip'

interface Props {
  placement?: TooltipPlacement
  renderAsBtn?: boolean
  buttonClass?: string
}

withDefaults(defineProps<Props>(), {
  placement: 'right',
  buttonClass: 'h-7 w-7',
})

const { toggleTheme, isThemeEnabled, selectedTheme } = useTheme()

const themeIcon = computed(
  () =>
    ({
      light: 'ncSun',
      dark: 'ncMoon',
      system: 'ncSunMoon',
    }[selectedTheme.value] as IconMapKey),
)
</script>

<template>
  <AtTooltip v-if="isThemeEnabled" :placement="placement" :arrow="false">
    <template #title>
      <div class="capitalize">Appearance: {{ selectedTheme }}</div>
    </template>
    <div
      v-e="['c:atmosphere:theme']"
      class="atm-mini-sidebar-btn-full-width"
      :class="[
        buttonClass,
        {
          'atm-render-as-btn': renderAsBtn,
        },
      ]"
      data-testid="atm-sidebar-theme"
    >
      <div class="atm-mini-sidebar-btn relative" @click="toggleTheme">
        <GeneralIcon
          :icon="themeIcon"
          :class="{
            'h-5 w-5': themeIcon === 'ncSunMoon',
            'h-4 w-4': themeIcon !== 'ncSunMoon',
          }"
        />
      </div>
    </div>
  </AtTooltip>
</template>

<style lang="scss" scoped>
.atm-mini-sidebar-btn-full-width {
  &.atm-render-as-btn {
    @apply text-atm-content-gray-subtle rounded-lg flex-none flex justify-center items-center cursor-pointer hover:bg-atm-bg-gray-medium transition-all duration-200;

    .atm-mini-sidebar-btn {
      @apply !p-1.5 flex items-center justify-center children:flex-none text-atm-content-gray-muted h-full w-full;
    }
  }
}
</style>
