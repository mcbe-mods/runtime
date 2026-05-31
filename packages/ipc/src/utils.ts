const ID_RANDOM_BITS = 0x100000000
const ID_RANDOM_CHARS = 6
const ID_COUNTER_RADIX = 36

let idCounter = 0

/** Generate a short unique identifier for packet correlation (hex random + counter suffix). */
export function generateId(): string {
  const r = ((Math.random() * ID_RANDOM_BITS) >>> 0).toString(16).slice(0, ID_RANDOM_CHARS).toUpperCase()
  const c = (idCounter++ % ID_COUNTER_RADIX).toString(ID_COUNTER_RADIX).toUpperCase()
  return r + c
}
