// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    rules: {
      'test/prefer-lowercase-title': 'off',
    },
  },
  {
    files: ['packages/log/src/**/*.ts'],
    rules: {
      'no-console': ['error', { allow: ['log', 'info', 'warn', 'error'] }],
    },
  },
)
