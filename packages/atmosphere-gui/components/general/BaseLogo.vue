<script setup lang="ts">
import LogosMysqlIcon from '~icons/logos/mysql-icon'
import LogosPostgresql from '~icons/atm-icons/postgresql'
import VscodeIconsFileTypeSqlite from '~icons/vscode-icons/file-type-sqlite'
import LogosSnowflakeIcon from '~icons/logos/snowflake-icon'
import AtMssqlServer from '~icons/atm-icons/mssql-server'
import AtOracle from '~icons/atm-icons/oracle'
import MdiDatabaseOutline from '~icons/mdi/database-outline'

const { sourceType } = defineProps<{ sourceType?: string; color?: string }>()

const baseIcon = computed(() => {
  switch (sourceType) {
    case ClientType.MYSQL:
      return LogosMysqlIcon
    case ClientType.PG:
      return LogosPostgresql
    case ClientType.SQLITE:
      return VscodeIconsFileTypeSqlite
    case ClientType.SNOWFLAKE:
      return LogosSnowflakeIcon
    case ClientType.MSSQL:
      return AtMssqlServer
    case ClientType.ORACLE:
      return AtOracle
    default:
      return MdiDatabaseOutline
  }
})
</script>

<template>
  <component :is="baseIcon" :style="color ? { color } : {}" />
</template>
