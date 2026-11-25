import React, { useState, useRef, useCallback, useEffect, useReducer } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import {
  Undo2, Redo2, Maximize, Minus, Plus,
  EyeOff, Eye, Copy, Clipboard, Trash2, Search, MousePointer2, Hand, RefreshCw,
  Hash, BoxSelect, Focus,
} from 'lucide-react'
import { saveLayout, getStore } from '@/services/data/parkingStore.js'
import { ParkingElement, type ParkingElementData, type ElementBounds } from './ParkingCanvas'
import { colorProfile, type ColorName } from '@/services/data/mockData'
import { useUserInfo } from '@/pages/system/System'
import { useI18n } from '@/i18n'

/* ─── types & interfaces ─── */
type CanvasMode = 'select' | 'pan' | 'place'
type NavTab = 'layout'
type ToolId =
  | 'slot' | 'lane' | 'entry' | 'exit' | 'zone'
  | 'lift' | 'stairs' | 'pillar' | 'cam' | 'sensor'
  | 'payment' | 'text' | 'gate'
  | 'focus' // "กล้อง" ของชั้น — มีทุกชั้นเสมอ ลบ/ซ่อนไม่ได้ (ไม่อยู่ใน Tool box)
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface ParkingElem extends Omit<ParkingElementData, 'id'> {
  id: string
  tool: ToolId
  type?: string
  zone?: string
  rate?: string
  sensor?: string
  color?: string
  hardware?: string
}

interface Floor {
  id: string
  name: string
  visible: boolean
}

type ElementsByFloor = Record<string, ParkingElem[]>

interface HistoryState {
  past: ElementsByFloor[]
  present: ElementsByFloor
  future: ElementsByFloor[]
}

type HistoryAction =
  | { type: 'PUSH'; payload: ElementsByFloor }
  | { type: 'REPLACE'; payload: ElementsByFloor } // changes present without adding an undo step
  | { type: 'UNDO' }
  | { type: 'REDO' }

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

interface ToolDef {
  id: ToolId
  label: string
  icon: React.FC<IconProps>
}

interface Point {
  x: number
  y: number
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface PlacementDragState {
  tool: ToolId
  x: number
  y: number
  moved: boolean
}

interface ResizeState {
  id: string
  handle: ResizeHandle
  orig: Rect
  rot: number
  min: number // ขนาดต่ำสุด (px) ของ element ตัวนี้
  /* สัดส่วนช่องว่างระหว่างขอบ element กับขอบภาพวาดจริง (ซ้าย/ขวา/บน/ล่าง) */
  fr: { l: number; r: number; t: number; b: number }
  pushed: boolean
  lockRatio: boolean // Focus ที่ตรง preset → ยืดหดได้เฉพาะแบบคงสัดส่วน
}

interface RotateState {
  id: string
  /* จุดกึ่งกลางของ element (หรือของกรอบรวมตอนหมุนทั้งก้อน) ในพิกัดโลก = จุดหมุน */
  cx: number
  cy: number
  /* มุมเมาส์ ณ ตอนเริ่มลาก และมุมเดิมของ element → ไม่กระโดดตอนเริ่มหมุน */
  startAngle: number
  origRot: number
  pushed: boolean
  /* โหมดหมุนทั้งก้อน: snapshot ของทุกชิ้น ณ ตอนเริ่มลาก */
  items?: { id: string; cx: number; cy: number; w: number; h: number; rot: number }[]
  delta?: number // มุมที่หมุนสะสม (ใช้โชว์ในป้าย)
}

/* ─── constants ─── */
const GRID = 20        // px per grid cell; 1 cell = 0.5 m at SCALE 0.025
const SNAP = 10        // ทั้งตำแหน่งและขนาด snap ทีละ 10px (0.25 m) → ขอบทุกด้านลงเส้นเดียวกันเสมอ
const MIN_SIZE = SNAP  // ขนาดต่ำสุดตอนยืด/หด
const FOCUS_MIN = 200  // ขนาดต่ำสุดของ Focus (px) = 5 m
const SCALE = 0.025    // m per px
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const MAX_FLOORS = 26   // A–Z

/* ขนาดจอที่เลือกได้ — ล็อกสัดส่วนของ Focus (rw:rh) ไม่ให้ยืดหดจนเพี้ยน
   ถ้าอยากเพิ่ม preset ใหม่ ให้เพิ่มแถวที่นี่ (สัดส่วนต้องไม่ซ้ำกัน) */
const FOCUS_PRESETS = [
  { id: '16:9',  label: '16:9 · 1920 × 1080',  rw: 1920, rh: 1080 },
  { id: '16:10', label: '16:10 · 1920 × 1200', rw: 1920, rh: 1200 },
  { id: '3:2',   label: '3:2 · 1800 × 1200',   rw: 1800, rh: 1200 },
  { id: '4:3',   label: '4:3 · 1600 × 1200',   rw: 1600, rh: 1200 },
  { id: '21:9',  label: '21:9 · 2560 × 1080',  rw: 2560, rh: 1080 },
  { id: '1:1',   label: '1:1 · 1080 × 1080',   rw: 1080, rh: 1080 },
  { id: '9:16',  label: '9:16 · 1080 × 1920',  rw: 1080, rh: 1920 },
] as const
type FocusPreset = (typeof FOCUS_PRESETS)[number]

/* หา preset จากสัดส่วนปัจจุบัน (ข้อมูลเก่าที่สัดส่วนไม่ตรง = undefined → แสดงเป็น Custom) */
const focusPresetOf = (el: { w: number; h: number }): FocusPreset | undefined =>
  FOCUS_PRESETS.find((p) => Math.abs(p.rw / p.rh - el.w / el.h) < 0.01)
const focusPresetId = (el: { w: number; h: number }) => focusPresetOf(el)?.id ?? 'custom'

/* คงความกว้างไว้ ปรับความสูงให้ตรงสัดส่วน preset (ไม่ให้ต่ำกว่า FOCUS_MIN) */
function fitFocusToPreset(w: number, p: FocusPreset): { w: number; h: number } {
  let nw = Math.max(FOCUS_MIN, Math.round(w))
  let nh = Math.round((nw * p.rh) / p.rw)
  if (nh < FOCUS_MIN) {
    nh = FOCUS_MIN
    nw = Math.round((nh * p.rw) / p.rh)
  }
  return { w: nw, h: nh }
}

/* ตัวเลือกชื่อ Zone: Zone A – Zone Z (ใช้กับช่อง Label ของ element ชนิด zone) */
const ZONE_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
/* label ของ zone เก็บเป็น "Zone B" → ดึงเฉพาะตัวอักษรมาแสดงใน dropdown */
const zoneLetterOf = (label?: string) => (label ?? '').replace(/^Zone\s*/i, '').trim().toUpperCase()

/* px <-> metre helpers (property panel shows metres, store keeps px) */
const pxToM = (px: number | undefined) => +((px ?? 0) * SCALE).toFixed(2)
const mToPx = (m: number) => Math.round(m / SCALE)

/* resize handles แบบ Figma: มุม 4 จุดเป็นสี่เหลี่ยมเล็ก, ขอบ 4 ด้านเป็นพื้นที่จับโปร่งใสตามเส้น */
const CORNERS: ResizeHandle[] = ['nw', 'ne', 'se', 'sw']
const EDGES: ResizeHandle[] = ['n', 'e', 's', 'w']
const HANDLE_CURSOR: Record<ResizeHandle, string> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
}
const CORNER_POS: Record<string, React.CSSProperties> = {
  nw: { left: 0, top: 0 },
  ne: { left: '100%', top: 0 },
  se: { left: '100%', top: '100%' },
  sw: { left: 0, top: '100%' },
}
const EDGE_POS: Record<string, React.CSSProperties> = {
  n: { left: 0, right: 0, top: -3, height: 6 },
  s: { left: 0, right: 0, bottom: -3, height: 6 },
  w: { top: 0, bottom: 0, left: -3, width: 6 },
  e: { top: 0, bottom: 0, right: -3, width: 6 },
}

/* tool ที่มีจุดจับยืด/หด (ตอนนี้เปิดครบทุกตัว — อยากปิดตัวไหนให้ลบออกจากรายการนี้) */
const RESIZABLE_TOOLS: ToolId[] = [
  'zone', 'pillar', 'focus',
]

/* tool ที่มีจุดหมุน (ปุ่มวงกลมใต้กรอบเลือก เหมือน Canva) — อยากปิดตัวไหนให้ลบออกจากรายการนี้
   (focus ไม่หมุน) */
const ROTATABLE_TOOLS: ToolId[] = [
  'slot', 'lane', 'entry', 'exit', 'zone', 'lift', 'stairs',
  'pillar', 'cam', 'sensor', 'payment', 'text', 'gate',
]
const ROTATE_SNAP_DEG = 15      // กด Shift ค้างตอนหมุน → snap ทีละ 15°
const ROTATE_HANDLE_GAP = 18    // ระยะจากขอบล่างกรอบถึงปุ่มหมุน (px หน้าจอ)
const ROTATE_HANDLE_SIZE = 26   // ขนาดปุ่มหมุน (px หน้าจอ)

/* Layers tree: ระยะย่อหน้าต่อชั้น (px) */
const LAYER_INDENT = 16

/* canvas tool modes — separate from placement-tool (slot/lane/…) */
const MODE_SELECT: CanvasMode = 'select'
const MODE_PAN: CanvasMode = 'pan'
const MODE_PLACE: CanvasMode = 'place'

/* ─── shared Tailwind class strings ───
   ใช้เฉพาะตัวแปรสีที่นิยามไว้ใน index.css เท่านั้น (ธีมมืด/สว่างสลับตาม data-theme อัตโนมัติ)
     bg-page    = --bg          (พื้นหลัง sidebar / toolbar / panel)
     bg-surface = --surface     (canvas, input, ปุ่ม, tool tile)
     border-line= --border
     text-ink / text-ink-2 / text-ink-3  = --text / --text-secondary / --text-tertiary
     bg-brand / text-brand / text-on-brand = --primary / --on-primary
     --hover-dropdown-bg = สี hover / พื้น segmented control
   ไม่ใส่ cursor-pointer เพื่อให้ cursor แบบ .cur ใน index.css ทำงาน                    */
const card = 'flex flex-col overflow-hidden'
const hoverBg = 'hover:bg-[var(--hover-dropdown-bg)]'
const lbl = 'block mb-1.5 text-[12px] leading-none text-ink-2'
const inp =
  'w-full h-8 box-border rounded border border-line bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-brand'
const pillBtn =
  `flex-1 flex items-center justify-center gap-1.5 h-8 box-border rounded-full border border-line bg-surface text-[12px] text-ink ${hoverBg}`
const sectionBtn =
  `flex w-full box-border items-center gap-2 px-4 h-10 bg-transparent text-[14px] text-ink ${hoverBg}`
const iconBtn =
  'w-8 h-8 flex items-center justify-center rounded-md bg-transparent text-ink-2 enabled:hover:bg-[var(--hover-dropdown-bg)] disabled:opacity-40'

/* ─── tool defs (placement tools only — focus ไม่อยู่ในนี้ เพราะผู้ใช้สร้างเองไม่ได้) ─── */
const TOOL_DEFS: ToolDef[] = [
  { id: 'slot', label: 'Slot', icon: SlotIcon },
  { id: 'lane', label: 'Lane', icon: LaneIcon },
  { id: 'entry', label: 'Entry', icon: EntryIcon },
  { id: 'exit', label: 'Exit', icon: ExitIcon },
  { id: 'zone', label: 'Zone', icon: ZoneIcon },
  { id: 'lift', label: 'Lift', icon: LiftIcon },
  { id: 'stairs', label: 'Stairs', icon: StairsIcon },
  { id: 'pillar', label: 'Pillar', icon: PillarIcon },
  { id: 'cam', label: 'Cam', icon: CamIcon },
  { id: 'sensor', label: 'Sensor', icon: SensorIcon },
  { id: 'payment', label: 'Payment', icon: PaymentIcon },
  { id: 'text', label: 'Text', icon: TextIcon },
  { id: 'gate', label: 'Gate', icon: GateIcon },
]

/* ขนาดเริ่มต้นทุกตัวเป็นตัวคูณของ SNAP (10) เพื่อให้ขอบลงเส้น grid */
/* ตัวคูณขนาดเริ่มต้นของทุก element ที่สร้างใหม่ (1 = ขนาดเดิม, 2 = ใหญ่ขึ้น 2 เท่า)
   ที่ SCALE 0.025 m/px → slot 2× = 2.5 × 5 m (ขนาดช่องจอดจริง)
   ⚠ ต้องตรงกับ ELEM_SCALE ใน ParkingCanvas.tsx (ใช้กับข้อความ label ของ zone) */
const ELEM_SCALE = 2

/* ขนาดตั้งต้น (หน่วย px ก่อนคูณ ELEM_SCALE) */
const BASE_ELEM: Record<ToolId, Omit<ParkingElem, 'id' | 'tool' | 'x' | 'y'>> = {
  slot: { w: 50, h: 100, rotation: 0, label: 'Text', slotId: '', type: 'General', zone: '', rate: '20/hr', sensor: '', status: 'active', variant: 'empty' },
  lane: { w: 140, h: 28, rotation: 0, label: 'Lane', variant: 'one-way' },
  entry: { w: 80, h: 50, rotation: 0, label: 'Entry' },
  exit: { w: 80, h: 50, rotation: 0, label: 'Exit' },
  zone: { w: 180, h: 120, rotation: 0, label: 'Zone A', color: '#22c55e', variant: 'green' },
  lift: { w: 90, h: 80, rotation: 0, label: 'Lift', sectionLabel: 'Section 1' },
  stairs: { w: 80, h: 110, rotation: 0, label: 'Stairs', variant: 'up', sectionLabel: 'Section...' },
  pillar: { w: 28, h: 28, rotation: 0, label: 'Pillar', variant: 'square' },
  cam: { w: 100, h: 50, rotation: 0, label: 'Cam', variant: 'directional' },
  sensor: { w: 36, h: 36, rotation: 0, label: 'Sensor', variant: 'ring' },
  payment: { w: 48, h: 44, rotation: 0, label: 'Payment' },
  text: { w: 80, h: 24, rotation: 0, label: 'Text' },
  gate: { w: 14, h: 50, rotation: 0, label: 'Gate' },
  focus: { w: 800, h: 450, rotation: 0, label: 'Focus' }, // ×2 = 1600 × 900 px = 40 × 22.5 m (16:9)
}

/* ขนาดเริ่มต้นจริงที่ใช้ตอนวาง/ลากสร้าง = ขนาดตั้งต้น × ELEM_SCALE */
const DEFAULT_ELEM = Object.fromEntries(
  Object.entries(BASE_ELEM).map(([tool, def]) => [
    tool,
    { ...def, w: Math.round(def.w * ELEM_SCALE), h: Math.round(def.h * ELEM_SCALE) },
  ])
) as unknown as Record<ToolId, Omit<ParkingElem, 'id' | 'tool' | 'x' | 'y'>>

