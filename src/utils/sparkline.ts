export interface ChartGeometry {
  /** Atributo `d` da linha */
  line: string
  /** Atributo `d` da área preenchida abaixo da linha */
  area: string
  min: number
  max: number
  /** true quando o último ponto está acima (ou igual) ao primeiro */
  up: boolean
}

/**
 * Reduz a série para no máximo `maxPoints` pontos (média por bloco):
 * a CoinGecko devolve ~168 pontos horários, demais para um minigráfico.
 */
export function downsample(points: number[], maxPoints: number) {
  if (points.length <= maxPoints) return points
  const size = points.length / maxPoints
  const out: number[] = []
  for (let i = 0; i < maxPoints; i++) {
    const chunk = points.slice(Math.floor(i * size), Math.floor((i + 1) * size))
    out.push(chunk.reduce((a, b) => a + b, 0) / chunk.length)
  }
  // Mantém o último valor exato para a variação bater com o preço atual
  out[out.length - 1] = points[points.length - 1]!
  return out
}

/** Converte uma série de preços em caminhos SVG dentro de uma caixa width×height. */
export function buildChart(
  points: number[],
  width: number,
  height: number,
  padding = 2,
): ChartGeometry | null {
  const values = points.filter((p) => Number.isFinite(p))
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)
  const innerH = height - padding * 2

  const coords = values.map((v, i) => {
    const x = i * stepX
    const y = padding + innerH - ((v - min) / range) * innerH
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const line = `M${coords.join(' L')}`
  const area = `${line} L${width.toFixed(2)},${height} L0,${height} Z`
  return { line, area, min, max, up: values[values.length - 1]! >= values[0]! }
}
