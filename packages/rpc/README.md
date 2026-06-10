# @mcbe-mods/rpc

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Remote Procedure Call for Minecraft Bedrock Edition Script API.

Request-response communication between addons over the `bedrock://` protocol.

## Install

```bash
npm install @mcbe-mods/rpc
```

## Usage

```ts
import { RPC } from '@mcbe-mods/rpc'

// Side A: handle
const server = new RPC({ namespace: 'myAddon' })
server.handle('add', (data: { a: number, b: number }) => data.a + data.b)

// Side B: invoke
const client = new RPC({ namespace: 'myAddon' })
const sum = await client.invoke<number>('add', { a: 1, b: 2 })
// sum === 3
```

### Timeout

```ts
// Per-call timeout (ms)
const result = await client.invoke('ping', data, 5000)

// Global default
const rpc = new RPC({ namespace: 'myAddon', timeout: 10_000 })

// Disable timeout
const result = await client.invoke('ping', data, 0)
```

### Error handling

```ts
// Handler throws → error sent back to caller
server.handle('fail', () => {
  throw new Error('something broke')
})

try {
  await client.invoke('fail')
}
catch (e) {
  console.error(e.message) // 'something broke'
}
```

### Lifecycle

```ts
rpc.dispose()
```

## Options

```ts
interface RPCOptions {
  namespace?: string // default: 'global'
  timeout?: number // default: 5000 (ms), 0 to disable
  cipher?: ProtocolCipher // transport-layer encryption
}
```

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/rpc?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/rpc
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/rpc?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/rpc
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
