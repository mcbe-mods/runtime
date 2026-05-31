# @mcbe-mods/runtime

[![License][license-src]][license-href]

Monorepo for Minecraft Bedrock Edition Script API runtime packages.

## Packages

| Package | Description |
|---------|-------------|
| [`@mcbe-mods/bedrock-url`](./packages/bedrock-url) | `bedrock://` URI parser — zero dependencies |
| [`@mcbe-mods/ipc`](./packages/ipc) | Inter-Pack Communication — fire-and-forget messaging with chunking and compression |
| [`@mcbe-mods/log`](./packages/log) | Level-based logging with lazy evaluation and timestamps |
| [`@mcbe-mods/protocol`](./packages/protocol) | `bedrock://` transport layer — `get`/`post`/`onReceive` |
| [`@mcbe-mods/rpc`](./packages/rpc) | Remote Procedure Call — `invoke`/`handle` with timeout |
| [`@mcbe-mods/runtime`](./packages/runtime) | Aggregator — re-exports all `@mcbe-mods/*` packages |

## Install

Pick what you need:

```bash
npm install @mcbe-mods/runtime       # all packages
npm install @mcbe-mods/rpc           # RPC only
npm install @mcbe-mods/ipc           # IPC only
# etc.
```

## License

[MIT](./LICENSE)

<!-- Badges -->

[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
