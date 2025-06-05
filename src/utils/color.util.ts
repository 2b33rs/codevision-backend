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
