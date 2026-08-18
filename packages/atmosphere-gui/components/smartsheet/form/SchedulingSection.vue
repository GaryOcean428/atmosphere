<script lang="ts" setup>
import type { FormType } from 'atmosphere-sdk'

interface Props {
  formViewData: FormType
  isLocked?: boolean
  isEditable?: boolean
}

defineProps<Props>()

defineEmits(['updateView'])
</script>

<template>
  <AtSpanHidden />
</template>
