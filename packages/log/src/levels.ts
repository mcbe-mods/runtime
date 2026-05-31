export const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
} as const

export type LogLevel = keyof typeof LEVELS
