<script lang="ts" setup>
const props = defineProps<{
  base: AtProject
  isMarked?: boolean
  // Indicator icons - shown when base has attribute but displayed in another section
  showStarIndicator?: boolean
  showPrivateIndicator?: boolean
}>()

// Get actions from provider
const { onRename, onDuplicate, onOpenErd, onOpenSettings, onDelete, onUpdateColor, onSelect } = useWsBaseListActionsOrThrow()

const { isUIAllowed } = useRoles()

const { activeProjectId } = storeToRefs(useBases())

const { lastVisitedBase } = useBackToBase({ useFallback: false })

// Local state
const isMenuOpen = ref(false)
const editMode = ref(false)
const tempTitle = ref('')
const inputRef = useTemplateRef('inputRef')

// Computed
const iconColor = computed(() => parseProp(props.base.meta).iconColor)
const baseRole = computed(() => props.base.project_role || props.base.workspace_role)

const isOptionVisible = computed(() => ({
  baseRename: isUIAllowed('baseRename', { roles: baseRole.value }),
  baseDuplicate: isUIAllowed('baseDuplicate', { roles: baseRole.value }),
  baseMiscSettings: isUIAllowed('baseMiscSettings', { roles: baseRole.value }),
  baseDelete: isUIAllowed('baseDelete', { roles: baseRole.value }),
}))

// Handlers
const handleSelect = () => {
  if (editMode.value) return
  onSelect(props.base)
}

