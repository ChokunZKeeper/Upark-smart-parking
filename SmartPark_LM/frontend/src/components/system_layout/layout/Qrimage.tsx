/* ---------- Types ---------- */

type Cell = [x: number, y: number]

interface QrImageProps {
  value: string
  className?: string
}

/* ---------- Constants ---------- */

const GRID_SIZE = 21 // จำนวนช่องต่อด้าน (21x21)
const FINDER_SIZE = 7 // ขนาดสี่เหลี่ยมมุมของ QR (finder pattern)

// มุมซ้ายบนของ finder pattern ทั้ง 3 ตำแหน่ง: ซ้ายบน, ขวาบน, ซ้ายล่าง
const FINDER_ORIGINS: Cell[] = [
  [0, 0],
  [GRID_SIZE - FINDER_SIZE, 0],
  [0, GRID_SIZE - FINDER_SIZE],
]

// แถว/คอลัมน์ที่เว้นว่างไว้ (ช่องว่างรอบ finder pattern)
const SEPARATOR_LINES = [7, 13]

/* ---------- Finder pattern ---------- */

// หา finder pattern ที่ช่อง (x, y) อยู่ข้างใน (ถ้าไม่มีจะได้ undefined)
const findFinderOrigin = (x: number, y: number) =>
  FINDER_ORIGINS.find(
    ([originX, originY]) =>
      x >= originX && x < originX + FINDER_SIZE && y >= originY && y < originY + FINDER_SIZE,
  )

// ช่องนี้ (พิกัดภายใน finder 0-6) ต้องเป็นสีดำหรือไม่: กรอบนอก + แกนกลาง 3x3
const isFinderCellFilled = (localX: number, localY: number) => {
  const isOuterRing = localX === 0 || localX === 6 || localY === 0 || localY === 6
  const isCenterBlock = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4
  return isOuterRing || isCenterBlock
}

/* ---------- Pseudo-random ---------- */

// แปลงข้อความเป็นเลข seed (ข้อความเดิมได้ QR หน้าตาเดิมเสมอ)
const hashText = (text: string) => {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash
}

// ตัวสุ่มแบบ LCG: คืนค่า 0 ถึงน้อยกว่า 1
const createRandom = (seedText: string) => {
  let seed = hashText(seedText)
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

/* ---------- Build QR ---------- */

const isSeparator = (x: number, y: number) => SEPARATOR_LINES.includes(x) || SEPARATOR_LINES.includes(y)

// คืนพิกัดของช่องที่เป็นสีดำทั้งหมด
export const buildQrCells = (seedText: string): Cell[] => {
  const random = createRandom(seedText)
  const cells: Cell[] = []

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const finderOrigin = findFinderOrigin(x, y)

      if (finderOrigin) {
        const [originX, originY] = finderOrigin
        if (isFinderCellFilled(x - originX, y - originY)) cells.push([x, y])
      } else if (!isSeparator(x, y) && random() > 0.5) {
        cells.push([x, y])
      }
    }
  }

  return cells
}

/* ---------- SVG string (ใช้ดาวน์โหลด/พิมพ์) ---------- */

export const qrToSvgString = (seedText: string, pixel = 10) => {
  const size = GRID_SIZE * pixel

  const rects = buildQrCells(seedText)
    .map(([x, y]) => `<rect x="${x * pixel}" y="${y * pixel}" width="${pixel}" height="${pixel}"/>`)
    .join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<g fill="#000">${rects}</g>` +
    `</svg>`
  )
}

/* ---------- Component ---------- */

function QrImage({ value, className = 'h-9 w-9' }: QrImageProps) {
  const cells = buildQrCells(value)

  return (
    <svg
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={GRID_SIZE} height={GRID_SIZE} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" />
      ))}
    </svg>
  )
}

export default QrImage