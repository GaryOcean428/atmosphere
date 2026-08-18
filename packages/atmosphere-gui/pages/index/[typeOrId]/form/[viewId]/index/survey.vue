<script lang="ts" setup>
import { UITypes, isVirtualCol } from 'atmosphere-sdk'
import { breakpointsTailwind } from '@vueuse/core'

enum TransitionDirection {
  Left = 'left',
  Right = 'right',
}

enum AnimationTarget {
  ArrowLeft = 'arrow-left',
  ArrowRight = 'arrow-right',
  OkButton = 'ok-button',
  SubmitButton = 'submit-button',
}

const { md } = useBreakpoints(breakpointsTailwind)

const {
  formState,
  formColumns,
  submitForm,
  submitted,
  secondsRemain,
  sharedFormView,
  sharedViewMeta,
  onReset,
  validateInfos,
  validate,
  clearValidate,
  isRequired,
  handleAddMissingRequiredFieldDefaultState,
  fieldMappings,
  backgroundAndTextColor,
  meta,
  draftWasRestored,
  draftRestoredAt,
  discardDraft,
  dismissDraftBanner,
} = useSharedFormStoreOrThrow()

const { isMobileMode } = storeToRefs(useConfigStore())

const isTransitioning = ref(false)

const transitionName = ref<TransitionDirection>(TransitionDirection.Left)

const animationTarget = ref<AnimationTarget>(AnimationTarget.ArrowRight)

const isAnimating = ref(false)

const isStarted = ref(false)

const dialogShow = ref(false)

const el = ref<HTMLDivElement>()

const activeCell = ref<HTMLElement>()

provide(DropZoneRef, el)

provide(IsSurveyFormInj, ref(true))

const transitionDuration = computed(() => sharedViewMeta.value.transitionDuration || 100)

const steps = computed(() => {
  if (!formColumns.value) return []

  return formColumns.value.reduce<string[]>((acc, column) => {
    const title = column.label || column.title

    if (!title) return acc

    acc.push(title)

    return acc
  }, [])
})

const { index, goToPrevious, goToNext, isFirst, isLast, goTo } = useStepper(steps)

const field = computed(() => formColumns.value?.[index.value])

const fieldHasError = computed(() => {
  if (field.value?.title) {
    return validateInfos[fieldMappings.value[field.value.title]]?.validateStatus === 'error'
  }

  return false
})

function transition(direction: TransitionDirection) {
  isTransitioning.value = true
  transitionName.value = direction

  setTimeout(() => {
    transitionName.value =
      transitionName.value === TransitionDirection.Left ? TransitionDirection.Right : TransitionDirection.Left
  }, transitionDuration.value / 2)

  setTimeout(() => {
    isTransitioning.value = false

    setTimeout(focusInput, 100)
  }, transitionDuration.value)
}

function animate(target: AnimationTarget) {
  animationTarget.value = target

  isAnimating.value = true

  setTimeout(() => {
    isAnimating.value = false
  }, transitionDuration.value / 2)
}

const validateField = async (title: string) => {
  if (fieldMappings.value[title] === undefined) {
    console.warn('Missing mapping field for:', title)
    return false
  }

  try {
    await validate(fieldMappings.value[title])

    return true
  } catch (_e: any) {
    return false
  }
}

async function goNext(animationTarget?: AnimationTarget) {
  if (isLast.value || !isStarted.value || submitted.value || dialogShow.value || !field.value || !field.value.title) return

  if (field.value?.title && !(await validateField(field.value.title))) return

  animate(animationTarget || AnimationTarget.ArrowRight)

  setTimeout(
    () => {
      transition(TransitionDirection.Left)

      goToNext()
    },
    animationTarget === AnimationTarget.OkButton ? 300 : 0,
  )
}

async function goPrevious(animationTarget?: AnimationTarget) {
  if (isFirst.value || !isStarted.value || submitted.value || dialogShow.value) return

  animate(animationTarget || AnimationTarget.ArrowLeft)

  transition(TransitionDirection.Right)

  goToPrevious()
}

