/** Public — system events emitted by {@link IPC.events}. */
export const EVENTS = {
  ERROR: 'error',
} as const

export interface IPCEvents {
  [EVENTS.ERROR]: Error
}
