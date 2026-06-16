import type { TRet } from '@noble/ciphers/utils.js'
import { Base64, utf8Decode, utf8Encode } from '@mcbe-mods/utils'
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js'
import { managedNonce } from '@noble/ciphers/utils.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'

const KEY_LENGTH = 32

function defaultRandomBytes(bytesLength: number): Uint8Array {
  const out = new Uint8Array(bytesLength)
  for (let i = 0; i < bytesLength; i++) {
    out[i] = (Math.random() * 256) | 0
  }
  return out
}

export interface CipherOptions {
  randomBytes?: (size: number) => Uint8Array
}

export class Cipher {
  readonly #impl: { encrypt: (data: Uint8Array) => Uint8Array, decrypt: (data: Uint8Array) => Uint8Array }

  private constructor(key: Uint8Array, options?: CipherOptions) {
    const randomBytes = options?.randomBytes ?? defaultRandomBytes
    this.#impl = managedNonce(xchacha20poly1305, size => randomBytes(size ?? 24) as unknown as TRet<Uint8Array>)(key)
  }

  static generateSalt(length: number = 16): Uint8Array {
    return defaultRandomBytes(length)
  }

  static fromPassword(password: string, salt?: string | Uint8Array, options?: CipherOptions): Cipher {
    const ikm = utf8Encode(password)
    const saltBytes = salt !== undefined
      ? (typeof salt === 'string' ? utf8Encode(salt) : salt)
      : utf8Encode('github.com/mcbe-mods/runtime')
    const key = hkdf(sha256, ikm, saltBytes, undefined, KEY_LENGTH)
    return new Cipher(key, options)
  }

  static fromKey(key: Uint8Array, options?: CipherOptions): Cipher {
    if (key.length !== KEY_LENGTH) {
      throw new TypeError(`key must be ${KEY_LENGTH} bytes, got ${key.length}`)
    }
    return new Cipher(key, options)
  }

  /**
   * Encrypt a plaintext string.
   * Returns the ciphertext as a base64-encoded string.
   * @param plain - UTF-8 plaintext to encrypt
   */
  encrypt(plain: string): string {
    const raw = utf8Encode(plain)
    const out = this.#impl.encrypt(raw)
    return Base64.fromBytes(out)
  }

  /**
   * Decrypt a base64-encoded ciphertext.
   * Returns the original plaintext string.
   * @param cipher - Base64-encoded ciphertext to decrypt
   */
  decrypt(cipher: string): string {
    const raw = Base64.toBytes(cipher)
    const out = this.#impl.decrypt(raw)
    return utf8Decode(out)
  }
}
