<script setup lang="ts">
/* interface */

const props = defineProps<{
  isUnsavedDuplicatedRecordExist: boolean
  /** Force-hide the right-side sidebar (fields summary) regardless of the
   * user's commentsDrawer preference. Used by the EE docked panel at narrow
   * widths. */
  hideSidebar?: boolean
  /** Render the sidebar's fields in compact mode. */
  compactMode?: boolean
}>()

const isUnsavedDuplicatedRecordExist = toRef(props, 'isUnsavedDuplicatedRecordExist')

/* stores */

const {
  saveComment,
  commentsDrawer,
  isNew,
  audits,
  comments,
  auditCommentGroups,
  hasMoreAudits,
  loadMoreAudits,
  primaryKey,
  resetAuditPages,
} = useExpandedFormStoreOrThrow()

const { isUIAllowed } = useRoles()

const {
  isCommentAttachmentsEnabled,
  pendingAttachments,
  isUploading: isAttachmentUploading,
  openFilePicker,
  handlePaste: handleAttachmentPaste,
  handleDrop: handleAttachmentDrop,
  removeAttachment,
  clearAttachments,
} = useCommentAttachments()

const { isExpandedFormCommentMode } = storeToRefs(useConfigStore())

const { sidebarWidth, onResizeStart } = useExpandedRecordSidebarWidth()

// Audits accumulate via unshift() in the store and are only reset by explicit
// callers. The legacy Sidebar/Audits.vue watches primaryKey for this; mirror
// the same here so switching rows in the docked panel's Discussion mode shows
// the new row's history instead of the previous row's.
watch(primaryKey, () => {
  resetAuditPages()
})

/* flags */

const showRightSections = computed(() => !props.hideSidebar && !isNew.value && commentsDrawer.value && isUIAllowed('commentList'))

onMounted(() => {
  scrollToBottom()
})

/* comments */

const refAuditsEnd = useTemplateRef('refAuditsEnd')
const refRichComment = useTemplateRef('refRichComment')
const newCommentText = ref('')
const shouldSkipAuditsScroll = ref(false)

function handleCreatingNewComment() {
  if (isAttachmentUploading.value) return
  if (!newCommentText.value.trim() && !pendingAttachments.value.length) return

  saveComment(newCommentText.value, [...pendingAttachments.value])
  newCommentText.value = ''
  clearAttachments()

  refRichComment?.value?.setEditorContent('', true)
}

function initLoadMoreAudits() {
  shouldSkipAuditsScroll.value = true
  loadMoreAudits()
}

const auditsLength = computed(() => audits.value.length)
const commentsLength = computed(() => comments.value.length)

watch([newCommentText, auditsLength, commentsLength], () => {
  scrollToBottom()
})

function scrollToBottom() {
  setTimeout(() => {
    if (shouldSkipAuditsScroll.value) {
      shouldSkipAuditsScroll.value = false
      return
    }
    refAuditsEnd.value?.scrollIntoView({
      behavior: 'smooth',
    })
  }, 200)
}
</script>

<script lang="ts">
export default {
  name: 'ExpandedFormPresentorsDiscussion',
}
</script>

