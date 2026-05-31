# @mcbe-mods/bedrock-url

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

`bedrock://` URI parser for Minecraft Bedrock Edition Script API. Zero dependencies.

## Install

```bash
npm install @mcbe-mods/bedrock-url
```

## Usage

```ts
import { BedrockURL, URLSearchParams } from '@mcbe-mods/bedrock-url'

const url = new BedrockURL('bedrock://my-addon/chat?v=1&id=abc')

url.protocol // 'bedrock:'
url.hostname // 'my-addon'
url.pathname // '/chat'
url.searchParams.get('v') // '1'
url.searchParams.get('id') // 'abc'

// With base URL
const base = new BedrockURL('bedrock://ns/path/to/')
const resolved = new BedrockURL('other', base)
resolved.href // 'bedrock://ns/path/other'

// To scriptEvent ID
url.toScriptEventId() // 'bedrock://my-addon/chat?v=1&id=abc'
```

## API

- `BedrockURL(url, base?)` — Parse and construct `bedrock://` URLs
- `URLSearchParams` — Standard `URLSearchParams`-compatible API

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/bedrock-url?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/bedrock-url
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/bedrock-url?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/bedrock-url
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
