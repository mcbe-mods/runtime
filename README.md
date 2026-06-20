# @mcbe-mods/runtime

[![License][license-src]][license-href]

Monorepo for Minecraft Bedrock Edition Script API runtime packages.

## Packages

| Package | Description |
|---------|-------------|
| [`@mcbe-mods/bedrock-url`](./packages/bedrock-url) | `bedrock://` URI parser — zero dependencies |
| [`@mcbe-mods/compress`](./packages/compress) | Deflate compression with threshold — fflate-based `Compressor` |
| [`@mcbe-mods/crypto`](./packages/crypto) | XChaCha20-Poly1305 symmetric encryption — password/key with QuickJS support |
| [`@mcbe-mods/discover`](./packages/discover) | Service discovery — heartbeat-based in-world registry |
| [`@mcbe-mods/ipc`](./packages/ipc) | Inter-Pack Communication — fire-and-forget messaging with chunking |
| [`@mcbe-mods/log`](./packages/log) | Level-based logging with lazy evaluation and timestamps |
| [`@mcbe-mods/protocol`](./packages/protocol) | `bedrock://` transport layer — `get`/`post`/`onReceive` |
| [`@mcbe-mods/rpc`](./packages/rpc) | Remote Procedure Call — `invoke`/`handle` with timeout |
| [`@mcbe-mods/utils`](./packages/utils) | Utility functions — game ticks, color codes, XP, item grouping, etc. |
| [`@mcbe-mods/runtime`](./packages/runtime) | Aggregator — re-exports all `@mcbe-mods/*` packages |

## Install

Pick what you need:

```bash
pnpm add @mcbe-mods/runtime       # all packages
pnpm add @mcbe-mods/rpc           # RPC only
pnpm add @mcbe-mods/ipc           # IPC only
# etc.
```

## License

[MIT](./LICENSE)

<!-- Badges -->

[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
