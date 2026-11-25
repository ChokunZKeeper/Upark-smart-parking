import React, { useLayoutEffect, useRef, useState } from 'react'
import carImg from '@/assets/logos/Car_white.png'
import carBlack from '@/assets/logos/Car_black.png'   // use your real file name
import { useT } from '@/i18n'

/* Every color is a CSS variable, so the canvas follows light/dark mode.
   The variables are defined in global CSS (see the :root / [data-theme='dark'] blocks). */
const COLORS = {
  stroke: 'var(--pc-stroke)',
  lightStroke: 'var(--pc-light-stroke)',
  fill: 'var(--surface)',
  label: 'var(--text)',
  text: 'var(--text)',
  ink: 'var(--pc-ink)',
  lane: 'var(--pc-lane)',
  chip: 'var(--pc-chip)',
  chipText: 'var(--pc-chip-text)',
  cameraFill: 'var(--pc-camera-fill)',
  cameraStroke: 'var(--pc-camera-stroke)',
  cameraDot: 'var(--pc-camera-dot)',
  sensor: 'var(--pc-sensor)',
  paymentFill: 'var(--pc-payment-fill)',
  paymentStroke: 'var(--pc-payment-stroke)',
  paymentText: 'var(--pc-payment-text)',
  greenFill: 'var(--pc-green-fill)',
  greenStroke: 'var(--pc-green-stroke)',
  redFill: 'var(--pc-red-fill)',
  redHatch: 'var(--pc-red-hatch)',
  redStroke: 'var(--pc-red-stroke)',
  purpleFill: 'var(--pc-purple-fill)',
  purpleStroke: 'var(--pc-purple-stroke)',
  gateFill: 'var(--pc-gate-fill)',
  gateStroke: 'var(--pc-gate-stroke)',
  selection: 'var(--pc-selection)',
} as const

const shapeProps: React.SVGProps<SVGElement> = {
  vectorEffect: 'non-scaling-stroke',
  strokeWidth: 1,
}

/* ─── ปรับความหนา / ขนาดตัวอักษรได้ที่นี่ ───
   ค่า stroke ด้านล่างอยู่ในหน่วย viewBox ของแต่ละรูป (ย่อตามขนาดรูปอัตโนมัติ)  */
const LANE_STROKE = 4.5          // ลูกศร Lane (ทั้งทางเดียว / สองทาง)
const GATE_ARROW_STROKE = 4.5    // ลูกศร Entry / Exit
const GATE_BAR_STROKE = 7        // เส้นตั้ง Entry / Exit
const STAIRS_BORDER_STROKE = 3   // กรอบบันได
const STAIRS_ROW_STROKE = 2.5    // เส้นขั้นบันได + เส้นประ + เส้นแบ่งกลาง
const STAIRS_ARROW_STROKE = 6    // ลูกศรบันได
const SLOT_FONT = 9              // ขนาดตัวอักษรใน Slot
const ZONE_STROKE = 1.5          // ขอบ Zone (px จริงบนหน้าจอ)
const ELEM_SCALE = 2             // ⚠ ต้องตรงกับ ELEM_SCALE ใน EditParkingLayout.tsx (ใช้กับข้อความ label ของ Zone)

/* tool ที่ "มีสี" (เขียว / แดง / ม่วง / เหลือง ฯลฯ)
   → หน้า Parking (grayOnly) จะไม่วาด tool เหล่านี้ เหลือแต่ของสีเทา
   อยากให้ตัวไหนโชว์ ให้ลบออกจาก Set นี้
   (zone เป็นกรณีพิเศษ: ซ่อนแค่กรอบสี แต่ยังเก็บชื่อ Zone ไว้ และยังกดเพื่อซูมได้) */
const COLORED_TOOLS = new Set<string>(['zone', 'sensor', 'cam', 'payment'])

/* tool ที่ภาพวาดมีขนาดตายตัว (ไม่คำนวณจาก W/H) — เวลายืด/หดจะ scale ภาพตามกรอบ
   แยกแกน X / Y อิสระต่อกัน (scale(sx, sy))
   ที่ขนาดเริ่มต้น (BASE_SIZE) scale = 1 จึงเหมือนเดิมเป๊ะ
   cam / payment: ใน block ของตัวเองวาดที่ขนาด BASE_SIZE เสมอ แล้วให้ scale ยืดแทน */
const BASE_SIZE: Partial<Record<string, { w: number; h: number }>> = {
  lane: { w: 140, h: 28 },
  entry: { w: 80, h: 50 },
  exit: { w: 80, h: 50 },
  stairs: { w: 80, h: 110 },
  gate: { w: 14, h: 50 },
  cam: { w: 100, h: 50 },
  payment: { w: 48, h: 44 },
}

/* tool ที่กรอบเลือกใช้ขนาด element ตรง ๆ ไม่ต้องวัดจากภาพ */
const NO_MEASURE = new Set(['slot', 'zone'])

export type ParkingToolType =
  | 'slot'
  | 'lane'
  | 'entry'
  | 'exit'
  | 'lift'
  | 'stairs'
  | 'pillar'
  | 'cam'
  | 'sensor'
  | 'payment'
  | 'text'
  | 'zone'
  | 'gate'

export interface ParkingElementData {
  id: string | number
  tool: ParkingToolType
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  variant?: string
  status?: 'active' | 'occupied' | 'closed' | 'reserved' | string
  slotId?: string
  label?: string
  sectionLabel?: string
  _dimmed?: boolean
  /* ซ่อนจาก Layers panel — ไม่วาดทั้งหน้า Edit และหน้า Parking */
  hidden?: boolean
}

/* ขอบเขตของภาพวาดจริง (พิกัดภายใน element, หน่วย px) */
export interface ElementBounds {
  x: number
  y: number
  w: number
  h: number
}

/* กรอบ "กล้อง" ในพิกัดโลก (หน่วย px เดียวกับ element) */
export interface CameraRect {
  x: number
  y: number
  w: number
  h: number
}

interface ArrowProps {
  x1: number
  y1: number
  x2: number
  y2: number
  color?: string
  direction?: 'left' | 'right'
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = COLORS.lightStroke,
  direction = 'right',
}: ArrowProps) {
  const head = Math.min(5, Math.max(2, Math.abs(x2 - x1) * 0.12))
  const points =
    direction === 'left'
      ? `${x2 + head},${y2 - head} ${x2},${y2} ${x2 + head},${y2 + head}`
      : `${x2 - head},${y2 - head} ${x2},${y2} ${x2 - head},${y2 + head}`

  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" {...shapeProps}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polyline points={points} />
    </g>
  )
}

