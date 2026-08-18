<script setup lang="ts">
import type { NotificationType } from 'atmosphere-sdk'
import { timeAgo } from '~/utils/datetimeUtils'

const props = defineProps<{
  item: NotificationType
}>()

const item = toRef(props, 'item')

const { isMobileMode } = useGlobal()

const notificationStore = useNotification()

const { toggleRead, deleteNotification } = notificationStore
</script>

<template>
  <div class="flex pl-6 pr-4 w-full overflow-x-hidden group py-4 hover:bg-atm-bg-gray-extralight gap-3 relative cursor-pointer">
    <div class="w-9.625">
      <slot name="avatar">
        <GeneralIcon icon="atmosphere1" class="w-8 h-8" />
      </slot>
    </div>

    <div class="text-[13px] min-h-12 w-full leading-5">
      <slot />
    </div>
    <div v-if="item" class="text-xs whitespace-nowrap absolute right-4.1 bottom-5 text-atm-content-gray-subtle2">
      {{ timeAgo(item.created_at) }}
    </div>
    <div class="flex items-start">
      <AtTooltip v-if="!item.is_read">
        <template #title>
          <span>Mark as read</span>
        </template>

        <AtButton
          :class="{
            '!opacity-100': isMobileMode,
          }"
          type="secondary"
          class="!border-0 transition-all duration-100 opacity-0 !group-hover:opacity-100"
          size="xsmall"
          @click.stop="() => toggleRead(item)"
        >
          <GeneralIcon icon="check" class="text-atm-content-gray-subtle" />
        </AtButton>
      </AtTooltip>
      <AtDropdown
        v-else
        :class="{
          '!opacity-100': isMobileMode,
        }"
        class="transition-all duration-100 opacity-0 !group-hover:opacity-100"
        placement="bottomRight"
      >
        <AtButton size="xsmall" type="secondary" @click.stop>
          <GeneralIcon icon="threeDotVertical" />
        </AtButton>

        <template #overlay>
          <AtMenu variant="small">
            <AtMenuItem @click.stop="() => toggleRead(item)"> Mark as unread </AtMenuItem>
            <AtDivider />
            <AtMenuItem danger @click.stop="deleteNotification(item)"> {{ $t('general.delete') }} </AtMenuItem>
          </AtMenu>
        </template>
      </AtDropdown>
    </div>
  </div>
</template>
