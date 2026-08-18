<script lang="ts" setup>
import { EnterpriseOrgUserRoles } from 'atmosphere-sdk'
import type { RequestParams, UserType } from 'atmosphere-sdk'

const { api, isLoading } = useApi()

// for loading screen
isLoading.value = true

const { $e } = useNuxtApp()

const { t } = useI18n()

const { dashboardUrl } = useDashboard()

const { appInfo, user: loggedInUser } = useGlobal()

const { copy } = useCopy()

const { sorts, sortDirection, loadSorts, handleGetSortedData, saveOrUpdate: saveOrUpdateUserSort } = useUserSorts('Org')

const users = ref<UserType[]>([])

const hasOrgRoles = computed(() => appInfo.value?.isOnPrem && appInfo.value?.ee)

const updateOrgRole = async (user: UserType, newRole: string) => {
  try {
    const orgId = appInfo.value?.defaultOrgId || ATMOSPHERE_DEFAULT_ORG_ID
    await api.instance.patch(`/api/v1/orgs/${orgId}/users/${user.id}`, { org_role: newRole })

    // Update reactively by replacing the user object in the array
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], org_roles: newRole } as any
    }

    message.success(t('msg.success.roleUpdated'))
    $e('a:org-user:role-update', { role: newRole })
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  }
}

const sortedUsers = computed(() => {
  return handleGetSortedData(users.value, sorts.value) as UserType[]
})

const currentPage = ref(1)

const currentLimit = ref(10)

const showUserModal = ref(false)

const userMadalKey = ref(0)

const isOpen = ref(false)

const searchText = ref<string>('')

const pagination = reactive({
  total: 0,
  pageSize: 10,
  position: ['bottomCenter'],
})

const loadUsers = useDebounceFn(async (page = currentPage.value, limit = currentLimit.value) => {
  currentPage.value = page
  try {
    const response: any = await api.orgUsers.list({
      query: {
        limit,
        offset: searchText.value.length === 0 ? (page - 1) * limit : 0,
        query: searchText.value,
      },
    } as RequestParams)

    if (!response) return

    pagination.total = response.pageInfo.totalRows ?? 0

    pagination.pageSize = 10

    users.value = response.list as UserType[]
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  }
}, 500)

onMounted(() => {
  loadUsers()
  loadSorts()
})

const deleteModalInfo = ref<UserType | null>(null)

const deleteUser = async () => {
  try {
    if (hasOrgRoles.value) {
      const orgId = appInfo.value?.defaultOrgId || ATMOSPHERE_DEFAULT_ORG_ID
      await api.instance.delete(`/api/v1/orgs/${orgId}/users/${deleteModalInfo.value?.id}`)
    } else {
      await api.orgUsers.delete(deleteModalInfo.value?.id as string)
    }
    message.success(t('msg.success.userDeleted'))

    await loadUsers()

    if (!users.value.length && currentPage.value !== 1) {
      currentPage.value--
      loadUsers(currentPage.value)
    }
    $e('a:org-user:user-deleted')
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    // closing the modal
    isOpen.value = false
    deleteModalInfo.value = null
  }
}

const resendInvite = async (user: UserType) => {
  try {
    await api.orgUsers.resendInvite(user.id)

    // Invite email sent successfully
    message.success(t('msg.success.inviteEmailSent'))
    await loadUsers()
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  }

  $e('a:org-user:resend-invite')
}

const copyInviteUrl = async (user: User) => {
  if (!user.invite_token) return
  try {
    await copy(`${dashboardUrl.value}/signup/${user.invite_token}`)

    // Invite URL copied to clipboard
    message.success(t('msg.success.inviteURLCopied'))
  } catch (e: any) {
    message.error(e.message)
  }
  $e('c:user:copy-url')
}

const copyPasswordResetUrl = async (user: UserType) => {
  try {
    const { reset_password_url } = await api.orgUsers.generatePasswordResetToken(user.id)

    await copy(reset_password_url!)

    // Invite URL copied to clipboard
    message.success(t('msg.success.passwordResetURLCopied'))
    $e('c:user:copy-url')
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  }
}

const openInviteModal = () => {
  showUserModal.value = true
  userMadalKey.value++
}

const openDeleteModal = (user: UserType) => {
  deleteModalInfo.value = user
  isOpen.value = true
}

const orderBy = computed<Record<string, SordDirectionType>>({
  get: () => {
    return sortDirection.value
  },
  set: (value: Record<string, SordDirectionType>) => {
    // Check if value is an empty object
    if (Object.keys(value).length === 0) {
      saveOrUpdateUserSort({})
      return
    }

    const [field, direction] = Object.entries(value)[0]

    saveOrUpdateUserSort({
      field,
      direction,
    })
  },
})

