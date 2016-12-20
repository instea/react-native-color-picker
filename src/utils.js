import tinycolor from 'tinycolor2'

/**
 * Converts color to hsv representation.
 * @param {string} color any color represenation - name, hexa, rgb
 * @return {object} { h: number, s: number, v: number } object literal
 */
export function toHsv(color) {
  return tinycolor(color).toHsv()
}

/**
 * Converts hsv object to hexa color string.
 * @param {object} hsv { h: number, s: number, v: number } object literal
 * @return {string} color in hexa representation
 */
export function fromHsv(hsv) {
  return tinycolor(hsv).toHexString()
}

