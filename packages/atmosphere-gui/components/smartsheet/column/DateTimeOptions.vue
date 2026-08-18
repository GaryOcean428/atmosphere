<script setup lang="ts">
import dayjs from 'dayjs'
import { ColumnHelper, UITypes, dateFormats, jalaliDateFormats, timeFormats } from 'atmosphere-sdk'
import { type TimeZone, getTimeZones } from '@vvo/tzdb'
import { timeFormatsObj } from '../../cell/DateTime/utils'

const props = defineProps<{
  value: any
}>()

const emit = defineEmits(['update:value'])

const vModel = useVModel(props, 'value', emit)

const allDateFormats = [...dateFormats, ...jalaliDateFormats]

const { appInfo } = useGlobal()

const timezones = getTimeZones({ includeUtc: true }).sort((a, b) => a.name.localeCompare(b.name))
const browserTzName = Intl.DateTimeFormat().resolvedOptions().timeZone
const browserTz = timezones.find((tz) => isSameTimezone(tz.name, browserTzName))
const utcTz = timezones.find((tz) => tz.name === 'Etc/UTC')
const defaultSuggestedTzs = [browserTz, utcTz].filter((k) => k) as TimeZone[]

const priorityTzs = computed(() => {
  const otherPriorityTzs = []
  for (const tz of timezones) {
    if (
      browserTz?.countryCode === tz.countryCode &&
      !defaultSuggestedTzs.find((suggestedTz) => isSameTimezone(suggestedTz?.name, tz.name))
    ) {
      otherPriorityTzs.push(tz)
    }
  }
  return [...defaultSuggestedTzs, ...otherPriorityTzs]
})

// set default value
vModel.value.meta = {
  ...ColumnHelper.getColumnDefaultMeta(UITypes.DateTime),
  ...(vModel.value.meta || {}),
}

const isDisplayTimezone = computed({
  get: () => !!vModel.value.meta?.isDisplayTimezone,
  set: (value) => {
    if (!vModel.value.meta) vModel.value.meta = {}
    vModel.value.meta.isDisplayTimezone = value
  },
})

const useSameTimezoneForAll = computed({
  get: () => !!vModel.value.meta?.useSameTimezoneForAll,
  set: (value) => {
    if (!vModel.value.meta) vModel.value.meta = {}
    vModel.value.meta.useSameTimezoneForAll = value
    if (!value) vModel.value.meta.timezone = undefined
    else if (!vModel.value.meta.timezone) {
      vModel.value.meta.timezone = priorityTzs.value[0]?.name
    }
  },
})

// Examples are rendered against the current date/time so users see what each format produces
const today = dayjs()

function formatDateExample(format: string) {
  return today.format(format)
}

function formatTimeExample(format: string) {
  const display = vModel.value.meta.is12hrFormat ? timeFormatsObj[format as keyof typeof timeFormatsObj] ?? format : format
  return today.format(display)
}

