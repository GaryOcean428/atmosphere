<script setup lang="ts">
import type { UserType } from 'atmosphere-sdk'

const { user } = defineProps<{
  user: UserType
}>()

const displayName = computed(() => extractUserDisplayNameOrEmail(user))
</script>

<template>
  <div class="flex flex-row items-center gap-x-3 h-12.5 p-2">
    <GeneralUserIcon size="base" :user="user" />
    <div class="flex flex-col justify-center flex-grow">
      <div class="flex flex-col">
        <span class="capitalize font-semibold text-atm-content-gray">{{ displayName }}</span>
        <span class="text-xs text-atm-content-gray-subtle2">{{ user.email }}</span>
      </div>
    </div>
    <slot name="append"></slot>
  </div>
</template>
