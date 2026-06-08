import { Base64 } from '@mcbe-mods/utils'
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import { managedNonce } from '@noble/ciphers/utils.js'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'

const KEY_LENGTH = 32
const ITERATIONS = 100_000

function utf8Encode(s: string): Uint8Array {
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

function utf8Decode(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) {
    s += `%${b.toString(16).padStart(2, '0').toUpperCase()}`
  }
  return decodeURIComponent(s)
}

export class Cipher {
  readonly #impl: { encrypt: (data: Uint8Array) => Uint8Array, decrypt: (data: Uint8Array) => Uint8Array }

  private constructor(key: Uint8Array) {
    this.#impl = managedNonce(xchacha20poly1305)(key)
  }

  static fromPassword(password: string, salt?: string | Uint8Array): Cipher {
    const saltBytes = salt !== undefined
      ? (typeof salt === 'string' ? utf8Encode(salt) : salt)
      : utf8Encode('github.com/mcbe-mods/runtime')
    const key = pbkdf2(sha256, password, saltBytes, { c: ITERATIONS, dkLen: KEY_LENGTH })
    return new Cipher(key)
  }

  static fromKey(key: Uint8Array): Cipher {
    if (key.length !== KEY_LENGTH) {
      throw new TypeError(`key must be ${KEY_LENGTH} bytes, got ${key.length}`)
    }
    return new Cipher(key)
  }

  encrypt(plain: string): string {
    const raw = utf8Encode(plain)
    const out = this.#impl.encrypt(raw)
    return Base64.fromBytes(out)
  }

  decrypt(cipher: string): string {
    const raw = Base64.toBytes(cipher)
    const out = this.#impl.decrypt(raw)
    return utf8Decode(out)
  }
}
