<script lang="ts" setup>
interface Props {
  rowCount: number
  rowHeight: number
  totalRowHeight: number
  colCount: number
}

const props = defineProps<Props>()

const background = computed(() => {
  return `repeating-linear-gradient(0deg,var(--atm-bg-default), var(--atm-bg-default) ${
    props.rowHeight - 1
  }px, var(--atm-bg-gray-medium) ${props.rowHeight}px)`
})

const height = computed(() => `${props.totalRowHeight}px`)
</script>

<template>
  <tr
    class="atm-grid-row"
    :style="{
      height,
    }"
  >
    <td
      :colspan="colCount"
      class="atm-grid-cell"
      :style="{
        background,
      }"
    ></td>
  </tr>
</template>
