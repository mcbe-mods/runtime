/**
 * Divide a number of items into groups of how many each
 * @param {number} sum totals
 * @param {number} groupSize Size per group (default 64)
 * @returns {number[]} The number of items in each group
 * @example
 * ```js
 * splitGroups(65) // => [64, 1]
 * splitGroups(140) // => [64, 64, 12]
 * splitGroups(65, 16) // => [16, 16, 16, 16, 1]
 * ```
 */
export function splitGroups(sum: number, groupSize: number = 64): number[] {
  if (groupSize <= 0) {
    throw new RangeError('groupSize must be a positive number')
  }
  if (sum < 0) {
    throw new RangeError('sum must be a non-negative number')
  }
  const groups = []
  while (sum > 0) {
    const group = Math.min(sum, groupSize)
    groups.push(group)
    sum -= group
  }
  return groups
}
