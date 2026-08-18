import { PluginCategory } from 'atmosphere-sdk';
import { AtError } from './catchError';
import type {
  IEmailAdapter,
  IStorageAdapterV2,
  IWebhookNotificationAdapter,
  // XcEmailPlugin,
  // XcPlugin,
  // XcStoragePlugin,
  // XcWebhookNotificationPlugin
} from '~/types/atm-plugin';
import BackblazePluginConfig from '~/plugins/backblaze';
import DiscordPluginConfig from '~/plugins/discord';
import GcsPluginConfig from '~/plugins/gcs';
import LinodePluginConfig from '~/plugins/linode';
import MattermostPluginConfig from '~/plugins/mattermost';
import MinioPluginConfig from '~/plugins/minio';
import OvhCloudPluginConfig from '~/plugins/ovhCloud';
import S3PluginConfig from '~/plugins/s3';
import ScalewayPluginConfig from '~/plugins/scaleway';
import SlackPluginConfig from '~/plugins/slack';
import SMTPPluginConfig from '~/plugins/smtp';
import MailerSendConfig from '~/plugins/mailerSend';
import SpacesPluginConfig from '~/plugins/spaces';
import TeamsPluginConfig from '~/plugins/teams';
import TwilioPluginConfig from '~/plugins/twilio';
import TwilioWhatsappPluginConfig from '~/plugins/twilioWhatsapp';
import UpcloudPluginConfig from '~/plugins/upcloud';
import VultrPluginConfig from '~/plugins/vultr';
import SESPluginConfig from '~/plugins/ses';
import R2PluginConfig from '~/plugins/r2';
import Atmosphere from '~/Atmosphere';
import Local from '~/plugins/storage/Local';
import { MetaTable, RootScopes } from '~/utils/globals';
import Plugin from '~/models/Plugin';

const defaultPlugins = [
  SlackPluginConfig,
  TeamsPluginConfig,
  DiscordPluginConfig,
  TwilioWhatsappPluginConfig,
  TwilioPluginConfig,
  S3PluginConfig,
  MinioPluginConfig,
  GcsPluginConfig,
  MattermostPluginConfig,
  SpacesPluginConfig,
  BackblazePluginConfig,
  VultrPluginConfig,
  OvhCloudPluginConfig,
  LinodePluginConfig,
  UpcloudPluginConfig,
  SMTPPluginConfig,
  MailerSendConfig,
  ScalewayPluginConfig,
  SESPluginConfig,
  R2PluginConfig,
];

class AtPluginMgrv2 {
  /* active plugins */

  // constructor(app: Atmosphere, ncMeta: AtMetaIO) {
  //   this.app = app;
  //   this.ncMeta = ncMeta;
  //   this.activePlugins = [];
  // }

  public static async init(ncMeta = Atmosphere.ncMeta): Promise<void> {
    // extract duplicate plugin ids from default plugins and throw error
    const duplicateIds = defaultPlugins
      .map((p) => p.id)
      .filter((id, index, self) => self.indexOf(id) !== index);

    if (duplicateIds.length) {
      throw new Error(
        `Duplicate plugin ids found in default plugins: ${duplicateIds.join(
          ', ',
        )}`,
      );
    }

    /* Populate rows into atm_plugins table if not present */
    for (const plugin of defaultPlugins) {
      const pluginConfig = await ncMeta.metaGet(
        RootScopes.ROOT,
        RootScopes.ROOT,
        MetaTable.PLUGIN,
        plugin.id,
      );

      if (!pluginConfig) {
        await ncMeta.metaInsert2(
          RootScopes.ROOT,
          RootScopes.ROOT,
          MetaTable.PLUGIN,
          {
            id: plugin.id,
            title: plugin.title,
            version: plugin.version,
            logo: plugin.logo,
            icon: plugin.icon,
            description: plugin.description,
            tags: plugin.tags,
            category: plugin.category,
            input_schema: JSON.stringify(plugin.inputs),
          },
        );
      } else if (pluginConfig.version !== plugin.version) {
        await ncMeta.metaUpdate(
          RootScopes.ROOT,
          RootScopes.ROOT,
          MetaTable.PLUGIN,
          {
            title: plugin.title,
            version: plugin.version,
            logo: plugin.logo,
            icon: plugin.icon,
            description: plugin.description,
            tags: plugin.tags,
            category: plugin.category,
            input_schema: JSON.stringify(plugin.inputs),
          },
          pluginConfig.id,
        );
      }
    }
    await this.initPluginsFromEnv();
  }

