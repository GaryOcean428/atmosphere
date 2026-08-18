<script lang="ts" setup>
import { RelationTypes } from 'atmosphere-sdk'

const {
  relation,
  relatedTableTitle,
  tableTitle,
  linkedRecords = 0,
} = defineProps<{
  relation: string
  header?: string | null
  tableTitle: string
  relatedTableTitle: string
  displayValue?: string
  linkedRecords?: number
}>()

const { t } = useI18n()

const relationMeta = computed(() => {
  if (relation === RelationTypes.HAS_MANY || relation === RelationTypes.ONE_TO_MANY) {
    return {
      title: t('msg.hm.title'),
      icon: iconMap.hm,
      tooltip_desc: t('msg.hm.tooltip_desc'),
      tooltip_desc2: t('msg.hm.tooltip_desc2'),
    }
  } else if (relation === RelationTypes.MANY_TO_MANY) {
    return {
      title: t('msg.mm.title'),
      icon: iconMap.mm,

      tooltip_desc: t('msg.mm.tooltip_desc'),
      tooltip_desc2: t('msg.mm.tooltip_desc2'),
    }
  } else if (relation === RelationTypes.MANY_TO_ONE || relation === RelationTypes.BELONGS_TO) {
    return {
      title: t('msg.bt.title'),
      icon: iconMap.bt,
      tooltip_desc: t('msg.bt.tooltip_desc'),
      tooltip_desc2: t('msg.bt.tooltip_desc2'),
    }
  } else {
    return {
      title: t('msg.oo.title'),
      icon: iconMap.oneToOneSolid,
      tooltip_desc: t('msg.oo.tooltip_desc'),
      tooltip_desc2: t('msg.oo.tooltip_desc2'),
    }
  }
})
</script>

<template>
  <div
    class="flex-none flex rounded-md gap-1 items-center p-1 max-h-7"
    :class="{
      'bg-atm-bg-gray-medium text-atm-content-gray-subtle2': !linkedRecords,
      'bg-atm-bg-orange-dark text-atm-content-orange-dark': (relation === 'hm' || relation === 'om') && linkedRecords,
      'bg-atm-bg-pink-dark text-atm-content-pink-dark': relation === 'mm' && linkedRecords,
      'bg-atm-bg-blue-dark text-atm-content-blue-dark': (relation === 'bt' || relation === 'mo') && linkedRecords,
      'bg-atm-bg-purple-dark text-atm-content-purple-dark': relation === 'oo' && linkedRecords,
    }"
  >
    <AtTooltip class="z-10 flex" placement="bottom">
      <template #title>
        <div class="p-1">
          <h1 class="text-white font-bold">{{ relationMeta.title }}</h1>
          <div class="text-white">
            {{ relationMeta.tooltip_desc }}
            <span class="bg-gray-700 px-2 rounded-md">
              {{ tableTitle }}
            </span>
            {{ relationMeta.tooltip_desc2 }}
            <span class="bg-gray-700 px-2 rounded-md">
              {{ relatedTableTitle }}
            </span>
          </div>
        </div>
      </template>
      <component
        :is="relationMeta.icon"
        class="atm-relation-icon flex-none w-5 h-5 p-1 rounded-md"
        :class="{
          '!bg-atm-orange-500': relation === 'hm' || relation === 'om',
          '!bg-atm-pink-500': relation === 'mm',
          '!bg-atm-purple-500 one-to-one': relation === 'oo',
          '!bg-atm-blue-500': relation === 'bt' || relation === 'mo',
        }"
      />
    </AtTooltip>

    <div class="leading-[20px]">
      {{ linkedRecords || 0 }} {{ $t('general.linked') }}
      {{ linkedRecords === 1 ? $t('objects.record') : $t('objects.records') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.atm-relation-icon.one-to-one path) {
  @apply stroke-atm-purple-50;
}
</style>
