<script lang="ts" setup>
import { ProjectRoles, RoleColors, RoleIcons, RoleLabels } from 'atmosphere-sdk'
import type { SelectValue } from 'ant-design-vue/es/select'
import type { IconMapKey } from '#imports'

const props = withDefaults(
  defineProps<{
    role: keyof typeof RoleLabels
    roles: (keyof typeof RoleLabels)[]
    disabledRoles?: (keyof typeof RoleLabels)[]
    disabledRolesTooltip?: Record<keyof typeof RoleLabels, string>
    onRoleChange: (role: keyof typeof RoleLabels) => void | Promise<any>
    border?: boolean
    description?: boolean
    inherit?: string
    size?: 'sm' | 'md' | 'lg'
    showInherit?: boolean
    placement?: 'bottomRight' | 'bottomLeft'
    inheritedRoleIcon?: string
    inheritSource?: 'workspace' | 'team'
    effectiveRole?: string
  }>(),
  {
    border: true,
    description: true,
    size: 'sm',
    showInherit: false,
    placement: 'bottomLeft',
    inheritedRoleIcon: undefined,
    inheritSource: undefined,
    effectiveRole: undefined,
  },
)

const { role, inherit, showInherit, size, placement, description } = toRefs(props)

const { t } = useI18n()

const { getResponsiveValue } = useGlobal()

const isDropdownOpen = ref(false)

const newRole = ref<null | keyof typeof RoleLabels>(null)

async function onChangeRole(val: SelectValue) {
  if (val === role.value) return

  newRole.value = val as keyof typeof RoleLabels

  await props.onRoleChange(val as keyof typeof RoleLabels)

  newRole.value = null
}

const roleSelectorOptions = computed<AtListItemType[]>(() => {
  return (props.disabledRoles || []).concat(props.roles || []).map((role: keyof typeof RoleLabels): AtListItemType => {
    return {
      value: role,
      label: t(`objects.roleType.${RoleLabels[role]}`),
      description: t(`objects.roleDescription.${role}`),
      icon: RoleIcons[role],
      color: RoleColors[role],
      ncItemDisabled: props.disabledRoles?.includes(role),
      ncItemTooltip: props.disabledRoles?.includes(role) ? props.disabledRolesTooltip?.[role] ?? '' : '',
    }
  })
})
</script>

<template>
  <div class="atm-roles-selector relative flex items-center">
    <AtListDropdown
      v-model:visible="isDropdownOpen"
      :default-slot-wrapper="false"
      default-slot-wrapper-class="flex-1 flex items-center gap-3"
      :placement="placement"
    >
      <div class="flex flex-col gap-1 cursor-pointer">
        <RolesBadge data-testid="roles" :border="false" :role="effectiveRole || role" :size="size" clickable class="flex-none" />
        <div
          v-if="showInherit && role === ProjectRoles.INHERIT && !!inherit"
          class="flex items-center gap-1 text-xs text-atm-content-gray-muted"
        >
          <GeneralIcon icon="role_inherit" class="h-3 w-3" />
          <span>{{
            inheritSource === 'team' ? $t('tooltip.roleInheritedFromTeam') : $t('tooltip.roleInheritedFromWorkspace')
          }}</span>
        </div>
      </div>

      <template #overlay="{ onEsc }">
        <AtList
          v-model:open="isDropdownOpen"
          :value="role"
          :list="roleSelectorOptions"
          :item-height="!description ? 48 : 72"
          class="!w-auto max-w-80"
          :class="{
            'min-w-50': !description,
            'min-w-80': description,
          }"
          :is-locked="!!newRole"
          variant="default"
          :focus-search-on-open="getResponsiveValue(false, true)"
          item-class-name="atm-role-select-dropdown !px-3"
          :wrapper-class-name="`!h-auto atm-role-selector-dropdown ${!!newRole ? '!cursor-wait' : ''}`"
          @update:value="onChangeRole"
          @escape="onEsc"
        >
          <template #listItem="{ option }">
            <div class="w-full flex flex-col rounded-md" :class="[`atm-role-select-${option.value}`]">
              <div class="w-full flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <GeneralIcon
                    :icon="(option.icon as IconMapKey)"
                    class="flex-none h-4 w-4"
                    :class="roleColorsMapping[option.color]?.content ?? 'text-atm-content-brand-hover'"
                  />
                  <span
                    class="text-captionDropdownDefault"
                    :class="[
                      roleColorsMapping[option.color]?.content ?? 'text-atm-content-brand-hover',
                      {
                        '!font-semibold': !description,
                      },
                    ]"
                  >
                    {{ option.label }}
                  </span>
                </div>
                <GeneralLoader v-if="option.value === newRole" size="medium" />
                <GeneralIcon v-else-if="!newRole && option.value === role" icon="check" class="text-atm-content-brand h-4 w-4" />
              </div>
              <div
                v-if="description"
                class="text-bodySm !font-light ml-6"
                :class="
                  option.value === ProjectRoles.INHERIT
                    ? 'text-atm-content-gray-muted dark:text-atm-content-gray-light'
                    : 'text-atm-content-gray-muted'
                "
              >
                {{ option.description }}
              </div>
            </div>
          </template>
        </AtList>
      </template>
    </AtListDropdown>
  </div>
</template>
