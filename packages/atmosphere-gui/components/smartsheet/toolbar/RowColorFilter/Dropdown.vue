<script setup lang="ts">
const { isMobileMode } = useGlobal()
const isToolbarIconMode = inject(
  IsToolbarIconMode,
  computed(() => false),
)
const isShowColoringButton = ref(false)
</script>

<template>
  <!-- TODO: show "ONLY IN EE feature" -->
  <template v-if="isShowColoringButton">
    <AtDropdown>
      <AtButton type="text" size="small" class="atm-toolbar-btn !border-0 !h-7">
        <div class="flex items-center gap-1 min-h-5">
          <div class="flex items-center gap-2">
            <component :is="iconMap.ncPaintRoller" class="h-4 w-4" />

            <!-- Group By -->
            <span v-if="!isMobileMode && !isToolbarIconMode" class="text-capitalize !text-[13px] font-medium">{{
              $t('objects.coloring.title')
            }}</span>
          </div>
          <!-- <span v-if="groupedByColumnIds?.length" class="bg-atm-bg-brand text-atm-content-brand atm-toolbar-btn-chip">{{
            groupedByColumnIds.length
          }}</span> -->
        </div>
      </AtButton>
      <template #overlay>
        <SmartsheetToolbarRowColorFilterTypeOptionOSS />
      </template>
    </AtDropdown>
  </template>
  <template v-else></template>
</template>
