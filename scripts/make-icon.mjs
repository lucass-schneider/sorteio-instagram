// Gera meta-review/app-icon-1024.png: o presente do logo, em branco, sobre um degradê.
// Desenha por distância até os traços (com antisserrilhado), sem dependências externas.
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const SIZE = 1024
const SCALE = (SIZE * 0.6) / 24 // o desenho original usa viewBox 24x24
const OFFSET = SIZE / 2 - 12 * SCALE
const HALF_STROKE = SCALE // traço de 2 unidades

const P = (x, y) => [OFFSET + x * SCALE, OFFSET + y * SCALE]

// Traços do ícone, como polilinhas (mesma geometria do SVG do cabeçalho).
const paths = []
const arc = (cx, cy, r, from, to, steps = 48) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180
    return P(cx + r * Math.cos(a), cy + r * Math.sin(a))
  })
const cubic = (p0, p1, p2, p3, steps = 48) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const u = 1 - t
    const f = (k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]
    return P(f(0), f(1))
  })

// Caixa: retângulo (3,8)-(21,21) com cantos de raio 2.
paths.push([
  ...arc(5, 10, 2, 180, 270),
  ...arc(19, 10, 2, 270, 360),
  ...arc(19, 19, 2, 0, 90),
  ...arc(5, 19, 2, 90, 180),
  P(3, 10),
])
paths.push([P(12, 8), P(12, 21)]) // fita vertical
paths.push([P(3, 12), P(21, 12)]) // tampa
// Laço: semicírculo esquerdo, curva até o centro, curva até a direita, semicírculo direito.
paths.push([
  ...arc(7.5, 5.5, 2.5, 90, 270),
  ...cubic([7.5, 3], [10, 3], [12, 8], [12, 8]),
  ...cubic([12, 8], [12, 8], [14, 3], [16.5, 3]),
  ...arc(16.5, 5.5, 2.5, 270, 450),
])

const segments = paths.flatMap((pts) => pts.slice(1).map((b, i) => [pts[i], b]))

function distanceToSegment(px, py, [[ax, ay], [bx, by]]) {
  const dx = bx - ax
  const dy = by - ay
  const len = dx * dx + dy * dy
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const stops = [
  [0, hex('#7c3aed')],
  [0.55, hex('#c026d3')],
  [1, hex('#ec4899')],
]
function background(x, y) {
  const t = (x + y) / (2 * (SIZE - 1))
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i]
    const [t0, c0] = stops[i - 1]
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0)
      return c0.map((v, j) => v + (c1[j] - v) * k)
    }
  }
  return stops.at(-1)[1]
}

const raw = Buffer.alloc((SIZE * 3 + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  const row = y * (SIZE * 3 + 1)
  raw[row] = 0 // filtro "none"
  for (let x = 0; x < SIZE; x++) {
    let d = Infinity
    for (const s of segments) {
      const [[ax, ay], [bx, by]] = s
      // Pula segmentos claramente longe (caixa delimitadora).
      if (x < Math.min(ax, bx) - HALF_STROKE - 2 || x > Math.max(ax, bx) + HALF_STROKE + 2) continue
      if (y < Math.min(ay, by) - HALF_STROKE - 2 || y > Math.max(ay, by) + HALF_STROKE + 2) continue
      d = Math.min(d, distanceToSegment(x + 0.5, y + 0.5, s))
    }
    const alpha = Math.max(0, Math.min(1, HALF_STROKE + 0.5 - d))
    const bg = background(x, y)
    for (let c = 0; c < 3; c++) raw[row + 1 + x * 3 + c] = Math.round(bg[c] + (255 - bg[c]) * alpha)
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  const out = Buffer.alloc(body.length + 8)
  out.writeUInt32BE(data.length, 0)
  body.copy(out, 4)
  out.writeUInt32BE(crc32(body), body.length + 4)
  return out
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bits por canal
ihdr[9] = 2 // RGB
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync('meta-review', { recursive: true })
writeFileSync('meta-review/app-icon-1024.png', png)
console.log(`meta-review/app-icon-1024.png (${(png.length / 1024).toFixed(0)} KB)`)
