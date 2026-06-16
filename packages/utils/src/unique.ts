/**
 * Forked from simple-unique (https://github.com/lete114/Simple-Unique)
 * Completely random generation of unique strings
 * @param size - Length of the random string (default 10)
 */
export function unique(size: number = 10): string {
  const r = (): string => Math.random().toString(36).slice(2)
  let result = r()
  while (result.length < size) {
    result += r()
  }
  return result.slice(0, size)
}
