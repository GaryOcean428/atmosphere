<script setup lang="ts">
import { UseVirtualList } from '@vueuse/components'
import type { AtButtonProps } from './Button.vue'
import AtTooltip from '~/components/nc/Tooltip.vue'

const props = withDefaults(
  defineProps<{
    current: number
    total: number
    pageSize: number
    entityName?: string
    mode?: 'simple' | 'full'
    variant?: 'default' | 'v2'
    prevPageTooltip?: string
    nextPageTooltip?: string
    firstPageTooltip?: string
    lastPageTooltip?: string
    showSizeChanger?: boolean
  }>(),
  {
    variant: 'default',
  },
)

const emits = defineEmits(['update:current', 'update:pageSize'])

const { total, showSizeChanger } = toRefs(props)

const current = useVModel(props, 'current', emits)

const pageSize = useVModel(props, 'pageSize', emits)

const { gridViewPageSize, setGridViewPageSize } = useGlobal()

const localPageSize = computed({
  get: () => {
    if (!showSizeChanger.value) return pageSize.value

    const storedPageSize = gridViewPageSize.value || 25

    if (pageSize.value !== storedPageSize) {
      pageSize.value = storedPageSize
    }

    return pageSize.value
  },
  set: (val) => {
    setGridViewPageSize(val)

    pageSize.value = val
  },
})

const entityName = computed(() => props.entityName || 'item')

const totalPages = computed(() => Math.max(Math.ceil(total.value / localPageSize.value), 1))

const { isMobileMode } = useGlobal()

const mode = computed(() => props.mode || (isMobileMode.value ? 'simple' : 'full'))

const btnSize = computed<AtButtonProps['size']>(() => (props.variant === 'default' ? 'xsmall' : 'xs'))

const changePage = ({ increase, set }: { increase?: boolean; set?: number }) => {
  if (set) {
    current.value = set
  } else if (increase && current.value < totalPages.value) {
    current.value = current.value + 1
  } else if (current.value > 0) {
    current.value = current.value - 1
  }
}

const goToLastPage = () => {
  current.value = totalPages.value
}

const goToFirstPage = () => {
  current.value = 1
}

const pagesList = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => ({
    value: i + 1,
    label: i + 1,
  }))
})

const pageSizeOptions = [
  {
    value: 25,
    label: '25 / page',
  },
  {
    value: 50,
    label: '50 / page',
  },
  {
    value: 75,
    label: '75 / page',
  },
  {
    value: 100,
    label: '100 / page',
  },
]
</script>

