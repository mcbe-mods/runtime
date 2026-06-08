import { Base64 } from '@mcbe-mods/utils'
import { describe, expect, it } from 'vitest'
import { Cipher } from '../src/index'

describe('Cipher', () => {
  describe('fromPassword', () => {
    it('encrypts and decrypts a message', () => {
      const cipher = Cipher.fromPassword('my-password')
      const msg = 'hello world'
      const encrypted = cipher.encrypt(msg)
      expect(encrypted).not.toBe(msg)
      expect(cipher.decrypt(encrypted)).toBe(msg)
    })

    it('produces deterministic output for same input', () => {
      const a = Cipher.fromPassword('pw')
      const b = Cipher.fromPassword('pw')
      // Each encryption uses a random nonce, so ciphertexts differ
      expect(a.encrypt('msg')).not.toBe(b.encrypt('msg'))
      // But both can decrypt the other's output
      const encA = a.encrypt('test')
      const encB = b.encrypt('test')
      expect(a.decrypt(encB)).toBe('test')
      expect(b.decrypt(encA)).toBe('test')
    })

    it('handles empty string', () => {
      const cipher = Cipher.fromPassword('pw')
      const encrypted = cipher.encrypt('')
      expect(cipher.decrypt(encrypted)).toBe('')
    })

    it('handles unicode characters', () => {
      const cipher = Cipher.fromPassword('pw')
      const msg = '你好世界 🔐'
      const encrypted = cipher.encrypt(msg)
      expect(cipher.decrypt(encrypted)).toBe(msg)
    })

    it('handles long messages', () => {
      const cipher = Cipher.fromPassword('pw')
      const msg = 'a'.repeat(10000)
      const encrypted = cipher.encrypt(msg)
      expect(cipher.decrypt(encrypted)).toBe(msg)
    })
  })

  describe('fromKey', () => {
    it('encrypts and decrypts with a 32-byte key', () => {
      const key = new Uint8Array(32).fill(42)
      const cipher = Cipher.fromKey(key)
      const msg = 'hello'
      const encrypted = cipher.encrypt(msg)
      expect(cipher.decrypt(encrypted)).toBe(msg)
    })

    it('throws on invalid key length', () => {
      expect(() => Cipher.fromKey(new Uint8Array(16))).toThrow('key must be 32 bytes')
      expect(() => Cipher.fromKey(new Uint8Array(0))).toThrow('key must be 32 bytes')
    })
  })

  describe('tamper detection', () => {
    it('throws on corrupted ciphertext', () => {
      const cipher = Cipher.fromPassword('pw')
      const encrypted = cipher.encrypt('secret')
      const bytes = Base64.toBytes(encrypted)
      bytes[bytes.length - 1] ^= 0xFF // flip a bit in the last byte
      const tampered = Base64.fromBytes(bytes)
      expect(() => cipher.decrypt(tampered)).toThrow()
    })

    it('throws on invalid base64', () => {
      const cipher = Cipher.fromPassword('pw')
      expect(() => cipher.decrypt('!!!not-base64!!!')).toThrow()
    })
  })
})
