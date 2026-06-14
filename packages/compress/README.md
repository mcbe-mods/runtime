# @mcbe-mods/compress

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Deflate compression for Minecraft Bedrock Edition Script API.

Uses `fflate/browser` under the hood — pure JS, compatible with QuickJS (no `TextEncoder`/`TextDecoder` at runtime).

## Install

```bash
npm install @mcbe-mods/compress
```

## Usage

```ts
import { Compressor } from '@mcbe-mods/compress'

const c = new Compressor()

const original = `Hello, World!${'x'.repeat(500)}`
const compressed = c.compress(original)
// compressed is Base64-encoded deflated data, shorter than original

const decompressed = c.decompress(compressed)
// decompressed === original
```

### With IPC

`Compressor` structurally matches the `DataCompressor` interface from `@mcbe-mods/ipc` — pass it directly as a compression plugin:

```ts
import { Compressor } from '@mcbe-mods/compress'
import { IPC } from '@mcbe-mods/ipc'

const ipc = new IPC({
  compress: new Compressor(),
  compressThreshold: 500,
})
```

## API

| Method | Signature | Description |
|--------|-----------|-------------|
| `compress` | `(data: string) => string` | Deflate + Base64 encode |
| `decompress` | `(data: string) => string` | Base64 decode + Inflate |

## Implementation notes

- Uses `deflateSync` / `inflateSync` from `fflate/browser` (avoids Node's `createRequire`)
- Results are Base64-encoded via `@mcbe-mods/utils` for safe transport
- No compression threshold — the class always compresses. Threshold checking is delegated to the consumer (e.g. IPC's `compressThreshold` option)
- Unicode-safe via shared `utf8Encode`/`utf8Decode` from `@mcbe-mods/utils`

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/compress?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/compress
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/compress?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/compress
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
