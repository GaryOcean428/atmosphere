export const onboardingFlowColoursMapping: Record<string, { lightBg: string; content: string }> = {
  brand: {
    lightBg: 'bg-atm-bg-brand',
    content: 'text-atm-content-brand',
  },
  orange: {
    lightBg: 'bg-atm-bg-orange-light',
    content: 'text-atm-content-orange-dark',
  },
  green: {
    lightBg: 'bg-atm-bg-green-light',
    content: 'text-atm-content-green-dark',
  },
  purple: {
    lightBg: 'bg-atm-bg-purple-light',
    content: 'text-atm-content-purple-dark',
  },
  pink: {
    lightBg: 'bg-atm-bg-pink-light',
    content: 'text-atm-content-pink-dark',
  },
}

export const roleColorsMapping: Record<
  string,
  {
    bg: string
    content: string
    contentTooltip: string
    badgeClass?: string
  }
> = {
  purple: {
    bg: 'bg-atm-bg-purple-light',
    content: 'text-atm-content-purple-dark',
    // Fixed light color for dark tooltip background (doesn't change with theme)
    contentTooltip: 'text-[#CBA8EB]',
  },
  blue: {
    bg: 'bg-atm-bg-blue-light',
    content: 'text-atm-content-blue-dark',
    contentTooltip: 'text-[#AFE5FF]',
  },
  green: {
    bg: 'bg-atm-bg-green-light',
    content: 'text-atm-content-green-dark',
    contentTooltip: 'text-[#A9EFC1]',
  },
  orange: {
    bg: 'bg-atm-bg-orange-light',
    content: 'text-atm-content-orange-dark',
    contentTooltip: 'text-[#FDCDAD]',
  },
  yellow: {
    bg: 'bg-atm-bg-yellow-light',
    content: 'text-atm-content-yellow-dark',
    contentTooltip: 'text-[#FEE5B0]',
  },
  red: {
    bg: 'bg-atm-bg-red-light',
    content: 'text-atm-content-red-dark',
    contentTooltip: 'text-[#FFB7B2]',
  },
  maroon: {
    bg: 'bg-atm-bg-maroon-light',
    content: 'text-atm-content-maroon-dark',
    contentTooltip: 'text-[#FFABD2]',
  },
  disabled: {
    bg: 'bg-atm-bg-gray-light',
    content: 'text-atm-content-gray-disabled',
    contentTooltip: 'text-[#E7E7E9]',
  },
  gray: {
    bg: 'bg-atm-bg-gray-medium',
    content: 'text-atm-content-gray-subtle2',
    contentTooltip: 'text-[#E7E7E9]',
    badgeClass: '!bg-atm-bg-gray-medium !border-atm-border-gray-medium',
  },
}

export const getTableAndFieldPermissionsColors = (color: string) => {
  switch (color) {
    case 'purple':
      return 'text-purple-700'
    case 'blue':
      return 'text-blue-700 dark:text-atm-blue-500'
    case 'green':
      return 'text-green-700 dark:text-atm-green-600'
    case 'orange':
      return 'text-orange-700'
    case 'yellow':
      return 'text-yellow-700'
    case 'red':
      return 'text-red-700 dark:text-atm-red-500'
    case 'maroon':
      return 'text-maroon-700'
    case 'gray':
    default:
      return 'text-gray-700 dark:text-atm-gray-600'
  }
}

/**
 * Strips spaces from a title so it can be used inside a CSS class name or a `data-testid`.
 *
 * Uses `replace(/ /g, '')` rather than `String.prototype.replaceAll`, which is only available
 * from Chrome 85 / Safari 13.4 and throws a TypeError on older mobile browsers.
 *
 * Playwright selectors are built from the same rule — keep `toSafeClassName` in
 * `tests/playwright/tests/utils/general.ts` in sync with this.
 */
export const toSafeClassName = (name?: string | null): string => (name ?? '').replace(/ /g, '')

export const extensionClassNames = {
  pageDesignerRemovable:
    'absolute w-5 h-5 px-2 bg-atm-bg-default rounded-md hover:bg-atm-bg-gray-light border-1 cursor-pointer border-atm-border-gray-medium justify-center items-center gap-2 inline-flex',
}

export const erdNodeClassNames = {
  node: 'rounded-lg border-1 border-atm-border-gray-medium shadow-lg',
}
