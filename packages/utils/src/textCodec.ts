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

export function utf8Decode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) {
    s += `%${b.toString(16).padStart(2, '0').toUpperCase()}`
  }
  return decodeURIComponent(s)
}