/* ─── Focus (กล้อง) ───
   หน้า Parking Layout จะแสดงเฉพาะสิ่งที่อยู่ในกรอบนี้ และตำแหน่งสัมพันธ์กับกรอบ
   ทุกชั้นมี focus 1 ตัวเสมอ: ลบ / ซ่อน / หมุน / คัดลอกไม่ได้ แต่ย้ายและปรับขนาดได้
   ขนาดเลือกจาก dropdown "Screen size" (ล็อกสัดส่วน) */
const focusIdOf = (floorId: string) => `focus-${floorId}`

function makeFocus(floorId: string): ParkingElem {
  return { id: focusIdOf(floorId), tool: 'focus', x: 0, y: 0, ...DEFAULT_ELEM.focus }
}

/* เติม focus ให้ทุกชั้นที่ยังไม่มี (รวมข้อมูลเก่าที่บันทึกไว้ก่อนมีฟีเจอร์นี้) */
function withFocus(floors: Floor[], els: ElementsByFloor): ElementsByFloor {
  const out: ElementsByFloor = { ...els }
  for (const f of floors) {
    const list = out[f.id] ?? []
    if (!list.some((e) => e.tool === 'focus')) out[f.id] = [makeFocus(f.id), ...list]
  }
  return out
}

const VARIANT_OPTIONS: Partial<Record<ToolId, string[]>> = {
  slot: ['empty', 'occupied'],
  lane: ['one-way', 'two-way'],
  stairs: ['up', 'up-down'],
  pillar: ['square', 'circle', 'rectangle'],
  cam: ['directional', 'dot', 'LPR', 'dome'],
  sensor: ['ring', 'boxed'],
  zone: ['green', 'red', 'purple'],
}

/* tool ที่ผูกกับอุปกรณ์ฮาร์ดแวร์ได้ (แสดงช่อง Hardware ในแผง Property)
   ⚠ ตอนนี้เป็นรายการจำลอง — ของจริงให้ดึงจาก API / store ของอุปกรณ์ */
const HARDWARE_TOOLS: ToolId[] = ['cam', 'sensor', 'payment']
const HARDWARE_OPTIONS: Partial<Record<ToolId, string[]>> = {
  cam: ['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004'],
  sensor: ['SN-0A25', 'SN-0A26', 'SN-0A27', 'SN-0A28'],
  payment: ['PAY-001', 'PAY-002'],
}

function canonicalVariant(tool: string, variant?: string): string | undefined {
  const legacy: Record<string, Record<string, string>> = {
    slot: { car: 'occupied' },
    pillar: { rect: 'rectangle' },
    cam: { box: 'directional', fisheye: 'dome', lpr: 'LPR' },
    sensor: { circle: 'ring', square: 'boxed' },
    stairs: { 'up-dn': 'up-down' },
    zone: { solid: 'green', hatched: 'red' },
  }
  return (variant && legacy[tool]?.[variant]) || variant || VARIANT_OPTIONS[tool as ToolId]?.[0]
}

function UserAvatar({ online_check = false, char_name = "", gradient_color = "" }: { online_check?: boolean, char_name?: string, gradient_color?: string }) {
  const Logo_gradient = colorProfile[gradient_color as ColorName] ?? colorProfile.dark

  return (
    <span
      className="relative flex h-[42.5px] w-[42.5px] shrink-0 items-center justify-center rounded-full"
      style={{ background: Logo_gradient }}
    >
      {/* ตัวอักษรกลางวงกลม (ใส่ text ตรงนี้) */}
      {/* <span className="select-none text-[20px] font-light leading-none text-white">{char_name}</span> */}
      {/* จุดสีเขียว = ออนไลน์ เดียวมาทำต่อ*/}
      {/* <span className={online_check ? "absolute -bottom-0.5 -right-0.5 h-[14.2px] w-[14.2px] rounded-full border-[2.4px] border-sidebar bg-[#3CD815]" : "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-0 border-sidebar bg-[#B9B9BF]"} /> */}
    </span>
  )
}

/* ─── SVG icons ─── */
function SlotIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 29 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.25" y="1.25" width="26.5" height="42.5" rx="2.75" strokeWidth="2.5" stroke={color} />
    </svg>
  )
}
function LaneIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 33 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.25 7.95508C0.559644 7.95508 0 8.51472 0 9.20508C0 9.89543 0.559644 10.4551 1.25 10.4551L1.25 9.20508L1.25 7.95508ZM1.25 9.20508L1.25 10.4551L31.25 10.4551V9.20508V7.95508L1.25 7.95508L1.25 9.20508ZM32.1339 10.089C32.622 9.60081 32.622 8.80935 32.1339 8.32119L24.1789 0.366243C23.6908 -0.121912 22.8993 -0.121912 22.4112 0.366243C21.923 0.854399 21.923 1.64585 22.4112 2.13401L29.4822 9.20508L22.4112 16.2761C21.923 16.7643 21.923 17.5558 22.4112 18.0439C22.8993 18.5321 23.6908 18.5321 24.1789 18.0439L32.1339 10.089Z" fill={color} />
    </svg>
  )
}
function EntryIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 29 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.25 17.75C0.559644 17.75 0 18.3096 0 19C0 19.6904 0.559644 20.25 1.25 20.25L1.25 19L1.25 17.75ZM1.25 19L1.25 20.25L20.25 20.25V19V17.75L1.25 17.75L1.25 19ZM21.1339 19.8839C21.622 19.3957 21.622 18.6043 21.1339 18.1161L13.1789 10.1612C12.6908 9.67301 11.8993 9.67301 11.4112 10.1612C10.923 10.6493 10.923 11.4408 11.4112 11.9289L18.4822 19L11.4112 26.0711C10.923 26.5592 10.923 27.3507 11.4112 27.8388C11.8993 28.327 12.6908 28.327 13.1789 27.8388L21.1339 19.8839Z" fill={color} />
      <line x1="27.5" y1="1.25" x2="27.5" y2="35.75" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
    </svg>
  )
}
function ExitIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 31 37" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M29.5 20.25C30.1904 20.25 30.75 19.6904 30.75 19C30.75 18.3096 30.1904 17.75 29.5 17.75V19V20.25ZM29.5 19V17.75L8.98 17.75V19V20.25L29.5 20.25V19ZM8.09612 18.1161C7.60796 18.6043 7.60796 19.3957 8.09612 19.8839L16.0511 27.8388C16.5392 28.327 17.3307 28.327 17.8188 27.8388C18.307 27.3507 18.307 26.5592 17.8188 26.0711L10.7478 19L17.8188 11.9289C18.307 11.4408 18.307 10.6493 17.8188 10.1612C17.3307 9.67301 16.5392 9.67301 16.0511 10.1612L8.09612 18.1161Z" fill={color} />
      <line x1="1.25" y1="35.75" x2="1.25" y2="1.25" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
    </svg>
  )
}
function ZoneIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.25 8.25V4.75C1.25 3.82174 1.61875 2.9315 2.27513 2.27513C2.9315 1.61875 3.82174 1.25 4.75 1.25H8.25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M25.75 1.25H29.25C30.1783 1.25 31.0685 1.61875 31.7249 2.27513C32.3813 2.9315 32.75 3.82174 32.75 4.75V8.25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M32.75 25.75V29.25C32.75 30.1783 32.3813 31.0685 31.7249 31.7249C31.0685 32.3813 30.1783 32.75 29.25 32.75H25.75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M8.25 32.75H4.75C3.82174 32.75 2.9315 32.3813 2.27513 31.7249C1.61875 31.0685 1.25 30.1783 1.25 29.25V25.75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
    </svg>
  )
}
function LiftIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 29 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.25" y="1.25" width="26.5" height="33.5" strokeWidth="2.5" stroke={color} />
      <path d="M9 22.167L14.5 27.5837L20 22.167" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M9 14.5837L14.5 9.16699L20 14.5837" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
    </svg>
  )
}
function StairsIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 43 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8.75" y1="36.6465" x2="8.75" y2="28.2499" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="1.25" y1="36.6465" x2="8.75" y2="36.6465" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="16.75" y1="27.6465" x2="16.75" y2="19.2499" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="9.25" y1="27.6465" x2="16.75" y2="27.6465" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="24.75" y1="18.6465" x2="24.75" y2="10.2499" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="17.25" y1="18.6465" x2="24.75" y2="18.6465" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="32.75" y1="9.64648" x2="32.75" y2="1.24993" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="25.25" y1="9.64648" x2="32.75" y2="9.64648" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
      <line x1="41.6465" y1="1.25" x2="33.2499" y2="1.25" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
    </svg>
  )
}
function PillarIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width="7" height="7" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="1.5" y1="18" x2="1.5" strokeWidth="3" stroke={color} />
      <line x1="16.5" y1="18" x2="16.5" strokeWidth="3" stroke={color} />
      <line x1="18" y1="16.5" y2="16.5" strokeWidth="3" stroke={color} />
      <line x1="18" y1="1.5" y2="1.5" strokeWidth="3" stroke={color} />
    </svg>
  )
}
function CamIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 36 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.045 1.25C21.6404 1.24999 22.2246 1.39638 22.7358 1.67365C23.2471 1.95093 23.6663 2.34876 23.949 2.825L24.7509 4.175C25.0337 4.65124 25.4529 5.04907 25.9642 5.32635C26.4754 5.60362 27.0596 5.75001 27.655 5.75H30.95C31.8252 5.75 32.6646 6.06607 33.2835 6.62868C33.9023 7.19129 34.25 7.95435 34.25 8.75V22.25C34.25 23.0456 33.9023 23.8087 33.2835 24.3713C32.6646 24.9339 31.8252 25.25 30.95 25.25H4.55C3.67479 25.25 2.83542 24.9339 2.21655 24.3713C1.59768 23.8087 1.25 23.0456 1.25 22.25V8.75C1.25 7.95435 1.59768 7.19129 2.21655 6.62868C2.83542 6.06607 3.67479 5.75 4.55 5.75H7.84505C8.43974 5.75003 9.0234 5.60396 9.53429 5.32725C10.0452 5.05053 10.4643 4.65346 10.7474 4.178L11.5542 2.822C11.8373 2.34654 12.2565 1.94947 12.7674 1.67275C13.2783 1.39604 13.8619 1.24997 14.4566 1.25H21.045Z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M22.25 14.75C22.25 17.2353 20.2353 19.25 17.75 19.25C15.2647 19.25 13.25 17.2353 13.25 14.75C13.25 12.2647 15.2647 10.25 17.75 10.25C20.2353 10.25 22.25 12.2647 22.25 14.75Z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
    </svg>
  )
}
function SensorIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="14.5" r="1.8" fill={color} />
      <path d="M6.5 11.5a5.03 5.03 0 0 1 7 0" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.5 8.5a9.5 9.5 0 0 1 13 0" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function PaymentIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 40 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.91667 1.25H34.25C36.275 1.25 37.9167 2.89162 37.9167 4.91667V23.25C37.9167 25.275 36.275 26.9167 34.25 26.9167H4.91667C2.89162 26.9167 1.25 25.275 1.25 23.25V4.91667C1.25 2.89162 2.89162 1.25 4.91667 1.25Z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M1.25 10.416H37.9167" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M8.58398 17.75H12.2507" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
    </svg>
  )
}
function TextIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 26 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.75 1.41699V30.0837" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M1.25 4.25V2.25C1.25 1.98478 1.40145 1.73043 1.67103 1.54289C1.94062 1.35536 2.30625 1.25 2.6875 1.25H22.8125C23.1937 1.25 23.5594 1.35536 23.829 1.54289C24.0986 1.73043 24.25 1.98478 24.25 2.25V4.25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M8.25 30.25H17.25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
    </svg>
  )
}
function GateIcon({ color = 'currentColor' }: IconProps) {
  return (
    <svg width={16} height={16} viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32.4167 34.25V4.91667C32.4167 3.94421 32.0304 3.01157 31.3427 2.32394C30.6551 1.63631 29.7225 1.25 28.75 1.25H10.4167C9.44421 1.25 8.51157 1.63631 7.82394 2.32394C7.13631 3.01157 6.75 3.94421 6.75 4.91667V34.25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M1.25 34.25H37.9167" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
      <path d="M14.084 17.75H14.1023" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke={color} />
    </svg>
  )
}

function NavLayoutDashboardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26.7291 4.54176C26.1863 4.29415 25.5966 4.16602 25 4.16602C24.4033 4.16602 23.8136 4.29415 23.2708 4.54176L5.41663 12.6668C5.04694 12.8298 4.73263 13.0968 4.51197 13.4352C4.29131 13.7737 4.17383 14.169 4.17383 14.573C4.17383 14.977 4.29131 15.3724 4.51197 15.7108C4.73263 16.0493 5.04694 16.3163 5.41663 16.4793L23.2916 24.6251C23.8345 24.8727 24.4242 25.0008 25.0208 25.0008C25.6174 25.0008 26.2071 24.8727 26.75 24.6251L44.625 16.5001C44.9947 16.3371 45.309 16.0701 45.5296 15.7316C45.7503 15.3932 45.8678 14.9979 45.8678 14.5938C45.8678 14.1898 45.7503 13.7945 45.5296 13.456C45.309 13.1176 44.9947 12.8506 44.625 12.6876L26.7291 4.54176Z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="M4.16602 25C4.16504 25.3985 4.27835 25.7889 4.49252 26.1249C4.70669 26.4609 5.01273 26.7285 5.37436 26.8958L23.291 35.0417C23.831 35.2862 24.417 35.4127 25.0098 35.4127C25.6026 35.4127 26.1885 35.2862 26.7285 35.0417L44.6035 26.9167C44.9723 26.7509 45.2849 26.4814 45.5031 26.1411C45.7214 25.8008 45.8359 25.4043 45.8327 25" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="M4.16602 35.417C4.16504 35.8155 4.27835 36.2059 4.49252 36.5419C4.70669 36.8779 5.01273 37.1455 5.37436 37.3128L23.291 45.4587C23.831 45.7032 24.417 45.8297 25.0098 45.8297C25.6026 45.8297 26.1885 45.7032 26.7285 45.4587L44.6035 37.3337C44.9723 37.1679 45.2849 36.8984 45.5031 36.5581C45.7214 36.2178 45.8359 35.8213 45.8327 35.417" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  )
}

/* ─── small shared UI pieces ─── */

/* สามเหลี่ยมเล็กหัวข้อ section (ตามดีไซน์) */
function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="8" height="8" viewBox="0 0 10 10"
      className={`shrink-0 text-ink-3 transition-transform duration-100 ${open ? '' : '-rotate-90'}`}
      fill="currentColor"
    >
      <path d="M1 2.5h8L5 8z" />
    </svg>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lbl}>{label}</label>
      {children}
    </div>
  )
}

