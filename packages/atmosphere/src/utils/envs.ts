export const isWorker = false;
export const isMuxEnabled = false;
export const isSecureAttachmentEnabled =
  process.env.ATMOSPHERE_ATTACHMENT_ACCESS_CONTROL_ENABLED === 'true' ||
  process.env.ATMOSPHERE_SECURE_ATTACHMENTS === 'true';
export const ncSiteUrl = process.env.ATMOSPHERE_SITE_URL || process.env.ATMOSPHERE_PUBLIC_URL;
