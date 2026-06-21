/**
 * QuickJS polyfill: TextEncoder is unavailable in Minecraft Bedrock Script API,
 * so we use encodeURIComponent to build UTF-8 byte arrays.
 */
export function utf8Encode(s: string): Uint8Array {
  const encoded = encodeURIComponent(s)
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
  return new Uint8Array(bytes)
}

/**
 * QuickJS polyfill: TextDecoder is unavailable, so we use decodeURIComponent
 * to decode UTF-8 byte arrays back to strings.
 * @throws {URIError} If the byte sequence is not valid UTF-8
 */
export function utf8Decode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) {
    s += `%${b.toString(16).padStart(2, '0').toUpperCase()}`
  }
  try {
    return decodeURIComponent(s)
  }
  catch {
    throw new Error('Invalid UTF-8 byte sequence')
  }
}
