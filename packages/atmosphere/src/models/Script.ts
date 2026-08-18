import type { AtContext } from '~/interface/config';
import Atmosphere from '~/Atmosphere';

export default class Script {
  constructor(_unknown: any) {
    Object.assign(this, _unknown);
  }

  public static async get(
    _context: AtContext,
    _param1: string,
    _includeDeleted = false,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return null;
  }

  public static async list(
    _context: AtContext,
    _param1: string,
    _includeDeleted = false,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return [];
  }

  static async softDelete(..._args: any) {}

  static async delete(
    _context: AtContext,
    _param1: any,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return true;
  }

  public static async update(
    _context: AtContext,
    _param1: string,
    _param2: Partial<any>,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return {};
  }

  public static async insert(
    _context: AtContext,
    _param1: string,
    _param2: Partial<any>,
    _ncMeta = Atmosphere.ncMeta,
  ) {
    return {};
  }
}
