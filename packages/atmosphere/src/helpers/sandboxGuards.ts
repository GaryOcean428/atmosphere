import type { AtContext } from '~/interface/config';

// CE no-op stubs. Sandboxes are an EE feature; EE overrides these with
// the real impl in `src/ee/helpers/sandboxGuards.ts`.

export async function assertNotSandbox(
  _context: AtContext,
  _message?: string,
): Promise<void> {}

export async function assertNotSandboxProduction(
  _context: AtContext,
  _message?: string,
): Promise<void> {}

export async function assertNotSandboxRelated(
  _context: AtContext,
  _message?: string,
): Promise<void> {}

export async function assertNotLockedViewOnSandboxProduction(
  _context: AtContext,
  _viewId: string,
  _message?: string,
): Promise<void> {}

export async function clearSandboxCreatingState(
  _context: AtContext,
  _baseId: string,
): Promise<void> {}

export async function isSandboxTeardownInProgress(
  _context: AtContext,
  _baseId: string,
): Promise<boolean> {
  return false;
}
