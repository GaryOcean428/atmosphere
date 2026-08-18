<script lang="ts" setup>
interface MenuItem {
  title: string
  onClick: () => void
  danger?: boolean
  icon?: IconMapKey
}

interface Props {
  items: MenuItem[]
}

const props = withDefaults(defineProps<Props>(), {})

const { items } = toRefs(props)

const isOpen = ref(false)
</script>

<template>
  <AtDropdown v-model:visible="isOpen" placement="bottomRight">
    <AtButton type="text" icon-only size="xsmall">
      <template #icon>
        <GeneralIcon icon="threeDotVertical" />
      </template>
    </AtButton>
    <template #overlay>
      <AtMenu variant="small" @click="isOpen = false">
        <template v-for="(item, idx) of items" :key="idx">
          <AtDivider v-if="item.danger" />

          <AtMenuItem :danger="item.danger" @click="item.onClick">
            <GeneralIcon :icon="item.icon" />

            {{ item.title }}
          </AtMenuItem>
        </template>
      </AtMenu>
    </template>
  </AtDropdown>
</template>
