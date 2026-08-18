import type { AtErrorType, SsoFailureCode } from 'atmosphere-sdk'

export interface SsoError {
  type: AtErrorType | SsoFailureCode
  message: string
  /** Log correlation id — set when the backend redirected here after a failed sign-in. */
  ref?: string
}

export const useSsoError = () => {
  const ssoError = useState<SsoError | null>('ssoError', () => null)

  const setError = (error: SsoError | null) => {
    ssoError.value = error
  }

  const clearError = () => {
    ssoError.value = null
  }

  return {
    ssoError,
    setError,
    clearError,
  }
}
