<script lang="ts" setup>
const { t } = useI18n()

const supportedDocs = [
  {
    title: t('general.integrations'),
    href: 'https://atmosphere.dev/docs/product-docs/integrations',
  },
  {
    title: 'Create new connection',
    href: 'https://atmosphere.dev/docs/product-docs/integrations/create-connection',
  },
  {
    title: 'Add new Data source',
    href: 'https://atmosphere.dev/docs/product-docs/data-sources/connect-to-data-source',
  },
] as {
  title: string
  href: string
}[]
</script>

<template>
  <AtModalSupportedDocs :docs="supportedDocs">
    <template #title>
      {{ $t('title.relevantDocumentation') }}
    </template>
  </AtModalSupportedDocs>
</template>
