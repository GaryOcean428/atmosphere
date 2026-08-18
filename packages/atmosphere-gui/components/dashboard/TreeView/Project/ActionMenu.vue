<script lang="ts" setup>
import { type SourceType, stringifyRolesObj } from 'atmosphere-sdk'

interface Props {
  showBaseOption: (source: SourceType) => boolean
  dataReflectionState?: number
  dataReflectionText?: string
}

const props = defineProps<Props>()

const emits = defineEmits<Emits>()

interface Emits {
  (e: 'clickMenu'): void
  (e: 'rename'): void
  (e: 'openErdView', value: SourceType): void
  (e: 'duplicateProject', base: AtProject): void
  (e: 'openBaseSettings', id: string): void
  (e: 'openMcpServer', id: string): void
  (e: 'copyProjectInfo'): void
  (e: 'delete'): void
}

const base = inject(ProjectInj)!

const { appInfo } = useGlobal()

const { orgRoles, isUIAllowed, sandboxRestrictionReason } = useRoles()

const baseRole = computed(() => base.value.project_role || base.value.workspace_role)

const baseDuplicateReason = computed(() =>
  sandboxRestrictionReason('baseDuplicate', {
    roles: [stringifyRolesObj(orgRoles.value), baseRole.value].join(),
    base,
  }),
)

const isOptionVisible = computed(() => {
  return {
    rename: isUIAllowed('baseRename'),
    baseDuplicate:
      isUIAllowed('baseDuplicate', { roles: [stringifyRolesObj(orgRoles.value), baseRole.value].join() }) ||
      !!baseDuplicateReason.value,
    baseOptions:
      (base.value?.sources?.[0]?.enabled || (base.value?.sources || []).length > 1) &&
      props.showBaseOption(base.value.sources[0]),
    apiDocs: isUIAllowed('apiDocs'),
    baseMiscSettings: isUIAllowed('baseMiscSettings'),
    baseDelete: isUIAllowed('baseDelete', { roles: [stringifyRolesObj(orgRoles.value), baseRole.value].join() }),
  }
})
</script>

<template>
  <AtMenu
    class="atm-scrollbar-md !min-w-50"
    :style="{
      maxHeight: '70vh',
      overflow: 'overlay',
    }"
    :data-testid="`atm-sidebar-base-${base.title}-options`"
    variant="small"
    @click="emits('clickMenu')"
  >
    <!-- Copy Base ID -->
    <AtMenuItemCopyId
      :id="base.id"
      :tooltip="$t('labels.clickToCopyBaseID')"
      :label="
        $t('labels.baseIdColon', {
          baseId: base.id,
        })
      "
    />

    <AtMenuItem v-if="isUIAllowed('baseRename')" data-testid="atm-sidebar-project-rename" @click="emits('rename')">
      <div v-e="['c:base:rename']" class="flex gap-2 items-center">
        <GeneralIcon icon="rename" />
        {{ $t('general.rename') }}
      </div>
    </AtMenuItem>

    <AtTooltip
      v-if="isOptionVisible.baseDuplicate"
      :title="baseDuplicateReason ? $t(baseDuplicateReason) : ''"
      :disabled="!baseDuplicateReason"
    >
      <AtMenuItem
        data-testid="atm-sidebar-base-duplicate"
        :disabled="!!baseDuplicateReason"
        @click="!baseDuplicateReason && emits('duplicateProject', base)"
      >
        <div v-e="['c:base:duplicate']" class="flex gap-2 items-center">
          <GeneralIcon icon="duplicate" />
          {{ $t('general.duplicate') }}
        </div>
      </AtMenuItem>
    </AtTooltip>

    <AtDivider v-if="['baseDuplicate', 'baseRename'].some((permission) => isUIAllowed(permission)) || !!baseDuplicateReason" />

    <!-- Copy Project Info -->
    <AtMenuItem v-if="!isEeUI" key="copy" data-testid="atm-sidebar-base-copy-base-info" @click.stop="emits('copyProjectInfo')">
      <div v-e="['c:base:copy-proj-info']" class="flex gap-2 items-center">
        <GeneralIcon icon="copy" />
        {{ $t('activity.account.projInfo') }}
      </div>
    </AtMenuItem>

    <!-- ERD View -->
    <AtMenuItem
      v-if="base?.sources?.[0]?.enabled"
      key="erd"
      data-testid="atm-sidebar-base-relations"
      @click="emits('openErdView', base?.sources?.[0])"
    >
      <div v-e="['c:base:erd']" class="flex gap-2 items-center">
        <GeneralIcon icon="ncErd" />
        {{ $t('title.relations') }}
      </div>
    </AtMenuItem>

    <AtMenuItem key="mcp" data-testid="atm-sidebar-mcp-server" @click="emits('openMcpServer', base.id!)">
      <div v-e="['c:base:mcp-server']" class="flex gap-2 items-center">
        <GeneralIcon icon="mcp" />
        {{ $t('title.mcpServer') }}
      </div>
    </AtMenuItem>

    <!-- Swagger: Rest APIs -->
    <AtSubMenu
      v-if="isOptionVisible.apiDocs"
      key="api"
      v-e="['e:api-docs']"
      data-testid="atm-sidebar-base-rest-apis"
      class="py-0"
      variant="small"
      @click.stop
    >
      <template #title>
        <GeneralIcon icon="ncCode" class="opacity-80 !max-w-3.9" />
        {{ $t('activity.account.swagger') }}
      </template>

      <AtMenuItem
        data-testid="atm-sidebar-base-rest-apis-v2"
        @click.stop="openLink(`/api/v2/meta/bases/${base.id}/swagger`, appInfo.ncSiteUrl)"
      >
        <GeneralIcon icon="ncCode" class="opacity-80 !max-w-3.9" />
        API v2
      </AtMenuItem>

      <AtMenuItem
        data-testid="atm-sidebar-base-rest-apis-v3"
        @click.stop="openLink(`/api/v3/meta/bases/${base.id}/swagger`, appInfo.ncSiteUrl)"
      >
        <GeneralIcon icon="ncCode" class="opacity-80 !max-w-3.9" />
        API v3
      </AtMenuItem>
    </AtSubMenu>

    <template v-if="isOptionVisible.baseOptions">
      <AtDivider />
      <DashboardTreeViewBaseOptions v-model:base="base" :source="base.sources[0]" />
    </template>

    <AtDivider v-if="isOptionVisible.baseMiscSettings || isOptionVisible.baseDelete" />

    <AtMenuItem
      v-if="isOptionVisible.baseMiscSettings"
      key="teamAndSettings"
      data-testid="atm-sidebar-base-settings"
      class="atm-sidebar-base-base-settings"
      @click="emits('openBaseSettings', base.id!)"
    >
      <div v-e="['c:base:settings']" class="flex gap-2 items-center">
        <GeneralIcon icon="settings" />
        {{ $t('activity.settings') }}
      </div>
    </AtMenuItem>
    <AtMenuItem v-if="isOptionVisible.baseDelete" data-testid="atm-sidebar-base-delete" danger @click="emits('delete')">
      <div class="flex gap-2 items-center">
        <GeneralIcon icon="delete" class="w-4" />
        {{ $t('general.delete') }}
      </div>
    </AtMenuItem>
  </AtMenu>
</template>
