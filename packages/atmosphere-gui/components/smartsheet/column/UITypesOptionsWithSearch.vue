<script lang="ts" setup>
import { UITypes, UITypesName, UITypesSearchTerms, readonlyMetaAllowedTypes } from 'atmosphere-sdk'

const props = defineProps<{
  options: typeof uiTypes
  extraIcons?: Record<string, string>
}>()

const emits = defineEmits<{ selected: [UITypes] }>()

const { options } = toRefs(props)

const { isMetaReadOnly } = useRoles()

const {
  showUpgradeToUseAiPromptField,
  showUpgradeToUseAiButtonField,
  showUpgradeToUseColourField,
  showUpgradeToUseUuidField,
  showUpgradeToUseAutoNumberField,
} = useEeConfig()

const { t } = useI18n()

const searchQuery = ref('')

const searchBasisInfoMap = ref<Record<string, string>>({})

const filteredOptions = computed(() => {
  searchBasisInfoMap.value = {}

  return (options.value || []).filter((c) => {
    // Step 1: apply default filter
    if (searchCompare([c.name, UITypesName[c.name]], searchQuery.value)) return true

    // Step 2: apply search basis options
    return searchCompare([...(UITypesSearchTerms[c.name] || [])], searchQuery.value, (matchKeyword) => {
      if (!matchKeyword) return

      searchBasisInfoMap.value[c.name] = t('msg.matchedByKeyword', { matchKeyword })
    })
  })
})

const inputRef = ref()

const activeFieldIndex = ref(-1)

const isDisabledUIType = (type: UITypes) => {
  return isMetaReadOnly.value && !readonlyMetaAllowedTypes.includes(type)
}

const onClick = (uidt: UITypes) => {
  if (!uidt || isDisabledUIType(uidt)) return

  if (uidt === AIPrompt && showUpgradeToUseAiPromptField({ triggerSource: 'field-menu-ai-prompt' })) {
    return
  }

  if (uidt === AIButton && showUpgradeToUseAiButtonField({ triggerSource: 'field-menu-ai-button' })) {
    return
  }

  if (uidt === UITypes.Colour && showUpgradeToUseColourField({ triggerSource: 'field-menu-colour-field' })) {
    return
  }

  // EE-only: gate UUID field type behind plan feature flag
  if (uidt === UITypes.UUID && showUpgradeToUseUuidField({ triggerSource: 'field-menu-uuid-field' })) {
    return
  }

  // EE-only: gate AutoNumber field type behind plan feature flag
  if (uidt === UITypes.AutoNumber && showUpgradeToUseAutoNumberField({ triggerSource: 'field-menu-autonumber-field' })) {
    return
  }

  emits('selected', uidt)
}

