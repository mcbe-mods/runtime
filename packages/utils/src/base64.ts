import { utf8Decode, utf8Encode } from './textCodec'

export class Base64 {
  static #CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  static #toBase64(bytes: Uint8Array): string {
    let result = ''
    for (let i = 0; i < bytes.length; i += 3) {
      const b = (bytes[i] << 16) | (bytes[i + 1] ?? 0) << 8 | (bytes[i + 2] ?? 0)
      result += Base64.#CHARS[b >> 18 & 0x3F] + Base64.#CHARS[b >> 12 & 0x3F]
      result += i + 1 < bytes.length ? Base64.#CHARS[b >> 6 & 0x3F] : '='
      result += i + 2 < bytes.length ? Base64.#CHARS[b & 0x3F] : '='
    }
    return result
  }

  static #fromBase64(input: string): Uint8Array {
    const sanitized = input.replace(/[^A-Z0-9+/=]/gi, '')
    const bytes: number[] = []
    for (let i = 0; i < sanitized.length; i += 4) {
      const enc1 = Base64.#CHARS.indexOf(sanitized[i])
      const enc2 = Base64.#CHARS.indexOf(sanitized[i + 1])
      const enc3 = sanitized[i + 2] === '=' ? 0 : Base64.#CHARS.indexOf(sanitized[i + 2])
      const enc4 = sanitized[i + 3] === '=' ? 0 : Base64.#CHARS.indexOf(sanitized[i + 3])
      const b = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4
      bytes.push(b >> 16 & 0xFF)
      if (sanitized[i + 2] !== '=') {
        bytes.push(b >> 8 & 0xFF)
      }
      if (sanitized[i + 3] !== '=') {
        bytes.push(b & 0xFF)
      }
    }
    return new Uint8Array(bytes)
  }

  /**
   * Encode a UTF-8 string to base64.
   * @param input - UTF-8 plaintext
   * @returns Base64-encoded string
   */
  static encode(input: string): string {
    return Base64.#toBase64(utf8Encode(input))
  }

  /**
   * Decode a base64 string back to UTF-8.
   * @param input - Base64-encoded string
   * @returns UTF-8 plaintext
   */
  static decode(input: string): string {
    return utf8Decode(Base64.#fromBase64(input))
  }

  /**
   * Encode a byte array to base64.
   * @param bytes - Raw bytes
   * @returns Base64-encoded string
   */
  static fromBytes(bytes: Uint8Array): string {
    return Base64.#toBase64(bytes)
  }

  /**
   * Decode a base64 string to raw bytes.
   * @param input - Base64-encoded string
   * @returns Decoded bytes
   */
  static toBytes(input: string): Uint8Array {
    return Base64.#fromBase64(input)
  }
}
