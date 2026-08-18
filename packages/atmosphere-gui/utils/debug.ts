import { debug } from 'debug'
export class AtDebug {
  private static logger: any

  static initLogger() {
    if (!AtDebug.logger) {
      AtDebug.logger = debug('atm')
    }

    return AtDebug.logger
  }

  static log(...args: any[]) {
    if (!debug.enabled('atm')) {
      return
    }

    const logger = AtDebug.initLogger()

    logger(...args)
  }
}