function focusInput() {
  if (document && typeof document !== 'undefined') {
    const inputEl =
      (document.querySelector('.atm-cell input') as HTMLInputElement) ||
      (document.querySelector('.atm-cell textarea') as HTMLTextAreaElement) ||
      (document.querySelector('.atm-cell [tabindex="0"]') as HTMLElement)

    if (inputEl) {
      activeCell.value = inputEl
      inputEl?.select?.()
      inputEl?.focus?.()
    }
  }
}

function resetForm() {
  clearValidate()
  submitted.value = false
  isStarted.value = false
  transition(TransitionDirection.Right)
  goTo(steps.value[0])
}

async function submit() {
  if (submitted.value) return
  dialogShow.value = false
  submitForm()
}

onReset(resetForm)

const onStart = () => {
  isStarted.value = true
  handleAddMissingRequiredFieldDefaultState()

  setTimeout(() => {
    focusInput()
  }, 100)
}

const handleFocus = () => {
  if (document?.activeElement !== activeCell.value) {
    focusInput()
  }
}

const showSubmitConfirmModal = async () => {
  if (field.value?.title && !(await validateField(field.value.title))) {
    return
  }

  dialogShow.value = true

  setTimeout(() => {
    // AtButton will only focus if document has already focused element
    document.querySelector('.atm-survery-form__confirmation_modal div[tabindex="0"]')?.focus()
    document.querySelector('.atm-survey-form-btn-submit.atm-button')?.focus()
  }, 50)
}

onKeyStroke(['ArrowLeft', 'ArrowDown'], () => {
  if (isMobileMode.value) return

  goPrevious(AnimationTarget.ArrowLeft)
})
onKeyStroke(['ArrowRight', 'ArrowUp'], () => {
  if (isMobileMode.value) return

  goNext(AnimationTarget.ArrowRight)
})
onKeyStroke(['Enter'], async (e) => {
  if (isMobileMode.value || submitted.value) return

  if (!isStarted.value && !submitted.value) {
    onStart()
  } else if (isStarted.value) {
    if (isLast.value) {
      if (dialogShow.value) {
        submit()
      } else {
        e.preventDefault()
        showSubmitConfirmModal()
      }
    } else {
      const activeElement = document.activeElement as HTMLElement

      if (activeElement?.classList && activeElement.classList.contains('atm-survey-form__btn-next')) return

      goNext(AnimationTarget.OkButton, true)
    }
  }
})

onKeyStroke('Escape', () => {
  if (document) {
    ;(document.activeElement as HTMLElement)?.blur?.()
  }
})

onMounted(() => {
  if (!md.value) {
    const { direction } = usePointerSwipe(el, {
      onSwipe: () => {
        if (isTransitioning.value) return

        if (direction.value === 'left') {
          goNext()
        } else if (direction.value === 'right') {
          goPrevious()
        }
      },
    })
  }
})

const { message: templatedMessage } = useTemplatedMessage(
  computed(() => sharedFormView?.value?.success_msg),
  computed(() => formState.value),
  formColumns,
  meta,
)
</script>

