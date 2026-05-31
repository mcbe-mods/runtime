import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  dts: true,
  exports: true,
  publint: true,
  deps: {
    neverBundle: [
      '@mcbe-mods/bedrock-url',
      '@mcbe-mods/ipc',
      '@mcbe-mods/log',
      '@mcbe-mods/protocol',
      '@mcbe-mods/rpc',
      '@minecraft/server',
    ],
  },
})
