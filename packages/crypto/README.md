# @mcbe-mods/crypto

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Symmetric encryption for Minecraft Bedrock Edition Script API — XChaCha20-Poly1305 with password/key support.

Designed to pair with [`@mcbe-mods/protocol`](../protocol) for encrypted in-world communication.

## Install

```bash
npm install @mcbe-mods/crypto
```

## Usage

### From password

```ts
import { Cipher } from '@mcbe-mods/crypto'
import { Protocol } from '@mcbe-mods/protocol'

const cipher = Cipher.fromPassword('my-shared-secret')
const protocol = new Protocol({ cipher })

protocol.post('bedrock://my-addon/info', 'hello') // automatically encrypted
protocol.onReceive((event) => {
  event.message // automatically decrypted
})
```

The optional second argument `salt` lets you scope a password to a specific project.
When omitted, it defaults to a salt bound to this monorepo (`github.com/mcbe-mods/runtime`):

```ts
// Default salt (github.com/mcbe-mods/runtime)
Cipher.fromPassword('secret')
// Custom string salt
Cipher.fromPassword('secret', 'my-project-id')
// Custom binary salt
Cipher.fromPassword('secret', new Uint8Array([1, 2, 3, 4]))
```

**Security note**: the default salt is tied to this monorepo to prevent accidental key reuse across projects. In production, pass an app-specific salt or manage keys directly via `fromKey`. Both sides must use the same password + salt combination.

### From raw key

```ts
const key = new Uint8Array(32).fill(42)
const cipher = Cipher.fromKey(key)
```

Both sides must use the same password or key for communication to work.

### Custom random source

By default, nonces are generated using `Math.random()`, which is safe for XChaCha20-Poly1305's 192-bit nonce space but not cryptographically secure. You can inject any random bytes function via `CipherOptions`:

```ts
const cipher = Cipher.fromPassword('secret', undefined, {
  randomBytes(size) {
    // Use any available random source
    const buf = new Uint8Array(size)
    for (let i = 0; i < size; i++) {
      buf[i] = (Math.random() * 256) | 0
    }
    return buf
  },
})
```

This works with both `fromPassword` and `fromKey`.

**Note:** `@minecraft/server` does not provide a secure random API. If your runtime has access to one (e.g. Web `crypto.getRandomValues`), you can pass it here.

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/crypto?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/crypto
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/crypto?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/crypto
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