  private static async initPluginsFromEnv() {
    /*
     * ATMOSPHERE_S3_BUCKET_NAME
     * ATMOSPHERE_S3_REGION
     * ATMOSPHERE_S3_ENDPOINT
     * ATMOSPHERE_S3_ACCESS_KEY
     * ATMOSPHERE_S3_ACCESS_SECRET
     * */

    if (
      process.env.ATMOSPHERE_S3_BUCKET_NAME &&
      (process.env.ATMOSPHERE_S3_REGION || process.env.ATMOSPHERE_S3_ENDPOINT)
    ) {
      const s3Plugin = await Plugin.getPlugin(S3PluginConfig.id);

      const s3CfgData: Record<string, any> = {
        bucket: process.env.ATMOSPHERE_S3_BUCKET_NAME,
        region: process.env.ATMOSPHERE_S3_REGION,
        endpoint: process.env.ATMOSPHERE_S3_ENDPOINT,
        force_path_style: process.env.ATMOSPHERE_S3_FORCE_PATH_STYLE === 'true',
        acl: process.env.ATMOSPHERE_S3_ACL,
      };

      if (process.env.ATMOSPHERE_S3_ACCESS_KEY && process.env.ATMOSPHERE_S3_ACCESS_SECRET) {
        s3CfgData.access_key = process.env.ATMOSPHERE_S3_ACCESS_KEY;
        s3CfgData.access_secret = process.env.ATMOSPHERE_S3_ACCESS_SECRET;
      }

      await Plugin.update(s3Plugin.id, {
        active: true,
        input: JSON.stringify(s3CfgData),
      });
    }

    if (
      process.env.ATMOSPHERE_SMTP_FROM &&
      process.env.ATMOSPHERE_SMTP_HOST &&
      process.env.ATMOSPHERE_SMTP_PORT
    ) {
      const smtpPlugin = await Plugin.getPlugin(SMTPPluginConfig.id);
      await Plugin.update(smtpPlugin.id, {
        active: true,
        input: JSON.stringify({
          from: process.env.ATMOSPHERE_SMTP_FROM,
          host: process.env.ATMOSPHERE_SMTP_HOST,
          port: process.env.ATMOSPHERE_SMTP_PORT,
          username: process.env.ATMOSPHERE_SMTP_USERNAME,
          password: process.env.ATMOSPHERE_SMTP_PASSWORD,
          secure: process.env.ATMOSPHERE_SMTP_SECURE === 'true',
          ignoreTLS: process.env.ATMOSPHERE_SMTP_IGNORE_TLS === 'true',
          rejectUnauthorized:
            process.env.ATMOSPHERE_SMTP_REJECT_UNAUTHORIZED === 'true',
        }),
      });
    }
  }

  public static async storageAdapter(
    ncMeta = Atmosphere.ncMeta,
  ): Promise<IStorageAdapterV2> {
    const pluginData = await ncMeta.metaGet2(
      RootScopes.ROOT,
      RootScopes.ROOT,
      MetaTable.PLUGIN,
      {
        category: PluginCategory.STORAGE,
        active: true,
      },
    );

    if (!pluginData) return new Local();

    const pluginConfig = defaultPlugins.find(
      (c) =>
        c.title === pluginData.title && c.category === PluginCategory.STORAGE,
    );
    const plugin = new pluginConfig.builder(ncMeta, pluginData);

    if (pluginData?.input) {
      pluginData.input = JSON.parse(pluginData.input);
    }

    await plugin.init(pluginData?.input);
    return plugin.getAdapter();
  }

