<script setup lang="ts">
import { type CommentType } from 'atmosphere-sdk'

/* interface */

const props = defineProps<{
  comment: any
}>()

const { user } = useGlobal()

const { t } = useI18n()

const { copy } = useCopy()

const { dashboardUrl } = useDashboard()

const route = useRoute()

const meta = inject(MetaInj, ref())

const activeView = inject(ActiveViewInj, ref())

/* stores */

const { loadComments, resolveComment, updateComment, deleteComment, primaryKey } = useRowCommentsOrThrow()

const {
  isCommentAttachmentsEnabled,
  pendingAttachments: editAttachments,
  isUploading: isEditAttachmentUploading,
  openFilePicker: openEditFilePicker,
  handlePaste: handleEditAttachmentPaste,
  handleDrop: handleEditAttachmentDrop,
  removeAttachment: removeEditAttachment,
  clearAttachments: clearEditAttachments,
} = useCommentAttachments()

const { isUIAllowed } = useRoles()

/* flags */

const hasEditPermission = computed(() => isUIAllowed('commentEdit'))

/* formatting */

const createdBy = (
  comment: CommentType & {
    created_display_name_short?: string
  },
) => {
  if (comment.created_by === user.value?.id) {
    return t('general.you')
  } else if (comment.created_display_name_short?.trim()) {
    return comment.created_display_name_short || t('labels.sharedSource')
  } else if (comment.created_by_email) {
    return formatUserNameFromEmail(comment.created_by_email)
  } else {
    return t('labels.sharedSource')
  }
}

const isCreatedByYou = computed(() => {
  return createdBy(props.comment) === t('general.you')
})

const editedAt = (comment: CommentType) => {
  if (comment.updated_at !== comment.created_at && comment.updated_at) {
    const str = timeAgo(comment.updated_at).replace(' ', '_')
    return `[${t('activity.edited')}](a~~~###~~~Edited_${str}) `
  }
  return ''
}

/* actions */

const isEditing = ref(false)
const editCommentValue = ref<CommentType>()

function editComment(comment: CommentType) {
  editCommentValue.value = {
    ...comment,
  }
  editAttachments.value = [...(comment.attachments ?? [])]
  isEditing.value = true
}

function onCancel(e: KeyboardEvent) {
  if (!isEditing.value) return
  e.preventDefault()
  e.stopPropagation()
  editCommentValue.value = undefined
  clearEditAttachments()
  loadComments()
  isEditing.value = false
  editCommentValue.value = undefined
}

const value = computed({
  get() {
    return editCommentValue.value?.comment || ''
  },
  set(val) {
    if (!editCommentValue.value) return
    editCommentValue.value.comment = val
  },
})

async function onEditComment() {
  if (!isEditing.value) return

  if (isEditAttachmentUploading.value) return

  if (!editCommentValue.value?.comment && !editAttachments.value.length) return

  while (
    editCommentValue.value?.comment &&
    (editCommentValue.value.comment.endsWith('<br />') || editCommentValue.value.comment.endsWith('\n'))
  ) {
    if (editCommentValue.value.comment.endsWith('<br />')) {
      editCommentValue.value.comment = editCommentValue.value.comment.slice(0, -6)
    } else {
      editCommentValue.value.comment = editCommentValue.value.comment.slice(0, -2)
    }
  }

  // isCommentMode.value = true

  const tempCom = {
    ...editCommentValue.value,
  }
  const tempAttachments = [...editAttachments.value]

  isEditing.value = false
  editCommentValue.value = undefined
  clearEditAttachments()
  await updateComment(tempCom.id!, {
    comment: tempCom.comment,
    attachments: tempAttachments,
  })
  loadComments()
}

function onCommentBlur() {
  isEditing.value = false
  editCommentValue.value = undefined
  clearEditAttachments()
}

async function copyComment(comment: CommentType) {
  const viewId = activeView.value?.fk_model_id === meta.value?.id ? activeView.value?.id : undefined

  await copy(
    encodeURI(
      `${dashboardUrl?.value}/${route.params.typeOrId}/${route.params.baseId}/${meta.value?.id}${
        viewId ? `/${viewId}` : ''
      }?rowId=${primaryKey.value}&commentId=${comment.id}`,
    ),
  )
}
</script>