function truncateLabel(value: unknown, maxLength: number): string {
  const label = String(value || '')
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}...` : label
}

type ZoneVariant = 'red' | 'purple' | 'green'

function getZoneVariant(variant?: string): ZoneVariant {
  if (variant === 'hatched' || variant === 'red') return 'red'
  if (variant === 'purple') return 'purple'
  return 'green'
}

export interface ParkingElementProps {
  elem: ParkingElementData
  selected?: boolean
  onSelect?: (id: string | number) => void
  onDragStart?: (e: React.MouseEvent<HTMLDivElement>, id: string | number) => void
  /* แจ้งขอบเขตภาพวาดจริงให้หน้า Edit ใช้วาดกรอบเลือกให้พอดี */
  onBounds?: (id: string, bounds: ElementBounds) => void
  readOnly?: boolean
  /* true = วาดเฉพาะของสีเทา (ซ่อน zone / sensor / cam / payment / gate ที่มีสี) — ใช้ในหน้า Parking */
  grayOnly?: boolean
}

/* Shared canvas element renderer – used by both EditParkingLayout and Parking. */
export function ParkingElement({
  elem,
  onSelect,
  onDragStart,
  onBounds,
  readOnly = false,
  grayOnly = false,
}: ParkingElementProps) {
  const t = useT()
  const W = Math.max(Number(elem.w) || 1, 1)
  const H = Math.max(Number(elem.h) || 1, 1)

  const handleMouseDown = readOnly
    ? undefined
    : (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      onSelect?.(elem.id)
      onDragStart?.(e, elem.id)
    }

  let artwork: React.ReactNode = null

  const rotation = elem.rotation || 0
  const upright = rotation ? `rotate(${-rotation} ${W / 2} ${H})` : undefined

  /* scale ของภาพวาดขนาดตายตัว (ดู BASE_SIZE) — แยกแกน X / Y */
  const base = BASE_SIZE[elem.tool]
  const sx = base ? W / base.w : 1
  const sy = base ? H / base.h : 1

  /* โหมดสีเทาอย่างเดียว: tool ที่มีสีไม่ต้องวาด (zone ข้ามไปวาดแค่ชื่อในบล็อก zone ด้านล่าง) */
  const skipColored = grayOnly && COLORED_TOOLS.has(elem.tool)

  /* ───────────────────────── SLOT ───────────────────────── */
  if (skipColored) {
    artwork = null
  } else if (elem.tool === 'slot') {
    /* รถแสดงเฉพาะช่องที่ตั้งเป็น occupied จริง ๆ (ช่องใหม่ status 'active' = ว่าง ไม่มีรถ) */
    const showCar =
      elem.status !== 'closed' &&
      (elem.status === 'occupied' ||
        elem.variant === 'occupied' ||
        elem.variant === 'car')

    /* รถกินเกือบเต็มช่อง (เว้นบนเล็กน้อย ล่างเหลือที่ให้ตัวอักษร) */
    /* ตัวอักษรใน Slot ย่อ/ขยายตามความกว้าง (ที่ W = 50 → ขนาดเดิม) */
    const slotU = Math.max(W / 50, 0.6)

    const carX = W * 0.1
    const carY = H * 0.04
    const carW = W * 0.8
    const carH = H * 0.84

    artwork = (
      <g opacity={elem._dimmed ? 0.3 : 1}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d={`M0.5 ${H} V0.5 H${Math.max(W - 0.5, 0)} V${H}`}
            stroke={COLORS.lane}
            strokeWidth={1}
            strokeLinejoin="miter"
            {...shapeProps}
          />
          {showCar && (
            <>
              {/* รถดำ: ตอนนี้แสดงเฉพาะ dark (กลับค่าแล้ว) */}
              <image
                href={carBlack}
                style={{ display: 'var(--pc-car-dark-display)' }}
                x={carX}
                y={carY}
                width={carW}
                height={carH}
                preserveAspectRatio="xMidYMid meet"
                opacity={elem.status === 'reserved' ? 0.3 : 1}
              />
              {/* รถขาว: ตอนนี้แสดงเฉพาะ light (กลับค่าแล้ว) */}
              <image
                href={carImg}
                style={{ display: 'var(--pc-car-light-display)' }}
                x={carX}
                y={carY}
                width={carW}
                height={carH}
                preserveAspectRatio="xMidYMid meet"
                opacity={elem.status === 'reserved' ? 0.3 : 1}
              />
            </>
          )}
        </svg>
        <g transform={upright}>
          {readOnly && elem.status === 'closed' && (
            <text
              x={W / 2}
              y={H}
              textAnchor="middle"
              fontSize={16 * slotU}
              fontWeight="700"
              fill={COLORS.ink}
              fontFamily="Inter"
            >
              !
            </text>
          )}
          <text
            x={W / 2}
            y={H}
            textAnchor="middle"
            fontSize={SLOT_FONT * slotU}
            fill={COLORS.ink}
            fontFamily="Inter"
          >
            {elem.slotId || elem.label || t('parkingCanvas.defaultText')}
          </text>
        </g>

      </g>
    )

    /* ───────────────────────── LANE ───────────────────────── */
  } else if (elem.tool === 'lane') {
    const variant = elem.variant || 'one-way'

    const laneStroke = {
      stroke: COLORS.lane,
      strokeWidth: LANE_STROKE,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      fill: 'none',
    }

    if (variant === 'two-way') {
      /* ขนาดอ้างอิงเดียวกับทางเดียว (1/3 ของ viewBox) เพื่อให้สัดส่วนเหมือนดีไซน์ */
      const TW = 214 / 3
      const TH = 189 / 3

      artwork = (
        <svg width={TW} height={TH} viewBox="0 0 214 189" fill="none" overflow="visible">
          <path d="M2.5 95.5L211.5 95.5" {...laneStroke} />
          <path d="M130.666 2.5L146.333 16.3333L130.666 30.1667" {...laneStroke} />
          <path d="M68 16.333H146.333" {...laneStroke} />
          <path d="M83.668 186.167L68.0013 172.334L83.668 158.5" {...laneStroke} />
          <path d="M146.334 172.334H68.0006" {...laneStroke} />
        </svg>
      )
    } else {
      const W2 = 84 / 3
      const H2 = 33 / 3

      artwork = (
        <svg width={W2} height={H2} viewBox="0 0 84 33" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
          <path d="M65.166 2.5L80.8327 16.3333L65.166 30.1667" {...laneStroke} />
          <path d="M2.5 16.333H80.8333" {...laneStroke} />
        </svg>
      )
    }

    /* ───────────────────────── ENTRY ───────────────────────── */
  } else if (elem.tool === 'entry') {
    const H = 135 / 3
    const W = 245 / 3

    artwork = (
      <svg width={H} height={W} viewBox="0 0 135 245" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <path d="M131.5 241.5L131.5 3.5" strokeWidth={GATE_BAR_STROKE} strokeLinecap="round" stroke={COLORS.lane} />
        <path d="M24.9297 73.2393C23.9897 73.2393 23.3916 72.624 23.3916 71.6499V49.6895C23.3916 48.7153 23.9897 48.1001 24.9297 48.1001C25.8696 48.1001 26.4678 48.7153 26.4678 49.6895V71.6499C26.4678 72.624 25.8696 73.2393 24.9297 73.2393ZM32.7739 73.2393C31.834 73.2393 31.2529 72.624 31.2529 71.6499V49.8945C31.2529 48.8179 31.9536 48.1001 33.0132 48.1001C33.8335 48.1001 34.2437 48.3394 34.7905 49.1255L47.7446 67.7021H47.8984V49.6895C47.8984 48.7153 48.4795 48.1001 49.4194 48.1001C50.3594 48.1001 50.9404 48.7153 50.9404 49.6895V71.5645C50.9404 72.6069 50.291 73.2393 49.1973 73.2393C48.3599 73.2393 47.9668 73.0171 47.4199 72.231L34.4487 53.7056H34.2949V71.6499C34.2949 72.624 33.7139 73.2393 32.7739 73.2393Z" fill={COLORS.ink} />
        <path d="M65.166 107.667L80.8327 121.5L65.166 135.334" strokeWidth={GATE_ARROW_STROKE} strokeLinecap="round" strokeLinejoin="round" stroke={COLORS.lane} />
        <path d="M2.5 121.5H80.8333" strokeWidth={GATE_ARROW_STROKE} strokeLinecap="round" strokeLinejoin="round" stroke={COLORS.lane} />
      </svg>
    )

    /* ───────────────────────── EXIT ───────────────────────── */
  } else if (elem.tool === 'exit') {
    const H = 135 / 3
    const W = 245 / 3

    artwork = (
      <svg width={H} height={W} viewBox="0 0 135 245" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <path d="M3.5 241.5L3.5 3.5" strokeWidth={GATE_BAR_STROKE} strokeLinecap="round" stroke={COLORS.lane} />
        <path d="M63.6465 73.4102C56.6567 73.4102 52.2817 68.5054 52.2817 60.6782C52.2817 52.8511 56.6567 47.9292 63.6465 47.9292C70.6362 47.9292 75.0112 52.8511 75.0112 60.6782C75.0112 68.5054 70.6362 73.4102 63.6465 73.4102ZM63.6465 70.5732C68.688 70.5732 71.8496 66.7451 71.8496 60.6782C71.8496 54.5942 68.688 50.7661 63.6465 50.7661C58.605 50.7661 55.4434 54.5942 55.4434 60.6782C55.4434 66.7451 58.605 70.5732 63.6465 70.5732ZM88.6318 73.4102C82.5137 73.4102 78.8394 69.6162 78.8394 64.3525V49.6895C78.8394 48.7153 79.4375 48.1001 80.3774 48.1001C81.3174 48.1001 81.9155 48.7153 81.9155 49.6895V64.1475C81.9155 67.873 84.3594 70.5732 88.6318 70.5732C92.9043 70.5732 95.3481 67.873 95.3481 64.1475V49.6895C95.3481 48.7153 95.9463 48.1001 96.8862 48.1001C97.8262 48.1001 98.4243 48.7153 98.4243 49.6895V64.3525C98.4243 69.6162 94.75 73.4102 88.6318 73.4102ZM110.985 73.2393C110.045 73.2393 109.447 72.624 109.447 71.6499V51.1079H102.885C102.013 51.1079 101.415 50.5439 101.415 49.7236C101.415 48.9033 102.013 48.3394 102.885 48.3394H119.086C119.958 48.3394 120.556 48.9033 120.556 49.7236C120.556 50.5439 119.958 51.1079 119.086 51.1079H112.523V71.6499C112.523 72.624 111.925 73.2393 110.985 73.2393Z" fill={COLORS.ink} />
        <path d="M116.666 108L132.333 121.833L116.666 135.667" strokeWidth={GATE_ARROW_STROKE} strokeLinecap="round" strokeLinejoin="round" stroke={COLORS.lane} />
        <path d="M54 121.833H132.333" strokeWidth={GATE_ARROW_STROKE} strokeLinecap="round" strokeLinejoin="round" stroke={COLORS.lane} />
      </svg>
    )

    /* ───────────────────────── LIFT ───────────────────────── */
  } else if (elem.tool === 'lift') {
    /* ทุกค่าที่เป็นตัวอักษร/ระยะคงที่ในลิฟต์ ย่อ/ขยายตามความกว้าง (ที่ W = 90 → ขนาดเดิม) */
    const u = Math.max(W / 90, 0.6)
    const labelH = 16 * u                      // space for the title above the frame
    const fx = 0.5
    const fy = labelH + 0.5
    const fw = Math.max(W - 1, 0)
    /* ความสูงกรอบคิดจาก H ตรง ๆ (ไม่ผูกกับความกว้างอีกต่อไป) → ยืดแกนใดแกนหนึ่งได้อิสระ */
    const fh = Math.max(H - labelH - 1, 4)

    // inner placeholder box (สัดส่วนตามดีไซน์)
    const ix = W * 0.13
    const iw = W - ix * 2
    const iy = fy + fh * 0.097
    const ih = fh * 0.73

    // pills straddling the bottom edge of the frame
    const pillW = iw * 0.42
    const pillH = 5 * u
    const pillY = fy + fh - pillH / 2

    artwork = (
      <>
        {/* LIFT — ข้อความใหญ่เหนือกรอบ กึ่งกลาง */}
        <text x={fx + fw / 2} y={fy - 12.4 * u} textAnchor="middle" fontSize={12.5 * u} fill={COLORS.ink} fontFamily="Inter">
          {t('parkingCanvas.lift')}
        </text>

        {/* outer frame */}
        <rect x={fx} y={fy} width={fw} height={fh} rx="1.5" fill={COLORS.fill} stroke={COLORS.lane} {...shapeProps} />

        {/* inner placeholder box + X */}
        <rect x={ix} y={iy} width={iw} height={ih} fill={COLORS.fill} stroke={COLORS.lane} {...shapeProps} />
        <path
          d={`M${ix} ${iy} L${ix + iw} ${iy + ih} M${ix + iw} ${iy} L${ix} ${iy + ih}`}
          fill="none"
          stroke={COLORS.lane}
          {...shapeProps}
        />

        {/* bottom pills, centered on the frame's bottom edge */}
        <rect x={ix} y={pillY} width={pillW} height={pillH} rx={pillH / 2} fill={COLORS.lane} />
        <rect x={ix + iw - pillW} y={pillY} width={pillW} height={pillH} rx={pillH / 2} fill={COLORS.lane} />
      </>
    )

    /* ───────────────────────── STAIRS ───────────────────────── */
  } else if (elem.tool === 'stairs') {
    const variant = elem.variant === 'up-down' || elem.variant === 'up-dn' ? 'up-down' : 'up'

    const UP_WIDTH = 432 / 2
    const UP_HEIGHT = 211 / 2

    const UD_WIDTH = 432 / 2
    const UD_HEIGHT = 211 / 2

    const rowProps = { stroke: COLORS.lane, strokeWidth: STAIRS_ROW_STROKE }

    artwork = variant === 'up' ? (
      <svg width={UP_WIDTH} height={UP_HEIGHT} viewBox="0 0 211 432" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* UP */}
        <path d="M95.3926 431.41C89.2744 431.41 85.6001 427.616 85.6001 422.353V407.689C85.6001 406.715 86.1982 406.1 87.1382 406.1C88.0781 406.1 88.6763 406.715 88.6763 407.689V422.147C88.6763 425.873 91.1201 428.573 95.3926 428.573C99.665 428.573 102.109 425.873 102.109 422.147V407.689C102.109 406.715 102.707 406.1 103.647 406.1C104.587 406.1 105.185 406.715 105.185 407.689V422.353C105.185 427.616 101.511 431.41 95.3926 431.41ZM111.508 431.239C110.568 431.239 109.97 430.624 109.97 429.65V407.929C109.97 406.955 110.568 406.339 111.508 406.339H118.771C123.403 406.339 126.667 409.586 126.667 414.252C126.667 418.935 123.369 422.199 118.737 422.199H113.046V429.65C113.046 430.624 112.448 431.239 111.508 431.239ZM113.046 419.464H117.968C121.489 419.464 123.505 417.533 123.505 414.252C123.505 410.988 121.506 409.074 117.968 409.074H113.046V419.464Z" fill={COLORS.ink} />

        {/* frame */}
        <rect x="1.5" y="1.5" width="208" height="374" fill={COLORS.fill} stroke={COLORS.lane} strokeWidth={STAIRS_BORDER_STROKE} />

        {/* solid step lines (เอียงเล็กน้อยตามดีไซน์) */}
        <line x1="0" y1="324" x2="211" y2="323" {...rowProps} />
        <line x1="0" y1="272" x2="211" y2="271" {...rowProps} />
        <line x1="0" y1="220" x2="211" y2="219" {...rowProps} />
        <line x1="0" y1="168" x2="211" y2="167" {...rowProps} />

        {/* dashed step lines */}
        <path d="M0.00502634 116L7.54074 115.964M211.005 115L203.469 115.036M22.6122 115.893L37.6836 115.821M52.755 115.75L67.8265 115.679M82.8979 115.607L97.9693 115.536M113.041 115.464L128.112 115.393M143.184 115.321L158.255 115.25M173.326 115.179L188.398 115.107" {...rowProps} />
        <path d="M0.00502634 64L7.54074 63.9643M211.005 63L203.469 63.0357M22.6122 63.8929L37.6836 63.8214M52.755 63.75L67.8265 63.6786M82.8979 63.6072L97.9693 63.5357M113.041 63.4643L128.112 63.3929M143.184 63.3214L158.255 63.25M173.326 63.1786L188.398 63.1072" {...rowProps} />

        {/* arrow */}
        <path d="M92.0098 201.667L105.843 186L119.676 201.667" strokeWidth={STAIRS_ARROW_STROKE} strokeLinecap="round" strokeLinejoin="round" stroke={COLORS.lane} />
        <path d="M105.842 353.5V191.5" strokeWidth={STAIRS_ARROW_STROKE} strokeLinecap="round" strokeLinejoin="round" stroke={COLORS.lane} />
      </svg>
    ) : (
      <svg width={UD_WIDTH} height={UD_HEIGHT} viewBox="0 0 337 432" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* UP */}
        <path d="M74.3984 431.41C68.2803 431.41 64.606 427.616 64.606 422.353V407.689C64.606 406.715 65.2041 406.1 66.144 406.1C67.084 406.1 67.6821 406.715 67.6821 407.689V422.147C67.6821 425.873 70.126 428.573 74.3984 428.573C78.6709 428.573 81.1147 425.873 81.1147 422.147V407.689C81.1147 406.715 81.7129 406.1 82.6528 406.1C83.5928 406.1 84.1909 406.715 84.1909 407.689V422.353C84.1909 427.616 80.5166 431.41 74.3984 431.41ZM90.5142 431.239C89.5742 431.239 88.9761 430.624 88.9761 429.65V407.929C88.9761 406.955 89.5742 406.339 90.5142 406.339H97.7773C102.409 406.339 105.673 409.586 105.673 414.252C105.673 418.935 102.375 422.199 97.7432 422.199H92.0522V429.65C92.0522 430.624 91.4541 431.239 90.5142 431.239ZM92.0522 419.464H96.9741C100.495 419.464 102.511 417.533 102.511 414.252C102.511 410.988 100.512 409.074 96.9741 409.074H92.0522V419.464Z" fill={COLORS.ink} />
        {/* DN */}
        <path d="M235.333 431C234.393 431 233.794 430.385 233.794 429.411V407.929C233.794 406.955 234.393 406.339 235.333 406.339H242.083C249.397 406.339 253.721 410.902 253.721 418.661C253.721 426.437 249.415 431 242.083 431H235.333ZM236.871 428.231H241.878C247.466 428.231 250.577 424.813 250.577 418.695C250.577 412.526 247.483 409.108 241.878 409.108H236.871V428.231ZM259.07 431.239C258.13 431.239 257.549 430.624 257.549 429.65V407.895C257.549 406.818 258.25 406.1 259.31 406.1C260.13 406.1 260.54 406.339 261.087 407.125L274.041 425.702H274.195V407.689C274.195 406.715 274.776 406.1 275.716 406.1C276.656 406.1 277.237 406.715 277.237 407.689V429.564C277.237 430.607 276.587 431.239 275.494 431.239C274.656 431.239 274.263 431.017 273.716 430.231L260.745 411.706H260.591V429.65C260.591 430.624 260.01 431.239 259.07 431.239Z" fill={COLORS.ink} />

        {/* frame */}
        <rect x="1.5" y="1.5" width="333" height="374" fill={COLORS.fill} stroke={COLORS.lane} strokeWidth={STAIRS_BORDER_STROKE} />

        {/* step lines */}
        <line x1="0" y1="324" x2="336" y2="323" {...rowProps} />
        <line x1="0" y1="272" x2="336" y2="271" {...rowProps} />
        <line x1="0" y1="220" x2="336" y2="219" {...rowProps} />
        <line x1="0" y1="168" x2="336" y2="167" {...rowProps} />
        <line x1="0" y1="116" x2="336" y2="115" {...rowProps} />

        {/* center divider */}
        <line x1="169" y1="115" x2="169" y2="376" {...rowProps} />

        {/* up / down loop */}
        <path d="M86 353V61H253V352" strokeWidth={STAIRS_ARROW_STROKE} strokeLinecap="butt" strokeLinejoin="miter" stroke={COLORS.lane} />
        <path d="M235.3 336.3L253 354L270.7 336.3" strokeWidth={STAIRS_ARROW_STROKE} strokeLinecap="round" strokeLinejoin="round" stroke={COLORS.lane} />
      </svg>
    )

    /* ───────────────────────── PILLAR ───────────────────────── */
  } else if (elem.tool === 'pillar') {
    const variant = elem.variant === 'rect' ? 'rectangle' : elem.variant || 'square'

    /* วาดเต็มกรอบ W × H ตรง ๆ → ยืดแกนใดแกนหนึ่งได้อิสระ
       (square / rectangle ต่างกันแค่ชื่อ — ขนาดจริงกำหนดจาก W/H) */
    artwork =
      variant === 'circle' ? (
        <ellipse
          cx={W / 2}
          cy={H / 2}
          rx={Math.max(W / 2 - 0.5, 0)}
          ry={Math.max(H / 2 - 0.5, 0)}
          fill={COLORS.fill}
          stroke={COLORS.lane}
          {...shapeProps}
        />
      ) : (
        <rect
          x={0.5}
          y={0.5}
          width={Math.max(W - 1, 0)}
          height={Math.max(H - 1, 0)}
          fill={COLORS.fill}
          stroke={COLORS.lane}
          {...shapeProps}
        />
      )

    /* ───────────────────────── CAMERA ───────────────────────── */
  } else if (elem.tool === 'cam') {
    /* วาดที่ขนาดอ้างอิง (BASE_SIZE.cam) เสมอ แล้วให้ scale(sx, sy) ด้านนอกยืดแยกแกน */
    const W = 100
    const H = 50

    const variantMap: Record<string, string> = { box: 'directional', fisheye: 'dome' }
    const variant = (elem.variant && variantMap[elem.variant]) || elem.variant || 'directional'

    /* ทุกขนาดคิดจากความสูง: 1 หน่วยดีไซน์ = k (ที่ H=50 → 0.333) */
    const k = H / 150
    const cy = H / 2
    const dash = '3 2'

    const solid = { fill: COLORS.cameraFill, stroke: COLORS.cameraStroke, ...shapeProps }
    const coneProps = {
      fill: COLORS.cameraFill,
      stroke: COLORS.cameraStroke,
      strokeOpacity: 0.7,
      strokeDasharray: dash,
      strokeLinejoin: 'round' as const,
      ...shapeProps,
    }

    /* วงแหวน + จุดทึบตรงกลาง */
    const cameraDot = (x: number, y: number) => (
      <>
        <circle cx={x} cy={y} r={19.5 * k} {...solid} />
        <circle cx={x} cy={y} r={10 * k} fill={COLORS.cameraDot} />
      </>
    )

    if (variant === 'dome') {
      const r = Math.min(75 * k, Math.min(W, H) / 2 - 1)

      artwork = (
        <>
          <circle cx={W / 2} cy={cy} r={r} {...coneProps} />
          {cameraDot(W / 2, cy)}
        </>
      )
    } else if (variant === 'dot') {
      const total = 190 * k
      const L = (W - total) / 2
      const ringR = 19.5 * k
      const apexX = L + 39 * k
      const baseX = L + total
      const halfH = 63.5 * k

      artwork = (
        <>
          <path d={`M${apexX} ${cy} L${baseX} ${cy - halfH} L${baseX} ${cy + halfH} Z`} {...coneProps} />
          {cameraDot(L + ringR, cy)}
        </>
      )
    } else if (variant === 'LPR' || variant === 'lpr') {
      const total = 217 * k
      const L = (W - total) / 2
      const boxW = 70 * k
      const boxH = 42 * k
      const baseX = L + total
      const halfH = 30 * k

      artwork = (
        <>
          <path d={`M${L + boxW} ${cy} L${baseX} ${cy - halfH} L${baseX} ${cy + halfH} Z`} {...coneProps} />
          <rect x={L} y={cy - boxH / 2} width={boxW} height={boxH} rx={4 * k} {...solid} />
          <text
            x={L + boxW / 2}
            y={cy + 6.5 * k}
            textAnchor="middle"
            fontSize={18 * k}
            fill={COLORS.cameraDot}
            fontFamily="Inter"
          >
            {t('parkingCanvas.lpr')}
          </text>
        </>
      )
    } else {
      /* directional: กล่อง + กรวยเส้นประ (ไม่มีจุดในกล่อง) */
      const total = 215 * k
      const L = (W - total) / 2
      const bodyW = 61 * k
      const bodyH = 35 * k
      const baseX = L + total
      const halfH = 63.5 * k

      artwork = (
        <>
          <path d={`M${L + bodyW} ${cy} L${baseX} ${cy - halfH} L${baseX} ${cy + halfH} Z`} {...coneProps} />
          <rect x={L} y={cy - bodyH / 2} width={bodyW} height={bodyH} rx={4 * k} {...solid} />
        </>
      )
    }

    /* ───────────────────────── SENSOR ───────────────────────── */
  } else if (elem.tool === 'sensor') {
    const variant = elem.variant === 'square' ? 'boxed' : elem.variant || 'ring'
    const cx = W / 2
    const cy = H / 2

    if (variant === 'boxed') {
      /* กล่องเส้นประสีเทา + วงกลมเขียวอ่อน + เครื่องหมายบวก
         กว้าง/สูงคิดแยกกัน → ยืดแกนใดแกนหนึ่งได้ */
      const SW = Math.max(W - 1, 4)
      const SH = Math.max(H - 1, 4)
      const rx = SW * 0.294
      const ry = SH * 0.294

      artwork = (
        <>
          <rect
            x={cx - SW / 2}
            y={cy - SH / 2}
            width={SW}
            height={SH}
            fill="none"
            stroke={COLORS.lane}
            strokeDasharray="3 2"
            {...shapeProps}
          />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={COLORS.greenFill} stroke={COLORS.gateStroke} {...shapeProps} />
          <path
            d={`M${cx - rx} ${cy} H${cx + rx} M${cx} ${cy - ry} V${cy + ry}`}
            fill="none"
            stroke={COLORS.gateStroke}
            {...shapeProps}
          />
        </>
      )
    } else {
      /* ring: วงนอกเส้นประ + วงในทึบ + จุดเขียวเข้ม (วงรีได้เมื่อ W ≠ H) */
      const RX = Math.max(W / 2 - 0.5, 4)
      const RY = Math.max(H / 2 - 0.5, 4)

      artwork = (
        <>
          <ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill={COLORS.gateFill} stroke={COLORS.gateStroke} strokeDasharray="3 2" {...shapeProps} />
          <ellipse cx={cx} cy={cy} rx={RX * 0.465} ry={RY * 0.465} fill={COLORS.gateFill} stroke={COLORS.gateStroke} {...shapeProps} />
          <ellipse cx={cx} cy={cy} rx={RX * 0.21} ry={RY * 0.21} fill={COLORS.sensor} />
        </>
      )
    }

    /* ───────────────────────── PAYMENT ───────────────────────── */
  } else if (elem.tool === 'payment') {
    /* วาดที่ขนาดอ้างอิง (BASE_SIZE.payment) เสมอ แล้วให้ scale(sx, sy) ด้านนอกยืดแยกแกน */
    const W = 48
    const H = 44
    const bodyH = Math.min(Math.max(12, H - 10), W / 1.7)

    artwork = (
      <svg width={Math.max(W - 2, 0)} height={Math.max(bodyH - 1, 0)} viewBox="-3 -3 110 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* background */}
        <path d="M0 8C0 3.58172 3.58172 0 8 0H96C100.418 0 104 3.58172 104 8V53C104 57.4183 100.418 61 96 61H8C3.58172 61 0 57.4183 0 53V8Z" fill={COLORS.paymentFill} />
        {/* outline */}
        <path d="M8 0V3H96V0V-3H8V0ZM104 8H101V53H104H107V8H104ZM96 61V58H8V61V64H96V61ZM0 53H3V8H0H-3V53H0ZM8 61V58C5.23858 58 3 55.7614 3 53H0H-3C-3 59.0751 1.92487 64 8 64V61ZM104 53H101C101 55.7614 98.7614 58 96 58V61V64C102.075 64 107 59.0751 107 53H104ZM96 0V3C98.7614 3 101 5.23858 101 8H104H107C107 1.92487 102.075 -3 96 -3V0ZM8 0V-3C1.92487 -3 -3 1.92487 -3 8H0H3C3 5.23858 5.23858 3 8 3V0Z" fill={COLORS.paymentStroke} />
        {/* text */}
        <path d="M32.3564 40.1846C31.6313 40.1846 31.1699 39.71 31.1699 38.9585V22.2021C31.1699 21.4507 31.6313 20.9761 32.3564 20.9761H37.9595C41.5322 20.9761 44.0503 23.481 44.0503 27.0801C44.0503 30.6924 41.5059 33.2104 37.9331 33.2104H33.543V38.9585C33.543 39.71 33.0815 40.1846 32.3564 40.1846ZM33.543 31.1011H37.3398C40.0557 31.1011 41.6113 29.6113 41.6113 27.0801C41.6113 24.562 40.0688 23.0854 37.3398 23.0854H33.543V31.1011ZM45.395 40.1846C44.7095 40.1846 44.2085 39.7495 44.2085 39.1431C44.2085 38.9717 44.248 38.7739 44.3535 38.4839L50.4707 21.9385C50.7607 21.1606 51.2485 20.7915 52.0264 20.7915C52.7515 20.7915 53.2261 21.1475 53.5161 21.9253L59.6465 38.4839C59.752 38.7739 59.7915 38.9717 59.7915 39.1431C59.7915 39.7495 59.2905 40.1846 58.605 40.1846C58.0117 40.1846 57.6689 39.9077 57.4448 39.2749L55.7573 34.5552H48.2295L46.5552 39.2749C46.3311 39.9077 45.9883 40.1846 45.395 40.1846ZM48.915 32.5381H55.085L52.0396 23.8633H51.9604L48.915 32.5381ZM66.4097 40.1846C65.6846 40.1846 65.2231 39.71 65.2231 38.9585V31.813L59.0664 22.5977C58.8818 22.3208 58.8291 22.0967 58.8291 21.833C58.8291 21.2397 59.3301 20.7915 59.9761 20.7915C60.4507 20.7915 60.7275 20.9629 61.0176 21.3979L66.3701 29.519H66.4492L71.8018 21.3979C72.0918 20.9629 72.3687 20.7915 72.8433 20.7915C73.4893 20.7915 73.9902 21.2397 73.9902 21.833C73.9902 22.0967 73.9375 22.3208 73.7529 22.5977L67.5962 31.813V38.9585C67.5962 39.71 67.1348 40.1846 66.4097 40.1846Z" fill={COLORS.paymentText} />
        {/* underline */}
        <path d="M20 61L84 61" strokeWidth="10" strokeLinecap="round" stroke={COLORS.paymentStroke} />
      </svg>
    )

    /* ───────────────────────── TEXT ───────────────────────── */
  } else if (elem.tool === 'text') {
    /* ขนาดตัวอักษรขยายตามความสูง (ที่ H = 24 → 12px เดิม) */
    const tu = Math.max(H / 24, 0.5)
    artwork = (
      <text
        x="1"
        y={Math.min(H - 3 * tu, 14 * tu)}
        fontSize={12 * tu}
        fontWeight="400"
        fill={COLORS.text}
        fontFamily="Inter"
      >
        {elem.label || t('parkingCanvas.defaultText')}
      </text>
    )

    /* ───────────────────────── ZONE ───────────────────────── */
  } else if (elem.tool === 'zone') {
    const variant = getZoneVariant(elem.variant)
    const colors =
      variant === 'red'
        ? { fill: COLORS.redFill, stroke: COLORS.redStroke }
        : variant === 'purple'
          ? { fill: COLORS.purpleFill, stroke: COLORS.purpleStroke }
          : { fill: COLORS.greenFill, stroke: COLORS.greenStroke }

    artwork = (
      <>
        {/* grayOnly: ไม่วาดพื้น/เส้นขอบสีของ zone (เหลือแค่ชื่อ zone ด้านล่าง) */}
        {!grayOnly && variant === 'red' && (
          <defs>
            <pattern
              id={`zone-hatch-${elem.id}`}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill={COLORS.redFill} />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke={COLORS.redHatch}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </pattern>
          </defs>
        )}
        {!grayOnly && (
          <rect
            x="0.5"
            y="0.5"
            width={Math.max(W - 1, 0)}
            height={Math.max(H - 1, 0)}
            fill={variant === 'red' ? `url(#zone-hatch-${elem.id})` : colors.fill}
            stroke={colors.stroke}
            strokeDasharray={variant === 'green' ? '6 3' : undefined}
            {...shapeProps}
            strokeWidth={ZONE_STROKE}
          />
        )}
        {elem.label && (
          <text
            x={6 * ELEM_SCALE}
            y={14 * ELEM_SCALE}
            fontSize={11 * ELEM_SCALE}
            fontWeight="0"
            fill={COLORS.label}
            fontStyle="normal"
            fontFamily="Inter"
          >
            {elem.label}
          </text>
        )}
      </>
    )

    /* ───────────────────────── GATE ───────────────────────── */
  } else if (elem.tool === 'gate') {
    const W = 36 / 2.3
    const H = 308 / 2.3
    const GS = 2   // stroke (หน่วย viewBox)

    artwork = (
      <svg width={W} height={H} viewBox="0 0 36 308" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* base */}
        <rect x="1" y="247" width="34" height="60" rx="5" fill={COLORS.fill} stroke={COLORS.lane} strokeWidth={GS} />
        {/* tube */}
        <rect x="10" y="1" width="15" height="246" rx="3" fill={COLORS.fill} stroke={COLORS.lane} strokeWidth={GS} />
        {/* segments */}
        <line x1="10" y1="47" x2="25" y2="47" strokeWidth={GS} stroke={COLORS.lane} />
        <line x1="10" y1="90" x2="25" y2="90" strokeWidth={GS} stroke={COLORS.lane} />
        <line x1="10" y1="137" x2="25" y2="137" strokeWidth={GS} stroke={COLORS.lane} />
        <line x1="10" y1="181" x2="25" y2="181" strokeWidth={GS} stroke={COLORS.lane} />
      </svg>
    )
  }

  /* วัดขอบเขตภาพวาดจริง (ก่อน scale) แล้วคูณ scale ส่งให้หน้า Edit วาดกรอบเลือกให้พอดี
     — กรอบฟ้าบางจึงเท่ากับขอบภาพจริงเสมอ */
  const measureRef = useRef<SVGGElement | null>(null)
  useLayoutEffect(() => {
    if (!onBounds || readOnly || NO_MEASURE.has(elem.tool) || !measureRef.current) return
    try {
      const bb = measureRef.current.getBBox()
      if (bb.width > 0 && bb.height > 0) {
        onBounds(String(elem.id), {
          x: bb.x * sx,
          y: bb.y * sy,
          w: bb.width * sx,
          h: bb.height * sy,
        })
      }
    } catch {
      /* getBBox อาจ throw ถ้า element ยังไม่ถูก render */
    }
  })

  return (
    <div
      className={`absolute left-0 top-0 box-border origin-center select-none overflow-visible ${readOnly ? 'cursor-default' : 'cursor-move'
        }`}
      /* size and rotation come from the element data, so they stay inline */
      style={{ width: W, height: H, transform: `rotate(${elem.rotation || 0}deg)` }}
      onMouseDown={handleMouseDown}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block overflow-visible"
        aria-hidden="true"
      >
        <g transform={base ? `scale(${sx} ${sy})` : undefined}>
          <g ref={measureRef}>{artwork}</g>
        </g>
      </svg>
    </div>
  )
}