const combinedPreview = computed(
  () => `${formatDateExample(vModel.value.meta.date_format)} ${formatTimeExample(vModel.value.meta.time_format)}`,
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <a-form-item>
      <template #label>
        <div class="flex items-center justify-between w-full gap-2">
          <span class="flex-none">{{ $t('labels.dateFormat') }}</span>
          <span class="flex items-center gap-1.5 min-w-0">
            <span class="flex-none text-atm-content-gray-muted">{{ $t('labels.preview') }}</span>
            <span class="truncate text-atm-content-gray font-weight-500">{{ combinedPreview }}</span>
          </span>
        </div>
      </template>
      <a-select
        v-model:value="vModel.meta.date_format"
        class="atm-date-select"
        dropdown-class-name="atm-dropdown-date-format"
        show-search
      >
        <template #suffixIcon>
          <GeneralIcon icon="arrowDown" class="text-atm-content-gray-subtle" />
        </template>

        <a-select-option v-for="(format, i) of allDateFormats" :key="i" :value="format">
          <div class="w-full flex items-center gap-2">
            <span class="atm-check-gutter flex-none w-4 h-4 flex items-center justify-center">
              <component
                :is="iconMap.check"
                v-if="vModel.meta.date_format === format"
                id="atm-selected-item-icon"
                class="text-atm-content-brand w-4 h-4"
              />
            </span>
            <span class="atm-format-example flex-1 min-w-0 truncate text-atm-content-gray">{{ formatDateExample(format) }}</span>
            <span class="atm-format-token flex-none">{{ format }}</span>
          </div>
        </a-select-option>
      </a-select>
    </a-form-item>
    <a-form-item>
      <template #label>
        <span>{{ $t('labels.timeFormat') }}</span>
      </template>
      <a-select v-model:value="vModel.meta.time_format" class="atm-time-select" dropdown-class-name="atm-dropdown-time-format">
        <template #suffixIcon>
          <GeneralIcon icon="arrowDown" class="text-atm-content-gray-subtle" />
        </template>

        <a-select-option v-for="(format, i) of timeFormats" :key="i" :value="format">
          <div class="w-full flex items-center gap-2" :data-testid="`atm-time-${format}`">
            <span class="atm-check-gutter flex-none w-4 h-4 flex items-center justify-center">
              <component
                :is="iconMap.check"
                v-if="vModel.meta.time_format === format"
                id="atm-selected-item-icon"
                class="text-atm-content-brand w-4 h-4"
              />
            </span>
            <span class="atm-format-example flex-1 min-w-0 truncate text-atm-content-gray">{{ formatTimeExample(format) }}</span>
            <span class="atm-format-token flex-none">{{ format }}</span>
          </div>
        </a-select-option>
      </a-select>
    </a-form-item>
    <a-form-item>
      <a-radio-group v-if="vModel.meta" v-model:value="vModel.meta.is12hrFormat" class="atm-time-form-layout">
        <a-radio :value="true">{{ $t('labels.hours12') }}</a-radio>
        <a-radio :value="false">{{ $t('labels.hours24') }}</a-radio>
      </a-radio-group>
    </a-form-item>

    <template v-if="appInfo.ee">
      <a-form-item>
        <AtTooltip :disabled="true">
          <div class="flex items-center gap-1">
            <AtSwitch v-model:checked="isDisplayTimezone">
              <div class="text-sm text-atm-content-gray select-none">
                {{ $t('labels.displayTimezone') }}
              </div>
            </AtSwitch>
          </div>
        </AtTooltip>
      </a-form-item>
      <a-form-item>
        <AtTooltip :disabled="true">
          <div class="flex items-center gap-1">
            <AtSwitch v-model:checked="useSameTimezoneForAll">
              <div class="text-sm text-atm-content-gray select-none">
                {{ $t('labels.useSameTimezoneForAllMembers') }}
              </div>
            </AtSwitch>
          </div>
        </AtTooltip>
      </a-form-item>
      <a-form-item v-if="useSameTimezoneForAll">
        <a-select
          v-model:value="vModel.meta.timezone"
          show-search
          allow-clear
          :filter-option="(input, option) => antSelectFilterOption(input, option, ['key', 'data-abbreviation'])"
          dropdown-class-name="atm-dropdown-timezone"
          :placeholder="$t('placeholder.useSameTimezoneForAll')"
          class="atm-search-timezone"
        >
          <template #suffixIcon>
            <GeneralIcon icon="arrowDown" class="text-atm-content-gray-subtle" />
          </template>

          <a-select-opt-group :label="$t('labels.suggested')">
            <a-select-option
              v-for="timezone of priorityTzs"
              :key="timezone.name"
              :value="timezone.name"
              :data-abbreviation="timezone.abbreviation"
            >
              <div class="flex gap-2 w-full justify-between items-center">
                <span>{{ timezone.name }}</span>
                <div>
                  <span class="text-atm-content-gray-muted text-[13px] mr-2">
                    {{ timezone.abbreviation }}
                  </span>
                  <component
                    :is="iconMap.check"
                    id="atm-selected-item-icon"
                    class="text-atm-content-brand w-4 h-4"
                    :class="{ invisible: vModel.meta.timezone !== timezone.name }"
                  />
                </div>
              </div>
            </a-select-option>
          </a-select-opt-group>
          <a-select-opt-group :label="$t('general.all')">
            <a-select-option
              v-for="timezone of timezones"
              :key="timezone.name"
              :value="timezone.name"
              :data-abbreviation="timezone.abbreviation"
            >
              <div class="flex gap-2 w-full justify-between items-center">
                <span>{{ timezone.name }}</span>
                <div>
                  <span class="text-atm-content-gray-muted text-[13px] mr-2">
                    {{ timezone.abbreviation }}
                  </span>
                  <component
                    :is="iconMap.check"
                    id="atm-selected-item-icon"
                    class="text-atm-content-brand w-4 h-4"
                    :class="{ invisible: vModel.meta.timezone !== timezone.name }"
                  />
                </div>
              </div>
            </a-select-option>
          </a-select-opt-group>
        </a-select>
      </a-form-item>
    </template>
  </div>
</template>

<style lang="scss" scoped>
// In the dropdown list the format token is plain muted text alongside the example
.atm-format-token {
  @apply text-atm-content-gray-muted text-captionSm font-mono;
}

// The closed selector reuses the selected option's markup — render it as a clean
// "example + format badge": drop the leading checkmark gutter, keep the example from
// stretching so the badge sits next to it, and pill the token
:deep(.ant-select-selection-item) {
  .atm-check-gutter {
    display: none;
  }

  .atm-format-example {
    flex: 0 1 auto;
  }

  .atm-format-token {
    @apply bg-atm-bg-gray-light rounded px-1.5 py-0.5 leading-tight;
  }
}

:deep(.atm-time-form-layout) {
  @apply flex justify-between gap-2 children:(flex-1 m-0 px-2 py-1 border-1 border-atm-border-gray-dark rounded-lg);

  .ant-radio-wrapper {
    @apply transition-all;
    span {
      @apply text-atm-content-gray;
    }
    &:not(.ant-radio-wrapper-disabled).ant-radio-wrapper-checked {
      @apply border-atm-border-brand;
    }
  }
}
</style>
