import type Atmosphere from '~/Atmosphere';

export default class XcAudit {
  public static init(app: Atmosphere) {
    this.app = app;
  }

  // @ts-ignore
  private static app: Atmosphere;

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async log(data: { base }) {}
}
