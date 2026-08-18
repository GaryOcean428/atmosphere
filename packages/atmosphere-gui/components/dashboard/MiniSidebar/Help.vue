<script lang="ts" setup>
interface ItemType {
  title: string
  icon?: IconMapKey
  e: string
  link: string
  subItems?: ItemType[]
  onClick?: () => void
  copyBtn?: boolean
  tooltip?: string
  hidden?: boolean
}

interface CategoryItemType {
  category: string
  items: ItemType[]
  hidden?: boolean
}

const { $e } = useNuxtApp()

const { t } = useI18n()

const { appInfo, isMobileMode } = useGlobal()

const { isChatWootEnabled } = useProvideChatwoot()

const { isModalVisible: isChatVisible } = useChatWoot()

// White-label may override the help-menu support email (falls back to Atmosphere
// support when unset); the rest of the help menu is unchanged — enterprise
// support/docs continue to route through Atmosphere.
const { isWhiteLabelled, config } = useBranding()

const visible = ref(false)

const copyBtnRef = ref()

const toggleChatSupport = () => {
  if (!isChatVisible.value && !ncIsFunction(window.$chatwoot?.toggle)) {
    return
  }
  const toggleText = (isChatVisible.value ? 'hide' : 'show') as any
  window.$chatwoot.toggle(toggleText)
  visible.value = false
}

const helpItems = computed<CategoryItemType[]>(() => {
  const isWl = isWhiteLabelled.value
  const supportEmail = config.value?.supportEmail || ''

  return [
    {
      category: t('general.resources'),
      items: [
        {
          title: t('labels.documentation'),
          icon: 'file',
          e: 'e:atmosphere:docs-open',
          link: 'https://atmosphere.dev/docs/product-docs',
        },
        {
          title: t('labels.apis'),
          icon: 'ncCode',
          e: '',
          link: '',
          subItems: [
            {
              title: t('labels.dataApiV3'),
              e: 'c:atmosphere:data-api-v3-open',
              link: 'https://atmosphere.dev/apis/v3/data',
            },
            {
              title: t('labels.metaApiV3'),
              e: 'c:atmosphere:meta-api-v3-open',
              link: 'https://atmosphere.dev/apis/v3/meta',
            },
            {
              title: t('labels.dataApiV2'),
              e: 'c:atmosphere:data-api-open',
              link: 'https://atmosphere.dev/apis/v2/data',
            },
            {
              title: t('labels.metaApiV2'),
              e: 'c:atmosphere:meta-api-open',
              link: 'https://atmosphere.dev/apis/v2/meta',
            },
          ],
        },
      ],
    },
    {
      category: t('general.community'),
      items: [
        {
          title: t('title.forum'),
          icon: 'ncDiscordForum',
          e: 'c:atmosphere:forum-open',
          link: 'https://community.atmosphere.dev/',
        },
        {
          title: t('general.youtube'),
          icon: 'ncYoutube',
          e: 'c:atmosphere:youtube-open',
          link: 'https://www.youtube.com/@atmosphere',
        },
        {
          title: 'X',
          icon: 'ncLogoTwitter',
          link: 'https://twitter.com/atmosphere',
          e: 'c:atmosphere:twitter',
        },
      ],
    },
    {
      category: t('general.contactSupport'),
      items: [
        {
          title: t('labels.chatWithAtmosphereSupport'),
          icon: 'ncSupportAgent',
          e: 'c:atmosphere:chat-support',
          link: '',
          onClick: toggleChatSupport,
          // isChatWootEnabled is already false when white-labelled.
          hidden: !isChatWootEnabled.value,
        },
        {
          // White-label may override the support contact; otherwise fall back to
          // Atmosphere support — enterprise support routes through Atmosphere regardless.
          title: isWl && supportEmail ? supportEmail : 'support@atmosphere.dev',
          icon: 'ncMail',
          e: 'c:atmosphere:contact-us-mail-copy',
          link: '',
          copyBtn: true,
          tooltip: t('labels.clickToCopy'),
        },
      ],
      hidden: !appInfo.value.ee,
    },
    {
      category: t('title.whatsNew'),
      items: [
        {
          title: t('general.changelog'),
          icon: 'ncList',
          e: 'c:atmosphere:changelog-open',
          link: 'https://atmosphere.dev/changelog',
        },
      ],
      hidden: !!isMobileMode.value,
    },
  ]
})

const openUrl = (item: ItemType) => {
  if (item.e) {
    $e(item.e, {
      trigger: 'mini-sidebar',
    })
  }

  if (item.onClick) {
    item.onClick()
    visible.value = false
  } else if (item.link.startsWith('http')) {
    window.open(item.link, '_blank')
  } else if (item.link) {
    openLinkUsingATag(item.link, '_blank')
  }

  if (item.copyBtn && copyBtnRef.value) {
    copyBtnRef.value?.[0]?.copyContent?.(item.title)
  }
}
</script>

<template>
  <AtDropdown
    v-model:visible="visible"
    placement="rightBottom"
    overlay-class-name="!min-w-55 atm-help-menu-dropdown"
    :align="{ offset: [0, 3] }"
  >
    <slot />

    <template #overlay>
      <AtMenu variant="small">
        <template v-for="(category, idx) of helpItems" :key="idx">
          <template v-if="!category.hidden">
            <AtDivider v-if="idx !== 0" />
            <AtMenuItemLabel>
              <span class="normal-case">
                {{ category.category }}
              </span>
            </AtMenuItemLabel>

            <template v-for="(item, i) of category.items" :key="i">
              <template v-if="!item.hidden">
                <AtSubMenu v-if="item.subItems" class="py-0" variant="small">
                  <template #title>
                    <GeneralIcon v-if="item.icon" :icon="item.icon" class="h-4 w-4" />
                    {{ item.title }}
                  </template>
                  <template v-for="(subItem, j) of item.subItems" :key="j">
                    <AtMenuItem v-if="!subItem.hidden" @click="openUrl(subItem)">
                      <GeneralIcon v-if="subItem.icon" :icon="subItem.icon" class="h-4 w-4" />
                      {{ subItem.title }}
                    </AtMenuItem>
                  </template>
                </AtSubMenu>
                <AtTooltip v-else :title="item.tooltip" :disabled="!item.tooltip || isMobileMode" placement="top" hide-on-click>
                  <AtMenuItem @click="openUrl(item)">
                    <GeneralIcon v-if="item.icon" :icon="item.icon" class="h-4 w-4" />
                    {{ item.title }}

                    <GeneralCopyButton
                      v-if="item.copyBtn"
                      ref="copyBtnRef"
                      type="secondary"
                      :content="item.title"
                      :show-toast="false"
                    />
                  </AtMenuItem>
                </AtTooltip>
              </template>
            </template>
          </template>
        </template>
      </AtMenu>
    </template>
  </AtDropdown>
</template>

<style lang="scss">
.atm-help-menu-dropdown.atm-help-menu-dropdown {
  overflow: visible !important;

  &::before {
    content: '';
    position: absolute;
    left: -6px;
    bottom: 13px;
    width: 0;
    height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-right: 7px solid var(--atm-border-gray-medium);
  }

  &::after {
    content: '';
    position: absolute;
    left: -5px;
    bottom: 14px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 6px solid var(--atm-bg-default);
  }
}
</style>
