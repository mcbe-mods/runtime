import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  dts: true,
  exports: true,
  publint: true,
  tsconfig: '../../tsconfig.json',
  plugins: [
    StaleGuardRecorder(),
  ],
  deps: {
    alwaysBundle: [
      'mini-emit',
      'lz-string',
    ],
    neverBundle: [
      '@minecraft/server',
      '@mcbe-mods/protocol',
      '@mcbe-mods/log',
      '@mcbe-mods/bedrock-url',
    ],
  },
})