const handleAutoScrollOption = () => {
  const option = document.querySelector('.atm-column-list-option-active')

  if (option) {
    setTimeout(() => {
      option?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }
}

const onArrowDown = () => {
  activeFieldIndex.value = Math.min(activeFieldIndex.value + 1, filteredOptions.value.length - 1)
  handleAutoScrollOption()
}

const onArrowUp = () => {
  activeFieldIndex.value = Math.max(activeFieldIndex.value - 1, 0)
  handleAutoScrollOption()
}

const handleKeydownEnter = () => {
  if (filteredOptions.value[activeFieldIndex.value]) {
    onClick(filteredOptions.value[activeFieldIndex.value].name)
  } else if (filteredOptions.value[0]) {
    onClick(filteredOptions.value[activeFieldIndex.value].name)
  }
}

onMounted(() => {
  searchQuery.value = ''
  activeFieldIndex.value = options.value?.findIndex((o) => o.name === UITypes.SingleLineText) ?? -1
})

const { isSystem } = useColumnCreateStoreOrThrow()
</script>

<template>
  <div
    class="flex-1 border-1 border-atm-border-gray-medium rounded-lg flex flex-col pb-2"
    data-testid="atm-column-uitypes-options-list-wrapper"
    @keydown.arrow-down.prevent="onArrowDown"
    @keydown.arrow-up.prevent="onArrowUp"
    @keydown.enter.prevent="onClick(filteredOptions[activeFieldIndex].name)"
  >
    <div class="w-full mb-2 !border-b-1" @click.stop>
      <a-input
        ref="inputRef"
        v-model:value="searchQuery"
        :placeholder="`${$t('general.search')} ${$t('labels.columnType').toLowerCase()}`"
        class="atm-column-type-search-input atm-toolbar-dropdown-search-field-input !border-none !shadow-none !py-2 !rounded-t-lg"
        :disabled="isSystem"
        @keydown.enter.stop="handleKeydownEnter"
        @change="activeFieldIndex = 0"
      >
        <template #prefix> <GeneralIcon icon="search" class="atm-search-icon h-4 w-4 mr-1" /> </template>
      </a-input>
    </div>
    <div
      class="atm-column-list-wrapper flex-col w-full max-h-[290px] atm-scrollbar-thin !overflow-y-auto px-2 focus-visible:(shadow-none outline-none ring-0)"
    >
      <div v-if="!filteredOptions.length" class="px-2 py-6 text-atm-content-gray-muted flex flex-col items-center gap-6">
        <img
          src="~assets/img/placeholder/no-search-result-found.png"
          class="!w-[164px] flex-none"
          :alt="$t('title.noSearchResultsFound')"
        />

        {{ options?.length ? $t('title.noResultsMatchedYourSearch') : $t('title.theListIsEmpty') }}
      </div>
      <GeneralSourceRestrictionTooltip
        v-for="(option, index) in filteredOptions"
        :key="index"
        :message="$t('tooltip.typeNotAllowed')"
        :enabled="isDisabledUIType(option.name)"
      >
        <div
          class="flex w-full py-2 items-center justify-between px-2 rounded-md"
          :class="[
            `atm-column-list-option-${index}`,
            {
              'hover:bg-atm-bg-gray-light cursor-pointer': !isDisabledUIType(option.name),
              'bg-atm-bg-gray-light atm-column-list-option-active': activeFieldIndex === index && !isDisabledUIType(option.name),
              '!text-atm-content-gray-disabled cursor-not-allowed': isDisabledUIType(option.name),
              '!text-atm-content-purple-dark': [AIButton, AIPrompt].includes(option.name),
            },
          ]"
          :data-testid="option.name"
          @click="onClick(option.name)"
        >
          <div class="flex flex-1 gap-2 items-center">
            <component
              :is="option.icon"
              class="w-4 h-4"
              :class="isDisabledUIType(option.name) ? '!text-atm-content-gray-disabled' : 'text-atm-content-gray-subtle'"
            />
            <div
              class="text-sm !text-atm-content-gray-subtle"
              :class="{
                'flex-1': !searchBasisInfoMap[option.name],
              }"
            >
              {{ UITypesName[option.name] }}
            </div>
            <div v-if="searchBasisInfoMap[option.name]" class="flex-1 flex">
              <AtTooltip :title="searchBasisInfoMap[option.name]" class="flex cursor-help">
                <GeneralIcon icon="info" class="flex-none h-3.5 w-3.5 text-atm-content-gray-muted" />
              </AtTooltip>
            </div>

            <span v-if="option.deprecated" class="!text-xs !text-atm-content-brand-hover">({{ $t('general.deprecated') }})</span>
            <span v-if="option.isNew" class="text-sm text-atm-content-purple-dark bg-atm-bg-purple-light px-2 rounded-md">{{
              $t('general.new')
            }}</span>
          </div>
          <GeneralIcon
            v-if="extraIcons && extraIcons[option.name]"
            class="!text-atm-content-gray-muted"
            :icon="extraIcons[option.name]"
          />
        </div>
      </GeneralSourceRestrictionTooltip>
    </div>
  </div>
</template>
