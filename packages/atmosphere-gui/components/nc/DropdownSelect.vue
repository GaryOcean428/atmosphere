<script lang="ts" setup>
/* interface */

const props = defineProps<{
  disabled?: boolean
  tooltip?: string
  items: {
    label: string
    value: string
  }[]
}>()

const modelValue = defineModel<string>()
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<template>
  <AtTooltip :disabled="!props.tooltip">
    <template #title>
      {{ props.tooltip }}
    </template>
    <AtDropdown :disabled="props.disabled" v-bind="$attrs" :class="{ 'pointer-events-none opacity-50': props.disabled }">
      <slot />
      <template #overlay>
        <div class="flex flex-col gap-1 p-1">
          <div
            v-for="item of props.items"
            :key="item.value"
            class="flex items-center justify-between px-2 py-1 rounded-md transition-colors hover:bg-atm-bg-gray-light cursor-pointer"
            :class="{
              'bg-atm-bg-gray-light': modelValue === item.value,
            }"
            @click="modelValue = item.value"
          >
            <AtTooltip class="truncate" show-on-truncate-only>
              <template #title>
                {{ item.label }}
              </template>
              <span>
                {{ item.label }}
              </span>
            </AtTooltip>

            <GeneralIcon v-if="modelValue === item.value" icon="check" class="text-primary" />
          </div>
        </div>
      </template>
    </AtDropdown>
  </AtTooltip>
</template>