<template>
  <div class="atm-pagination flex flex-row items-center gap-x-0.25" :class="`atm-variant-${variant}`">
    <div class="atm-pagition-btns-wrapper">
      <component :is="props.firstPageTooltip && mode === 'full' ? AtTooltip : 'div'" v-if="mode === 'full'">
        <template v-if="props.firstPageTooltip" #title>
          {{ props.firstPageTooltip }}
        </template>
        <AtButton
          v-e="[`a:pagination:${entityName}:first-page`]"
          class="first-page !border-0"
          type="text"
          :size="btnSize"
          :disabled="current === 1"
          @click="goToFirstPage"
        >
          <GeneralIcon icon="doubleLeftArrow" class="atm-pagination-icon" />
        </AtButton>
      </component>
      <div v-if="variant === 'v2'" class="atm-pagition-v2-border"></div>

      <component :is="props.prevPageTooltip && mode === 'full' ? AtTooltip : 'div'">
        <template v-if="props.prevPageTooltip" #title>
          {{ props.prevPageTooltip }}
        </template>
        <AtButton
          v-e="[`a:pagination:${entityName}:prev-page`]"
          class="prev-page"
          type="text"
          :size="btnSize"
          :disabled="current === 1"
          @click="changePage({ increase: false })"
        >
          <GeneralIcon icon="arrowLeft" class="atm-pagination-icon" />
        </AtButton>
      </component>
    </div>

    <div v-if="!isMobileMode" class="atm-pagination-selector-wrapper text-atm-content-gray-muted">
      <AtDropdown placement="top" overlay-class-name="!shadow-none">
        <div class="flex items-center gap-2">
          <AtButton class="atm-select-page" :type="variant === 'default' ? 'text' : 'secondary'" :size="btnSize">
            <div
              class="flex items-center"
              :class="{
                'gap-1 px-2': variant === 'default',
                'gap-2': variant !== 'default',
              }"
            >
              <span class="atm-current-page">
                {{ current }}
              </span>
              <GeneralIcon icon="arrowDown" class="text-atm-content-gray mt-0.5 atm-select-expand-btn" />
            </div>
          </AtButton>
          <div v-if="variant === 'v2'" class="text-small1 font-500 text-atm-content-gray-subtle">/{{ pagesList.length }}</div>
        </div>

        <template #overlay>
          <AtMenu class="atm-pagination-menu overflow-hidden" variant="small">
            <AtSubMenu
              v-if="showSizeChanger"
              :key="`${localPageSize}page`"
              class="bg-atm-bg-gray-light z-20 top-0 !sticky"
              variant="small"
            >
              <template #title>
                <div class="rounded-lg text-[13px] font-medium w-full">{{ localPageSize }} / page</div>
              </template>

              <AtMenuItem v-for="option in pageSizeOptions" :key="option.value" @click="localPageSize = option.value">
                <span
                  class="text-[13px]"
                  :class="{
                    '!text-atm-content-brand': option.value === localPageSize,
                  }"
                >
                  {{ option.value }} / page
                </span>
              </AtMenuItem>
            </AtSubMenu>

            <UseVirtualList
              :key="localPageSize"
              :list="pagesList"
              height="auto"
              :options="{ itemHeight: 28 }"
              class="mt-1 max-h-46 atm-scrollbar-thin"
            >
              <template #default="{ data: item }">
                <AtMenuItem
                  :key="`${localPageSize}${item.value}`"
                  :style="{
                    height: '28px',
                  }"
                  @click.stop="
                    changePage({
                      set: item.value,
                    })
                  "
                >
                  <div
                    :class="{
                      'text-atm-content-brand': item.value === current,
                    }"
                    class="flex text-[13px] !w-full text-atm-content-gray items-center justify-between"
                  >
                    {{ item.label }}
                  </div>
                </AtMenuItem>
              </template>
            </UseVirtualList>
          </AtMenu>
        </template>
      </AtDropdown>
    </div>

    <div class="atm-pagition-btns-wrapper">
      <component :is="props.nextPageTooltip && mode === 'full' ? AtTooltip : 'div'">
        <template v-if="props.nextPageTooltip" #title>
          {{ props.nextPageTooltip }}
        </template>
        <AtButton
          v-e="[`a:pagination:${entityName}:next-page`]"
          class="next-page"
          type="text"
          :size="btnSize"
          :disabled="current === totalPages"
          @click="changePage({ increase: true })"
        >
          <GeneralIcon icon="arrowRight" class="atm-pagination-icon" />
        </AtButton>
      </component>
      <div v-if="variant === 'v2'" class="atm-pagition-v2-border"></div>

      <component :is="props.lastPageTooltip && mode === 'full' ? AtTooltip : 'div'" v-if="mode === 'full'">
        <template v-if="props.lastPageTooltip" #title>
          {{ props.lastPageTooltip }}
        </template>
        <AtButton
          v-e="[`a:pagination:${entityName}:last-page`]"
          class="last-page"
          type="text"
          :size="btnSize"
          :disabled="current === totalPages"
          @click="goToLastPage"
        >
          <GeneralIcon icon="doubleRightArrow" class="atm-pagination-icon" />
        </AtButton>
      </component>
    </div>

    <div v-if="showSizeChanger && !isMobileMode" class="text-atm-content-gray-muted"></div>
  </div>
</template>

<style lang="scss" scoped>
.atm-pagination-icon {
  @apply w-4 h-4;
}

:deep(.ant-dropdown-menu-title-content) {
  @apply justify-center;
}

:deep(.atm-button:not(:disabled)) {
  .atm-pagination-icon {
    @apply !text-atm-content-gray-muted;
  }
}

.atm-pagition-btns-wrapper {
  @apply flex items-center gap-x-0.25;
}

.atm-pagination {
  &.atm-variant-v2 {
    @apply w-full max-w-[308px] justify-between gap-2;

    .atm-pagition-btns-wrapper {
      @apply border-1 border-atm-border-gray-medium rounded-lg gap-x-0 items-stretch;

      .atm-pagition-v2-border {
        @apply self-stretch border-r-1 border-atm-border-gray-medium;
      }

      .first-page,
      .next-page {
        @apply rounded-r-none px-2;
      }

      .prev-page,
      .last-page {
        @apply rounded-l-none px-2;
      }
    }

    .atm-pagination-selector-wrapper {
      @apply flex-1 flex justify-center items-center children:flex-none;
    }
  }
}
</style>

<style lang="scss"></style>
