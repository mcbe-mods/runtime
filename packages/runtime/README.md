# @mcbe-mods/runtime

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Aggregator package — re-exports all `@mcbe-mods/*` sub-packages.

Install this if you want everything in one dependency:

```bash
npm install @mcbe-mods/runtime
```

## Re-exports

| Source Package | Exports |
|---------------|---------|
| `@mcbe-mods/bedrock-url` | `BedrockURL`, `URLSearchParams` |
| `@mcbe-mods/crypto` | `Cipher` |
| `@mcbe-mods/discover` | `Discover` |
| `@mcbe-mods/ipc` | `Chunker`, `Compressor`, `EVENTS`, `IPC`, `PROTOCOL_VERSION` |
| `@mcbe-mods/log` | `Log` |
| `@mcbe-mods/protocol` | `Protocol` |
| `@mcbe-mods/rpc` | `RPC` |
| `@mcbe-mods/utils` | `Base64`, `color`, `unique`, `ms2ticks`, … |

```ts
import { Base64, Cipher, Discover, IPC, Log, Protocol, RPC } from '@mcbe-mods/runtime'
```

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/runtime?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/runtime
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/runtime?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/runtime
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
