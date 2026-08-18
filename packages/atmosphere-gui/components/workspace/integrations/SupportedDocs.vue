<script lang="ts" setup>
import { IntegrationsType } from 'atmosphere-sdk'
const { activeIntegrationItem } = useIntegrationStore()

const { t } = useI18n()

const supportedDocs = computed(() => {
  const docs = [
    {
      title: t('general.integrations'),
      href: 'https://atmosphere.dev/docs/product-docs/integrations',
    },
    {
      title: 'Create new connection',
      href: 'https://atmosphere.dev/docs/product-docs/integrations/create-connection',
    },
  ]

  if (activeIntegrationItem.value?.type === IntegrationsType.Database) {
    docs.push({
      title: 'Add new Data source',
      href: 'https://atmosphere.dev/docs/product-docs/data-sources/connect-to-data-source',
    })
  }

  return docs as {
    title: string
    href: string
  }[]
})
</script>

<template>
  <AtModalSupportedDocs :docs="supportedDocs">
    <template #title> {{ $t('title.relevantDocumentation') }} </template>
  </AtModalSupportedDocs>
</template>
