import type { Server } from 'socket.io';
import type { AtSocket } from '~/interface/config';

export default class AtmospherePresence {
  public static setupHandlers(_socket: AtSocket) {}

  public static handleDisconnect(_socket: AtSocket, _ioServer: Server) {}
}
