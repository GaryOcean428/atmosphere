<script setup lang="ts">
const { sharedViewMeta, backgroundAndTextColor } = useSharedFormStoreOrThrow()

const route = useRoute()

const router = useRouter()

const shouldRedirect = (to: string) => {
  if (sharedViewMeta.value.surveyMode) {
    if (!to.includes('survey')) {
      navigateTo({
        path: `/atm/form/${route.params.viewId}/survey`,
        query: route.query,
      })
    }
  } else {
    if (to.includes('survey')) {
      navigateTo({
        path: `/atm/form/${route.params.viewId}`,
        query: route.query,
      })
    }
  }
}

shouldRedirect(route.name as string)

router.afterEach((to) => shouldRedirect(to.name as string))
</script>

<template>
  <div
    class="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 hover-scrollbar-thumb-gray-300 atm-h-screen overflow-y-auto overflow-x-hidden flex flex-col color-transition p-4 lg:p-6 atm-form-view min-h-[600px]"
    :class="{
      'children:(!h-auto my-auto)': sharedViewMeta?.surveyMode,
    }"
    :style="{
      background: backgroundAndTextColor.bgColor,
    }"
  >
    <NuxtPage />
  </div>
</template>

<style lang="scss">
.atm-form-view {
  .atm-data-cell {
    @apply !border-none rounded-none;

    &:focus-within {
      @apply !border-none;
    }
  }

  .atm-input {
    &:not(.layout-list) {
      &:not(:has(.form-attachment-cell.atm-has-attachments)) {
        @apply !bg-atm-bg-default rounded-lg border-solid border-1 border-atm-border-gray-medium !focus-within:border-atm-border-brand;
      }
    }
  }

  .atm-cell,
  .atm-virtual-cell {
    @apply bg-atm-bg-default  appearance-none;

    &.atm-cell-checkbox {
      @apply color-transition !border-0;

      .atm-icon {
        @apply !text-2xl;
      }

      .atm-cell-hover-show {
        opacity: 100 !important;

        div {
          background-color: transparent !important;
        }
      }
    }

    &:not(.atm-cell-checkbox) {
      @apply bg-atm-bg-default;

      &.atm-input {
        @apply w-full h-10;

        &:not(.layout-list) {
          @apply rounded-lg border-solid border-1 border-atm-border-gray-medium focus-within:border-atm-border-brand overflow-hidden;

          &.readonly {
            @apply bg-atm-bg-gray-extralight cursor-not-allowed;

            input,
            textarea {
              @apply !bg-transparent;
            }
          }

          & > div {
            @apply !bg-transparent;
          }
        }
        &.layout-list {
          @apply h-auto !p-0 !bg-transparent !dark:bg-none;
        }

        .duration-cell-wrapper {
          @apply w-full;

          input {
            @apply !outline-none;

            &::placeholder {
              @apply text-atm-content-gray-disabled;
            }
          }
        }

        &:not(.readonly) {
          &:not(.atm-cell-longtext) {
            input,
            textarea,
            &.atm-virtual-cell {
              @apply bg-atm-bg-default !disabled:bg-transparent;
            }
          }
          &.atm-cell-longtext {
            textarea {
              @apply bg-atm-bg-default !disabled:bg-transparent;
            }
          }
        }

        &.atm-cell-longtext {
          @apply p-0 h-auto;
          & > div {
            @apply w-full;
          }
          &.readonly > div {
            @apply px-3 py-1;
          }

          textarea {
            @apply px-3;
          }
        }
        &.atm-cell:not(.atm-cell-longtext) {
          @apply p-2;

          &.atm-cell-phonenumber,
          &.atm-cell-email,
          &.atm-cell-url {
            .atm-cell-field.atm-cell-link-preview {
              @apply px-3;
            }
          }

          &.atm-cell-attachment {
            @apply pl-1;
          }
        }
        &.atm-virtual-cell {
          @apply px-2 py-1;
        }

        &.atm-cell-json {
          & > div {
            @apply w-full;
          }
        }

        .ant-picker,
        input.atm-cell-field {
          @apply !py-0 !px-1;
        }
        &.atm-cell-currency {
          @apply !py-0 !pl-0 flex items-stretch;

          .atm-currency-code {
            @apply !bg-atm-bg-gray-light;
          }
        }
        &.atm-cell-attachment {
          @apply h-auto;
        }
      }
    }
  }
}
</style>
