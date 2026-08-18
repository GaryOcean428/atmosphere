import type { MessageApi as AntMessageApi, MessageType } from 'ant-design-vue/es'

declare module 'ant-design-vue/es/message' {
  interface MessageApi extends Omit<AntMessageApi, 'success' | 'error' | 'info' | 'warn' | 'warning'> {
    success(params?: AtMessageProps, duration?: number, ncMessageExtraProps?: AtMessageExtraProps): MessageType
    error(params?: AtMessageProps, duration?: number, ncMessageExtraProps?: AtMessageExtraProps): MessageType
    info(params?: AtMessageProps, duration?: number, ncMessageExtraProps?: AtMessageExtraProps): MessageType
    warning(params?: AtMessageProps, duration?: number, ncMessageExtraProps?: AtMessageExtraProps): MessageType
    warn: MessageApi['warning'] // Ensure `warn` and `warning` share the same signature
    toast(params?: AtMessageProps, duration?: number, ncMessageExtraProps?: AtMessageExtraProps): MessageType
  }
}
