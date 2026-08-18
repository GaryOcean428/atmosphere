<script setup lang="ts">
import type { UserType } from 'atmosphere-sdk'

const props = withDefaults(
  defineProps<{
    // JSON map of `{ "email": boolean }` stored on the form view's `email` field
    modelValue?: string | null
    baseId?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    baseId: '',
    disabled: false,
  },
)

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change'): void
}>()

const { $api } = useNuxtApp()

const { t } = useI18n()

const { getBaseUsers } = useBases()

const isOpen = ref(false)

const isLoading = ref(false)

const collaborators = ref<UserType[]>([])

// Template ref to AtList — exposes its search-filtered `list` so Select all can honor the active search
const ncListRef = ref<{ list?: UserType[] } | null>(null)

const emailMap = computed<Record<string, boolean>>(() => {
  try {
    return JSON.parse(props.modelValue || '') || {}
  } catch {
    return {}
  }
})

const selectedEmails = computed(() =>
  Object.entries(emailMap.value)
    .filter(([, enabled]) => !!enabled)
    .map(([email]) => email),
)

const selectedCount = computed(() => selectedEmails.value.length)

const triggerLabel = computed(() => {
  if (!selectedCount.value) return t('general.none')

  if (selectedCount.value === 1) {
    const email = selectedEmails.value[0]
    const collab = collaborators.value.find((c) => c.email === email)
    return extractUserDisplayNameOrEmail(collab) || formatUserNameFromEmail(email)
  }

  return t('labels.peopleSelected', { count: selectedCount.value }, selectedCount.value)
})

function isSelected(email: string) {
  return !!emailMap.value[email]
}

function filterOption(query: string, option: AtListItemType) {
  return antSelectFilterOption(query, option, ['email', 'display_name'])
}

function persist(map: Record<string, boolean>) {
  emits('update:modelValue', JSON.stringify(map))
  emits('change')
}

async function checkSmtp() {
  // CE requires the SMTP plugin to be active before form emails can be sent
  if (isEeUI) return true

  const isActive = await $api.plugin.status('smtp')
  if (!isActive) {
    message.info(t('msg.toast.formEmailSMTP'))
    return false
  }

  return true
}

async function toggle(email: string, value: boolean) {
  if (props.disabled) return

  if (value && !(await checkSmtp())) return

  const map = { ...emailMap.value }
  if (value) {
    map[email] = true
  } else {
    delete map[email]
  }

  persist(map)
}

async function selectAll() {
  if (props.disabled) return

  // Honor the active search: only select what is currently visible in the list
  const visible = ncListRef.value?.list ?? collaborators.value
  if (!visible.length) return

  if (!(await checkSmtp())) return

  const map = { ...emailMap.value }
  for (const collab of visible) {
    if (collab.email) map[collab.email] = true
  }

  persist(map)
}

function clearAll() {
  if (props.disabled) return

  persist({})
}

async function loadCollaborators() {
  if (!props.baseId) return

  isLoading.value = true
  try {
    const { users } = await getBaseUsers({ baseId: props.baseId })
    collaborators.value = ((users ?? []) as Array<UserType & { deleted?: boolean }>).filter((user) => user.email && !user.deleted)
  } catch {
    collaborators.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.baseId,
  () => {
    collaborators.value = []
    loadCollaborators()
  },
  { immediate: true },
)

// Refresh the list when the dropdown opens if it could not be loaded earlier (e.g. baseId arrived late)
watch(isOpen, (open) => {
  if (open && !collaborators.value.length) loadCollaborators()
})
</script>

<template>
  <AtDropdown
    v-model:visible="isOpen"
    :disabled="disabled"
    placement="bottomRight"
    overlay-class-name="atm-form-email-responses-overlay"
  >
    <div
      v-e="['a:form-view:email-responses']"
      class="atm-form-email-responses-trigger flex items-center justify-between gap-2 min-w-[180px] h-8 px-3 rounded-lg border-1 border-atm-border-gray-medium transition-colors"
      :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-atm-border-gray-dark'"
      data-testid="atm-form-email-responses-trigger"
    >
      <span class="truncate" :class="selectedCount ? 'text-atm-content-gray' : 'text-atm-content-gray-muted'">
        {{ triggerLabel }}
      </span>
      <GeneralIcon icon="settings" class="flex-none text-atm-content-gray-muted" />
    </div>

    <template #overlay>
      <AtList
        ref="ncListRef"
        :open="isOpen"
        :value="selectedEmails"
        :list="collaborators"
        :is-loading="isLoading"
        is-multi-select
        option-value-key="email"
        option-label-key="email"
        :item-height="48"
        :close-on-select="false"
        show-search-always
        :search-input-placeholder="$t('placeholder.findBaseCollaborator')"
        :filter-option="filterOption"
        :empty-description="$t('labels.noResults')"
        class="atm-form-email-responses-list !w-[300px]"
        item-class-name="!py-1"
      >
        <template #listItem="{ option }">
          <div class="flex items-center w-full min-w-0" :data-testid="`atm-form-email-responses-item-${option.email}`">
            <AtSwitch
              :checked="isSelected(option.email)"
              :disabled="disabled"
              placement="right"
              size="xsmall"
              content-wrapper-class="flex-1 min-w-0 !pl-0"
              @change="(val: boolean) => toggle(option.email, val)"
            >
              <AtUserInfo :user="(option as UserType)" :disabled="disabled" />
            </AtSwitch>
          </div>
        </template>

        <template #listFooter>
          <AtDivider class="!my-1" />
          <div class="flex items-center gap-4 px-3 py-1">
            <AtButton
              v-e="['a:form-view:email-responses:select-all']"
              type="text"
              size="small"
              :disabled="disabled || !collaborators.length"
              data-testid="atm-form-email-responses-select-all"
              @click="selectAll"
            >
              {{ $t('general.selectAll') }}
            </AtButton>
            <AtButton
              v-e="['a:form-view:email-responses:clear-all']"
              type="text"
              size="small"
              :disabled="disabled || !selectedCount"
              data-testid="atm-form-email-responses-clear-all"
              @click="clearAll"
            >
              {{ $t('labels.clearAll') }}
            </AtButton>
          </div>
        </template>
      </AtList>
    </template>
  </AtDropdown>
</template>