  public static async emailAdapter(
    isUserInvite = true,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<IEmailAdapter> {
    const pluginData = await ncMeta.metaGet2(
      RootScopes.ROOT,
      RootScopes.ROOT,
      MetaTable.PLUGIN,
      {
        category: PluginCategory.EMAIL,
        active: true,
      },
    );

    if (!pluginData) {
      // return null to show the invite link in UI
      if (isUserInvite) return null;
      // for webhooks, throw the error
      throw new Error('Plugin not configured / active');
    }

    const pluginConfig = defaultPlugins.find(
      (c) =>
        c.title === pluginData.title && c.category === PluginCategory.EMAIL,
    );
    const plugin = new pluginConfig.builder(ncMeta, pluginData);

    if (pluginData?.input) {
      pluginData.input = JSON.parse(pluginData.input);
    }

    await plugin.init(pluginData?.input);
    return plugin.getAdapter();
  }

  public static async webhookNotificationAdapters(
    title: string,
    ncMeta = Atmosphere.ncMeta,
  ): Promise<IWebhookNotificationAdapter> {
    const pluginData = await ncMeta.metaGet2(
      RootScopes.ROOT,
      RootScopes.ROOT,
      MetaTable.PLUGIN,
      {
        title,
        active: true,
      },
    );

    if (!pluginData) throw new Error('Plugin not configured / active');

    const pluginConfig = defaultPlugins.find(
      (c) => c.title === pluginData.title,
    );
    const plugin = new pluginConfig.builder(ncMeta, pluginData);

    if (pluginData?.input) {
      pluginData.input = JSON.parse(pluginData.input);
    }

    await plugin.init(pluginData?.input);
    return plugin.getAdapter() as IWebhookNotificationAdapter;

    // return this.activePlugins?.reduce((obj, plugin) => {
    //   if (plugin instanceof XcWebhookNotificationPlugin) {
    //     obj[
    //       plugin?.config?.title
    //     ] = (plugin as XcWebhookNotificationPlugin)?.getAdapter();
    //   }
    //   return obj;
    // }, {});
  }

  public static async test(args): Promise<boolean> {
    args.input =
      typeof args?.input === 'string' ? JSON.parse(args?.input) : args?.input;
    switch (args.category) {
      case 'Storage':
        {
          const plugin = defaultPlugins.find(
            (pluginConfig) => pluginConfig?.title === args.title,
          );
          const tempPlugin = new plugin.builder(Atmosphere.ncMeta, plugin);
          await tempPlugin.init(args?.input);

          if (!tempPlugin?.getAdapter()?.test)
            AtError.notImplemented('Plugin Test');

          return tempPlugin?.getAdapter()?.test?.();
        }
        break;
      case 'Email':
        {
          const plugin = defaultPlugins.find(
            (pluginConfig) => pluginConfig?.title === args.title,
          );
          const tempPlugin = new plugin.builder(Atmosphere.ncMeta, plugin);
          await tempPlugin.init(args?.input);

          if (!tempPlugin?.getAdapter()?.test)
            AtError.notImplemented('Plugin Test');

          return tempPlugin?.getAdapter()?.test?.();
        }
        break;
      default: {
        const plugin = defaultPlugins.find(
          (pluginConfig) => pluginConfig?.title === args.title,
        );
        const tempPlugin = new plugin.builder(Atmosphere.ncMeta, plugin);
        await tempPlugin.init(args?.input);

        if (!tempPlugin?.getAdapter()?.test)
          AtError.notImplemented('Plugin Test');

        return tempPlugin?.getAdapter()?.test?.();
      }
    }
  }
}

export default AtPluginMgrv2;
