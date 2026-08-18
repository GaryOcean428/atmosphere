<script lang="ts" setup>
import type { ViewSettingOverrideOptions, ViewType } from 'atmosphere-sdk'

interface Props {
  view: ViewType
  defaultOptions?: ViewSettingOverrideOptions[]
}

defineProps<Props>()
</script>

<template>
  <AtSpanHidden />
</template>
