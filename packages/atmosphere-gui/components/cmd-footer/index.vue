<script setup lang="ts">
import type { CommandPaletteType } from '~/lib/types'

defineProps<{
  activeCmd: CommandPaletteType
  setActiveCmdView: (cmd: CommandPaletteType) => void
}>()

const renderCmdOrCtrlKey = () => {
  return isMac() ? '⌘' : 'Ctrl'
}
</script>

<template>
  <div class="cmdk-footer absolute inset-x-0 bottom-0 !bg-atm-bg-default">
    <div class="flex justify-center w-full py-2">
      <div
        class="flex flex-grow-1 w-full text-sm items-center gap-2 justify-center cursor-pointer"
        :class="activeCmd === 'cmd-j' ? 'text-atm-content-brand' : ''"
        @click.stop="activeCmd !== 'cmd-j' ? setActiveCmdView('cmd-j') : () => undefined"
      >
        <GeneralIcon icon="ncFileSearch" class="h-4 w-4" />
        {{ $t('objects.document') }}
        <span
          class="text-small !leading-5 px-1 rounded-md border-1"
          :class="
            activeCmd === 'cmd-j'
              ? 'bg-atm-fill-primary border-atm-border-brand text-atm-content-inverted-primary'
              : 'bg-atm-bg-gray-medium border-atm-border-gray-medium'
          "
        >
          {{ renderCmdOrCtrlKey() }} + J
        </span>
      </div>
      <div
        class="flex flex-grow-1 w-full text-sm items-center gap-2 justify-center cursor-pointer"
        :class="activeCmd === 'cmd-k' ? 'text-atm-content-brand' : ''"
        @click.stop="activeCmd !== 'cmd-k' ? setActiveCmdView('cmd-k') : () => undefined"
      >
        <GeneralIcon icon="ncCornerUpRight" class="h-4 w-4" />
        {{ $t('labels.quickNavigation') }}
        <span
          class="text-small !leading-5 px-1 rounded-md border-1"
          :class="
            activeCmd === 'cmd-k'
              ? 'bg-atm-fill-primary border-atm-border-brand text-atm-content-inverted-primary'
              : 'bg-atm-bg-gray-medium border-atm-border-gray-medium'
          "
        >
          {{ renderCmdOrCtrlKey() }} + K
        </span>
      </div>
      <div
        class="flex flex-grow-1 w-full text-sm items-center gap-2 justify-center cursor-pointer"
        :class="activeCmd === 'cmd-l' ? 'text-atm-content-brand' : ''"
        @click.stop="activeCmd !== 'cmd-l' ? setActiveCmdView('cmd-l') : () => undefined"
      >
        <MdiClockOutline class="h-4 w-4" />
        {{ $t('labels.recent') }}
        <span
          class="text-small !leading-5 px-1 rounded-md border-1"
          :class="
            activeCmd === 'cmd-l'
              ? 'bg-atm-fill-primary border-atm-border-brand text-atm-content-inverted-primary'
              : 'bg-atm-bg-gray-medium border-atm-border-gray-medium'
          "
        >
          {{ renderCmdOrCtrlKey() }} + L
        </span>
      </div>
    </div>
  </div>
</template>
