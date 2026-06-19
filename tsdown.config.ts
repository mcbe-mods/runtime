import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig([
  {
    workspace: {
      include: ['packages/*'],
    },
    dts: true,
    exports: true,
    publint: true,
    plugins: [StaleGuardRecorder()],
  },
])