/* ───────────────────────── ZONE HELPERS ───────────────────────── */

/* element ที่อยู่ใน zone = จุดกึ่งกลางอยู่ในกรอบ zone (รวมตัว zone เอง) */
export function elementsInZone(all: ParkingElementData[], zone: ParkingElementData) {
  return all.filter((e) => {
    if (e.id === zone.id) return true
    if (e.hidden) return false
    const cx = e.x + e.w / 2
    const cy = e.y + e.h / 2
    return cx >= zone.x && cx <= zone.x + zone.w && cy >= zone.y && cy <= zone.y + zone.h
  })
}

/* zone ที่เล็กที่สุดที่ครอบ element นี้ (ใช้ตอนกด slot แล้วให้ซูมเข้า zone) */
function zoneFor(all: ParkingElementData[], el: ParkingElementData) {
  if (el.tool === 'zone') return el
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  return all
    .filter((z) => z.tool === 'zone' && !z.hidden &&
      cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h)
    .sort((a, b) => a.w * a.h - b.w * b.h)[0]
}

/* element ชนกับกรอบกล้องไหม */
function touchesCamera(e: ParkingElementData, c: CameraRect) {
  return e.x < c.x + c.w && e.x + e.w > c.x && e.y < c.y + c.h && e.y + e.h > c.y
}

