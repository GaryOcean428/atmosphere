<script lang="ts" setup>
import type { ViewSettingOverrideOptions, ViewType } from 'atmosphere-sdk'

interface Props {
  modelValue?: boolean
  defaultSelectedCopyViewConfigTypes?: ViewSettingOverrideOptions[]
  destView: ViewType
}
defineProps<Props>()
</script>

<template>
  <AtSpanHidden />
</template>
