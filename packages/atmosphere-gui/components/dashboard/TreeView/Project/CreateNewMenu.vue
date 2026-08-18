<script lang="ts" setup>
import type { SourceType } from 'atmosphere-sdk'

interface Props {
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {})

const emits = defineEmits(['update:visible', 'newTable'])

const vVisible = useVModel(props, 'visible', emits)

const base = inject(ProjectInj)!

const source = computed(() => {
  return base.value.sources?.[0]
})

const { isUIAllowed } = useRoles()

const showBaseOption = (source: SourceType) => {
  return (
    (source.enabled || (base.value.sources || []).length > 1) &&
    ['airtableImport', 'csvImport', 'jsonImport', 'excelImport'].some((permission) => isUIAllowed(permission, { source }))
  )
}
</script>

<template>
  <AtMenu variant="large" data-testid="atm-home-create-new-menu" @click="vVisible = false">
    <AtMenuItem inner-class="w-full" class="atm-menu-item-combo" data-testid="create-new-table" @click="emits('newTable')">
      <div class="w-full flex items-center">
        <div class="flex-1 flex items-center gap-2 cursor-pointer">
          <GeneralIcon icon="table" class="!w-4 !h-4" />
          {{ $t('objects.table') }}
        </div>
        <template v-if="source && showBaseOption(source)">
          <div class="px-1 cursor-default flex items-center h-9 -my-2" @click.stop>
            <div class="h-7 w-px flex-none bg-atm-border-gray-medium" />
          </div>

          <DashboardTreeViewBaseOptions
            v-model:base="base"
            :source="source"
            variant="large"
            submenu-class="atm-sub-menu-item-icon-only"
            title-class="!p-0 hover:bg-atm-bg-brand dark:hover:bg-atm-bg-gray-medium group"
            show-atmosphere-db-import
            :popup-offset="[8, -2]"
          >
            <template #title>
              <div class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer group-hover:text-atm-content-brand">
                <GeneralIcon icon="ncChevronRight" />
              </div>
            </template>
            <template #expandIcon> </template>
            <template #label>
              <AtMenuItemLabel>
                <span class="normal-case min-w-[180px]"> {{ $t('labels.importOptions') }} </span>
              </AtMenuItemLabel>
            </template>
          </DashboardTreeViewBaseOptions>
        </template>
      </div>
    </AtMenuItem>
  </AtMenu>
</template>

<style lang="scss">
.atm-menu-item-combo {
  @apply !pr-1;
}

.atm-sub-menu-item-icon-only {
  @apply !mx-0 -my-1;

  .ant-dropdown-menu-submenu-title {
    @apply !px-0 !w-8 children:w-8 flex items-center !justify-center;
  }
}
</style>