<template>
  <div class="relative my-4 atm-audit-comment-block">
    <div class="absolute left-0 rtl:(left-auto right-0)">
      <GeneralUserIcon
        :user="{
          email: props.comment.user,
          display_name: props.comment.displayName,
          meta: props.comment.created_by_meta,
        }"
        size="base"
        class="w-[28px] h-[28px] !aspect-square !text-small"
      />
    </div>
    <div
      class="flex-1 bg-atm-bg-default rounded-lg border-1 group ml-11.5 rtl:(mr-11.5 ml-0)"
      :class="{
        'border-atm-brand-200/70 dark:!border-[#388bfd4b]': isCreatedByYou,
        'border-atm-border-gray-medium': !isCreatedByYou,
      }"
    >
      <div
        class="flex items-center gap-2 bg-atm-bg-gray-extralight px-4 py-0.5 border-b rounded-t-lg text-atm-content-gray min-h-[28px]"
        :class="{
          '!bg-atm-bg-brand border-atm-brand-200/70 dark:(!bg-[#151b23] !border-[#388bfd4b])': isCreatedByYou,
          'border-atm-border-gray-medium': !isCreatedByYou,
        }"
      >
        <span class="font-medium text-xs" :class="{ 'text-atm-content-brand-disabled': isCreatedByYou }">
          {{ createdBy(props.comment) }}
        </span>
        <span class="text-xs text-atm-content-gray-muted">
          <AtTooltip>
            <template #title>{{ parseStringDateTime(props.comment.created_at) }}</template>
            {{ timeAgo(props.comment.created_at) }}
          </AtTooltip>
        </span>

        <div class="flex-1" />

        <div v-if="!editCommentValue" class="flex items-center gap-2">
          <AtTooltip
            v-if="user && props.comment.created_by_email === user.email && hasEditPermission"
            class="opacity-0 transition !duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          >
            <AtButton
              class="!w-6 !h-6 !bg-transparent !hover:bg-atm-bg-gray-medium"
              size="xsmall"
              type="text"
              @click="editComment(props.comment)"
            >
              <GeneralIcon class="!w-3.5 !h-3.5" icon="pencil" />
            </AtButton>
            <template #title>{{ $t('tooltip.clickToEdit') }}</template>
          </AtTooltip>

          <AtDropdown
            v-if="!editCommentValue"
            class="opacity-0 transition !duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            overlay-class-name="!min-w-[160px]"
            placement="bottomRight"
          >
            <AtButton class="!w-6 !h-6 !bg-transparent !hover:bg-atm-bg-gray-medium" size="xsmall" type="text">
              <GeneralIcon class="!w-3.5 !h-3.5" icon="threeDotVertical" />
            </AtButton>
            <template #overlay>
              <AtMenu variant="small">
                <AtMenuItem v-e="['c:comment-expand:comment:copy']" @click="copyComment(props.comment)">
                  <div class="flex gap-2 items-center">
                    <component :is="iconMap.copy" class="cursor-pointer" />
                    {{ $t('general.copy') }} {{ $t('datatype.URL') }}
                  </div>
                </AtMenuItem>
                <template v-if="user && props.comment.created_by_email === user.email && hasEditPermission">
                  <AtDivider />
                  <AtMenuItem v-e="['c:row-expand:comment:delete']" danger @click="deleteComment(props.comment.id!)">
                    <div class="flex gap-2 items-center">
                      <component :is="iconMap.delete" class="cursor-pointer" />
                      {{ $t('general.delete') }}
                    </div>
                  </AtMenuItem>
                </template>
              </AtMenu>
            </template>
          </AtDropdown>

          <AtTooltip
            v-if="!props.comment.resolved_by && hasEditPermission"
            class="opacity-0 transition !duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          >
            <AtButton
              class="!w-6 !h-6 !bg-transparent !hover:bg-atm-bg-gray-medium"
              size="xsmall"
              type="text"
              @click="resolveComment(props.comment.id)"
            >
              <GeneralIcon class="!w-3.5 !h-3.5" icon="checkCircle" />
            </AtButton>
            <template #title>{{ $t('activity.clickToResolve') }}</template>
          </AtTooltip>
          <AtTooltip v-else-if="props.comment.resolved_by">
            <template #title>{{ $t('tooltip.resolvedBy', { name: props.comment.resolved_display_name_short }) }}</template>
            <AtButton
              class="!h-6 !w-6 !bg-transparent !hover:bg-atm-bg-gray-medium text-semibold"
              size="xsmall"
              type="text"
              @click="resolveComment(props.comment.id!)"
            >
              <GeneralIcon class="!w-3.5 !h-3.5 rounded-full bg-atm-fill-green-dark text-white" icon="checkFill" />
            </AtButton>
          </AtTooltip>
        </div>
      </div>
      <div
        v-if="props.comment.id === editCommentValue?.id && hasEditPermission"
        @paste="isCommentAttachmentsEnabled ? handleEditAttachmentPaste($event) : undefined"
        @dragover.prevent
        @drop="isCommentAttachmentsEnabled ? handleEditAttachmentDrop($event) : undefined"
      >
        <SmartsheetExpandedFormRichComment
          v-model:value="value"
          autofocus
          autofocus-to-end
          :hide-options="false"
          :extra-save-enabled="editAttachments.length > 0"
          class="cursor-text expanded-form-comment-input !py-3 !px-4 !pr-3 !m-0 w-full !border-1 !border-atm-border-gray-medium !rounded-lg !bg-atm-bg-default !text-atm-content-gray !text-small !leading-18px !max-h-[240px]"
          data-testid="expanded-form-comment-input"
          sync-value-change
          @save="onEditComment"
          @keydown.esc="onCancel"
          @blur="onCommentBlur"
          @keydown.enter.exact.prevent="onEditComment"
        >
          <template v-if="editAttachments.length" #attachments>
            <SmartsheetExpandedFormCommentAttachments
              :attachments="editAttachments"
              :comment-id="editCommentValue?.id"
              editable
              class="px-1 pt-1"
              @remove="removeEditAttachment"
            />
          </template>
          <template v-if="isCommentAttachmentsEnabled" #bottom-bar-start>
            <AtButton
              v-e="['c:comment:attach-file']"
              type="text"
              size="xsmall"
              class="atm-comment-attach-btn !h-7 !w-7"
              :loading="isEditAttachmentUploading"
              :disabled="isEditAttachmentUploading"
              data-testid="atm-comment-attach-btn"
              @click="openEditFilePicker"
            >
              <GeneralIcon v-if="!isEditAttachmentUploading" icon="ncPaperclip" class="text-md" />
            </AtButton>
          </template>
        </SmartsheetExpandedFormRichComment>
      </div>
      <template v-else>
        <SmartsheetExpandedFormRichComment
          :key="`${props.comment.id}-${props.comment.comment}`"
          :value="`${props.comment.comment}  ${editedAt(props.comment)}`"
          class="!text-small !leading-18px !text-atm-content-gray px-4 py-3"
          read-only
          sync-value-change
        />
        <SmartsheetExpandedFormCommentAttachments
          v-if="props.comment.attachments?.length"
          :attachments="props.comment.attachments"
          :comment-id="props.comment.id"
          class="px-4 pb-3"
        />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.atm-audit-comment-block {
  &::before {
    content: '';
    @apply absolute -top-4 left-15.8 h-4 border-l-1 border-atm-border-gray-dark;
  }
}
.atm-audit-comment-block {
  &::after {
    content: '';
    @apply absolute -bottom-4 left-15.8 h-4 border-l-1 border-atm-border-gray-dark;
  }
}
</style>

<style lang="scss">
.rtl .atm-audit-comment-block {
  &::before,
  &::after {
    left: auto;
    right: 63.2px;
    border-left: 0;
    border-right: 1px solid var(--atm-border-gray-dark);
  }
}
</style>
