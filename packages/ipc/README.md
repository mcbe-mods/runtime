# @mcbe-mods/ipc

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

Inter-Pack Communication for Minecraft Bedrock Edition Script API.

Fire-and-forget messaging with automatic chunking and LZ-String compression.

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
  compressThreshold?: number // default: 800 (compress payloads above this)
  maxPacketSize?: number // default: 1_000_000
  chunkTimeout?: number // default: 30_000 (ms)
}
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
