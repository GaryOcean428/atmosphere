<script setup lang="ts">
import { generateGroupPath } from '../utils/groupby'
import type { CanvasGroup } from '#imports'

const props = defineProps<{
  group: CanvasGroup
}>()

const emit = defineEmits<{
  (e: 'toggleExpand', group: CanvasGroup): void
  (e: 'toggleExpandAll', path: Array<number>, expand: boolean): void
}>()

const { group } = toRefs(props)

const toggleExpand = (group: CanvasGroup) => {
  emit('toggleExpand', group)
}

const expandAllGroup = () => {
  const path = generateGroupPath(group.value)
  emit('toggleExpandAll', path, true)
}

const collapseAllGroup = () => {
  const path = generateGroupPath(group.value)
  emit('toggleExpandAll', path, false)
}
</script>

<template>
  <AtMenu variant="small">
    <AtMenuItem v-if="group?.isExpanded" @click="toggleExpand(group)">
      <GeneralIcon icon="minimize" />
      {{ $t('labels.collapseGroup') }}
    </AtMenuItem>
    <AtMenuItem v-else @click="toggleExpand(group)">
      <GeneralIcon icon="maximize" />
      {{ $t('labels.expandGroup') }}
    </AtMenuItem>
    <AtMenuItem @click="expandAllGroup">
      <GeneralIcon icon="maximizeAll" />
      {{ $t('labels.expandAll') }}
    </AtMenuItem>
    <AtMenuItem @click="collapseAllGroup">
      <GeneralIcon icon="minimizeAll" />
      {{ $t('labels.collapseAll') }}
    </AtMenuItem>
  </AtMenu>
</template>

<style scoped lang="scss"></style>