export interface ParkingCanvasViewProps {
  elements?: ParkingElementData[]
  height?: number | string
  /* ถ้าใส่ = ซูมเข้า zone นี้ (โหมดเดิม ไม่ใช้ camera) */
  zoneId?: string | null
  /* กด zone (หรือ slot ใน zone) ในภาพรวม */
  onSelectZone?: (zoneId: string) => void
  /* true = แสดงเฉพาะของสีเทา (ซ่อน zone / sensor / cam / payment / gate ที่มีสี) */
  grayOnly?: boolean
  /* โหมดกล้อง (Focus): แสดงเฉพาะสิ่งที่อยู่ในกรอบนี้
     - stage = กรอบ Focus ย่อ/ขยายแบบ contain (สัดส่วนเท่า Focus เป๊ะ) วางกึ่งกลางพื้นที่
     - มุมซ้ายบนของกรอบ = มุมซ้ายบนของ stage ตำแหน่งสัมพันธ์กับกรอบเหมือนใน editor ทุกประการ
     - ไม่มี scrollbar, ส่วนนอกกรอบถูกตัดทิ้ง */
  camera?: CameraRect | null
  /* ตำแหน่ง stage ในพื้นที่แสดงผลเมื่อสัดส่วนไม่เท่ากัน
     - 'center'       = กึ่งกลาง (เหลือขอบว่างรอบด้าน)
     - 'bottom-right' = ชิดมุมขวาล่าง */
  cameraAlign?: 'center' | 'bottom-right'
  /* วาดเส้นกรอบรอบ stage ของกล้อง (ใช้ตอนดู Focus ทั้งชั้น) */
  showFrame?: boolean
}

