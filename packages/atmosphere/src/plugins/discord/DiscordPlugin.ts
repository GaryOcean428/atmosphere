import Discord from './Discord';
import type { IWebhookNotificationAdapter } from '~/types/atm-plugin';
import { XcWebhookNotificationPlugin } from '~/types/atm-plugin';

class DiscordPlugin extends XcWebhookNotificationPlugin {
  private static notificationAdapter: Discord;

  public getAdapter(): IWebhookNotificationAdapter {
    return DiscordPlugin.notificationAdapter;
  }

  public async init(_config: any): Promise<any> {
    DiscordPlugin.notificationAdapter = new Discord();
    await DiscordPlugin.notificationAdapter.init();
  }
}

export default DiscordPlugin;
