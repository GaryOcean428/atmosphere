<script lang="ts" setup>
import type { UserType } from 'atmosphere-sdk'

interface Props {
  user: UserType
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const { user, disabled } = toRefs(props)
</script>

<template>
  <div class="atm-user-info w-full flex gap-3 items-center">
    <template v-if="user?.email">
      <GeneralUserIcon size="base" :user="user" class="flex-none atm-user-info-icon" />
      <div class="flex flex-col flex-1 max-w-[calc(100%_-_44px)]">
        <div class="flex items-center gap-1">
          <AtTooltip
            class="truncate max-w-full capitalize font-semibold atm-user-info-name"
            :class="{
              'text-atm-content-gray': !disabled,
              'text-atm-content-gray-muted': disabled,
            }"
            show-on-truncate-only
          >
            <template #title>
              {{ extractUserDisplayNameOrEmail(user) }}
            </template>
            {{ extractUserDisplayNameOrEmail(user) }}
          </AtTooltip>
        </div>
        <AtTooltip
          class="truncate max-w-full text-xs atm-user-info-email"
          :class="{ 'text-atm-content-gray-muted': disabled, 'text-atm-content-gray-subtle2': !disabled }"
          show-on-truncate-only
        >
          <template #title>
            {{ user.email }}
          </template>
          {{ user.email }}
        </AtTooltip>
      </div>
    </template>
    <div v-else class="atm-user-info-email">
      {{ user?.id || user?.fk_user_id }}
    </div>
  </div>
</template>