const enableEditMode = () => {
  if (!isOptionVisible.value.baseRename) return

  editMode.value = true
  tempTitle.value = props.base.title || ''
  isMenuOpen.value = false

  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

const updateTitle = () => {
  if (tempTitle.value?.trim()) {
    tempTitle.value = tempTitle.value.trim()
  }

  if (!tempTitle.value || tempTitle.value === props.base.title) {
    editMode.value = false
    tempTitle.value = ''
    return
  }

  onRename(props.base, tempTitle.value)
  editMode.value = false
  tempTitle.value = ''
}

const handleDuplicate = () => {
  onDuplicate(props.base)
  isMenuOpen.value = false
}

const handleOpenErd = () => {
  const source = props.base.sources?.[0]

  if (source) {
    onOpenErd(props.base, source)
  }
  isMenuOpen.value = false
}

const handleOpenSettings = () => {
  onOpenSettings(props.base)
  isMenuOpen.value = false
}

const handleDelete = () => {
  onDelete(props.base)
  isMenuOpen.value = false
}

const handleColorChange = (color: string) => {
  if (!isOptionVisible.value.baseRename) return

  onUpdateColor(props.base, color)
}

const onMenuClick = (e: Event) => {
  e.stopPropagation()
}
</script>

<template>
  <div
    :tabindex="0"
    class="atm-base-node group relative flex items-center gap-3 p-4 rounded-xl cursor-pointer border-1 transition-all border-atm-border-gray-medium dark:(border-atm-border-gray-light hover:border-atm-border-gray-medium) hover:shadow-sm"
    :class="{ 'is-marked': isMarked, 'is-editing': editMode }"
    :data-id="base.id"
    :data-testid="`atm-base-list-modal-base-title-${base.title}`"
    @click="handleSelect"
    @keydown.enter.stop="handleSelect"
  >
    <!-- Project Icon with Color Picker -->
    <GeneralBaseIconColorPicker
      :key="`${base.id}_${iconColor}`"
      :managed-app="{
        managed_app_master: base.managed_app_master,
        managed_app_id: base.managed_app_id,
      }"
      :type="base?.type"
      :model-value="iconColor"
      size="medium"
      icon-class="!h-6 !w-6"
      :readonly="!isOptionVisible.baseRename"
      class="-mr-1"
      @update:model-value="handleColorChange"
      @click.stop
    />

    <div class="flex-1 min-w-0 min-h-[28px] flex items-center gap-2">
      <!-- Inline Edit Input -->
      <a-input
        v-if="editMode"
        ref="inputRef"
        v-model:value="tempTitle"
        class="!bg-transparent !text-sm !font-medium !rounded-md !px-1 !h-7 !-ml-1.2"
        @click.stop
        @keyup.enter="updateTitle"
        @keyup.esc="updateTitle"
        @blur="updateTitle"
        @keydown.stop
      />
      <template v-else>
        <!-- Title Display -->
        <AtTooltip show-on-truncate-only class="min-w-0 truncate text-sm font-medium">
          {{ base.title }}

          <template #title>{{ base.title }}</template>
        </AtTooltip>
        <!-- Last opened badge -->
        <div
          v-if="lastVisitedBase?.id === base.id"
          class="flex items-center gap-1 px-1.5 py-1 rounded-full bg-atm-bg-gray-medium/80 text-atm-content-gray-muted text-bodySm font-medium leading-none flex-none"
        >
          {{ $t('labels.lastOpened') }}
        </div>
      </template>
    </div>

    <div class="flex items-center space-x-2">
      <!-- Indicator icons when base has attribute but shown in another section -->
      <div v-if="showStarIndicator || showPrivateIndicator" class="flex items-center gap-1">
        <AtTooltip v-if="showStarIndicator" class="flex">
          <GeneralIcon icon="star" class="flex-none w-3.5 h-3.5 text-atm-content-gray-muted" />
          <template #title>{{ $t('general.starred') }}</template>
        </AtTooltip>
        <AtTooltip v-if="showPrivateIndicator" class="flex">
          <GeneralIcon icon="ncLock" class="flex-none w-3.5 h-3.5 text-atm-content-gray-muted" />
          <template #title>{{ $t('general.private') }}</template>
        </AtTooltip>
      </div>

      <!-- More Options Button -->
      <div
        v-if="!editMode"
        class="atm-base-node-menu-wrapper"
        :class="{ 'is-open': isMenuOpen, 'is-active': activeProjectId === base.id }"
      >
        <AtDropdown
          v-model:visible="isMenuOpen"
          :trigger="['click']"
          placement="bottomRight"
          overlay-class-name="atm-base-node-menu"
        >
          <AtButton :tabindex="-1" type="text" size="xsmall" class="atm-base-node-menu-btn" @click.stop="onMenuClick">
            <GeneralIcon
              v-if="activeProjectId === base.id"
              v-show="!isMenuOpen"
              icon="ncCheck"
              class="atm-base-active-check text-atm-content-brand flex-none"
            />
            <GeneralIcon icon="threeDotVertical" class="atm-base-three-dot text-atm-content-gray-muted flex-none" />
          </AtButton>

          <template #overlay>
            <AtMenu class="!min-w-50" variant="small">
              <!-- Copy Base ID -->
              <AtMenuItemCopyId
                :id="base.id"
                :tooltip="$t('labels.clickToCopyBaseID')"
                :label="$t('labels.baseIdColon', { baseId: base.id })"
              />
              <AtDivider />

              <!-- Rename -->
              <AtMenuItem v-if="isOptionVisible.baseRename" data-testid="atm-base-node-rename" @click="enableEditMode">
                <GeneralIcon icon="rename" />
                {{ $t('general.rename') }} {{ $t('objects.project').toLowerCase() }}
              </AtMenuItem>

              <!-- Duplicate -->
              <AtMenuItem v-if="isOptionVisible.baseDuplicate" data-testid="atm-base-node-duplicate" @click="handleDuplicate">
                <GeneralIcon icon="duplicate" />
                {{ $t('general.duplicate') }} {{ $t('objects.project').toLowerCase() }}
              </AtMenuItem>

              <AtDivider />

              <!-- ERD View -->
              <AtMenuItem v-if="base?.sources?.[0]?.enabled" data-testid="atm-base-node-erd" @click="handleOpenErd">
                <GeneralIcon icon="ncErd" />
                {{ $t('title.relations') }}
              </AtMenuItem>

              <!-- Settings -->
              <AtMenuItem v-if="isOptionVisible.baseMiscSettings" data-testid="atm-base-node-settings" @click="handleOpenSettings">
                <GeneralIcon icon="settings" />
                {{ $t('activity.settings') }}
              </AtMenuItem>

              <template v-if="isOptionVisible.baseDelete">
                <AtDivider />

                <!-- Delete -->
                <AtMenuItem danger data-testid="atm-base-node-delete" @click="handleDelete">
                  <GeneralIcon icon="delete" />
                  {{ $t('general.delete') }} {{ $t('objects.project').toLowerCase() }}
                </AtMenuItem>
              </template>
            </AtMenu>
          </template>
        </AtDropdown>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.atm-base-node {
  @apply bg-atm-bg-gray-extralight;

  .atm-base-node-menu-btn {
    @apply !hover:bg-atm-bg-gray-medium;
  }

  &:hover,
  &:focus-within,
  &:focus-visible {
    @apply bg-atm-bg-gray-light;

    .atm-base-node-menu-wrapper {
      @apply w-6 !flex;

      .atm-base-active-check {
        @apply !hidden;
      }

      .atm-base-three-dot {
        @apply !block;
      }
    }
  }

  &:focus-visible {
    @apply outline-none shadow-focus;
  }

  &.is-marked {
    @apply bg-atm-bg-gray-light border-atm-border-brand;
  }

  &.is-editing {
    @apply cursor-default;
  }
}

.atm-base-node-menu-wrapper {
  @apply w-0 hidden overflow-hidden items-center justify-center;
  @apply transition-all duration-200 ease-in-out;

  &.is-active {
    @apply w-6 flex;

    .atm-base-three-dot {
      @apply hidden;
    }
  }

  &.is-open {
    @apply w-6 !flex;

    .atm-base-three-dot {
      @apply !block;
    }
  }
}
</style>
