import type { WhiteLabelConfig } from 'atmosphere-sdk';

/**
 * Display product name for transactional emails — the white-label product name
 * when branding is enabled, otherwise the Atmosphere default. Used in template body
 * copy (headings, buttons, preview text) so white-labelled emails don't say
 * "Atmosphere".
 */
export const resolveProductName = (
  branding?: WhiteLabelConfig | null,
): string => (branding?.enabled && branding.productName) || 'Atmosphere';
