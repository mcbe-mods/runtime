# @mcbe-mods/ipc

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

Inter-Pack Communication for Minecraft Bedrock Edition Script API.

Fire-and-forget messaging with automatic chunking and optional pluggable compression.

## Install

```bash
npm install @mcbe-mods/ipc
```

## Usage

```ts
import { EVENTS, IPC } from '@mcbe-mods/ipc'

const ipc = new IPC({ namespace: 'myAddon' })

// Send a message
ipc.send('chat', { text: 'hello', sender: 'alice' })

// Receive messages
ipc.on<{ text: string, sender: string }>('chat', (data) => {
  console.log(data.text)
})

// Cancel subscription
const off = ipc.on('channel', handler)
off()
```

### Events

```ts
ipc.events.on(EVENTS.ERROR, (err) => {
  console.error('IPC error:', err.message)
})

ipc.events.on(EVENTS.INVALID_PACKET, ({ payload }) => {
  console.warn('Invalid payload:', payload)
})
```

### Lifecycle

```ts
ipc.dispose()
```

## Options

```ts
interface IPCOptions {
  namespace?: string // default: 'global'
  chunkSize?: number // default: 1800 (max safe bytes per scriptEvent)
  compressThreshold?: number // default: 800 (only compress when payload exceeds this)
  compress?: DataCompressor // pluggable compression (e.g. @mcbe-mods/compress)
  maxPacketSize?: number // default: 1_000_000
  chunkTimeout?: number // default: 30_000 (ms)
  cipher?: ProtocolCipher // transport-layer encryption
}
```

### Compression

Compression is **optional** and **pluggable** via the `compress` option.
IPC compares the compressed result length against the original — if shorter, the
compressed version is sent with a `c` flag; the receiver decompresses automatically.

Use the standalone [`@mcbe-mods/compress`](../compress) package:

```ts
import { Compressor } from '@mcbe-mods/compress'

const ipc = new IPC({ compress: new Compressor(), compressThreshold: 500 })
```

Or provide any custom implementation matching `DataCompressor`:

```ts
const ipc = new IPC({
  compress: {
    compress: s => myPack(s),
    decompress: s => myUnpack(s),
  },
})
```

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/ipc?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/ipc
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/ipc?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/ipc
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@mcbe-mods/ipc?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@mcbe-mods/ipc
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