<template>
  <div class="h-full">
    <div class="survey md:p-0 w-full h-full flex flex-col max-w-[max(33%,688px)] mx-auto mb-4rem lg:mb-10rem">
      <div v-if="sharedFormView" class="my-auto z-2">
        <template v-if="!isStarted || submitted">
          <GeneralFormBanner
            v-if="sharedFormView && !parseProp(sharedFormView?.meta).hide_banner"
            :banner-image-url="sharedFormView.banner_image_url"
            class="flex-none mb-4"
          />
          <div class="rounded-3xl border-1 border-atm-border-gray-medium p-6 lg:p-12 bg-atm-bg-default">
            <h1 class="text-2xl font-bold text-atm-content-gray-emphasis mb-4" data-testid="atm-survey-form__heading">
              {{ sharedFormView.heading }}
            </h1>

            <div v-if="submitted" class="flex flex-col justify-center items-center text-center">
              <a-alert
                class="atm-survey-form__success-msg !p-4 !rounded-lg text-left w-full !bg-atm-bg-default !border-atm-border-gray-medium !items-start"
                type="success"
                data-testid="atm-survey-form__success-msg"
                outlined
                show-icon
              >
                <template #message>
                  <LazyCellRichText
                    v-if="templatedMessage"
                    :value="templatedMessage"
                    class="!h-auto -ml-1"
                    is-form-field
                    read-only
                    sync-value-change
                  />
                  <span v-else>
                    {{ $t('msg.info.thankYou') }}
                  </span>
                </template>
                <template v-if="!templatedMessage" #description>
                  {{ $t('msg.info.submittedFormData') }}
                </template>

                <template #icon>
                  <div>
                    <GeneralIcon icon="circleCheck2" class="text-[#27D665]"></GeneralIcon>
                  </div>
                </template>
              </a-alert>

              <div
                v-if="
                  typeof sharedFormView?.redirect_url !== 'string' &&
                  (sharedFormView.show_blank_form || sharedFormView.submit_another_form)
                "
                class="mt-16 w-full flex justify-between items-center flex-wrap gap-3"
              >
                <p v-if="sharedFormView?.show_blank_form" class="text-sm text-atm-content-gray-muted m-0">
                  {{ $t('labels.newFormLoaded') }} {{ secondsRemain }} {{ $t('general.seconds').toLowerCase() }}
                </p>

                <div class="flex-1 self-end flex justify-end">
                  <AtButton
                    v-if="sharedFormView?.submit_another_form"
                    type="secondary"
                    :size="isMobileMode ? 'medium' : 'small'"
                    data-testid="atm-survey-form__btn-submit-another-form"
                    @click="resetForm"
                  >
                    {{ $t('activity.submitAnotherForm') }}
                  </AtButton>
                </div>
              </div>
            </div>
            <template v-else-if="!isStarted">
              <div v-if="sharedFormView.subheading?.trim()">
                <LazyCellRichText
                  :value="sharedFormView.subheading"
                  class="font-medium text-base text-atm-content-gray-muted !h-auto mb-4 -ml-1"
                  is-form-field
                  read-only
                  sync-value-change
                  data-testid="atm-survey-form__sub-heading"
                />
              </div>

              <div class="flex justify-end mt-12">
                <div class="flex items-center gap-3">
                  <div class="hidden md:flex text-sm items-center gap-1 text-atm-content-gray">
                    <span> {{ $t('labels.pressEnter') }} ↵ </span>
                  </div>
                  <AtButton
                    :size="isMobileMode ? 'medium' : 'small'"
                    data-testid="atm-survey-form__fill-form-btn"
                    @click="onStart()"
                  >
                    {{ $t('labels.fillForm') }}
                  </AtButton>
                </div>
              </div>
            </template>
          </div>
        </template>
        <div v-else class="px-6 lg:px-12">
          <h1 class="text-2xl font-bold text-atm-content-gray-emphasis line-clamp-2 text-center mb-2rem md:mb-4rem">
            {{ sharedFormView.heading }}
          </h1>
        </div>
        <template v-if="isStarted && !submitted">
          <SmartsheetFormDraftRestoredBanner
            v-if="draftWasRestored"
            :restored-at="draftRestoredAt"
            class="mb-4"
            @discard="discardDraft"
            @close="dismissDraftBanner"
          />
          <Transition :name="`slide-${transitionName}`" :duration="transitionDuration" mode="out-in">
            <a-form :model="formState">
              <div
                ref="el"
                :key="field?.title"
                class="flex flex-col gap-4 w-full m-auto rounded-xl border-1 border-atm-border-gray-medium bg-atm-bg-default p-6 lg:p-12"
              >
                <div class="select-none text-atm-content-gray-muted mb-4 md:mb-2" data-testid="atm-survey-form__footer">
                  {{ index + 1 }} / {{ formColumns?.length }}
                </div>

                <div v-if="field" class="flex flex-col gap-2">
                  <div class="atm-form-column-label text-sm font-semibold text-atm-content-gray" data-testid="atm-form-column-label">
                    <span>
                      {{ field.label || field.title }}
                    </span>
                    <span v-if="isRequired(field)" class="text-atm-content-red-medium text-base leading-[18px]">&nbsp;*</span>
                  </div>
                  <div
                    v-if="field?.description"
                    class="atm-form-column-description text-atm-content-gray-muted text-sm"
                    data-testid="atm-survey-form__field-description"
                  >
                    <LazyCellRichText
                      :value="field?.description"
                      class="!h-auto -ml-1"
                      is-form-field
                      read-only
                      sync-value-change
                    />
                  </div>

                  <AtTooltip :disabled="!field?.read_only">
                    <template #title> {{ $t('activity.preFilledFields.lockedFieldTooltip') }} </template>
                    <a-form-item
                      v-if="field.title && fieldMappings[field.title]"
                      :name="fieldMappings[field.title]"
                      class="atm-input-required-error"
                      v-bind="validateInfos[fieldMappings[field.title]]"
                    >
                      <SmartsheetDivDataCell class="relative atm-form-data-cell" @click.stop="handleFocus">
                        <LazySmartsheetVirtualCell
                          v-if="isVirtualCol(field)"
                          v-model="formState[field.title]"
                          class="mt-0 atm-input h-auto"
                          :class="{
                            readonly: field?.read_only,
                          }"
                          :row="{ row: {}, oldRow: {}, rowMeta: {} }"
                          :data-testid="`atm-survey-form__input-${toSafeClassName(field.title)}`"
                          :column="field"
                          :read-only="field?.read_only"
                          @update:model-value="validateField(field.title)"
                        />

                        <LazySmartsheetCell
                          v-else
                          v-model="formState[field.title]"
                          class="atm-input h-auto"
                          :class="{ 'layout-list': parseProp(field?.meta)?.isList, 'readonly': field?.read_only }"
                          :data-testid="`atm-survey-form__input-${toSafeClassName(field.title)}`"
                          :column="field"
                          :edit-enabled="!field?.read_only"
                          :read-only="field?.read_only"
                          @update:model-value="validateField(field.title)"
                        />
                        <template v-if="field.uidt === UITypes.LongText" #help>
                          <div class="flex flex-col gap-2 text-atm-content-gray-muted text-xs mt-2">
                            <div class="hidden text-sm text-atm-content-gray-muted md:flex flex-wrap items-center">
                              {{ $t('general.shift') }} <span class="text-primary"> &nbsp;⇧&nbsp; </span> +
                              {{ $t('general.enter') }}
                              <span class="text-primary"> &nbsp;↵&nbsp; </span>
                              {{ $t('msg.info.makeLineBreak') }}
                            </div>
                          </div>
                        </template>
                      </SmartsheetDivDataCell>
                    </a-form-item>
                  </AtTooltip>
                </div>

                <div class="ml-1 mt-4 flex w-full text-lg">
                  <div class="flex-1 flex justify-end">
                    <div v-if="isLast">
                      <AtButton
                        :size="isMobileMode ? 'medium' : 'small'"
                        :class="
                          animationTarget === AnimationTarget.SubmitButton && isAnimating
                            ? 'transform translate-y-[1px] translate-x-[1px] ring ring-accent ring-opacity-100'
                            : ''
                        "
                        :disabled="fieldHasError"
                        data-testid="atm-survey-form__btn-submit-confirm"
                        @click="showSubmitConfirmModal"
                      >
                        {{ $t('general.submit') }} {{ $t('objects.viewType.form') }}
                      </AtButton>
                    </div>

                    <div v-else class="flex items-center gap-3">
                      <div
                        class="hidden md:flex text-sm items-center gap-1"
                        :class="fieldHasError ? 'text-gray-200' : 'text-atm-content-gray'"
                      >
                        <span> {{ $t('labels.pressEnter') }} ↵ </span>
                      </div>
                      <AtButton
                        :size="isMobileMode ? 'medium' : 'small'"
                        data-testid="atm-survey-form__btn-next"
                        class="atm-survey-form__btn-next"
                        :class="[
                          animationTarget === AnimationTarget.OkButton && isAnimating
                            ? 'transform translate-y-[2px] translate-x-[2px] after:(!ring !ring-accent !ring-opacity-100)'
                            : '',
                        ]"
                        :disabled="fieldHasError"
                        @click="goNext()"
                      >
                        {{ $t('labels.next') }}
                      </AtButton>
                    </div>
                  </div>
                </div>
              </div>
            </a-form>
          </Transition>
        </template>
      </div>
      <div class="lg:(absolute bottom-0 right-0 px-4 pb-4) lg:px-10 lg:pb-10">
        <div class="flex justify-end items-center gap-4 atm-survey-form-branding">
          <div class="flex justify-center">
            <GeneralFormBranding
              class="inline-flex mx-auto"
              :style="{
                color: backgroundAndTextColor.textColor,
              }"
            />
          </div>
          <div v-if="isStarted && !submitted" class="flex items-center gap-3">
            <AtButton
              type="secondary"
              :size="isMobileMode ? 'medium' : 'small'"
              data-testid="atm-survey-form__icon-prev"
              :disabled="isFirst"
              @click="goPrevious()"
            >
              <GeneralIcon icon="ncArrowLeft"
            /></AtButton>

            <AtButton
              :size="isMobileMode ? 'medium' : 'small'"
              type="secondary"
              data-testid="atm-survey-form__icon-next"
              :disabled="isLast || fieldHasError"
              @click="goNext()"
            >
              <GeneralIcon icon="ncArrowRight" />
            </AtButton>
          </div>
        </div>
      </div>
    </div>

    <AtModal v-model:visible="dialogShow" size="small" class="atm-survery-form__confirmation_modal">
      <div>
        <div class="text-lg font-bold">{{ $t('general.submit') }} {{ $t('objects.viewType.form') }}</div>
        <div class="mt-1 text-sm">{{ $t('title.surveyFormSubmitConfirmMsg') }}</div>
        <div class="flex justify-end mt-7 gap-x-2">
          <AtButton type="secondary" :size="isMobileMode ? 'medium' : 'small'" @click="dialogShow = false">{{
            $t('general.back')
          }}</AtButton>
          <AtButton
            type="primary"
            :size="isMobileMode ? 'medium' : 'small'"
            data-testid="atm-survey-form__btn-submit"
            class="atm-survey-form-btn-submit"
            @click="submit"
          >
            {{ $t('general.submit') }}
          </AtButton>
        </div>
      </div>
    </AtModal>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-form-item.atm-input-required-error) {
  @apply !mt-0;

  &:not(.ant-form-item-with-help) {
    @apply !mb-7;
  }

  .ant-form-item-explain {
    @apply !min-h-7;
  }
}

