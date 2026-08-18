<script lang="ts" setup>
import type { RowColoringMode } from 'atmosphere-sdk'

const rowColoringMode = ref<RowColoringMode>(null)
</script>

<template>
  <div class="bg-atm-bg-gray-light">
    <a-card>
      <h4>Simple</h4>
      <div>
        Row coloring mode: {{ rowColoringMode }}
        <AtButton type="secondary" size="small" @click="rowColoringMode = null">Clear</AtButton>
      </div>
    </a-card>
    <SmartsheetToolbarRowColorFilterTypeOption v-model:row-coloring-mode="rowColoringMode">
      <template #filter>
        <div class="bg-atm-bg-default animate-animated animate-fadeIn" style="animation-duration: 0.3s">
          This is filter panel <AtButton type="secondary" size="small" @click="rowColoringMode = null">Clear</AtButton>
        </div>
      </template>

      <template #select>
        <div class="bg-atm-bg-default animate-animated animate-fadeIn" style="animation-duration: 0.3s">
          This is select panel <AtButton type="secondary" size="small" @click="rowColoringMode = null">Clear</AtButton>
        </div>
      </template>
    </SmartsheetToolbarRowColorFilterTypeOption>
  </div>
</template>
