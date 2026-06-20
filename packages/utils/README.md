# @mcbe-mods/utils

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

Utility functions for Minecraft Bedrock Edition mod development. Part of the [`@mcbe-mods/runtime`](https://github.com/mcbe-mods/runtime) monorepo.

## Usage

Install:

```bash
npm install @mcbe-mods/utils
```

```ts
import { Base64, Color, Experience, getCubeRange, getRandomProbability, getRandomRangeValue, getSphereRange, ms2ticks, splitGroups, unique } from '@mcbe-mods/utils'

// splitGroups - split items into stacks
splitGroups(65) // => [64, 1]
splitGroups(140) // => [64, 64, 12]

// Color - Minecraft formatting codes
Color.green.italic.bold('Dedicated Ser') + Color.reset('ver') + Color.red.obfuscated('!!!')
// => '§a§o§lDedicated Ser§rver§c§k!!!'

// Experience - player XP calculation
const exp = new Experience()
exp.addXP(100)
exp.getLevel() // => 7

// ms2ticks - time to ticks
ms2ticks(1000) // => 20

// getCubeRange / getSphereRange - block position range
getCubeRange({ x: 0, y: 0, z: 0 }, 1) // => 27 positions (cube)
getSphereRange({ x: 0, y: 0, z: 0 }, 1) // => 27 positions (sphere)
```

## API

| Function | Description |
| --- | --- |
| `splitGroups(sum, groupSize?)` | Split a number into groups of a given size |
| `Color` | Minecraft color/formatting code stylizer |
| `Experience` | Player experience calculator (leveling up) |
| `ms2ticks(milliseconds?, gameTicksPerSecond?, millisecondsPerSecond?)` | Convert real time to game ticks |
| `getCubeRange(location, radius?)` | Get block positions in a cube |
| `getRandomProbability(probability)` | Random chance with percentage |
| `getRandomRangeValue(min, max)` | Random integer within a range |
| `getSphereRange(location, radius?)` | Get block positions in a sphere |
| `unique(size?)` | Generate a random alphanumeric string |
| `Base64` | Base64 encode/decode utility |
| `utf8Encode(s)` | Encode string to UTF-8 bytes using `encodeURIComponent` |
| `utf8Decode(bytes)` | Decode UTF-8 bytes back to string using `decodeURIComponent` |

## License

[MIT](../LICENSE) License © [Lete114](https://github.com/Lete114)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@mcbe-mods/utils?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/@mcbe-mods/utils
[npm-downloads-src]: https://img.shields.io/npm/dm/@mcbe-mods/utils?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/@mcbe-mods/utils
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@mcbe-mods/utils?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@mcbe-mods/utils
[license-src]: https://img.shields.io/github/license/mcbe-mods/runtime.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mcbe-mods/runtime/blob/main/LICENSE
