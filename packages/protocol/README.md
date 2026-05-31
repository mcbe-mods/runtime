# @mcbe-mods/protocol

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

`bedrock://` transport layer for Minecraft Bedrock Edition Script API.

Wraps `system.sendScriptEvent` and `scriptEventReceive` into a simple Pub/Sub API.

## Install

```bash
npm install @mcbe-mods/protocol
```

## Usage

```ts
import { Protocol } from '@mcbe-mods/protocol'

const protocol = new Protocol()

// Subscribe to incoming messages
const unsubscribe = protocol.onReceive((event) => {
  event.url // BedrockURL
  event.message // string payload
  event.sourceType // 'Server' | 'Client' | 'Other'
})

// Send a message
protocol.post('bedrock://my-addon/info', 'hello')
protocol.get('bedrock://my-addon/ping')

// Cleanup
unsubscribe()
protocol.dispose()
```

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/protocol?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/protocol
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/protocol?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/protocol
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
