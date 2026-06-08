export class Base64 {
  static #CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  static #REVERSE = Object.fromEntries([...Base64.#CHARS].map((c, i) => [c.charCodeAt(0), i]))

  static encode(input: string): string {
    const encoded = encodeURIComponent(input)
    const bytes: number[] = []
    for (let i = 0; i < encoded.length; i++) {
      if (encoded[i] === '%') {
        bytes.push(Number.parseInt(encoded[i + 1] + encoded[i + 2], 16))
        i += 2
      }
      else {
        bytes.push(encoded.charCodeAt(i))
      }
    }

    let result = ''
    for (let i = 0; i < bytes.length; i += 3) {
      const b = (bytes[i] << 16) | (bytes[i + 1] ?? 0) << 8 | (bytes[i + 2] ?? 0)
      result += Base64.#CHARS[b >> 18 & 0x3F] + Base64.#CHARS[b >> 12 & 0x3F]
      result += i + 1 < bytes.length ? Base64.#CHARS[b >> 6 & 0x3F] : '='
      result += i + 2 < bytes.length ? Base64.#CHARS[b & 0x3F] : '='
    }
    return result
  }

  static decode(input: string): string {
    const bytes: number[] = []
    const sanitized = input.replace(/[^A-Z0-9+/=]/gi, '')
    for (let i = 0; i < sanitized.length; i += 4) {
      const enc1 = Base64.#REVERSE[sanitized[i].charCodeAt(0)]
      const enc2 = Base64.#REVERSE[sanitized[i + 1].charCodeAt(0)]
      const enc3 = sanitized[i + 2] === '=' ? 0 : Base64.#REVERSE[sanitized[i + 2].charCodeAt(0)]
      const enc4 = sanitized[i + 3] === '=' ? 0 : Base64.#REVERSE[sanitized[i + 3].charCodeAt(0)]
      const b = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4
      bytes.push(b >> 16 & 0xFF)
      if (sanitized[i + 2] !== '=') {
        bytes.push(b >> 8 & 0xFF)
      }
      if (sanitized[i + 3] !== '=') {
        bytes.push(b & 0xFF)
      }
    }

    let percent = ''
    for (const b of bytes) {
      percent += `%${b.toString(16).padStart(2, '0').toUpperCase()}`
    }
    return decodeURIComponent(percent)
  }
}
