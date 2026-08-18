<script setup lang="ts">
import type { WelcomeEventType } from 'atmosphere-sdk'

const props = defineProps<{
  item: WelcomeEventType
}>()

const item = toRef(props, 'item')
</script>

<template>
  <NotificationItemWrapper :item="item">
    <div>Welcome to <span class="font-semibold">Atmosphere!</span> We’re excited to have you onboard.</div>
  </NotificationItemWrapper>
</template>
