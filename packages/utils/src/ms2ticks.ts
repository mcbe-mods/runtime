/**
 * Convert milliseconds to game ticks.
 * @param milliseconds - Time in milliseconds (default 1000).
 * @param gameTicksPerSecond - Game ticks per second (default 20).
 * @param millisecondsPerSecond - Milliseconds per second (default 1000).
 * @returns The number of game ticks.
 * @example
 * ```js
 * ms2ticks(1000) // => 20
 * ms2ticks(500)  // => 10
 * ```
 */
export function ms2ticks(milliseconds: number = 1000, gameTicksPerSecond: number = 20, millisecondsPerSecond: number = 1000): number {
  return Math.floor(milliseconds * gameTicksPerSecond / millisecondsPerSecond)
}

/** @deprecated Use `ms2ticks` instead. */
export { ms2ticks as calcGameTicks }