const orgAllowedRoles = computed(() => {
  return [EnterpriseOrgUserRoles.VIEWER, EnterpriseOrgUserRoles.CREATOR, EnterpriseOrgUserRoles.ADMIN]
})

const onOrgRoleChange = (user: UserType) => async (role: string) => {
  await updateOrgRole(user, role)
}

const columns = computed(() => {
  const cols: AtTableColumnProps[] = [
    {
      key: 'email',
      title: t('objects.members'),
      minWidth: 220,
      dataIndex: 'email',
      showOrderBy: true,
    },
  ]

  if (hasOrgRoles.value) {
    cols.push({
      key: 'org_roles',
      title: t('labels.orgRole'),
      basis: '25%',
      minWidth: 200,
    })
  }

  cols.push({
    key: 'created_at',
    title: t('title.dateJoined'),
    basis: '25%',
    minWidth: 200,
  })

  cols.push({
    key: 'action',
    title: t('labels.actions'),
    width: 110,
    minWidth: 110,
    justify: 'justify-end',
  })

  return cols
})
</script>

<template>
  <div class="flex flex-col" data-testid="atm-super-user-list">
    <AtPageHeader>
      <template #icon>
        <GeneralIcon icon="users" class="flex-none h-5 w-5" />
      </template>
      <template #title>
        <span data-rec="true">
          {{ $t('title.userManagement') }}
        </span>
      </template>
    </AtPageHeader>
    <div class="atm-content-max-w p-6 h-[calc(100vh_-_100px)] flex flex-col gap-6 overflow-auto atm-scrollbar-thin">
      <div class="h-full">
        <div class="h-full">
          <div class="flex gap-4 items-center justify-between">
            <a-input
              v-model:value="searchText"
              class="!max-w-90 !rounded-md"
              :placeholder="$t('title.searchMembers')"
              @change="loadUsers()"
            >
              <template #prefix>
                <PhMagnifyingGlassBold class="!h-3.5 text-atm-content-gray-muted" />
              </template>
            </a-input>
            <div class="flex gap-3 items-center justify-center">
              <component :is="iconMap.reload" class="cursor-pointer" @click="loadUsers(currentPage, currentLimit)" />
              <AtButton data-testid="atm-super-user-invite" size="small" type="primary" @click="openInviteModal">
                <div class="flex items-center gap-1" data-rec="true">
                  <component :is="iconMap.plus" />
                  {{ $t('activity.inviteUser') }}
                </div>
              </AtButton>
            </div>
          </div>
          <AtTable
            v-model:order-by="orderBy"
            :columns="columns"
            :data="sortedUsers"
            :is-data-loading="isLoading"
            class="h-[calc(100%-58px)] mt-6"
          >
            <template #bodyCell="{ column, record: el }">
              <div v-if="column.key === 'email'" class="w-full flex gap-3 items-center">
                <GeneralUserIcon size="base" :user="el" class="flex-none" />
                <div class="flex flex-col flex-1 max-w-[calc(100%_-_44px)]">
                  <div class="flex items-center gap-1">
                    <AtTooltip class="truncate max-w-full text-atm-content-gray capitalize font-semibold" show-on-truncate-only>
                      <template #title>
                        {{ extractUserDisplayNameOrEmail(el) }}
                      </template>
                      {{ extractUserDisplayNameOrEmail(el) }}
                    </AtTooltip>
                    <AtBadge
                      v-if="el.roles?.includes('super')"
                      :border="false"
                      color="purple"
                      class="text-[10px] leading-[14px] !h-[18px] font-semibold flex-none"
                    >
                      {{ $t('objects.roleType.superAdmin') }}
                    </AtBadge>
                    <AtTooltip v-if="el.scim_managed" :title="$t('labels.scimManagedUserTooltip')" class="flex items-center">
                      <AtBadge
                        :border="false"
                        color="blue"
                        class="text-atm-content-blue-dark text-[10px] leading-[14px] !h-[18px] font-semibold flex-none"
                      >
                        {{ $t('labels.scimManaged') }}
                      </AtBadge>
                    </AtTooltip>
                  </div>
                  <AtTooltip class="truncate max-w-full text-xs text-atm-content-gray-subtle2" show-on-truncate-only>
                    <template #title>
                      {{ el.email }}
                    </template>
                    {{ el.email }}
                  </AtTooltip>
                </div>
              </div>
              <div v-if="column.key === 'org_roles'" class="flex items-center">
                <RolesSelectorV2
                  :on-role-change="onOrgRoleChange(el)"
                  :role="el.org_roles || EnterpriseOrgUserRoles.VIEWER"
                  :roles="orgAllowedRoles"
                  class="cursor-pointer"
                  data-testid="atm-org-role-select"
                />
              </div>
              <div v-if="column.key === 'created_at'">
                <AtTooltip class="max-w-full">
                  <template #title>
                    {{ parseStringDateTime(el.created_at) }}
                  </template>
                  <span>
                    {{ timeAgo(el.created_at) }}
                  </span>
                </AtTooltip>
              </div>
              <div v-if="column.key === 'action'" class="flex items-center gap-2">
                <AtDropdown :trigger="['click']" placement="bottomRight">
                  <AtButton size="xsmall" type="ghost">
                    <MdiDotsVertical
                      class="text-atm-content-gray-subtle2 h-5.5 w-5.5 rounded outline-0 p-0.5 atm-workspace-menu transform transition-transform !text-gray-400 cursor-pointer hover:(!text-atm-content-inverted-secondary-disabled bg-atm-bg-gray-light)"
                    />
                  </AtButton>

                  <template #overlay>
                    <AtMenu variant="small">
                      <AtMenuItemCopyId
                        :id="el.id"
                        :tooltip="$t('labels.clickToCopyUserID')"
                        :label="
                          $t('labels.userIdColon', {
                            userId: el.id,
                          })
                        "
                      />

                      <template v-if="!el.roles?.includes('super')">
                        <AtDivider />

                        <!-- Resend invite Email -->
                        <AtMenuItem @click="resendInvite(el)">
                          <component :is="iconMap.email" class="flex text-atm-content-gray-subtle2" />
                          <div data-rec="true">{{ $t('activity.resendInvite') }}</div>
                        </AtMenuItem>
                        <AtMenuItem @click="copyInviteUrl(el)">
                          <component :is="iconMap.copy" class="flex text-atm-content-gray-subtle2" />
                          <div data-rec="true">{{ $t('activity.copyInviteURL') }}</div>
                        </AtMenuItem>
                        <AtMenuItem @click="copyPasswordResetUrl(el)">
                          <component :is="iconMap.copy" class="flex text-atm-content-gray-subtle2" />
                          <div>{{ $t('activity.copyPasswordResetURL') }}</div>
                        </AtMenuItem>
                        <template v-if="el.id !== loggedInUser?.id">
                          <AtDivider v-if="!el.roles?.includes('super')" />
                          <AtTooltip
                            :disabled="!el.scim_managed"
                            :title="$t('labels.scimManagedRemovalTooltip')"
                            placement="left"
                          >
                            <AtMenuItem :disabled="el.scim_managed" data-rec="true" danger @click="openDeleteModal(el)">
                              <MaterialSymbolsDeleteOutlineRounded />
                              {{ $t('general.remove') }} {{ $t('objects.user') }}
                            </AtMenuItem>
                          </AtTooltip>
                        </template>
                      </template>
                    </AtMenu>
                  </template>
                </AtDropdown>
              </div>
            </template>
            <template #extraRow>
              <div
                v-if="pagination.total === 1 && sortedUsers.length === 1"
                class="w-full pt-12 pb-4 px-2 flex flex-col items-center gap-6 text-center"
              >
                <div class="text-2xl text-atm-content-gray font-bold">
                  {{ $t('placeholder.inviteYourTeam') }}
                </div>
                <div class="text-sm text-atm-content-gray-subtle">
                  {{ $t('placeholder.inviteYourTeamLabel') }}
                </div>
                <img src="~assets/img/placeholder/invite-team.png" class="!w-[30rem] flex-none" />
              </div>
            </template>

            <template #tableFooter>
              <div v-if="pagination.total > 10" class="px-4 py-2 flex items-center justify-center">
                <a-pagination
                  v-model:current="currentPage"
                  :total="pagination.total"
                  show-less-items
                  @change="loadUsers(currentPage, currentLimit)"
                />
              </div>
            </template>
          </AtTable>

          <GeneralDeleteModal v-model:visible="isOpen" entity-name="User" :on-delete="() => deleteUser()">
            <template #entity-preview>
              <span>
                <div
                  class="flex flex-row items-center py-2.25 px-2.5 bg-atm-bg-gray-extralight rounded-lg text-atm-content-gray-subtle mb-4"
                >
                  <GeneralIcon icon="account" class="atm-view-icon"></GeneralIcon>
                  <div
                    class="text-ellipsis overflow-hidden select-none w-full pl-1.75"
                    :style="{ wordBreak: 'keep-all', whiteSpace: 'nowrap', display: 'inline' }"
                  >
                    {{ deleteModalInfo?.email }}
                  </div>
                </div>
              </span>
            </template>
          </GeneralDeleteModal>

          <AccountUsersModal :key="userMadalKey" :show="showUserModal" @closed="showUserModal = false" @reload="loadUsers" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user:last-child {
  @apply rounded-b-md;
}
</style>
