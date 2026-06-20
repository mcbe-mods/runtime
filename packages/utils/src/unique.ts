/**
 * Forked from simple-unique (https://github.com/lete114/Simple-Unique)
 * Completely random generation of unique strings
 *
 * Note: Uses Math.random() rather than crypto.getRandomValues because
 * QuickJS in Minecraft Bedrock Script API does not provide a Web Crypto API.
 * Not suitable for security-sensitive uniqueness (e.g. session tokens).
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
