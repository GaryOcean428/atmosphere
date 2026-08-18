<template>
  <div class="w-[320px] h-full flex-none p-5 bg-atm-bg-gray-extralight border-l-1 border-atm-border-gray-medium">
    <slot />
    <slot name="divider">
      <AtDivider class="!my-4" />
    </slot>
  </div>
</template>
