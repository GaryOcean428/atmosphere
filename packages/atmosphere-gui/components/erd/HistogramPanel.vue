<script lang="ts" setup>
import { Panel, PanelPosition } from '@vue-flow/additional-components'
</script>

<template>
  <Panel
    class="text-xs bg-atm-bg-default border-1 rounded border-atm-border-gray-medium shadow-md p-1.5 z-50 atm-erd-histogram"
    :position="PanelPosition.TopLeft"
  >
    <div class="flex flex-col">
      <div class="flex items-center gap-1.5 p-2">
        <component :is="iconMap.table" class="atm-table-icon !text-atm-gray-600/75" />
        <div>{{ $t('objects.table') }}</div>
      </div>

      <div class="flex items-center gap-1.5 p-2">
        <component :is="iconMap.eye" class="atm-table-icon" />
        <div>{{ $t('objects.sqlView') }}</div>
      </div>
    </div>
  </Panel>
</template>