/* mixed = เลือกหลายชิ้นแล้วค่าไม่เท่ากัน → แสดง "Mixed" (เลือกค่าใหม่แล้วจะใช้กับทุกชิ้น) */
function SelectWrap({
  value, onChange, children, mixed = false,
}: { value: string | undefined; onChange: (v: string) => void; children: React.ReactNode; mixed?: boolean }) {
  const { t } = useI18n()
  return (
    <div className="relative">
      <select
        value={mixed ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inp} appearance-none pr-6 ${mixed ? 'text-ink-3' : ''}`}
      >
        {mixed && <option value="" disabled>{t('editLayout.mixed')}</option>}
        {children}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[7px] text-ink-3">▼</span>
    </div>
  )
}

/* ช่องตัวเลข: เก็บ draft ไว้ตอนพิมพ์ เพื่อให้พิมพ์ "1." / ลบจนว่าง ได้โดยค่าไม่เด้ง
   readOnly = แสดงค่าอย่างเดียว (ใช้กับ Height ของ Focus ที่ล็อกสัดส่วนไว้)
   mixed = เลือกหลายชิ้นแล้วค่าไม่เท่ากัน → ช่องว่างพร้อม placeholder "Mixed" */
function NumField({
  label, value, onChange, unit, readOnly = false, mixed = false,
}: { label: string; value: number | undefined; onChange: (v: number) => void; unit?: string; readOnly?: boolean; mixed?: boolean }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type="number"
          step="any"
          readOnly={readOnly}
          placeholder={mixed ? t('editLayout.mixed') : undefined}
          value={draft ?? (mixed ? '' : String(value ?? 0))}
          onChange={(e) => {
            if (readOnly) return
            const raw = e.target.value
            setDraft(raw)
            const n = Number(raw)
            if (raw !== '' && Number.isFinite(n)) onChange(n)
          }}
          onBlur={() => setDraft(null)}
          className={`${inp} ${unit ? 'pr-6' : ''} ${readOnly ? 'opacity-60' : ''} [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none`}
        />
        {unit && !mixed && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-3">{unit}</span>
        )}
      </div>
    </Field>
  )
}

function ToolbarToggle({
  on, onClick, title, label, children,
}: { on: boolean; onClick: () => void; title: string; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={label}
      aria-pressed={on}
      className={`flex h-8 w-8 items-center justify-center rounded-md border-[1.5px] ${on
        ? 'border-brand bg-surface text-brand'
        : `border-transparent bg-transparent text-ink-2 ${hoverBg}`
        }`}
    >
      {children}
    </button>
  )
}

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'PUSH': {
      const past = [...state.past, state.present].slice(-50)
      return { past, present: action.payload, future: [] }
    }
    case 'REPLACE':
      return { ...state, present: action.payload }
    case 'UNDO': {
      if (!state.past.length) return state
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      }
    }
    case 'REDO': {
      if (!state.future.length) return state
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      }
    }
    default:
      return state
  }
}

/* ทำ Slot ID ให้ไม่ซ้ำตอนวาง: A01 → A02, 101 → 102 (ข้ามเลขที่ถูกใช้แล้ว) */
function uniqueSlotId(base: string, used: Set<string | undefined>): string {
  if (!used.has(base)) return base
  const m = base.match(/^(.*?)(\d+)$/)
  const prefix = m ? m[1] : `${base}-`
  const width = m ? m[2].length : 0
  let n = m ? parseInt(m[2], 10) + 1 : 2
  let id = ''
  do {
    id = `${prefix}${String(n).padStart(width, '0')}`
    n++
  } while (used.has(id))
  return id
}

/* ─── Layers tree helpers ───
   parent ของ element = zone ที่เล็กที่สุดที่ครอบจุดกึ่งกลางของมัน (ไม่นับตัวเอง)
   zone ซ้อน zone: zone ที่เล็กกว่าจะเป็นลูกของ zone ที่ใหญ่กว่า (เทียบพื้นที่ จึงไม่มีวงวน) */
function findParentZone(el: ParkingElem, all: ParkingElem[]): ParkingElem | undefined {
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  const area = el.w * el.h
  return all
    .filter((z) =>
      z.tool === 'zone' &&
      z.id !== el.id &&
      cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h &&
      (el.tool !== 'zone' || z.w * z.h > area)
    )
    .sort((a, b) => a.w * a.h - b.w * b.h)[0]
}

/* ids ที่ต้องขยับพร้อมกัน: ถ้าเลือก zone จะรวมทุก element ที่อยู่ข้างใน (รวม zone ซ้อน zone)
   focus ไม่ใช่ลูกของ zone ใด ๆ */
function withZoneChildren(ids: string[], all: ParkingElem[]): string[] {
  const zoneIds = ids.filter((id) => all.find((e) => e.id === id)?.tool === 'zone')
  if (!zoneIds.length) return ids
  const result = new Set(ids)
  for (const el of all) {
    if (result.has(el.id) || el.tool === 'focus') continue
    let p = findParentZone(el, all)
    while (p) {
      if (zoneIds.includes(p.id)) { result.add(el.id); break }
      p = findParentZone(p, all)
    }
  }
  return Array.from(result)
}

function buildLayerTree(all: ParkingElem[]) {
  const parentOf: Record<string, string | undefined> = {}
  for (const el of all) parentOf[el.id] = findParentZone(el, all)?.id

  /* ท้าย array = อยู่หน้าสุด → แสดงกลับด้าน (บนสุดของลิสต์ = หน้าสุด)
     zone เป็นพื้นหลังเสมอ → อยู่ล่างสุดของลิสต์ ส่วน object อื่นอยู่เหนือกว่า */
  const rev = [...all].reverse()
  const ordered = [...rev.filter((e) => e.tool !== 'zone'), ...rev.filter((e) => e.tool === 'zone')]
  const roots: ParkingElem[] = []
  const children: Record<string, ParkingElem[]> = {}
  for (const el of ordered) {
    const p = parentOf[el.id]
    if (p) (children[p] ||= []).push(el)
    else roots.push(el)
  }
  return { roots, children }
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
export default function EditParkingLayout() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { url_uuid } = useParams<{ url_uuid: string }>()

  /* floors / elements */
  const initial = getStore() as { floors: Floor[]; elements?: ElementsByFloor }
  const initialFloors: Floor[] = initial.floors.length
    ? initial.floors
    : [
      { id: 'floor-1', name: 'A', visible: true },
      { id: 'floor-2', name: 'B', visible: true },
      { id: 'floor-3', name: 'C', visible: true },
    ]
  const [floors, setFloors] = useState<Floor[]>(initialFloors)
  const [activeFloorId, setActiveFloorId] = useState<string>(floors[0]?.id ?? 'floor-1')
  const [floorsOpen, setFloorsOpen] = useState<boolean>(true)
  const [toolboxOpen, setToolboxOpen] = useState<boolean>(true)

  /* layers panel */
  const [layersOpen, setLayersOpen] = useState<boolean>(true)
  const [layerDragId, setLayerDragId] = useState<string | null>(null)
  const [layerOver, setLayerOver] = useState<{ id: string; above: boolean } | null>(null)
  /* zone ที่ถูกพับใน Layers tree (ค่าเริ่มต้น = ขยายทั้งหมด) */
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set())
  const toggleLayerCollapsed = (id: string) =>
    setCollapsedLayers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  /* floors drag-reorder */
  const [floorDragId, setFloorDragId] = useState<string | null>(null)
  const [floorOver, setFloorOver] = useState<{ id: string; above: boolean } | null>(null)

  /* add-floor form (ตั้งชื่อก่อนสร้าง) */
  const [addingFloor, setAddingFloor] = useState<boolean>(false)
  const [newFloorName, setNewFloorName] = useState<string>('')
  const [floorError, setFloorError] = useState<string>('')

  /* rename floor (ดับเบิลคลิกที่ชื่อ) */
  const [renamingFloorId, setRenamingFloorId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState<string>('')
  const [renameError, setRenameError] = useState<boolean>(false)

  /* history — ทุกชั้นมี Focus เสมอ (เติมให้ตั้งแต่เริ่ม) */
  const [hist, dispatchHist] = useReducer(historyReducer, {
    past: [],
    present: withFocus(initialFloors, initial.elements || {}),
    future: [],
  })
  const elements = hist.present
  const pushHistory = useCallback((e: ElementsByFloor) => dispatchHist({ type: 'PUSH', payload: e }), [])
  const undo = () => dispatchHist({ type: 'UNDO' })
  const redo = () => dispatchHist({ type: 'REDO' })

  /* zoom / pan */
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<Point>({ x: 60, y: 60 })
  const canvasRef = useRef<HTMLDivElement | null>(null)

  /* canvas mode: 'select' | 'pan' | 'place' */
  const [canvasMode, setCanvasMode] = useState<CanvasMode>(MODE_SELECT)
  const [placeTool, setPlaceTool] = useState<ToolId>('slot')
  const [cursorOverCanvas, setCursorOverCanvas] = useState<boolean>(false)
  const [placementPreview, setPlacementPreview] = useState<Omit<ParkingElem, 'id'> | null>(null)
  const placementDrag = useRef<PlacementDragState | null>(null)

  /* temporary pan via Space */
  const [spaceDown, setSpaceDown] = useState<boolean>(false)
  const prevModeRef = useRef<CanvasMode>(MODE_SELECT)

  /* selection (multi) — selectedId / selectedElem only exist for a single selection */
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null
  const setSelectedId = (id: string | null) => setSelectedIds(id ? [id] : [])

  /* rubber-band selection */
  const rbStart = useRef<Point | null>(null)
  const [rbBox, setRbBox] = useState<Rect | null>(null)

  /* drag element(s) */
  const dragging = useRef<string | null>(null)
  const dragOffset = useRef<Point>({ x: 0, y: 0 })
  const dragPushed = useRef<boolean>(false) // first move pushes one undo step, the rest replace

  /* ขอบเขตภาพวาดจริงของแต่ละ element (วัดจาก ParkingElement) — ใช้วาดกรอบเลือกให้พอดีภาพ */
  const [bounds, setBounds] = useState<Record<string, ElementBounds>>({})
  const handleBounds = useCallback((id: string, b: ElementBounds) => {
    setBounds((prev) => {
      const o = prev[id]
      if (o && Math.abs(o.x - b.x) < 0.01 && Math.abs(o.y - b.y) < 0.01 && Math.abs(o.w - b.w) < 0.01 && Math.abs(o.h - b.h) < 0.01) {
        return prev
      }
      return { ...prev, [id]: b }
    })
  }, [])

  /* resize */
  const resizing = useRef<ResizeState | null>(null)
  const [resizeCursor, setResizeCursor] = useState<string | null>(null) // cursor ค้างไว้ตอนกำลังลากจุดจับ

  /* rotate */
  const rotating = useRef<RotateState | null>(null)

  /* pan drag */
  const panDragging = useRef<boolean>(false)
  const panStart = useRef<Point | null>(null)

  /* cursor tracking for status bar */
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 })

  /* left panel nav */
  const [activeNav, setActiveNav] = useState<NavTab>('layout')

  /* auto-save */
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* search */
  const [toolSearch, setToolSearch] = useState<string>('')

  /* clipboard (Ctrl+C / Ctrl+V) — เก็บสำเนา element ข้ามชั้นได้ */
  const clipboard = useRef<{ elems: ParkingElem[]; floorId: string; pastes: number } | null>(null)
  const [hasClipboard, setHasClipboard] = useState<boolean>(false)

  /* ─── derived ─── */
  const floorElems = elements[activeFloorId] || []
  /* Focus ของชั้นที่เปิดอยู่ (วาดแยกจาก element อื่น) */
  const focusElem = floorElems.find((e) => e.tool === 'focus') ?? null
  /* zone เป็นพื้นหลังเสมอ (วาดก่อน, zone ใหญ่อยู่หลังสุด) → object อื่นอยู่ด้านหน้า คลิก/ลากง่าย */
  const visibleElems = (() => {
    const shown = floorElems.filter((e) => !e.hidden && e.tool !== 'focus')
    const zonesBack = shown.filter((e) => e.tool === 'zone').sort((a, b) => b.w * b.h - a.w * a.h)
    const rest = shown.filter((e) => e.tool !== 'zone')
    return [...zonesBack, ...rest]
  })()
  const selectedElem = floorElems.find((e) => e.id === selectedId) || null
  const activeFloorVisible = floors.find((floor) => floor.id === activeFloorId)?.visible !== false
  const slotCount = Object.values(elements).flat().filter((e) => e.tool === 'slot').length
  const motoCount = 0
  const filteredTools = TOOL_DEFS.filter((tl) =>
    t('editLayout.tools.' + tl.id).toLowerCase().includes(toolSearch.toLowerCase())
  )

  /* ─── Property panel: เลือก 1 ชิ้น หรือ หลายชิ้นที่เป็น "ชนิดเดียวกัน" ───
     - ชนิดเดียวกัน → แสดงฟิลด์ชุดเดียวกัน แก้แล้วใช้กับทุกชิ้นที่เลือก
       (ค่าที่ไม่เท่ากันโชว์เป็น "Mixed")
     - คนละชนิด → ไม่แสดงฟิลด์ (แสดงแค่จำนวนที่เลือก) */
  const panelElems = floorElems.filter((e) => selectedIds.includes(e.id))
  const panelTool: ToolId | null =
    panelElems.length > 0 && panelElems.every((e) => e.tool === panelElems[0].tool)
      ? panelElems[0].tool
      : null
  const multi = panelElems.length > 1
  /* Focus มีชั้นละ 1 ตัว แก้ร่วมกันไม่ได้ */
  const panelElem: ParkingElem | null =
    panelTool && !(multi && panelTool === 'focus') ? panelElems[0] : null
  const panelToolLabel = panelTool ? t('editLayout.tools.' + panelTool) : ''
  /* ค่าของฟิลด์นี้ไม่เท่ากันในชิ้นที่เลือกหรือไม่ */
  const mixedOf = (get: (e: ParkingElem) => unknown) =>
    multi && panelElems.some((e) => get(e) !== get(panelElems[0]))

  /* แก้ property → ใช้กับทุกชิ้นที่เลือก (ชนิดเดียวกัน) ใน history step เดียว */
  function updateSelected(patch: Partial<ParkingElem>) {
    const ids = new Set(panelElems.map((e) => e.id))
    if (!ids.size) return
    pushHistory({
      ...elements,
      [activeFloorId]: floorElems.map((e) => (ids.has(e.id) ? { ...e, ...patch } : e)),
    })
  }

  /* ─── layers ─── */
  /* ชื่อที่แสดงใน Layers: slot ใช้ Slot ID, ที่เหลือใช้ label */
  const layerName = (el: ParkingElem) =>
    (el.tool === 'slot' ? el.slotId || el.label : el.label) || el.tool

  /* ซ่อน/แสดง element */
  function toggleLayerHidden(id: string) {
    pushHistory({
      ...elements,
      [activeFloorId]: floorElems.map((e) => (e.id === id ? { ...e, hidden: !e.hidden } : e)),
    })
    setSelectedIds((prev) => prev.filter((i) => i !== id)) // ซ่อนแล้วไม่ให้ค้างเลือกอยู่
  }

  /* ย้ายชั้น: ตำแหน่งท้าย array = อยู่หน้าสุด (วาดทีหลัง)
     ในลิสต์ Layers แสดงกลับด้าน → "above" = index สูงกว่าเป้าหมาย */
  function moveLayer(srcId: string, targetId: string, above: boolean) {
    if (srcId === targetId) return
    const arr = [...floorElems]
    const from = arr.findIndex((e) => e.id === srcId)
    if (from < 0) return
    const [item] = arr.splice(from, 1)
    const to = arr.findIndex((e) => e.id === targetId)
    if (to < 0) return
    arr.splice(above ? to + 1 : to, 0, item)
    pushHistory({ ...elements, [activeFloorId]: arr })
  }

  /* Layers tree ของชั้นที่เปิดอยู่ (ไม่รวม focus — แสดงเป็นแถวพิเศษด้านล่าง) */
  const layerTree = buildLayerTree(floorElems.filter((e) => e.tool !== 'focus'))
  const realLayerCount = floorElems.filter((e) => e.tool !== 'focus').length

  /* วาดแถว layer หนึ่งแถว + ลูก ๆ (ถ้าเป็น zone และไม่ถูกพับ) */
  function renderLayerRow(el: ParkingElem, depth: number): React.ReactNode {
    const kids = layerTree.children[el.id] ?? []
    const isZone = el.tool === 'zone'
    const hasKids = kids.length > 0
    const collapsed = collapsedLayers.has(el.id)
    const selected = selectedIds.includes(el.id)
    const isOver = layerOver?.id === el.id && layerDragId !== el.id

    return (
      <React.Fragment key={el.id}>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', el.id)
            setLayerDragId(el.id)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            const r = e.currentTarget.getBoundingClientRect()
            setLayerOver({ id: el.id, above: e.clientY < r.top + r.height / 2 })
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (layerDragId && layerOver) moveLayer(layerDragId, layerOver.id, layerOver.above)
            setLayerDragId(null)
            setLayerOver(null)
          }}
          onDragEnd={() => { setLayerDragId(null); setLayerOver(null) }}
          onClick={() => { if (!el.hidden) setSelectedIds([el.id]) }}
          style={{ paddingLeft: 16 + depth * LAYER_INDENT }}
          className={`box-border flex h-9 w-full items-center gap-2 border-y-2 border-transparent pr-4
            ${isOver ? (layerOver!.above ? '!border-t-brand' : '!border-b-brand') : ''}
            ${layerDragId === el.id ? 'opacity-40' : ''}
            ${selected ? 'bg-brand/10 text-brand' : el.hidden ? 'text-ink-3' : 'text-ink'}
            ${hoverBg}`}
        >
          {/* ลูกศรพับ/ขยาย (เฉพาะ zone ที่มีลูก) */}
          {hasKids ? (
            <button
              type="button"
              aria-label={collapsed ? t('editLayout.expand') : t('editLayout.collapse')}
              onClick={(ev) => { ev.stopPropagation(); toggleLayerCollapsed(el.id) }}
              className="flex h-4 w-3 shrink-0 items-center justify-center bg-transparent p-0 text-current"
            >
              <Caret open={!collapsed} />
            </button>
          ) : (
            <span className="h-4 w-3 shrink-0" />
          )}

          {/* ไอคอนประเภท: zone = # (เหมือน frame ใน Figma), อื่น ๆ = กรอบเส้นประ */}
          {isZone
            ? <Hash size={14} strokeWidth={1.75} className="shrink-0" />
            : <BoxSelect size={14} strokeWidth={1.75} className="shrink-0" />}

          <span className="flex-1 truncate text-left text-[13px]">{layerName(el)}</span>

          {/* ตา อยู่ขวาแถว เหมือน Figma */}
          <button
            type="button"
            aria-label={el.hidden ? t('editLayout.showLayer') : t('editLayout.hideLayer')}
            onClick={(ev) => { ev.stopPropagation(); toggleLayerHidden(el.id) }}
            className="flex shrink-0 items-center bg-transparent p-0 text-current"
          >
            {el.hidden ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
          </button>
        </div>

        {hasKids && !collapsed && kids.map((k) => renderLayerRow(k, depth + 1))}
      </React.Fragment>
    )
  }

  /* ─── auto-save ─── */
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveLayout(floors, elements)
      setLastSaved(new Date())
    }, 600)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [floors, elements])

  /* ─── keyboard shortcuts ─── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (!inInput) {
        /* ต้องอยู่ก่อนปุ่ม v / h ไม่งั้น Ctrl+V จะโดนตีเป็นเครื่องมือ Select */
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); copySelected(); return }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteClipboard(); return }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); return }
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); return }
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); return }
        if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); return }
        if (e.key === 'v' || e.key === 'V') { activateSelect(); return }
        if (e.key === 'h' || e.key === 'H') { activatePan(); return }
        if (e.key === 'Escape') { activateSelect(); setSelectedIds([]); return }
        if (e.key === ' ') {
          e.preventDefault()
          if (!spaceDown) {
            prevModeRef.current = canvasMode
            setSpaceDown(true)
            setCanvasMode(MODE_PAN)
          }
          return
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length) {
          /* Focus ลบไม่ได้ */
          const delIds = selectedIds.filter((id) => floorElems.find((el) => el.id === id)?.tool !== 'focus')
          if (delIds.length) {
            pushHistory({ ...elements, [activeFloorId]: floorElems.filter((el) => !delIds.includes(el.id)) })
            setSelectedIds([])
          }
        }
        if (selectedIds.length && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault()
          const d = e.shiftKey ? GRID * 5 : GRID
          const dx = e.key === 'ArrowRight' ? d : e.key === 'ArrowLeft' ? -d : 0
          const dy = e.key === 'ArrowDown' ? d : e.key === 'ArrowUp' ? -d : 0
          const movingIds = withZoneChildren(selectedIds, floorElems)
          pushHistory({
            ...elements,
            [activeFloorId]: floorElems.map((el) =>
              movingIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
            ),
          })
        }
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === ' ') {
        setSpaceDown(false)
        setCanvasMode(prevModeRef.current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  function activateSelect() {
    placementDrag.current = null
    setPlacementPreview(null)
    setCanvasMode(MODE_SELECT)
    prevModeRef.current = MODE_SELECT
  }
  function activatePan() {
    placementDrag.current = null
    setPlacementPreview(null)
    setCanvasMode(MODE_PAN)
    prevModeRef.current = MODE_PAN
  }
  function activatePlacement(toolId: ToolId) {
    placementDrag.current = null
    setPlacementPreview(null)
    setPlaceTool(toolId)
    setCanvasMode(MODE_PLACE)
    prevModeRef.current = MODE_PLACE
  }

  /* ─── copy / paste (Focus คัดลอกไม่ได้) ─── */
  function copySelected() {
    const picked = floorElems.filter((el) => selectedIds.includes(el.id) && el.tool !== 'focus')
    if (!picked.length) return
    clipboard.current = { elems: picked.map((el) => ({ ...el })), floorId: activeFloorId, pastes: 0 }
    setHasClipboard(true)
  }
  /* วางลงชั้นที่เปิดอยู่ (ชั้นเดียวกัน = เยื้อง GRID ต่อการวางหนึ่งครั้ง, ชั้นอื่น = ตำแหน่งเดิม) */
  function pasteClipboard() {
    const cb = clipboard.current
    if (!cb || !cb.elems.length) return
    const existing = elements[activeFloorId] || []
    const step = cb.floorId === activeFloorId ? cb.pastes + 1 : cb.pastes
    const off = GRID * step
    const stamp = Date.now()
    const usedSlotIds = new Set<string | undefined>(
      existing.filter((e) => e.tool === 'slot').map((e) => e.slotId)
    )
    const copies: ParkingElem[] = cb.elems.map((el, i) => {
      let slotId = el.slotId
      if (el.tool === 'slot' && slotId) {
        slotId = uniqueSlotId(slotId, usedSlotIds)
        usedSlotIds.add(slotId)
      }
      return { ...el, id: `${el.tool}-${stamp}-${i}`, x: el.x + off, y: el.y + off, slotId }
    })
    cb.pastes += 1
    pushHistory({ ...elements, [activeFloorId]: [...existing, ...copies] })
    setSelectedIds(copies.map((c) => c.id))
    activateSelect()
  }
  function duplicateSelected() {
    copySelected()
    pasteClipboard()
  }

  /* ─── canvas coord helpers ─── */
  function toCanvas(clientX: number, clientY: number): Point {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    }
  }
  function snapGrid(v: number): number {
    return Math.round(v / SNAP) * SNAP
  }

  /* ─── เริ่มลากจุดจับ (ใช้ทั้งมุมและขอบ) ─── */
  function startResize(e: React.MouseEvent, handle: ResizeHandle, el: ParkingElem) {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const rot = el.rotation ?? 0
    const min = el.tool === 'focus' ? FOCUS_MIN : MIN_SIZE
    /* element ที่ไม่หมุน: ปัดค่าเดิมลงเส้น grid ก่อน เพื่อให้ขอบทุกด้านตรงกัน
       (Focus ที่ล็อกสัดส่วน: ใช้ค่าจริง ไม่ปัด เพื่อไม่ให้สัดส่วนเพี้ยน) */
    const lockRatio = el.tool === 'focus' && !!focusPresetOf(el)
    const orig: Rect = rot === 0 && !lockRatio
      ? {
        x: snapGrid(el.x),
        y: snapGrid(el.y),
        w: Math.max(min, snapGrid(el.w)),
        h: Math.max(min, snapGrid(el.h)),
      }
      : { x: el.x, y: el.y, w: el.w, h: el.h }
    /* ช่องว่างระหว่างขอบ element กับขอบภาพวาดจริง (เป็นสัดส่วน เพราะภาพ scale ตามกรอบ) */
    const b = bounds[el.id]
    const fr = b && el.w > 0 && el.h > 0
      ? {
        l: Math.max(0, Math.min(0.9, b.x / el.w)),
        r: Math.max(0, Math.min(0.9, (el.w - (b.x + b.w)) / el.w)),
        t: Math.max(0, Math.min(0.9, b.y / el.h)),
        b: Math.max(0, Math.min(0.9, (el.h - (b.y + b.h)) / el.h)),
      }
      : { l: 0, r: 0, t: 0, b: 0 }
    resizing.current = { id: el.id, handle, orig, rot, min, fr, pushed: false, lockRatio }
    setResizeCursor(HANDLE_CURSOR[handle])
  }

  /* ─── เริ่มหมุน (ลากปุ่มวงกลมใต้กรอบ) ─── */
  function startRotate(e: React.MouseEvent, el: ParkingElem) {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const cx = el.x + el.w / 2
    const cy = el.y + el.h / 2
    const cv = toCanvas(e.clientX, e.clientY)
    rotating.current = {
      id: el.id,
      cx,
      cy,
      startAngle: (Math.atan2(cv.y - cy, cv.x - cx) * 180) / Math.PI,
      origRot: el.rotation ?? 0,
      pushed: false,
    }
    setResizeCursor('grabbing')
  }

  /* ─── เริ่มหมุนทั้งก้อน (เลือกหลายชิ้น) — หมุนรอบจุดกึ่งกลางของกรอบรวม ─── */
  function startGroupRotate(e: React.MouseEvent, box: Rect) {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    const cv = toCanvas(e.clientX, e.clientY)
    /* zone ที่เลือกจะพาลูกในนั้นหมุนไปด้วย เหมือนตอนลากย้าย (Focus ไม่หมุน) */
    const ids = withZoneChildren(selectedIds, floorElems)
    rotating.current = {
      id: '',
      cx,
      cy,
      startAngle: (Math.atan2(cv.y - cy, cv.x - cx) * 180) / Math.PI,
      origRot: 0,
      pushed: false,
      delta: 0,
      items: floorElems
        .filter((el) => ids.includes(el.id) && el.tool !== 'focus')
        .map((el) => ({
          id: el.id,
          cx: el.x + el.w / 2,
          cy: el.y + el.h / 2,
          w: el.w,
          h: el.h,
          rot: el.rotation ?? 0,
        })),
    }
    setResizeCursor('grabbing')
  }

  /* ─── mouse down on canvas ─── */
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 1) {
      e.preventDefault()
      panDragging.current = true
      panStart.current = { x: e.clientX, y: e.clientY }
      return
    }
    if (e.button !== 0) return

    const mode = spaceDown ? MODE_PAN : canvasMode

    if (mode === MODE_PAN) {
      panDragging.current = true
      panStart.current = { x: e.clientX, y: e.clientY }
      return
    }

    if (mode === MODE_SELECT) {
      const cv = toCanvas(e.clientX, e.clientY)
      rbStart.current = cv
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelectedIds([])
      setRbBox(null)
      return
    }

    if (mode === MODE_PLACE) {
      const cv = toCanvas(e.clientX, e.clientY)
      const x = snapGrid(cv.x)
      const y = snapGrid(cv.y)
      if (['lane', 'zone'].includes(placeTool)) {
        placementDrag.current = { tool: placeTool, x, y, moved: false }
        setPlacementPreview({ ...DEFAULT_ELEM[placeTool], tool: placeTool, x, y })
        return
      }
      const def = DEFAULT_ELEM[placeTool]
      const id = `${placeTool}-${Date.now()}`
      const existing = elements[activeFloorId] || []
      const slotCount2 = existing.filter((el) => el.tool === 'slot').length
      const floorLetter = floors.find((f) => f.id === activeFloorId)?.name?.replace('Floor ', '') || 'A'
      const slotId = placeTool === 'slot' ? `${floorLetter}${String(slotCount2 + 1).padStart(2, '0')}` : ''
      const newElem: ParkingElem = { id, tool: placeTool, x, y, ...def, slotId }

      pushHistory({ ...elements, [activeFloorId]: [...existing, newElem] })
      setSelectedId(id)
      activateSelect()
    }
  }

  /* ─── mouse move ─── */
  function handleCanvasMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const cv = toCanvas(e.clientX, e.clientY)
    setCursorPos(cv)

    /* rotating via handle — หมุนรอบจุดกึ่งกลาง
       - ชิ้นเดียว: หมุนรอบจุดกึ่งกลาง element
       - หลายชิ้น: หมุนทั้งก้อนรอบจุดกึ่งกลางของกรอบรวม (ตำแหน่ง + rotation ของทุกชิ้น)
       - ค่าปกติปัดเป็นองศาเต็ม
       - Shift: snap ทีละ 15°                                                   */
    if (rotating.current) {
      const rt = rotating.current
      const angle = (Math.atan2(cv.y - rt.cy, cv.x - rt.cx) * 180) / Math.PI

      /* หมุนทั้งก้อน — คำนวณจาก snapshot ตอนเริ่มลากเสมอ ไม่เพี้ยนสะสม */
      if (rt.items) {
        let delta = angle - rt.startAngle
        delta = e.shiftKey ? Math.round(delta / ROTATE_SNAP_DEG) * ROTATE_SNAP_DEG : Math.round(delta)
        const rad = (delta * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const map = new Map(rt.items.map((i) => [i.id, i]))

        const payload: ElementsByFloor = {
          ...elements,
          [activeFloorId]: floorElems.map((el) => {
            const it = map.get(el.id)
            if (!it) return el
            const dx = it.cx - rt.cx
            const dy = it.cy - rt.cy
            const ncx = rt.cx + dx * cos - dy * sin
            const ncy = rt.cy + dx * sin + dy * cos
            return {
              ...el,
              x: Math.round(ncx - it.w / 2),
              y: Math.round(ncy - it.h / 2),
              rotation: (((it.rot + delta) % 360) + 360) % 360,
            }
          }),
        }
        rt.delta = delta
        dispatchHist({ type: rt.pushed ? 'REPLACE' : 'PUSH', payload })
        rt.pushed = true
        return
      }

      /* หมุนชิ้นเดียว */
      let rot = rt.origRot + (angle - rt.startAngle)
      rot = e.shiftKey ? Math.round(rot / ROTATE_SNAP_DEG) * ROTATE_SNAP_DEG : Math.round(rot)
      rot = ((rot % 360) + 360) % 360 // เก็บในช่วง 0–359

      const payload: ElementsByFloor = {
        ...elements,
        [activeFloorId]: floorElems.map((el) =>
          el.id === rt.id ? { ...el, rotation: rot } : el
        ),
      }
      dispatchHist({ type: rt.pushed ? 'REPLACE' : 'PUSH', payload })
      rt.pushed = true
      return
    }

    /* resizing via handles — แบบ Figma
       - ลากมุม/ขอบ: ขอบฝั่งตรงข้ามอยู่กับที่
       - Shift (ที่มุม): คงสัดส่วน
       - Focus ที่ตรง preset: คงสัดส่วนเสมอ (ลากได้เฉพาะมุม)
       - Alt/Option: ยืดจากจุดกึ่งกลาง
       - รองรับ element ที่หมุนอยู่ (คำนวณในแกนที่หมุน)                        */
    if (resizing.current) {
      const r = resizing.current
      const o = r.orig
      const th = (r.rot * Math.PI) / 180
      const cos = Math.cos(th)
      const sin = Math.sin(th)
      const c0x = o.x + o.w / 2
      const c0y = o.y + o.h / 2

      /* เมาส์ → พิกัดในแกนของ element (หมุนย้อนกลับรอบจุดกึ่งกลางเดิม) */
      const dx = cv.x - c0x
      const dy = cv.y - c0y
      const lx = c0x + dx * cos + dy * sin
      const ly = c0y - dx * sin + dy * cos

      const hasE = r.handle.includes('e')
      const hasW = r.handle.includes('w')
      const hasS = r.handle.includes('s')
      const hasN = r.handle.includes('n')
      const fromCenter = e.altKey
      const keepRatio = (e.shiftKey || r.lockRatio) && r.handle.length === 2

      let w = o.w
      let h = o.h
      /* เมาส์ลากขอบของ "ภาพวาดจริง" จึงหารด้วยสัดส่วนที่ภาพกินกรอบ element */
      if (hasE) w = fromCenter ? 2 * (lx - c0x) : (lx - o.x) / Math.max(1 - r.fr.r, 0.1)
      if (hasW) w = fromCenter ? 2 * (c0x - lx) : (o.x + o.w - lx) / Math.max(1 - r.fr.l, 0.1)
      if (hasS) h = fromCenter ? 2 * (ly - c0y) : (ly - o.y) / Math.max(1 - r.fr.b, 0.1)
      if (hasN) h = fromCenter ? 2 * (c0y - ly) : (o.y + o.h - ly) / Math.max(1 - r.fr.t, 0.1)

      if (keepRatio) {
        const s = Math.max(w / o.w, h / o.h)
        w = o.w * s
        h = o.h * s
      } else {
        if (hasE || hasW) w = snapGrid(w)
        if (hasN || hasS) h = snapGrid(h)
      }

      if (r.lockRatio) {
        /* Focus ที่ล็อกสัดส่วน: คำนวณ h จาก w เสมอ ไม่ให้เพี้ยนจาก preset */
        w = Math.max(r.min, Math.round(w))
        h = Math.round((w * o.h) / o.w)
        if (h < r.min) {
          h = r.min
          w = Math.round((h * o.w) / o.h)
        }
      } else {
        w = Math.max(r.min, Math.round(w))
        h = Math.max(r.min, Math.round(h))
      }

      /* จุดกึ่งกลางใหม่ (ในแกน element) โดยให้ขอบฝั่งตรงข้ามอยู่กับที่ */
      let clx = c0x
      let cly = c0y
      if (!fromCenter) {
        if (hasE) clx = o.x + w / 2
        else if (hasW) clx = o.x + o.w - w / 2
        if (hasS) cly = o.y + h / 2
        else if (hasN) cly = o.y + o.h - h / 2
      }

      /* แปลงจุดกึ่งกลางใหม่กลับเป็นพิกัดโลก (หมุนไปข้างหน้า) */
      const vx = clx - c0x
      const vy = cly - c0y
      const ncx = c0x + vx * cos - vy * sin
      const ncy = c0y + vx * sin + vy * cos
      const nx = Math.round(ncx - w / 2)
      const ny = Math.round(ncy - h / 2)

      const payload: ElementsByFloor = {
        ...elements,
        [activeFloorId]: floorElems.map((el) =>
          el.id === r.id ? { ...el, x: nx, y: ny, w, h } : el
        ),
      }
      dispatchHist({ type: r.pushed ? 'REPLACE' : 'PUSH', payload })
      r.pushed = true
      return
    }

    if (placementDrag.current && canvasMode === MODE_PLACE) {
      const drag = placementDrag.current
      const endX = snapGrid(cv.x)
      const endY = snapGrid(cv.y)
      drag.moved = drag.moved || Math.abs(cv.x - drag.x) > 2 || Math.abs(cv.y - drag.y) > 2
      if (drag.tool === 'zone') {
        setPlacementPreview({
          ...DEFAULT_ELEM.zone,
          tool: drag.tool,
          x: Math.min(drag.x, endX),
          y: Math.min(drag.y, endY),
          w: Math.max(Math.abs(endX - drag.x), MIN_SIZE),
          h: Math.max(Math.abs(endY - drag.y), MIN_SIZE),
        })
      } else {
        const def = DEFAULT_ELEM[drag.tool]
        setPlacementPreview({
          ...def,
          tool: drag.tool,
          x: Math.min(drag.x, endX),
          y: snapGrid(drag.y - def.h / 2),
          w: Math.max(Math.abs(endX - drag.x), MIN_SIZE),
          h: def.h,
        })
      }
    }

    if (panDragging.current && panStart.current) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      panStart.current = { x: e.clientX, y: e.clientY }
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
      return
    }

    if (dragging.current && canvasMode === MODE_SELECT) {
      const lead = floorElems.find((el) => el.id === dragging.current)
      if (!lead) return
      const nx = snapGrid(cv.x - dragOffset.current.x)
      const ny = snapGrid(cv.y - dragOffset.current.y)
      const dx = nx - lead.x
      const dy = ny - lead.y
      if (dx === 0 && dy === 0) return

      const moving = withZoneChildren(
        selectedIds.includes(lead.id) ? selectedIds : [lead.id],
        floorElems
      )
      const payload: ElementsByFloor = {
        ...elements,
        [activeFloorId]: floorElems.map((el) =>
          moving.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el
        ),
      }
      dispatchHist({ type: dragPushed.current ? 'REPLACE' : 'PUSH', payload })
      dragPushed.current = true
      return
    }

    if (rbStart.current) {
      setRbBox({
        x: Math.min(rbStart.current.x, cv.x),
        y: Math.min(rbStart.current.y, cv.y),
        w: Math.abs(cv.x - rbStart.current.x),
        h: Math.abs(cv.y - rbStart.current.y),
      })
    }
  }

  /* ─── mouse up ─── */
  function handleCanvasMouseUp(e?: React.MouseEvent<HTMLDivElement>) {
    /* ปล่อยเมาส์ตอนมี zone ไฮไลต์อยู่ → ให้ element เข้า zone นั้นแน่นอน
       (การเป็นลูกของ zone ดูจากจุดกึ่งกลาง จึงดันจุดกึ่งกลางเข้าในกรอบ zone ถ้ายังอยู่นอก) */
    if (dragging.current && dragPushed.current && dropZone) {
      const lead = floorElems.find((el) => el.id === dragging.current)
      if (lead) {
        const cx = lead.x + lead.w / 2
        const cy = lead.y + lead.h / 2
        const ncx = Math.min(Math.max(cx, dropZone.x + 2), dropZone.x + dropZone.w - 2)
        const ncy = Math.min(Math.max(cy, dropZone.y + 2), dropZone.y + dropZone.h - 2)
        const dxc = Math.round(ncx - cx)
        const dyc = Math.round(ncy - cy)
        if (dxc !== 0 || dyc !== 0) {
          const moving = withZoneChildren(
            selectedIds.includes(lead.id) ? selectedIds : [lead.id],
            floorElems
          )
          dispatchHist({
            type: 'REPLACE',
            payload: {
              ...elements,
              [activeFloorId]: floorElems.map((el) =>
                moving.includes(el.id) ? { ...el, x: el.x + dxc, y: el.y + dyc } : el
              ),
            },
          })
        }
      }
    }

    resizing.current = null
    rotating.current = null
    setResizeCursor(null)
    panDragging.current = false
    panStart.current = null
    dragging.current = null
    dragPushed.current = false

    if (placementDrag.current) {
      const drag = placementDrag.current
      const preview = placementPreview
      const def = DEFAULT_ELEM[drag.tool]
      const draw = drag.moved && preview
        ? preview
        : { ...def, tool: drag.tool, x: drag.x, y: drag.y }
      const id = `${drag.tool}-${Date.now()}`
      const existing = elements[activeFloorId] || []
      pushHistory({ ...elements, [activeFloorId]: [...existing, { id, ...draw } as ParkingElem] })
      setSelectedId(id)
      activateSelect()
    }

    if (rbBox && rbBox.w > 4 && rbBox.h > 4) {
      /* rubber-band ไม่เลือก Focus (เลือกผ่านป้าย/Layers เท่านั้น) */
      const hits = floorElems.filter((el) =>
        !el.hidden && el.tool !== 'focus' &&
        el.x < rbBox.x + rbBox.w && el.x + el.w > rbBox.x &&
        el.y < rbBox.y + rbBox.h && el.y + el.h > rbBox.y
      )
      if (hits.length >= 1) {
        const ids = hits.map((el) => el.id)
        const additive = !!e && (e.shiftKey || e.ctrlKey || e.metaKey)
        setSelectedIds((prev) => (additive ? Array.from(new Set([...prev, ...ids])) : ids))
      }
    }
    rbStart.current = null
    setRbBox(null)
  }

  /* ─── wheel ─── */
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (e.ctrlKey) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      setZoom((z) => {
        const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor))
        setPan((p) => ({
          x: mx - (mx - p.x) * (nz / z),
          y: my - (my - p.y) * (nz / z),
        }))
        return nz
      })
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
  }

  /* ─── floor ops ─── */
  /* ชื่อ default = ตัวอักษร A–Z ตัวแรกที่ยังไม่ถูกใช้ (ไม่มีให้ใช้แล้ว = สร้างไม่ได้) */
  const nextFloorName = (): string | null => {
    const used = new Set(floors.map((f) => f.name.trim().toUpperCase()))
    for (let i = 0; i < 26; i++) {
      const ch = String.fromCharCode(65 + i)
      if (!used.has(ch)) return ch
    }
    return null
  }
  const floorLimitReached = floors.length >= MAX_FLOORS || nextFloorName() === null

  function startAddFloor() {
    if (floorLimitReached) return
    setNewFloorName(nextFloorName() ?? '')
    setFloorError('')
    setAddingFloor(true)
  }
  function cancelAddFloor() {
    setAddingFloor(false)
    setFloorError('')
  }
  function confirmAddFloor() {
    const name = newFloorName.trim()
    if (!name) { setFloorError(t('editLayout.errNameRequired')); return }
    if (floors.some((f) => f.name.trim().toLowerCase() === name.toLowerCase())) {
      setFloorError(t('editLayout.errNameUsed'))
      return
    }
    if (floors.length >= MAX_FLOORS) { setFloorError(t('editLayout.errMaxFloors', { max: MAX_FLOORS })); return }
    const id = `floor-${Date.now()}`
    /* ชั้นใหม่มี Focus ตั้งต้นเสมอ */
    pushHistory({ ...elements, [id]: [makeFocus(id)] })
    setFloors([...floors, { id, name, visible: true }])
    setActiveFloorId(id)
    setSelectedIds([])
    setAddingFloor(false)
    setFloorError('')
  }
  function duplicateFloor() {
    const src = floors.find((f) => f.id === activeFloorId)
    if (!src || floors.length >= MAX_FLOORS) return
    /* ชื่อสำเนา = "<ชื่อเดิม> Copy" ถ้าซ้ำให้เป็น "Copy 2", "Copy 3", ... */
    const taken = new Set(floors.map((f) => f.name.trim().toLowerCase()))
    const base = t('editLayout.floorCopy', { name: src.name.trim() })
    let name = base
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base} ${n}`
    const id = `floor-${Date.now()}`
    const srcElems = elements[activeFloorId] || []
    /* สำเนารวม Focus ของชั้นเดิม (ขนาดเดียวกัน) — id ของ focus เปลี่ยนเป็นของชั้นใหม่ */
    pushHistory({
      ...elements,
      [id]: srcElems.map((e) => ({ ...e, id: e.tool === 'focus' ? focusIdOf(id) : `${e.id}-copy` })),
    })
    setFloors([...floors, { id, name, visible: true }])
    setActiveFloorId(id)
    setSelectedIds([])
  }
  function deleteFloor(id: string) {
    if (floors.length <= 1) return
    const f = floors.find((x) => x.id === id)
    if (!f) return
    const count = (elements[id] || []).filter((e) => e.tool !== 'focus').length
    const msg = count
      ? t(count > 1 ? 'editLayout.deleteFloorWithMany' : 'editLayout.deleteFloorWithOne', { name: f.name, count })
      : t('editLayout.deleteFloorEmpty', { name: f.name })
    if (!window.confirm(msg)) return
    const rest = floors.filter((x) => x.id !== id)
    const { [id]: _removed, ...restElements } = elements
    pushHistory(restElements)
    setFloors(rest)
    if (activeFloorId === id) setActiveFloorId(rest[0].id)
    setSelectedIds([])
  }
  function toggleFloorVisible(id: string) {
    setFloors(floors.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)))
  }

  /* ─── rename floor (ดับเบิลคลิกที่ชื่อ) ─── */
  function startRename(f: Floor) {
    setRenamingFloorId(f.id)
    setRenameValue(f.name)
    setRenameError(false)
  }
  function cancelRename() {
    setRenamingFloorId(null)
    setRenameError(false)
  }
  /* คืนค่า true ถ้าบันทึกสำเร็จ */
  function commitRename(): boolean {
    if (!renamingFloorId) return false
    const name = renameValue.trim()
    if (!name) { cancelRename(); return false }          // ว่าง = ยกเลิก คงชื่อเดิม
    const dup = floors.some(
      (f) => f.id !== renamingFloorId && f.name.trim().toLowerCase() === name.toLowerCase()
    )
    if (dup) { setRenameError(true); return false }       // ชื่อซ้ำ
    setFloors(floors.map((f) => (f.id === renamingFloorId ? { ...f, name } : f)))
    cancelRename()
    return true
  }

  /* ย้ายลำดับ floor: above = วางไว้เหนือแถวเป้าหมาย */
  function moveFloor(srcId: string, targetId: string, above: boolean) {
    if (srcId === targetId) return
    const arr = [...floors]
    const from = arr.findIndex((f) => f.id === srcId)
    if (from < 0) return
    const [item] = arr.splice(from, 1)
    const to = arr.findIndex((f) => f.id === targetId)
    if (to < 0) return
    arr.splice(above ? to : to + 1, 0, item)
    setFloors(arr)
  }

  /* ─── save / discard ─── */
  function handleSave() {
    saveLayout(floors, elements)
    setLastSaved(new Date())

    if (url_uuid) {
      navigate(`/system/${url_uuid}/parking`)
    }
  }
  function handleDiscard() {
    if (url_uuid) {
      navigate(`/system/${url_uuid}/parking`)
    }
  }

  /* ─── zoom ─── */
  function zoomIn() { setZoom((z) => Math.min(MAX_ZOOM, +(z * 1.2).toFixed(2))) }
  function zoomOut() { setZoom((z) => Math.max(MIN_ZOOM, +(z / 1.2).toFixed(2))) }
  /* Fit to screen = จัด Focus ให้พอดีกลางจอ */
  function resetZoom() {
    const r = canvasRef.current?.getBoundingClientRect()
    if (!r || !focusElem) { setZoom(1); setPan({ x: 60, y: 60 }); return }
    const z = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.min((r.width - 120) / focusElem.w, (r.height - 120) / focusElem.h)),
    )
    setZoom(z)
    setPan({
      x: (r.width - focusElem.w * z) / 2 - focusElem.x * z,
      y: (r.height - focusElem.h * z) / 2 - focusElem.y * z,
    })
  }

  /* ─── cursors ─── */
  const effectiveMode = spaceDown ? MODE_PAN : canvasMode
  const canvasCursorClass = effectiveMode === MODE_PAN
    ? (panDragging.current ? 'cursor-grabbing' : 'cursor-grab')
    : effectiveMode === MODE_SELECT
      ? 'cursor-default'
      : 'cursor-crosshair'

  /* ─── autosave label ─── */
  const autoSaveLabel = lastSaved
    ? t('editLayout.draftAutoSaved', { time: lastSaved.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en', { hour: 'numeric', minute: '2-digit' }) })
    : t('editLayout.draftAutoSaved', { time: '00:22' })

  const snapM = (SNAP * SCALE).toFixed(2)
  const previewElem: ParkingElem | null = activeFloorVisible && cursorOverCanvas && canvasMode === MODE_PLACE
    ? (placementPreview
      ? { ...placementPreview, id: 'placement-preview' }
      : {
        ...DEFAULT_ELEM[placeTool],
        id: 'placement-preview',
        tool: placeTool,
        x: snapGrid(cursorPos.x),
        y: snapGrid(cursorPos.y),
      })
    : null

  const variantOptions = panelElem ? VARIANT_OPTIONS[panelElem.tool as ToolId] : undefined

  /* zone ที่ "เมาส์" ชี้อยู่ตอนกำลังลาก element (zone ที่เล็กที่สุดที่ครอบตำแหน่งเมาส์)
     → ไฮไลต์สีฟ้าทุกครั้งที่เมาส์อยู่เหนือ zone และตอนปล่อยมือ element จะเข้า zone นี้แน่นอน */
  const dragLead = dragging.current && dragPushed.current
    ? floorElems.find((el) => el.id === dragging.current)
    : undefined
  const dropZone: ParkingElem | null = dragLead
    ? floorElems
        .filter((z) =>
          z.tool === 'zone' &&
          z.id !== dragLead.id &&
          !z.hidden &&
          cursorPos.x >= z.x && cursorPos.x <= z.x + z.w &&
          cursorPos.y >= z.y && cursorPos.y <= z.y + z.h &&
          (dragLead.tool !== 'zone' || z.w * z.h > dragLead.w * dragLead.h)
        )
        .sort((a, b) => a.w * a.h - b.w * b.h)[0] ?? null
    : null

  const navItems: { id: NavTab; label: string; Icon: React.FC }[] = [
    { id: 'layout', label: t('editLayout.nav.layout'), Icon: NavLayoutDashboardIcon },
  ]

  /* ─── selection overlay (สไตล์ Figma) ───
     - เลือก 1 ชิ้น: กรอบสีน้ำเงิน + จุดจับมุม 4 จุด + ขอบ 4 ด้านจับได้ + ป้ายขนาด "W × H" + ปุ่มหมุน
     - เลือกหลายชิ้น: กรอบรวม + ป้ายขนาด + ปุ่มหมุนทั้งก้อน (ยังไม่มีจุดจับยืด/หด)    */
  const selectionVisible = activeFloorVisible && effectiveMode === MODE_SELECT && !!selectedIds.length
  const selectedElems = floorElems.filter((el) => selectedIds.includes(el.id) && !el.hidden)
  const singleSel =
    selectionVisible && selectedElem && !selectedElem.hidden &&
    (RESIZABLE_TOOLS.includes(selectedElem.tool) || ROTATABLE_TOOLS.includes(selectedElem.tool))
      ? selectedElem
      : null
  const canResize = !!singleSel && RESIZABLE_TOOLS.includes(singleSel.tool)
  const canRotate = !!singleSel && ROTATABLE_TOOLS.includes(singleSel.tool)
  /* เลือกหลายชิ้น → หมุนทั้งก้อนได้ */
  const canRotateGroup = selectionVisible && !singleSel && selectedElems.length > 1
  const showRotate = canRotate || canRotateGroup
  const isRotating = !!rotating.current

  let selBox: Rect | null = null
  let selRot = 0
  if (selectionVisible && selectedElems.length) {
    /* ขอบเขตภาพวาดจริงในพิกัดโลก (ถ้ายังไม่ได้วัด ใช้ขนาด element) */
    const visual = (el: ParkingElem): Rect => {
      const b = bounds[el.id]
      return b
        ? { x: el.x + b.x, y: el.y + b.y, w: b.w, h: b.h }
        : { x: el.x, y: el.y, w: el.w, h: el.h }
    }
    if (singleSel) {
      /* กรอบ = ขอบภาพจริง หมุนรอบจุดกึ่งกลางของ element เหมือนตัว element */
      const b = bounds[singleSel.id] ?? { x: 0, y: 0, w: singleSel.w, h: singleSel.h }
      const rad0 = ((singleSel.rotation ?? 0) * Math.PI) / 180
      const ox = b.x + b.w / 2 - singleSel.w / 2
      const oy = b.y + b.h / 2 - singleSel.h / 2
      const ccx = singleSel.x + singleSel.w / 2 + ox * Math.cos(rad0) - oy * Math.sin(rad0)
      const ccy = singleSel.y + singleSel.h / 2 + ox * Math.sin(rad0) + oy * Math.cos(rad0)
      selBox = { x: ccx - b.w / 2, y: ccy - b.h / 2, w: b.w, h: b.h }
      selRot = singleSel.rotation ?? 0
    } else {
      /* ขอบเขตของภาพวาดที่หมุนแล้ว (AABB) — ให้กรอบรวมครอบชิ้นที่หมุนอยู่ด้วย */
      const rotatedAabb = (el: ParkingElem): Rect => {
        const r = visual(el)
        const rad = ((el.rotation ?? 0) * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const ecx = el.x + el.w / 2
        const ecy = el.y + el.h / 2
        const pts = [
          [r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h],
        ].map(([px, py]) => {
          const dx = px - ecx
          const dy = py - ecy
          return { x: ecx + dx * cos - dy * sin, y: ecy + dx * sin + dy * cos }
        })
        const xs = pts.map((p) => p.x)
        const ys = pts.map((p) => p.y)
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          w: Math.max(...xs) - Math.min(...xs),
          h: Math.max(...ys) - Math.min(...ys),
        }
      }
      const rects = selectedElems.map(rotatedAabb)
      const minX = Math.min(...rects.map((r) => r.x))
      const minY = Math.min(...rects.map((r) => r.y))
      const maxX = Math.max(...rects.map((r) => r.x + r.w))
      const maxY = Math.max(...rects.map((r) => r.y + r.h))
      selBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
  }

  /* ตำแหน่งป้ายขนาด: ใต้กรอบที่ครอบ element ที่หมุนแล้ว (axis-aligned) */
  let badge: { left: number; top: number; text: string } | null = null
  if (selBox) {
    const rad = (selRot * Math.PI) / 180
    const aabbH = Math.abs(selBox.w * Math.sin(rad)) + Math.abs(selBox.h * Math.cos(rad))
    const cxScreen = (selBox.x + selBox.w / 2) * zoom + pan.x
    const cyScreen = (selBox.y + selBox.h / 2) * zoom + pan.y
    /* มีปุ่มหมุนอยู่ใต้กรอบ → เลื่อนป้ายลงต่ำกว่าปุ่ม ไม่ให้ทับกัน */
    const badgeGap = showRotate ? 8 + ROTATE_HANDLE_GAP + ROTATE_HANDLE_SIZE : 8
    badge = {
      left: cxScreen,
      top: cyScreen + (aabbH * zoom) / 2 + badgeGap,
      /* ตอนกำลังหมุนให้โชว์องศาแทนขนาด (หมุนทั้งก้อน = มุมที่หมุนสะสม) */
      text: isRotating
        ? `${Math.round(singleSel ? selRot : (((rotating.current?.delta ?? 0) % 360) + 360) % 360)}°`
        : `${Math.round(selBox.w)} × ${Math.round(selBox.h)}`,
    }
  }

  const userInfo = useUserInfo()

  const currentFloorName = floors.find((f) => f.id === activeFloorId)?.name

  /* Focus ที่ตรง preset → ซ่อนจุดจับขอบ เหลือแต่มุม (ยืดแบบคงสัดส่วน) */
  const focusLocked = !!singleSel && singleSel.tool === 'focus' && !!focusPresetOf(singleSel)
  const focusPresetLabel = focusElem ? focusPresetOf(focusElem)?.id : undefined

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-50 box-border flex select-none overflow-hidden bg-page text-xs text-ink font-sans">

      {/* ══════════════ A: ICON RAIL ══════════════ */}
      <div className={`${card} w-16 min-w-[64px] shrink-0 items-center bg-page pt-4 pb-4 border-r border-line`}>
        <button
          onClick={handleDiscard}
          title={t('editLayout.back')}
          aria-label={t('editLayout.backToParking')}
          className={`flex h-10 w-10 items-center justify-center rounded-[10px] bg-transparent text-ink ${hoverBg}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="mb-6 mt-3 h-px w-9 bg-line" />

        {navItems.map(({ id, label, Icon }) => {
          const active = activeNav === id
          return (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              title={label}
              aria-label={label}
              className={`mb-5 flex h-14 w-14 flex-col items-center justify-center gap-1.5 rounded-lg bg-transparent ${active
                ? 'text-brand'
                : `text-ink-2 hover:text-ink`
                }`}
            >
              <Icon />
              <span className="text-[11px] leading-none">{label}</span>
            </button>
          )
        })}

        <div className="mt-auto flex flex-col items-center">
          <div className="mb-3 h-px w-9 bg-line" />
          <UserAvatar online_check={true}
            char_name={userInfo?.first_name?.slice(0, 1).toUpperCase()}
            gradient_color={userInfo?.avatar_color}
          />
        </div>
      </div>

      {/* ══════════════ B: LEFT PANEL ══════════════ */}
      <div className={`${card} w-[240px] min-w-[240px] shrink-0 border-r border-line bg-page`}>
        <div className="flex h-[54px] shrink-0 items-center border-b border-line px-4">
          <span className="block whitespace-nowrap text-[16px] leading-none text-ink">
            {t('editLayout.title')}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Floors */}
          <div>
            <button onClick={() => setFloorsOpen((v) => !v)} className={`${sectionBtn} border-b border-line`}>
              <Caret open={floorsOpen} />
              <span className="flex-1 text-left">{t('editLayout.floors')}</span>
              <span className="text-[13px] text-ink">{floors.length}</span>
            </button>

            {floorsOpen && (
              <div className="pb-4 pt-1">
                {floors.map((f) => {
                  const fSlots = (elements[f.id] || []).filter((e) => e.tool === 'slot').length
                  const isActive = activeFloorId === f.id
                  const metaText = `${t('editLayout.slotsCount', { count: fSlots })}${!f.visible ? ' · ' + t('editLayout.hidden') : isActive ? ' · ' + t('editLayout.editing') : ''}`
                  const isOver = floorOver?.id === f.id && floorDragId !== f.id
                  const isRenaming = renamingFloorId === f.id
                  return (
                    <div
                      key={f.id}
                      draggable={!isRenaming}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', f.id)
                        setFloorDragId(f.id)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        const r = e.currentTarget.getBoundingClientRect()
                        setFloorOver({ id: f.id, above: e.clientY < r.top + r.height / 2 })
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (floorDragId && floorOver) moveFloor(floorDragId, floorOver.id, floorOver.above)
                        setFloorDragId(null)
                        setFloorOver(null)
                      }}
                      onDragEnd={() => { setFloorDragId(null); setFloorOver(null) }}
                      onClick={() => { setActiveFloorId(f.id); setSelectedIds([]) }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setActiveFloorId(f.id); setSelectedIds([]) } }}
                      className={`group box-border flex h-10 w-full items-center gap-3 border-y-2 border-transparent px-4 ${hoverBg}
                        ${isOver ? (floorOver!.above ? '!border-t-brand' : '!border-b-brand') : ''}
                        ${floorDragId === f.id ? 'opacity-40' : ''}
                        ${isActive ? 'text-brand' : f.visible ? 'text-ink' : 'text-ink-3'}`}
                    >
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          maxLength={20}
                          onChange={(e) => { setRenameValue(e.target.value); setRenameError(false) }}
                          onFocus={(e) => e.currentTarget.select()}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation() // กันไม่ให้ Enter/Space ไปโดน onKeyDown ของแถว
                            if (e.key === 'Enter') commitRename()
                            if (e.key === 'Escape') cancelRename()
                          }}
                          onBlur={() => { if (!commitRename()) cancelRename() }}
                          className={`h-7 min-w-0 flex-1 select-text box-border rounded border bg-surface px-2 text-[14px] text-ink outline-none ${
                            renameError ? 'border-red-500' : 'border-brand'
                          }`}
                        />
                      ) : (
                        <span
                          className="flex-1 truncate text-left text-[14px]"
                          onDoubleClick={(e) => { e.stopPropagation(); startRename(f) }}
                          title={t('editLayout.doubleClickRename')}
                        >
                          {f.name}
                        </span>
                      )}
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-3">
                        {metaText}
                      </span>
                      {floors.length > 1 && (
                        <button
                          type="button"
                          title={t('editLayout.deleteFloor')}
                          aria-label={t('editLayout.deleteFloorName', { name: f.name })}
                          onClick={(ev) => { ev.stopPropagation(); deleteFloor(f.id) }}
                          className="flex shrink-0 items-center bg-transparent p-0 text-ink-3 hover:text-red-500"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  )
                })}

                {addingFloor ? (
                  <div className="mt-4 px-4">
                    <label className={lbl}>{t('editLayout.floorName')}</label>
                    <input
                      autoFocus
                      value={newFloorName}
                      maxLength={20}
                      onChange={(e) => { setNewFloorName(e.target.value); setFloorError('') }}
                      onFocus={(e) => e.currentTarget.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmAddFloor()
                        if (e.key === 'Escape') { e.stopPropagation(); cancelAddFloor() }
                      }}
                      className={inp}
                    />
                    {floorError && <p className="mt-1.5 text-[11px] text-red-500">{floorError}</p>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={confirmAddFloor} className="h-8 flex-1 rounded-full bg-brand text-[12px] font-medium text-on-brand hover:opacity-90">
                        {t('editLayout.create')}
                      </button>
                      <button onClick={cancelAddFloor} className={pillBtn}>
                        {t('editLayout.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex gap-2 px-4">
                      <button
                        onClick={startAddFloor}
                        disabled={floorLimitReached}
                        className={`${pillBtn} disabled:opacity-40`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.0355 11.5177C22.0355 17.3265 17.3265 22.0355 11.5177 22.0355C5.70895 22.0355 1 17.3265 1 11.5177C1 5.70895 5.70895 1 11.5177 1C17.3265 1 22.0355 5.70895 22.0355 11.5177Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                          <path d="M7.31055 11.5176H15.7247" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                          <path d="M11.5176 7.31055V15.7247" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                        </svg>
                        {t('editLayout.addFloor')}
                      </button>
                      <button
                        onClick={duplicateFloor}
                        disabled={floorLimitReached}
                        className={`${pillBtn} disabled:opacity-40`}
                      >
                        <Copy size={14} /> {t('editLayout.duplicate')}
                      </button>
                    </div>
                    {floorLimitReached && (
                      <p className="mt-2 px-4 text-[11px] text-ink-3">{t('editLayout.maxFloorsHint', { max: MAX_FLOORS })}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tool box */}
          <div>
            <button onClick={() => setToolboxOpen((v) => !v)} className={`${sectionBtn} border-y border-line`}>
              <Caret open={toolboxOpen} />
              {t('editLayout.toolBox')}
            </button>

            {toolboxOpen && (
              <div className="px-4 py-4">
                <div className="grid grid-cols-3 gap-2">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon
                    const active = canvasMode === MODE_PLACE && placeTool === tool.id
                    return (
                      <button
                        key={tool.id}
                        onClick={() => (active ? activateSelect() : activatePlacement(tool.id))}
                        className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-md text-[11px] transition-colors duration-100 ${active
                          ? 'border border-brand bg-brand text-on-brand'
                          : `border border-line bg-surface text-ink ${hoverBg}`
                          }`}
                      >
                        <span className="flex h-[22px] items-center justify-center">
                          <Icon size={22} color="currentColor" />
                        </span>
                        {t('editLayout.tools.' + tool.id)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Layers — tree: zone เป็น parent, element ที่อยู่ใน zone ย่อหน้าเป็นลูก
              แถว "Focus" อยู่ล่างสุดเสมอ ลบ/ซ่อนไม่ได้ */}
          <div>
            <button onClick={() => setLayersOpen((v) => !v)} className={`${sectionBtn} border-y border-line`}>
              <Caret open={layersOpen} />
              <span className="flex-1 text-left">{t('editLayout.layers')}</span>
              <span className="text-[13px] text-ink">{realLayerCount}</span>
            </button>

            {layersOpen && (
              <div className="pb-4 pt-1">
                {realLayerCount === 0 && (
                  <p className="px-4 py-3 text-[12px] text-ink-3">{t('editLayout.noLayers')}</p>
                )}

                {layerTree.roots.map((el) => renderLayerRow(el, 0))}

                {focusElem && (
                  <div
                    onClick={() => setSelectedIds([focusElem.id])}
                    title={t('editLayout.focusLayerTitle')}
                    className={`box-border flex h-9 w-full items-center gap-2 border-y-2 border-transparent px-4 ${
                      selectedIds.includes(focusElem.id) ? 'bg-brand/10 text-brand' : 'text-ink'
                    } ${hoverBg}`}
                  >
                    <span className="h-4 w-3 shrink-0" />
                    <Focus size={14} strokeWidth={1.75} className="shrink-0" />
                    <span className="flex-1 truncate text-left text-[13px]">{t('editLayout.focus')}</span>
                    <span className="shrink-0 text-[11px] text-ink-3">{t('editLayout.focusLocked')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 p-4">
          <div className="relative">
            <input
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder={t('editLayout.searchTools')}
              aria-label={t('editLayout.searchTools')}
              className="box-border h-10 w-full rounded-full border border-line bg-surface pl-4 pr-10 text-[12px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
            />
            <Search size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          </div>
        </div>
      </div>

      {/* ══════════════ C: CANVAS CARD ══════════════ */}
      <div className={`${card} flex-1 bg-surface`}>
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-page px-4">
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={!hist.past.length} title={t('editLayout.undoTitle')} aria-label={t('editLayout.undo')} className={iconBtn}>
              <Undo2 size={16} />
            </button>
            <button onClick={redo} disabled={!hist.future.length} title={t('editLayout.redoTitle')} aria-label={t('editLayout.redo')} className={iconBtn}>
              <Redo2 size={16} />
            </button>

            <div className="mx-2 h-6 w-px bg-line" />

            <ToolbarToggle on={effectiveMode === MODE_SELECT} onClick={activateSelect} title={t('editLayout.selectTitle')} label={t('editLayout.selectTool')}>
              <MousePointer2 size={16} />
            </ToolbarToggle>

            <ToolbarToggle on={effectiveMode === MODE_PAN} onClick={activatePan} title={t('editLayout.panTitle')} label={t('editLayout.panTool')}>
              <Hand size={16} />
            </ToolbarToggle>

            <div className="mx-2 h-6 w-px bg-line" />

            <button onClick={copySelected} disabled={!selectedIds.length} title={t('editLayout.copyTitle')} aria-label={t('editLayout.copy')} className={iconBtn}>
              <Copy size={16} />
            </button>
            <button onClick={pasteClipboard} disabled={!hasClipboard} title={t('editLayout.pasteTitle')} aria-label={t('editLayout.paste')} className={iconBtn}>
              <Clipboard size={16} />
            </button>

            <div className="mx-2 h-6 w-px bg-line" />
          </div>

          <div className="flex items-center gap-1">
            <button onClick={zoomOut} title={t('editLayout.zoomOut')} aria-label={t('editLayout.zoomOut')} className={iconBtn}>
              <Minus size={16} />
            </button>
            <span className="min-w-[52px] text-center text-[13px] text-ink">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} title={t('editLayout.zoomIn')} aria-label={t('editLayout.zoomIn')} className={iconBtn}>
              <Plus size={16} />
            </button>
            <button onClick={resetZoom} title={t('editLayout.fitScreen')} aria-label={t('editLayout.fitScreen')} className={`${iconBtn} ml-2`}>
              <Maximize size={16} />
            </button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className={`canvas-bg relative flex-1 overflow-hidden bg-surface ${canvasCursorClass}`}
          style={resizeCursor ? { cursor: resizeCursor } : undefined}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseEnter={() => setCursorOverCanvas(true)}
          onMouseLeave={() => { setCursorOverCanvas(false); handleCanvasMouseUp() }}
          onWheel={handleWheel}
        >
          {/* pan/zoom values are dynamic, so they stay inline */}
          <div
            className="absolute origin-top-left"
            style={{ left: pan.x, top: pan.y, transform: `scale(${zoom})` }}
          >
            {activeFloorVisible && visibleElems.map((elem) => (
              <div
                key={elem.id}
                data-elem-id={elem.id}
                className="absolute"
                style={{ left: elem.x, top: elem.y, width: elem.w, height: elem.h }}
              >
                <ParkingElement
                  elem={elem}
                  selected={selectedIds.includes(elem.id)}
                  onBounds={handleBounds}
                  onSelect={() => { }}
                  onDragStart={(e, id) => {
                    if (canvasMode !== MODE_SELECT) return
                    const sid = String(id)
                    const additive = e.shiftKey || e.ctrlKey || e.metaKey
                    if (additive) {
                      setSelectedIds((prev) => (prev.includes(sid) ? prev.filter((i) => i !== sid) : [...prev, sid]))
                    } else if (!selectedIds.includes(sid)) {
                      setSelectedIds([sid])
                    }
                    const cv = toCanvas(e.clientX, e.clientY)
                    dragOffset.current = { x: cv.x - elem.x, y: cv.y - elem.y }
                    dragging.current = sid
                    dragPushed.current = false
                  }}
                />
              </div>
            ))}
            {previewElem && (
              <div
                className="pointer-events-none absolute opacity-60"
                style={{ left: previewElem.x, top: previewElem.y, width: previewElem.w, height: previewElem.h }}
              >
                <ParkingElement elem={previewElem} readOnly />
              </div>
            )}

            {/* Focus — กรอบเส้นประ + ส่วนนอกกรอบมืดลง (นอกกรอบ = ไม่แสดงในหน้า Parking Layout) */}
            {activeFloorVisible && focusElem && (
              <div
                className="pointer-events-none absolute z-[2] box-border border-brand"
                style={{
                  left: focusElem.x,
                  top: focusElem.y,
                  width: focusElem.w,
                  height: focusElem.h,
                  borderStyle: 'dashed',
                  borderWidth: 1.5 / zoom,
                  boxShadow: '0 0 0 100000px rgba(0,0,0,0.07)',
                }}
              />
            )}
          </div>

          {/* ป้ายชื่อ Focus — คลิกเพื่อเลือกกรอบ (แล้วลากจุดจับยืดหด / แก้ค่าในแผง Property) */}
          {activeFloorVisible && focusElem && (
            <div
              onMouseDown={(e) => {
                if (e.button !== 0) return
                e.stopPropagation()
                if (effectiveMode !== MODE_SELECT) return
                setSelectedIds([focusElem.id])
              }}
              className="absolute z-[5] flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-[4px] bg-brand px-1.5 py-[3px] text-[11px] font-medium leading-none text-on-brand"
              style={{ left: focusElem.x * zoom + pan.x, top: focusElem.y * zoom + pan.y - 22 }}
            >
              <Focus size={11} strokeWidth={2} />
              {t('editLayout.focus')} · {pxToM(focusElem.w)} × {pxToM(focusElem.h)} m{focusPresetLabel ? ` · ${focusPresetLabel}` : ''}
            </div>
          )}

          {/* hover ของ zone ตอนลาก object เข้ามา — บอกว่าปล่อยแล้วจะเข้าไปอยู่ใน zone นี้ */}
          {dropZone && activeFloorVisible && (
            <>
              <div
                className="pointer-events-none absolute z-[3] box-border rounded-[2px] border-[3px] border-brand bg-brand/20  outline-brand/50"
                style={{
                  left: dropZone.x * zoom + pan.x,
                  top: dropZone.y * zoom + pan.y,
                  width: dropZone.w * zoom,
                  height: dropZone.h * zoom,
                  transform: dropZone.rotation ? `rotate(${dropZone.rotation}deg)` : undefined,
                  transformOrigin: 'center center',
                }}
              />
              <div
                className="pointer-events-none absolute z-[6] whitespace-nowrap rounded-[4px] bg-brand px-1.5 py-[3px] text-[11px] font-medium leading-none text-on-brand"
                style={{
                  left: dropZone.x * zoom + pan.x,
                  top: dropZone.y * zoom + pan.y - 22,
                }}
              >
                {t('editLayout.addToZone', { zone: dropZone.label || t('editLayout.fZone') })}
              </div>
            </>
          )}

          {rbBox && (
            <div
              className="pointer-events-none absolute border-[1.5px] border-brand bg-brand/10"
              style={{
                left: rbBox.x * zoom + pan.x,
                top: rbBox.y * zoom + pan.y,
                width: rbBox.w * zoom,
                height: rbBox.h * zoom,
              }}
            />
          )}

          {/* selection overlay แบบ Figma: กรอบ + จุดจับมุม + ขอบจับได้ + ป้ายขนาด */}
          {selBox && (
            <>
              <div
                className="pointer-events-none absolute"
                style={{
                  left: selBox.x * zoom + pan.x,
                  top: selBox.y * zoom + pan.y,
                  width: selBox.w * zoom,
                  height: selBox.h * zoom,
                  transform: selRot ? `rotate(${selRot}deg)` : undefined,
                  transformOrigin: 'center center',
                }}
              >
                {/* เส้นกรอบ */}
                <div className="pointer-events-none absolute inset-0 box-border border border-brand" />

                {/* ปุ่มหมุน — วงกลมใต้กึ่งกลางขอบล่าง หมุนไปพร้อมกรอบ (เหมือน Canva)
                    ชิ้นเดียว = หมุนชิ้นนั้น / หลายชิ้น = หมุนทั้งก้อนรอบจุดกึ่งกลางกรอบรวม */}
                {showRotate && (
                  <div
                    onMouseDown={(e) => (singleSel ? startRotate(e, singleSel) : startGroupRotate(e, selBox!))}
                    title={t('editLayout.rotateTitle')}
                    aria-label={t('editLayout.rotate')}
                    className="pointer-events-auto absolute z-[5] box-border flex items-center justify-center rounded-full border border-line bg-white text-neutral-700 shadow-sm hover:bg-neutral-100"
                    style={{
                      left: '50%',
                      top: '100%',
                      width: ROTATE_HANDLE_SIZE,
                      height: ROTATE_HANDLE_SIZE,
                      marginTop: ROTATE_HANDLE_GAP,
                      transform: 'translateX(-50%)',
                      cursor: isRotating ? 'grabbing' : 'grab',
                    }}
                  >
                    <RefreshCw size={13} strokeWidth={2} />
                  </div>
                )}

                {singleSel && canResize && (
                  <>
                    {/* ขอบ 4 ด้าน — จับลากยืดทีละด้าน (โปร่งใส เหมือน Figma)
                        Focus ที่ล็อกสัดส่วนไม่มีจุดจับขอบ (ยืดได้เฉพาะมุม) */}
                    {!focusLocked && EDGES.map((h) => (
                      <div
                        key={h}
                        onMouseDown={(e) => startResize(e, h, singleSel)}
                        className="pointer-events-auto absolute z-[4]"
                        style={{ ...EDGE_POS[h], cursor: HANDLE_CURSOR[h] }}
                      />
                    ))}
                    {/* มุม 4 จุด — สี่เหลี่ยมเล็กขอบน้ำเงิน พื้นขาว */}
                    {CORNERS.map((h) => (
                      <div
                        key={h}
                        onMouseDown={(e) => startResize(e, h, singleSel)}
                        className="pointer-events-auto absolute z-[5] box-border h-2 w-2 border border-brand bg-white"
                        style={{
                          ...CORNER_POS[h],
                          transform: 'translate(-50%, -50%)',
                          cursor: HANDLE_CURSOR[h],
                        }}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* ป้ายขนาด W × H */}
              {badge && (
                <div
                  className="pointer-events-none absolute z-[6] whitespace-nowrap rounded-[4px] bg-brand px-1.5 py-[3px] text-[11px] font-medium leading-none text-on-brand"
                  style={{ left: badge.left, top: badge.top, transform: 'translateX(-50%)' }}
                >
                  {badge.text}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex h-7 shrink-0 items-center justify-between border-t border-line bg-page px-4 text-[11px] text-ink-2">
          <span>
            {currentFloorName ?? '\u2014'}
            {'\u00a0\u00a0\u00b7\u00a0\u00a0'}
            {slotCount}{' ' + t('editLayout.carSlots')}
            {'\u00a0\u00a0\u00b7\u00a0\u00a0'}
            {motoCount}{' ' + t('editLayout.motoBays')}
            {'\u00a0\u00a0\u00b7\u00a0\u00a0'}
            {t('editLayout.snapOn', { size: snapM + '\u202fm' })}
            {selectedIds.length > 1 && ` · ${t('editLayout.nSelected', { count: selectedIds.length })}`}
            {canvasMode === MODE_PLACE && ` · ${t(['lane', 'zone'].includes(placeTool) ? 'editLayout.placeHintDraw' : 'editLayout.placeHint')}`}
          </span>
          <span className="flex items-center gap-4">
            <span>{'X\u00a0'}{(cursorPos.x * SCALE).toFixed(1)}{'\u202fm'}</span>
            <span>{'Y\u00a0'}{(cursorPos.y * SCALE).toFixed(1)}{'\u202fm'}</span>
            <span>{t('editLayout.zoomLabel') + '\u00a0'}{Math.round(zoom * 100)}{'%'}</span>
          </span>
        </div>
      </div>

      {/* ══════════════ D: RIGHT PROPERTY PANEL ══════════════ */}
      <div className={`${card} w-[280px] min-w-[280px] shrink-0 border-l border-line bg-page`}>
        <div className="shrink-0 px-4 pb-4 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={handleSave}
              className="h-10 flex-1 rounded-full bg-brand text-[14px] font-medium text-on-brand hover:opacity-90"
            >
              {t('editLayout.save')}
            </button>
            <button
              onClick={handleDiscard}
              className={`h-10 flex-none rounded-full border border-line bg-surface px-5 text-[14px] text-ink ${hoverBg}`}
            >
              {t('editLayout.discard')}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-green-500" />
              <span className="whitespace-nowrap text-[11px] text-ink-2">{autoSaveLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex h-[54px] shrink-0 items-center border-y border-line px-4">
          <span className="text-[16px] text-ink">{t('editLayout.property')}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!panelElem ? (
            /* ไม่ได้เลือก / เลือกคนละชนิด → ไม่แสดงฟิลด์ */
            <div className="mt-4">
              <p className="text-[12px] leading-normal text-ink-2">
                {selectedIds.length > 1
                  ? t('editLayout.elementsSelected', { count: selectedIds.length })
                  : t('editLayout.clickToEdit')}
              </p>
              {selectedIds.length > 1 && (
                <p className="mt-1 text-[11px] leading-normal text-ink-3">
                  {t('editLayout.selectSameType')}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-5">
              <div>
                <p className="m-0 text-[15px] font-medium leading-[1.4] text-ink">
                  {multi
                    ? `${panelToolLabel} · ${t('editLayout.nSelected', { count: panelElems.length })}`
                    : panelElem.tool === 'slot'
                      ? t('editLayout.parkingSlot', { id: panelElem.slotId || panelElem.label })
                      : panelElem.tool === 'focus'
                        ? t('editLayout.focus')
                        : panelElem.label}
                </p>
                {panelElem.tool === 'slot' && (
                  <p className="mt-1 text-[11px] text-ink-3">
                    {t('editLayout.nSelected', { count: panelElems.length })} &nbsp;&middot;&nbsp; {currentFloorName} &nbsp;&middot;&nbsp; {t('editLayout.zoneName', { zone: mixedOf((e) => e.zone) ? t('editLayout.mixed') : panelElem.zone || 'A' })}
                  </p>
                )}
                {multi && panelElem.tool !== 'slot' && (
                  <p className="mt-1 text-[11px] leading-normal text-ink-3">
                    {t('editLayout.changesApplyAll', { tool: panelToolLabel })}
                  </p>
                )}
                {panelElem.tool === 'focus' && (
                  <p className="mt-1 text-[11px] leading-normal text-ink-3">
                    {t('editLayout.focusDesc')}
                  </p>
                )}
              </div>

              {variantOptions && (
                <Field label={t('editLayout.fVariant')}>
                  <SelectWrap
                    value={canonicalVariant(panelElem.tool, panelElem.variant)}
                    mixed={mixedOf((e) => canonicalVariant(e.tool, e.variant))}
                    onChange={(v) => updateSelected({ variant: v })}
                  >
                    {variantOptions.map((variant) => (
                      <option key={variant} value={variant}>
                        {t('editLayout.variants.' + variant.replace('-', '_'))}
                      </option>
                    ))}
                  </SelectWrap>
                </Field>
              )}

              {panelElem.tool === 'slot' && (
                <>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                    {/* Slot ID / X / Y ไม่ซ้ำกันได้ → แก้ได้เฉพาะตอนเลือกชิ้นเดียว */}
                    {!multi && (
                      <Field label={t('editLayout.fSlotId')}>
                        <input value={panelElem.slotId ?? ''} onChange={(e) => updateSelected({ slotId: e.target.value })} className={inp} />
                      </Field>
                    )}
                    <Field label={t('editLayout.fType')}>
                      <SelectWrap
                        value={panelElem.type ?? 'General'}
                        mixed={mixedOf((e) => e.type ?? 'General')}
                        onChange={(v) => updateSelected({ type: v })}
                      >
                        <option value="General">{t('editLayout.types.general')}</option>
                        <option value="VIP">{t('editLayout.types.vip')}</option>
                        <option value="Handicap">{t('editLayout.types.handicap')}</option>
                        <option value="EV">{t('editLayout.types.ev')}</option>
                      </SelectWrap>
                    </Field>

                    {!multi && (
                      <>
                        <NumField label="X" unit="m" value={pxToM(panelElem.x)} onChange={(v) => updateSelected({ x: mToPx(v) })} />
                        <NumField label="Y" unit="m" value={pxToM(panelElem.y)} onChange={(v) => updateSelected({ y: mToPx(v) })} />
                      </>
                    )}

                    <NumField label={t('editLayout.fWidth')} unit="m" value={pxToM(panelElem.w)} mixed={mixedOf((e) => e.w)} onChange={(v) => updateSelected({ w: Math.max(1, mToPx(v)) })} />
                    <NumField label={t('editLayout.fLength')} unit="m" value={pxToM(panelElem.h)} mixed={mixedOf((e) => e.h)} onChange={(v) => updateSelected({ h: Math.max(1, mToPx(v)) })} />

                    <NumField label={t('editLayout.fRotation')} unit="°" value={panelElem.rotation ?? 0} mixed={mixedOf((e) => e.rotation ?? 0)} onChange={(v) => updateSelected({ rotation: v })} />
                    <Field label={t('editLayout.fZone')}>
                      <input
                        value={mixedOf((e) => e.zone) ? '' : panelElem.zone ?? ''}
                        onChange={(e) => updateSelected({ zone: e.target.value })}
                        placeholder={mixedOf((e) => e.zone) ? t('editLayout.mixed') : 'A North'}
                        className={inp}
                      />
                    </Field>

                    <Field label={t('editLayout.fRate')}>
                      <input
                        value={mixedOf((e) => e.rate) ? '' : panelElem.rate ?? ''}
                        onChange={(e) => updateSelected({ rate: e.target.value })}
                        placeholder={mixedOf((e) => e.rate) ? t('editLayout.mixed') : t('editLayout.ratePlaceholder')}
                        className={inp}
                      />
                    </Field>
                    <Field label={t('editLayout.fSensor')}>
                      <input
                        value={mixedOf((e) => e.sensor) ? '' : panelElem.sensor ?? ''}
                        onChange={(e) => updateSelected({ sensor: e.target.value })}
                        placeholder={mixedOf((e) => e.sensor) ? t('editLayout.mixed') : 'SN-0A25'}
                        className={inp}
                      />
                    </Field>
                  </div>

                  <div>
                    <label className={lbl}>{t('editLayout.fStatus')}</label>
                    <div className="flex gap-1 rounded-lg bg-[var(--status-bg)] p-1">
                      {[
                        { key: 'active', label: t('editLayout.status.active') },
                        { key: 'reserved', label: t('editLayout.status.reserved') },
                        { key: 'closed', label: t('editLayout.status.closed') },
                      ].map(({ key, label }) => {
                        const on = !mixedOf((e) => e.status) && panelElem.status === key
                        return (
                          <button
                            key={key}
                            onClick={() => updateSelected({ status: key })}
                            className={`h-7 flex-1 rounded-md text-[12px] transition-colors duration-100 ${on
                              ? 'bg-brand font-medium text-on-brand'
                              : 'bg-transparent text-ink-2 hover:text-ink'
                              }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-md border border-dashed border-line bg-transparent px-3 py-2.5">
                    <p className="text-[11px] leading-normal text-ink-2">
                      {t('editLayout.autoNumberHint')}
                    </p>
                  </div>
                </>
              )}

              {panelElem.tool === 'text' && (
                <Field label={t('editLayout.fText')}>
                  <input
                    value={mixedOf((e) => e.label) ? '' : panelElem.label ?? ''}
                    placeholder={mixedOf((e) => e.label) ? t('editLayout.mixed') : undefined}
                    onChange={(e) => updateSelected({ label: e.target.value })}
                    className={inp}
                  />
                </Field>
              )}

              {/* Focus: เลือกขนาดจอจาก dropdown (ล็อกสัดส่วน) */}
              {panelElem.tool === 'focus' && (
                <Field label={t('editLayout.screenSize')}>
                  <SelectWrap
                    value={focusPresetId(panelElem)}
                    onChange={(v) => {
                      const p = FOCUS_PRESETS.find((x) => x.id === v)
                      if (!p) return
                      updateSelected(fitFocusToPreset(panelElem.w, p))
                    }}
                  >
                    {!focusPresetOf(panelElem) && <option value="custom">{t('editLayout.custom')}</option>}
                    {FOCUS_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </SelectWrap>
                </Field>
              )}

              {panelElem.tool !== 'slot' && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                  {/* X / Y: หลายชิ้นตั้งค่าเดียวกันไม่ได้ (จะซ้อนกัน) → เฉพาะเลือกชิ้นเดียว */}
                  {!multi && (
                    <>
                      <NumField label="X" unit="m" value={pxToM(panelElem.x)} onChange={(v) => updateSelected({ x: mToPx(v) })} />
                      <NumField label="Y" unit="m" value={pxToM(panelElem.y)} onChange={(v) => updateSelected({ y: mToPx(v) })} />
                    </>
                  )}
                  <NumField
                    label={t('editLayout.fWidth')} unit="m" value={pxToM(panelElem.w)}
                    mixed={mixedOf((e) => e.w)}
                    onChange={(v) => {
                      if (panelElem.tool !== 'focus') return updateSelected({ w: Math.max(1, mToPx(v)) })
                      const p = focusPresetOf(panelElem)
                      /* มี preset → ปรับความสูงตามสัดส่วนให้อัตโนมัติ */
                      updateSelected(p ? fitFocusToPreset(mToPx(v), p) : { w: Math.max(FOCUS_MIN, mToPx(v)) })
                    }}
                  />
                  <NumField
                    label={t('editLayout.fHeight')} unit="m" value={pxToM(panelElem.h)}
                    mixed={mixedOf((e) => e.h)}
                    readOnly={panelElem.tool === 'focus' && !!focusPresetOf(panelElem)}
                    onChange={(v) => updateSelected({ h: Math.max(panelElem.tool === 'focus' ? FOCUS_MIN : 1, mToPx(v)) })}
                  />
                  {panelElem.tool !== 'focus' && (
                    <NumField
                      label={t('editLayout.fRotation')} unit="°" value={panelElem.rotation ?? 0}
                      mixed={mixedOf((e) => e.rotation ?? 0)}
                      onChange={(v) => updateSelected({ rotation: v })}
                    />
                  )}
                  {panelElem.tool === 'zone' ? (
                    /* Zone: ชื่อช่องเป็น "Zone" เลือกได้ A – Z ตัวอักษรเดียว (เก็บลง label เป็น "Zone X") */
                    <Field label={t('editLayout.fZone')}>
                      <SelectWrap
                        value={zoneLetterOf(panelElem.label)}
                        mixed={mixedOf((e) => zoneLetterOf(e.label))}
                        onChange={(v) => updateSelected({ label: `Zone ${v}` })}
                      >
                        {/* ข้อมูลเก่าที่ยังไม่มีตัวอักษร (เช่น label = "Zone") */}
                        {!ZONE_LETTERS.includes(zoneLetterOf(panelElem.label)) && (
                          <option value={zoneLetterOf(panelElem.label)}>{t('editLayout.select')}</option>
                        )}
                        {ZONE_LETTERS.map((ch) => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </SelectWrap>
                    </Field>
                  ) : panelElem.tool !== 'text' && panelElem.tool !== 'focus' && (
                    <Field label={t('editLayout.fLabel')}>
                      <input
                        value={mixedOf((e) => e.label) ? '' : panelElem.label ?? ''}
                        placeholder={mixedOf((e) => e.label) ? t('editLayout.mixed') : undefined}
                        onChange={(e) => updateSelected({ label: e.target.value })}
                        className={inp}
                      />
                    </Field>
                  )}
                </div>
              )}

              {HARDWARE_TOOLS.includes(panelElem.tool) && (
                <Field label={t('editLayout.fHardware')}>
                  <SelectWrap
                    value={panelElem.hardware ?? ''}
                    mixed={mixedOf((e) => e.hardware ?? '')}
                    onChange={(v) => updateSelected({ hardware: v })}
                  >
                    <option value="">{t('editLayout.hardwareNone')}</option>
                    {(HARDWARE_OPTIONS[panelElem.tool] ?? []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </SelectWrap>
                </Field>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}