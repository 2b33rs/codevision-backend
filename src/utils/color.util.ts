export function parseCmykString(color: string | null) {
  if (!color) return null

  const cmyk = color
    .replace('cmyk(', '')
    .replace(')', '')
    .split(',')
    .map((value) => parseFloat(value.trim()))

  if (cmyk.length !== 4) return null

  const [cyan, magenta, yellow, black] = cmyk

  return { cyan, magenta, yellow, black }
}

export function parseCMYKForMawi(color: string | null): {
  cyan: number
  magenta: number
  yellow: number
  black: number
} | null {
  if (!color) return null

  const match = color.match(/cmyk\(([^)]+)\)/i)
  if (!match) return null

  const values = match[1]
    .split(',')
    .map((v) => parseFloat(v.replace('%', '').trim()))

  if (values.length !== 4 || values.some((v) => isNaN(v))) return null

  const [cyan, magenta, yellow, black] = values

  return { cyan, magenta, yellow, black }
}
