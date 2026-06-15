# @mcbe-mods/log

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Level-based logging utility for Minecraft Bedrock Edition Script API.

## Install

```bash
npm install @mcbe-mods/log
```

## Usage

```ts
import { Log } from '@mcbe-mods/log'

// Default level (fallback when not set per-instance)
Log.defaultLevel = 'debug'

// Or set per-instance
const log = new Log('MyAddon', { level: 'debug' })

log.info('Hello')
log.warn('Something suspicious', detail)
log.error('Something broke', error)
log.fatal('Cannot recover')

// Lazy evaluation for debug (avoids unnecessary work)
log.debug(() => `Expensive: ${compute()}`)

// Child logger
const child = new Log('MyAddon:Sub')
child.info('scoped message')

// Timestamps
Log.defaultTimestamp = true
// or per-instance
const log2 = new Log('MyAddon', { timestamp: true, dateFormat: 'HH:mm:ss' })
```

## Options

```ts
interface LogOptions {
  level?: LogLevel // default: Log.defaultLevel
  timestamp?: boolean // default: Log.defaultTimestamp
  dateFormat?: string // default: Log.defaultDateFormat
}
```

## License

[MIT](../../LICENSE)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/log?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@mcbe-mods/log
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/log?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@mcbe-mods/log
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
