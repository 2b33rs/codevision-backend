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

export function cmykObjectToString(farbcode: {
  cyan: number
  magenta: number
  yellow: number
  black: number
}) {
  return `cmyk(${farbcode.cyan}%,${farbcode.magenta}%,${farbcode.yellow}%,${farbcode.black}%)`
}

/**
 * Konvertiert eine Hex-Farbe (#ffffff) in CMYK-Werte
 * @param hex - Hex-Farbwert (mit oder ohne #)
 * @returns CMYK-Objekt mit Werten in Prozent (0-100)
 */
export function hexToCmyk(hex: string): {
  c: number
  m: number
  y: number
  k: number
} {
  // # entfernen falls vorhanden
  hex = hex.replace('#', '')

  // Validierung: muss 6 Zeichen lang sein
  if (hex.length !== 6) {
    throw new Error('Ungültiger Hex-Wert. Format: #ffffff oder ffffff')
  }

  // RGB-Werte extrahieren (0-255)
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // RGB in 0-1 Bereich normalisieren
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  // K (Key/Black) berechnen
  const k = 1 - Math.max(rNorm, gNorm, bNorm)

  // CMY berechnen
  const c = k === 1 ? 0 : (1 - rNorm - k) / (1 - k)
  const m = k === 1 ? 0 : (1 - gNorm - k) / (1 - k)
  const y = k === 1 ? 0 : (1 - bNorm - k) / (1 - k)

  // In Prozent umwandeln und runden
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  }
}

// Beispiel-Verwendung:
const cmykValues = hexToCmyk('#ffffff')
console.log(cmykValues) // { c: 0, m: 0, y: 0, k: 0 }

const cmykRed = hexToCmyk('#ff0000')
console.log(cmykRed) // { c: 0, m: 100, y: 100, k: 0 }

const cmykBlue = hexToCmyk('#0000ff')
console.log(cmykBlue) // { c: 100, m: 100, y: 0, k: 0 }

// Formatierte String-Ausgabe
export function formatCmyk(cmyk: {
  c: number
  m: number
  y: number
  k: number
}): string {
  return `cmyk(${cmyk.c}%,${cmyk.m}%,${cmyk.y}%,${cmyk.k}%)`
}