/*
 * Read-only canvas view — renders the elements of a floor.
 * - มี camera: ดูผ่านกรอบ Focus (fit ในพื้นที่, ไม่มี scroll)
 * - ไม่มี camera: โหมดเดิม (กรอบครอบ element ทั้งหมด / ซูมเข้า zone)
 * element ที่ซ่อนไว้ (hidden) จะไม่ถูกวาด
 */
export function ParkingCanvasView({
  elements: allElements = [],
  height = 480,
  zoneId = null,
  onSelectZone,
  grayOnly = false,
  camera = null,
  cameraAlign = 'center',
  showFrame = false,
}: ParkingCanvasViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const elements = allElements.filter((e) => !e.hidden)

  /* ───────── โหมดกล้อง (Focus) ─────────
     stage = กรอบ Focus ย่อ/ขยายแบบ contain (สัดส่วนเท่า Focus เป๊ะ) แล้ววางกึ่งกลางพื้นที่
     ตำแหน่งของทุกชิ้นภายใน stage = ตำแหน่งสัมพันธ์กับกรอบใน editor ทุกประการ
     (ซ้ายของ Focus = ซ้ายของ stage, กลาง = กลาง, ขวา = ขวา) ส่วนที่ล้นกรอบถูกตัดทิ้ง */
  if (camera && camera.w > 0 && camera.h > 0) {
    const s = size.w > 0 && size.h > 0 ? Math.min(size.w / camera.w, size.h / camera.h) : 0
    const stageW = camera.w * s
    const stageH = camera.h * s
    const stageLeft = cameraAlign === 'bottom-right' ? size.w - stageW : (size.w - stageW) / 2
    const stageTop = cameraAlign === 'bottom-right' ? size.h - stageH : (size.h - stageH) / 2
    const inCam = elements.filter((e) => touchesCamera(e, camera))

    return (
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden bg-surface"
        style={{ height }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <rect width="100%" height="100%" fill="url(#pgrid)" />
        </svg>

        {s > 0 && (
          <div
            className="absolute overflow-hidden"
            style={{
              left: Math.round(stageLeft),
              top: Math.round(stageTop),
              width: Math.round(stageW),
              height: Math.round(stageH),
            }}
          >
            {/* ชั้นใน = ขนาดจริงของ Focus (px โลก) แล้ว scale ลงมา */}
            <div
              className="absolute left-0 top-0"
              style={{
                width: camera.w,
                height: camera.h,
                transform: `scale(${s})`,
                transformOrigin: 'top left',
              }}
            >
              {inCam.map((elem) => {
                const target = onSelectZone ? zoneFor(elements, elem) : undefined
                return (
                  <div
                    key={elem.id}
                    className={`absolute ${target ? 'cursor-pointer' : ''}`}
                    style={{ left: elem.x - camera.x, top: elem.y - camera.y, width: elem.w, height: elem.h }}
                    onClick={target ? () => onSelectZone!(String(target.id)) : undefined}
                  >
                    <ParkingElement elem={elem} readOnly grayOnly={grayOnly} />
                  </div>
                )
              })}
            </div>

            {showFrame && (
              <div className="pointer-events-none absolute inset-0 box-border border border-dashed border-[var(--border)]" />
            )}
          </div>
        )}
      </div>
    )
  }

  /* ───────── โหมดเดิม ───────── */
  if (elements.length === 0) return null

  const zone = zoneId
    ? elements.find((e) => e.tool === 'zone' && String(e.id) === zoneId)
    : undefined
  const visible = zone ? elementsInZone(elements, zone) : elements

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const e of visible) {
    minX = Math.min(minX, e.x)
    minY = Math.min(minY, e.y)
    maxX = Math.max(maxX, e.x + e.w)
    maxY = Math.max(maxY, e.y + e.h)
  }

  const PAD = 24
  const contentW = maxX - minX + PAD * 2
  const contentH = maxY - minY + PAD * 2
  const ox = -minX + PAD
  const oy = -minY + PAD

  /* โหมด zone: ขยายให้พอดีกรอบ (สูงสุด 3 เท่า) / ภาพรวม: ขนาดจริง */
  const scale =
    zone && size.w > 0 && size.h > 0
      ? Math.min(size.w / contentW, size.h / contentH, 3)
      : 1

  return (
    <div
      ref={wrapRef}
      className={`relative flex w-full bg-surface ${zone ? 'items-center justify-center overflow-hidden' : 'overflow-auto'}`}
      style={{ height }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <rect width="100%" height="100%" fill="url(#pgrid)" />
      </svg>

      <div className="relative shrink-0" style={{ width: contentW * scale, height: contentH * scale }}>
        <div
          key={zone ? String(zone.id) : 'all'}
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: contentW, height: contentH, transform: `scale(${scale})` }}
        >
          {visible.map((elem) => {
            const target = !zone && onSelectZone ? zoneFor(elements, elem) : undefined
            return (
              <div
                key={elem.id}
                className={`absolute ${target ? 'cursor-pointer' : ''}`}
                style={{ left: elem.x + ox, top: elem.y + oy, width: elem.w, height: elem.h }}
                onClick={target ? () => onSelectZone!(String(target.id)) : undefined}
              >
                <ParkingElement elem={elem} readOnly grayOnly={grayOnly} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}