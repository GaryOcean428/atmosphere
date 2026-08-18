import { timezoneAliases } from 'atmosphere-sdk'

export function isSameTimezone(tzName: string, expectedTzName: string) {
  return tzName === expectedTzName || tzName === timezoneAliases[expectedTzName]
}

export default timezoneAliases
