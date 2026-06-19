import { describe, expect, it } from 'vitest'
import { Color } from '../src/index'

describe('Color', () => {
  it('single color', () => {
    expect(Color.green('hello')).toBe('§ahello')
  })

  it('color + style chaining', () => {
    expect(Color.green.italic.bold('hello')).toBe('§a§o§lhello')
  })

  it('multiple arguments', () => {
    expect(Color.green('hello', ' world')).toBe('§ahello world')
  })

  it('with reset', () => {
    expect(Color.green.italic.bold('Dedicated Ser') + Color.reset('ver') + Color.red.obfuscated('!!!'))
      .toBe('§a§o§lDedicated Ser§rver§c§k!!!')
  })

  it('starts a new chain after calling', () => {
    const red = Color.red
    const green = Color.green
    expect(red('a')).toBe('§ca')
    expect(green('b')).toBe('§ab')
  })

  it('unknown property access returns undefined', () => {
    expect((Color as any).unknown).toBeUndefined()
  })
})