<template>
  <div class="h-full flex flex-row atm-discussion-mode-container">
    <div
      class="relative h-full overflow-y-auto atm-scrollbar-thin flex flex-col items-center justify-start overflow-x-hidden"
      :class="{
        'w-full': !showRightSections,
        'flex-1': showRightSections,
      }"
    >
      <div class="w-[680px] max-w-full flex-grow flex flex-col pl-3 pr-6 2xl:px-0">
        <div
          class="w-full h-0 flex-grow ml-15.8 rtl:(mr-15.8 ml-0 border-l-0 border-r-1) border-l-1 border-atm-border-gray-dark"
        />
      </div>
      <div v-if="hasMoreAudits" class="w-[680px] max-w-full fflex-grow-0 flex-shrink-0 flex flex-col pl-3 pr-6 2xl:px-0">
        <div class="w-full h-15 flex-grow-0 flex-shrink-0 ml-15.8 border-l-1 border-atm-border-gray-dark relative">
          <AtButton
            size="small"
            type="secondary"
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            @click="initLoadMoreAudits()"
          >
            {{ $t('general.loadMore') }}
          </AtButton>
        </div>
      </div>
      <div class="w-[680px] max-w-full pb-4">
        <div v-for="group in auditCommentGroups" :key="group.created_at" class="w-full pl-3 pr-6 2xl:px-0">
          <template v-if="group.type === 'audit'">
            <SmartsheetExpandedFormPresentorsDiscussionEntryAudit :audit-group="group" />
          </template>
          <template v-else>
            <SmartsheetExpandedFormPresentorsDiscussionEntryComment :comment="group" />
          </template>
        </div>
        <div
          v-if="isUIAllowed('commentEdit')"
          class="w-full border-t border-atm-border-gray-medium pl-3 pr-6 2xl:px-0 sticky bottom-0 pb-4 -mb-4 bg-atm-bg-default z-10"
        >
          <div class="font-bold my-3">{{ $t('activity.addComment') }}</div>
          <div
            @paste="isCommentAttachmentsEnabled ? handleAttachmentPaste($event) : undefined"
            @dragover.prevent
            @drop="isCommentAttachmentsEnabled ? handleAttachmentDrop($event) : undefined"
          >
            <SmartsheetExpandedFormRichComment
              ref="refRichComment"
              v-model:value="newCommentText"
              :hide-options="false"
              :extra-save-enabled="pendingAttachments.length > 0"
              :placeholder="$t('placeholder.comment')"
              class="expanded-form-comment-input !py-2 !px-2 cursor-text border-1 rounded-lg !text-atm-content-gray !text-small !leading-18px !max-h-[240px] bg-atm-bg-default !w-auto"
              data-testid="expanded-form-comment-input"
              :autofocus="isExpandedFormCommentMode"
              @focus="isExpandedFormCommentMode = false"
              @update:value="scrollToBottom()"
              @keydown.stop
              @save="handleCreatingNewComment"
              @keydown.enter.exact.prevent="handleCreatingNewComment"
            >
              <template v-if="pendingAttachments.length" #attachments>
                <SmartsheetExpandedFormCommentAttachments
                  :attachments="pendingAttachments"
                  editable
                  class="px-1 pt-1"
                  @remove="removeAttachment"
                />
              </template>
              <template v-if="isCommentAttachmentsEnabled" #bottom-bar-start>
                <AtTooltip :title="$t('activity.attachFile')" placement="top">
                  <AtButton
                    v-e="['c:comment:attach-file']"
                    type="text"
                    size="xsmall"
                    class="atm-comment-attach-btn !h-7 !w-7"
                    :loading="isAttachmentUploading"
                    :disabled="isAttachmentUploading"
                    data-testid="atm-comment-attach-btn"
                    @click="openFilePicker"
                  >
                    <GeneralIcon v-if="!isAttachmentUploading" icon="lucidePaperclip" class="text-md" />
                  </AtButton>
                </AtTooltip>
              </template>
            </SmartsheetExpandedFormRichComment>
          </div>
        </div>
        <div v-else class="w-full pl-3 pr-6 2xl:px-0">
          <div class="w-full h-4 flex-grow ml-15.8 -mb-4 border-l-1 border-atm-border-gray-dark" />
        </div>

        <div ref="refAuditsEnd" />
      </div>
    </div>
    <div
      v-if="showRightSections && !isUnsavedDuplicatedRecordExist"
      class="atm-comments-drawer border-l-1 rtl:(border-l-0 border-r-1) relative border-atm-border-gray-medium bg-atm-bg-default h-full xs:hidden rounded-br-2xl flex-shrink-0"
      :style="{ width: `${sidebarWidth}px` }"
      :class="{
        active: commentsDrawer && isUIAllowed('commentList'),
      }"
    >
      <div class="atm-sidebar-resize-handle" @mousedown.prevent="onResizeStart" />
      <SmartsheetExpandedFormPresentorsFieldsMiniColumnsWrapper :compact-mode="compactMode" />
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.expanded-form-comment-input) {
  @apply transition-all duration-150 min-h-8;
  box-shadow: none;
  &:focus,
  &:focus-within {
    @apply min-h-16 !bg-atm-bg-default border-atm-border-brand;
    box-shadow: 0px 0px 0px 2px rgba(var(--atm-brand-accent-rgb), 0.24);
  }
  &::placeholder {
    @apply !text-gray-400;
  }
}

.atm-sidebar-resize-handle {
  @apply absolute left-0 top-0 h-full w-1 cursor-col-resize z-50 transition-colors;
}
.atm-sidebar-resize-handle:hover {
  @apply bg-atm-border-gray-medium;
}
</style>
