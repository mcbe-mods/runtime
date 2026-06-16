/** Public — system events emitted by {@link IPC.events}. */
export const EVENTS = {
  ERROR: 'error',
} as const

export interface IPCEvents {
  /** Emitted when a message handler throws or chunk assembly fails */
  [EVENTS.ERROR]: Error
}
