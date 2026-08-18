/**
 * Email-side branding overrides. Used by transactional email templates
 * (invites, password reset, etc.) so the footer doesn't say "Atmosphere Team"
 * on a white-labelled instance.
 */
export interface WhiteLabelEmailConfig {
  /** Replaces "Atmosphere Team" in the sign-off (e.g. "Acme Team") */
  senderName?: string | null;
  /** Replaces the default footer tagline / signature */
  footerText?: string | null;
  /** Replaces "https://atmosphere.dev" — used by the footer brand link */
  footerUrl?: string | null;
}

/**
 * Instance-level white-label config for on-prem deployments (white-label add-on, Scale+).
 * Stored as JSON in atm_store under key `atm_white_label_config`.
 * Exposed (sanitized) via /api/v1/meta/atmosphere/info to allow pre-login branding.
 */
export interface WhiteLabelConfig {
  /** Master switch — when false, defaults are used regardless of other fields */
  enabled: boolean;
  /** Display name that replaces "Atmosphere" in titles, sidebars, login screens */
  productName?: string | null;
  /** URL/path to the light-mode logo (rendered on light backgrounds) */
  logoUrl?: string | null;
  /** URL/path to the dark-mode logo (falls back to logoUrl when absent) */
  logoDarkUrl?: string | null;
  /** URL/path to the favicon (.ico / .png) */
  faviconUrl?: string | null;
  /** Hex color string (e.g. "#0D5A5A") used to override --color-brand-500 */
  brandColor?: string | null;
  /**
   * Description used for social/link-preview meta tags (og:description,
   * twitter:description, <meta name="description">), injected into the SPA
   * shell at serve time. Falls back to productName when unset.
   */
  seoDescription?: string | null;
  /**
   * URL/path to the social/link-preview card image (og:image, twitter:image).
   * Best at 1200×630 (1.91:1) — a wide card, not a square logo. Falls back to
   * the logo, then the Atmosphere default, when unset.
   */
  ogImageUrl?: string | null;
  /** URL/path to the default form banner (4:1 ratio wide image shown when the form author hasn't uploaded one) */
  formBannerUrl?: string | null;
  /**
   * Support contact email shown in the in-app help menu, replacing
   * support@atmosphere.dev. When white-labelled the Atmosphere docs / API / community /
   * changelog links are hidden outright; this is the one help entry a reseller
   * can surface. Null hides the support entry too.
   */
  supportEmail?: string | null;
  /** Optional email-side branding (used by transactional templates) */
  email?: WhiteLabelEmailConfig | null;
}

export const ATMOSPHERE_STORE_KEY_WHITE_LABEL = 'atm_white_label_config';
