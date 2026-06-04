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
      '@minecraft/server',
      '@mcbe-mods/protocol',
      '@mcbe-mods/log',
      '@mcbe-mods/bedrock-url',
      '@mcbe-mods/utils',
    ],
  },
})