.atm-input-required-error {
  max-width: 100%;
  white-space: pre-line;
  :deep(.ant-form-item-explain-error) {
    &:first-child {
      @apply mt-2;
    }
  }

  &:focus-within {
    :deep(.ant-form-item-explain-error) {
      @apply text-atm-content-gray-disabled;
    }
  }
}
:deep(.ant-form-item-has-error .ant-select:not(.ant-select-disabled) .ant-select-selector) {
  border: none !important;
}
:deep(.ant-form-item-has-success .ant-select:not(.ant-select-disabled) .ant-select-selector) {
  border: none !important;
}
</style>

<style lang="scss">
:global(html),
:global(body) {
  @apply overscroll-x-none;
}

.survey {
  .atm-form-column-label {
    .atm-icon {
      @apply mr-2;
    }
  }

  .atm-form-column-label__checkbox {
    @apply flex items-center justify-center gap-2 text-left;
  }

  .atm-form-data-cell.atm-data-cell {
    @apply !border-none rounded-none;

    &:focus-within {
      @apply !border-none;
    }
  }

  .atm-survey-form__success-msg {
    .ant-alert-icon {
      @apply flex items-start;
    }
  }
}

@media (min-width: 1024px) and (max-width: 1170px) {
  .atm-survey-form-branding {
    @apply flex-col;
  }
}
</style>
