# @mcbe-mods/discover

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Service discovery for Minecraft Bedrock Edition Script API.

Scripts in the same world can discover each other. Pick a name for your service — the `.discover` suffix is internal and never appears in your code.

Names support multiple levels — for example, if your addon is called `aaa` with sub-modules `chat` and `sync`, name them `chat.aaa` and `sync.aaa`. `query('aaa')` matches everything under `aaa`, and `query('_tcp')` matches all services with the `_tcp` suffix.

Each service can carry arbitrary metadata — just pass any JSON-serializable object as the second argument to `register()`. Other addons receive this metadata when they find your service.

## Install

```bash
npm install @mcbe-mods/discover
```

## Usage

```ts
import { Discover } from '@mcbe-mods/discover'

const discover = new Discover()

// Register with any name
const stop = discover.register('chat.my-addon', {
  prefix: '!',
  lang: 'zh-CN',
  version: '2.0',
})

// Find a service by name — pass a meta type for type-safe access
const cancel = discover.query<{ prefix: string, lang: string, version: string }>('my-addon', (event) => {
  if (event.type === 'service-resolved') {
    console.log('Found:', event.service.serviceType)
    console.log('Meta:', event.service.meta.lang)
  }
  else if (event.type === 'service-removed') {
    console.log('Lost:', event.serviceType)
  }
})

// Cleanup when done
stop()
cancel()
discover.dispose()
```

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/discover?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/discover
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/discover?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/discover
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
