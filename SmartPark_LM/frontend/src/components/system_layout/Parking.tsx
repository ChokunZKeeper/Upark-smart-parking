<<<<<<< HEAD
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  useLayoutEffect,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { Icon } from '@iconify/react'
import Navbar from '@/components/system_layout/layout/Navbar'
import Segmented from '@/components/system_layout/layout/Segmented'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import PillSelect from '@/styles/Dropdown'
// mock data (floors / layout / stats) ถูกล้างออกแล้ว เหลือแค่ตัวเลือก filter ของ Segmented
import { parkingFilters } from '@/services/data/mockData'
// ⚠️ adjust these two paths to where the files live in your project
import { getSaved, subscribe } from '@/services/data/parkingStore'
import {
  ParkingCanvasView,
  elementsInZone,
  type ParkingElementData,
  type CameraRect,
} from '@/components/system_layout/ParkingCanvas'
import carImg from '@/assets/logos/Car_white.png'
import carImgdark from "@/assets/logos/Car_black.png"
import { useNavigate, useParams } from 'react-router-dom'
import { canEdit } from '@/constants/viewAs'
import { useT, type TFunction } from '@/i18n'

=======
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'
import Segmented from '@/components/system_layout/layout/Segmented'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import { floors, getParkingLayout, parkingFilters, parkingStatsByFloor } from '@/types/_mockData'
import carImg from '@/assets/logos/Car_white.png'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
/* ---------- Types ---------- */

type SlotStatus = 'occupied' | 'available' | 'offline'
type ParkingFilter = 'all' | SlotStatus
type SlotPosition = 'top' | 'bottom'

// ตำแหน่งของ block ในผังชั้น: t/b = บน/ล่าง, l/m/r = ซ้าย/กลาง/ขวา
type BlockKey = 'tl' | 'tm' | 'tr' | 'bl' | 'bm' | 'br'

interface ParkingSlot {
  id: string
  status: SlotStatus
}

interface ParkingBlock {
  key: BlockKey
  top: ParkingSlot[]
  bottom: ParkingSlot[]
}

interface ParkingStats {
  total: number | null
  occupied: number | null
  available: number | null
  offline: number | null
}

interface Metrics {
  slotW: number
  slotH: number
  carH: number
  font: number
  bang: number
  dot: number
  padY: number
  pull: number
}

<<<<<<< HEAD
type SlotContextMenuHandler = (e: MouseEvent, slot: ParkingSlot) => void

interface SlotMenuState {
  x: number
  y: number
  slot: ParkingSlot
}

type MenuItem = {
  label: string
  icon: ReactNode
  onClick?: () => void
  danger?: boolean
  good?: boolean
  reportText?: string
}

/* layout saved from the editor (parkingStore) */
interface SavedFloor {
  id: string
  name: string
  visible: boolean
}

interface SavedLayout {
  floors: SavedFloor[]
  elements: Record<string, ParkingElementData[]>
}

interface LocationOption {
  value: string
  label: string
}

=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
/* ---------- Constants ---------- */

// zone (1-4) <-> block ในผัง
const ZONE_BLOCK_KEY: Record<number, BlockKey> = { 1: 'tl', 2: 'bl', 3: 'tm', 4: 'bm' }
const BLOCK_KEY_TO_ZONE: Partial<Record<BlockKey, number>> = { tl: 1, bl: 2, tm: 3, bm: 4 }

// ลำดับ block ในมุมมองทั้งชั้น (grid 3 คอลัมน์ x 2 แถว)
const FLOOR_GRID_ORDER: BlockKey[] = ['tl', 'tm', 'tr', 'bl', 'bm', 'br']

<<<<<<< HEAD
// RESET: ไม่มี floor / zone mock แล้ว
const LOCATION_OPTIONS: LocationOption[] = []
=======
const ZONES = [1, 2, 3, 4]

const LOCATION_OPTIONS = floors.flatMap((floor) => [
  { value: floor, label: `Floor ${floor}` },
  ...ZONES.map((zone) => ({ value: `${floor}-${zone}`, label: `Floor ${floor} - Zone ${floor}${zone}` })),
])
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

const EMPTY_STATS: ParkingStats = { total: null, occupied: null, available: null, offline: null }

const AREA_PADDING = 48 // p-6 ซ้าย + ขวา
const ZONE_VIEW_WIDTH_RATIO = 0.55 // โหมด zone: block เดียวกว้างประมาณ 55% ของกรอบ
const DEFAULT_SLOTS_PER_ROW = 6

<<<<<<< HEAD
const CUSTOM_CANVAS_HEIGHT = 480 // ความสูงขั้นต่ำของข้อความ "ไม่มี element" (px)
const ZONE_CAMERA_PAD = 24 // ตอนซูมเข้า zone: เผื่อขอบรอบ zone (หน่วยโลก px)

const FACILITY_BUTTON =
  'h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-7 text-[13.5px] text-[var(--text-secondary)] transition hover:border-[#E5E5E5] hover:bg-[#F2F2F2] hover:text-[#212121]'

// หน้าตา dropdown Floor / Zone เดิม: ใช้ ! กันชนกับ padding / สีตัวอักษรพื้นฐานของ PillSelect (pl-4 pr-8, text-[#212121])
const LOCATION_TRIGGER =
  'h-8 rounded-[7.5px] border border-[var(--border)] text-[13px] !px-7 !text-ink-2 hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]'
// panel ตอนเปิด: กว้างอย่างน้อยเท่ากล่อง (ไม่ใช้ min-w-[220px] ค่าเดิม)
const LOCATION_PANEL = 'min-w-full'

// ปุ่มใน modal Vehicle details (modal พื้นขาว จึงใช้สีคงที่แบบเดิม ไม่ผูกกับ theme)
const MODAL_BUTTON =
  'h-9 rounded-xl border border-[#d2d2d7] bg-white px-4 text-[13.5px] text-[#6f6f72] transition hover:bg-gray-50'

// เส้นคั่นใต้หัวการ์ด: Radial gradient (กลางเข้ม -> ปลายสองข้างจางหาย)
const DIVIDER_STYLE: CSSProperties = {
  background:
    'radial-gradient(ellipse closest-side at 50% 50%, var(--border) 20%, rgba(195, 195, 250, 0) 97.5%)',
}
=======
const FACILITY_BUTTON =
  'h-9 rounded-xl border border-[#d2d2d7] bg-white px-7 text-[13.5px] text-[#6f6f72] transition hover:bg-gray-50'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* ---------- Helpers ---------- */

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

// ความกว้างของช่องจอดหนึ่งช่อง ตามความกว้างพื้นที่ที่มี
const computeSlotWidth = (areaWidth: number, isZoneView: boolean, slotsPerRow: number) => {
  const usable = Math.max(0, areaWidth - AREA_PADDING)

  if (isZoneView) {
    return clamp(Math.floor((usable * ZONE_VIEW_WIDTH_RATIO) / slotsPerRow), 60, 140)
  }

  // โหมดทั้งชั้น: เผื่อช่องว่างระหว่าง block + เพดานขนาดช่อง 84px
  const totalUnits = slotsPerRow * 2 + 1 + 8
  return clamp(Math.floor(usable / totalUnits), 40, 84)
}

// ขนาดทั้งหมดคำนวณจาก slotW ค่าเดียว
const getMetrics = (slotW: number): Metrics => ({
  slotW,
  slotH: Math.round(slotW * 2.3), // ความสูงช่อง: ต้องเพิ่มตามขนาดรถ (ประมาณ carH + 0.5)
  carH: Math.round(slotW * 1.8), // ขนาดรถ: เพิ่ม/ลดตรงนี้ได้เลย
  font: Math.max(10, Math.round(slotW * 0.2)),
  bang: Math.max(20, Math.round(slotW * 0.5)),
  dot: Math.max(8, Math.round(slotW * 0.16)),
  padY: Math.max(6, Math.round(slotW * 0.1)),
  pull: Math.round(slotW * 0.015), // ระยะดันรถเข้าหาเส้นกลาง: เพิ่ม = ชิดขึ้น, 0 = ไม่ดัน
})

const statsOfBlock = (block: ParkingBlock): ParkingStats => {
  const slots = [...block.top, ...block.bottom]
  const count = (status: SlotStatus) => slots.filter((slot) => slot.status === status).length

  return {
    total: slots.length,
    occupied: count('occupied'),
    available: count('available'),
    offline: count('offline'),
  }
}

<<<<<<< HEAD
/* ---------- parkingStore helpers ---------- */

// read the store and normalise it (always a fresh object, so React re-renders on change)
const readSaved = (): SavedLayout => {
  const saved = (getSaved() ?? {}) as Partial<SavedLayout>
  return { floors: saved.floors ?? [], elements: saved.elements ?? {} }
}

// editor status (active / reserved / closed) -> status used by the filter + stat cards
const toDisplayStatus = (status?: string): SlotStatus =>
  status === 'active' ? 'occupied' : status === 'closed' ? 'offline' : 'available'

// floor id จาก editor มี "-" อยู่แล้ว (เช่น "floor-1") จึงใช้ "::" คั่นระหว่าง floor กับ zone
const ZONE_SEP = '::'

// Floor 1, Floor 1 - Zone A, Floor 1 - Zone B, Floor 2, ...
const buildCustomLocationOptions = (
  savedFloors: SavedFloor[],
  elements: Record<string, ParkingElementData[]>,
  t: TFunction,
): LocationOption[] =>
  savedFloors.flatMap((f) => [
    { value: f.id, label: t('parking.location.floor', { name: f.name }) },
    ...(elements[f.id] ?? [])
      .filter((e) => e.tool === 'zone' && !e.hidden)
      .map((z) => ({
        value: `${f.id}${ZONE_SEP}${z.id}`,
        label: t('parking.location.floorZoneLabel', { floor: f.name, zone: z.label || t('parking.location.zone') }),
      })),
  ])

const parseLocation = (loc: string, savedFloors: SavedFloor[]) => {
  const [fid, zid] = loc.split(ZONE_SEP)
  return {
    floorId: savedFloors.find((f) => f.id === fid)?.id ?? null,
    zoneId: zid ?? null,
  }
}

/* ---------- Focus (กล้อง) helpers ---------- */

const rectOf = (e: ParkingElementData): CameraRect => ({ x: e.x, y: e.y, w: e.w, h: e.h })

// element ชนกับกรอบกล้องไหม (ส่วนที่ล้นกรอบจะถูกตัดตอนวาด)
const intersects = (a: CameraRect, b: CameraRect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
/* ---------- Hook: วัดความกว้าง container ---------- */

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => setWidth(element.clientWidth)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}

<<<<<<< HEAD
/* ---------- Icons (context menu) ---------- */

const EyeIcon = (
  <svg width="16" height="15" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.14812 12.3479C2.0613 12.1234 2.0613 11.8764 2.14812 11.6519C2.99364 9.68373 4.42886 8.00091 6.27184 6.81677C8.11481 5.63263 10.2825 5.00049 12.5002 5.00049C14.7179 5.00049 16.8856 5.63263 18.7286 6.81677C20.5715 8.00091 22.0068 9.68373 22.8523 11.6519C22.9391 11.8764 22.9391 12.1234 22.8523 12.3479C22.0068 14.316 20.5715 15.9988 18.7286 17.183C16.8856 18.3671 14.7179 18.9993 12.5002 18.9993C10.2825 18.9993 8.11481 18.3671 6.27184 17.183C4.42886 15.9988 2.99364 14.316 2.14812 12.3479Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path
      d="M15.625 12C15.625 13.6569 14.2259 15 12.5 15C10.7741 15 9.375 13.6569 9.375 12C9.375 10.3431 10.7741 9 12.5 9C14.2259 9 15.625 10.3431 15.625 12Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
)

const EraserIcon = (
  <svg width="16" height="14" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19.9996 19.0001H11.8336M11.8336 19.0001H6.99957C6.73587 19.0007 6.47465 18.9491 6.23095 18.8484C5.98725 18.7476 5.76588 18.5997 5.57957 18.4131L1.58557 14.4141C1.21063 14.039 1 13.5304 1 13.0001C1 12.4697 1.21063 11.9611 1.58557 11.5861L11.5856 1.58607C11.7713 1.40027 11.9918 1.25288 12.2345 1.15232C12.4772 1.05176 12.7374 1 13.0001 1C13.2628 1 13.5229 1.05176 13.7656 1.15232C14.0083 1.25288 14.2288 1.40027 14.4146 1.58607L20.4136 7.58607C20.7885 7.96113 20.9991 8.46974 20.9991 9.00007C20.9991 9.5304 20.7885 10.039 20.4136 10.4141L11.8336 19.0001Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path
      d="M4.08203 9.08984L12.91 17.9178"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
)

const FlagIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 22V15.528M4 15.528V4C4 3.84475 4.03614 3.69164 4.10557 3.55279C4.175 3.41393 4.2758 3.29315 4.4 3.2C5.43858 2.42107 6.70178 2 8 2C11 2 13 4 15.333 4C16.6663 4 17.6887 3.73333 18.4 3.2C18.5486 3.08857 18.7252 3.02072 18.9102 3.00404C19.0952 2.98736 19.2811 3.02252 19.4472 3.10557C19.6133 3.18863 19.753 3.31629 19.8507 3.47427C19.9483 3.63224 20 3.81429 20 4V14C20 14.1552 19.9639 14.3084 19.8944 14.4472C19.825 14.5861 19.7242 14.7069 19.6 14.8C18.5614 15.5789 17.2982 16 16 16C13 16 11 14 8 14C6.52412 14 5.10002 14.544 4 15.528Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
)

const ResolveIcon = (
  <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20.7987 9.00341C21.2554 11.2447 20.9299 13.5748 19.8765 15.6052C18.8231 17.6356 17.1056 19.2435 15.0102 20.1607C12.9148 21.078 10.5683 21.2492 8.36196 20.6458C6.15563 20.0424 4.22285 18.7008 2.88593 16.8448C1.54902 14.9889 0.88878 12.7306 1.01532 10.4468C1.14186 8.16294 2.04754 5.9915 3.58131 4.29458C5.11508 2.59766 7.18424 1.47784 9.44372 1.12186C11.7032 0.765884 14.0164 1.19527 15.9977 2.33841"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path
      d="M7.99805 10.0029L10.998 13.0029L20.998 3.00293"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
)

const ErrorIcon = (
  <svg width="16" height="16" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.3937 17.2651L13.727 2.09839C13.538 1.76494 13.264 1.48759 12.9328 1.29463C12.6017 1.10167 12.2253 1 11.842 1C11.4587 1 11.0823 1.10167 10.7512 1.29463C10.42 1.48759 10.146 1.76494 9.957 2.09839L1.29033 17.2651C1.09932 17.5959 0.999159 17.9713 1.00001 18.3533C1.00085 18.7353 1.10267 19.1102 1.29515 19.4402C1.48762 19.7702 1.76391 20.0434 2.096 20.2321C2.42809 20.4209 2.80419 20.5185 3.18616 20.5151H20.5195C20.8996 20.5147 21.273 20.4143 21.6021 20.2239C21.9311 20.0336 22.2043 19.7601 22.3942 19.4308C22.5841 19.1015 22.684 18.728 22.6839 18.3478C22.6838 17.9677 22.5837 17.5943 22.3937 17.2651Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path d="M11.8525 7.51465V11.848" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    <path d="M11.8525 16.1816H11.8627" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
  </svg>
)

/* ---------- Slot ---------- */

// รถ: light แสดง Car_black, dark แสดง Car_white
// สลับด้วย CSS variable (--pc-car-*-display ใน index.css) ที่ตาม data-theme จึงเปลี่ยนทันทีโดยไม่ต้อง re-render
function CarIcon({ dimmed, flip, height }: { dimmed: boolean; flip: boolean; height: number }) {
  const cls = `w-auto select-none object-contain transition-opacity ${dimmed ? 'opacity-25' : ''} ${flip ? 'rotate-180' : ''}`

  return (
    <>
      {/* light mode: รถดำ */}
      <img
        src={carImgdark}
        alt=""
        draggable={false}
        aria-hidden="true"
        style={{ height, display: 'var(--pc-car-light-display)' }}
        className={cls}
      />
      {/* dark mode: รถขาว */}
      <img
        src={carImg}
        alt=""
        draggable={false}
        aria-hidden="true"
        style={{ height, display: 'var(--pc-car-dark-display)' }}
        className={cls}
      />
    </>
=======
/* ---------- Slot ---------- */

function CarIcon({ dimmed, flip, height }: { dimmed: boolean; flip: boolean; height: number }) {
  return (
    <img
      src={carImg}
      alt=""
      draggable={false}
      aria-hidden="true"
      style={{ height }}
      className={`w-auto select-none object-contain transition-opacity ${dimmed ? 'opacity-25' : ''} ${
        flip ? 'rotate-180' : ''
      }`}
    />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

// เส้นแบ่งช่องแนวตั้ง (div กว้าง 1px ให้หนาเท่ากันทุกเส้น)
function SlotDivider({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden="true"
      style={side === 'left' ? { left: 0 } : { right: 0 }}
<<<<<<< HEAD
      className="pointer-events-none absolute top-0 h-full w-px bg-[var(--border)]" /* เข้มขึ้นถ้าอยากเห็นชัดขึ้น เช่น bg-[#b8b8be] */
=======
      className="pointer-events-none absolute top-0 h-full w-px bg-[#d2d2d7]" /* เข้มขึ้นถ้าอยากเห็นชัดขึ้น เช่น bg-[#b8b8be] */
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    />
  )
}

function SlotLabel({ slot, dimmed, fontSize }: { slot: ParkingSlot; dimmed: boolean; fontSize: number }) {
<<<<<<< HEAD
  const color = slot.status === 'offline' ? 'font-semibold text-[#e5173f]' : 'text-ink-1'
=======
  const color = slot.status === 'offline' ? 'font-semibold text-[#e5173f]' : 'text-[#212121]'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

  return (
    <span style={{ fontSize }} className={`${color} ${dimmed ? 'opacity-30' : ''}`}>
      {slot.id}
    </span>
  )
}

// "!" (offline) หรือจุดเขียว (ว่าง) จัดกึ่งกลางช่องทั้งช่อง ไม่เกี่ยวกับตำแหน่งรถ
function SlotMarker({ status, dimmed, m }: { status: SlotStatus; dimmed: boolean; m: Metrics }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {status === 'offline' ? (
        <span
          style={{ fontSize: m.bang }}
          className={`font-bold leading-none text-[#e5173f] ${dimmed ? 'opacity-30' : ''}`}
        >
          !
        </span>
      ) : (
        <span style={{ width: m.dot, height: m.dot }} className="rounded-full bg-green-500" />
      )}
    </div>
  )
}

interface SlotProps {
  slot: ParkingSlot
  position: SlotPosition
  filter: ParkingFilter
  query: string
  m: Metrics
  isFirst: boolean
<<<<<<< HEAD
  onSlotContextMenu?: SlotContextMenuHandler
}

function Slot({ slot, position, filter, query, m, isFirst, onSlotContextMenu }: SlotProps) {
  const t = useT()
=======
}

function Slot({ slot, position, filter, query, m, isFirst }: SlotProps) {
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const isTop = position === 'top'

  const statusMatch = filter === 'all' || filter === slot.status
  const queryMatch = !query || slot.id.toLowerCase().includes(query)
  const matches = statusMatch && queryMatch
  const dimmed = !matches

  const showMarker = slot.status === 'offline' || (slot.status === 'available' && matches && filter === 'available')
  const label = <SlotLabel slot={slot} dimmed={dimmed} fontSize={m.font} />

  return (
    <div
<<<<<<< HEAD
      onContextMenu={(e) => {
        if (!onSlotContextMenu) return
        e.preventDefault() // hide the browser's native menu
        onSlotContextMenu(e, slot)
      }}
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      style={{
        width: m.slotW,
        height: m.slotH,
        // ฝั่งป้ายชื่อเว้น padY, ฝั่งเส้นกลางไม่เว้น เพื่อให้รถชิดเส้นกลางได้
        paddingTop: isTop ? m.padY : 0,
        paddingBottom: isTop ? 0 : m.padY,
      }}
      className="relative flex shrink-0 flex-col items-center justify-between"
<<<<<<< HEAD
      title={`${slot.id} - ${t('parking.status.' + slot.status)}`}
=======
      title={`${slot.id} - ${slot.status}`}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    >
      {isFirst && <SlotDivider side="left" />}
      <SlotDivider side="right" />

      {isTop && label}

      {/* รถ: ชิดเส้นกลาง (ดันเพิ่มด้วย m.pull ชดเชยขอบโปร่งใสของรูป) */}
      <div
        style={{ transform: `translateY(${isTop ? m.pull : -m.pull}px)` }}
        className={`flex flex-1 justify-center ${isTop ? 'items-end' : 'items-start'}`}
      >
        {slot.status === 'occupied' && <CarIcon dimmed={dimmed} flip={isTop} height={m.carH} />}
      </div>

      {showMarker && <SlotMarker status={slot.status} dimmed={dimmed} m={m} />}

      {!isTop && label}
    </div>
  )
}

/* ---------- Block (ช่องจอด 2 แถว) ---------- */

interface BlockProps {
  block?: ParkingBlock
  filter: ParkingFilter
  query: string
  m: Metrics
  onSelectBlock?: () => void // ถ้าใส่ block จะกดได้ (ใช้ซูมเข้า zone)
<<<<<<< HEAD
  onSlotContextMenu?: SlotContextMenuHandler
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
}

function SlotRow({
  slots,
  position,
  filter,
  query,
  m,
<<<<<<< HEAD
  onSlotContextMenu,
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
}: {
  slots: ParkingSlot[]
  position: SlotPosition
  filter: ParkingFilter
  query: string
  m: Metrics
<<<<<<< HEAD
  onSlotContextMenu?: SlotContextMenuHandler
}) {
  return (
    <div className={position === 'top' ? 'flex border-b border-[var(--border)]' : 'flex'}>
=======
}) {
  return (
    <div className={position === 'top' ? 'flex border-b border-[#d2d2d7]' : 'flex'}>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      {slots.map((slot, index) => (
        <Slot
          key={slot.id}
          slot={slot}
          position={position}
          filter={filter}
          query={query}
          m={m}
          isFirst={index === 0}
<<<<<<< HEAD
          onSlotContextMenu={onSlotContextMenu}
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        />
      ))}
    </div>
  )
}

<<<<<<< HEAD
function Block({ block, filter, query, m, onSelectBlock, onSlotContextMenu }: BlockProps) {
=======
function Block({ block, filter, query, m, onSelectBlock }: BlockProps) {
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  if (!block) return <div />

  const clickable = Boolean(onSelectBlock)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectBlock?.()
    }
  }

  return (
    <div
      onClick={onSelectBlock}
      onKeyDown={clickable ? handleKeyDown : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={`inline-block ${clickable ? 'cursor-pointer transition-opacity hover:opacity-90' : ''}`}
    >
<<<<<<< HEAD
      <SlotRow slots={block.top} position="top" filter={filter} query={query} m={m} onSlotContextMenu={onSlotContextMenu} />
      <SlotRow
        slots={block.bottom}
        position="bottom"
        filter={filter}
        query={query}
        m={m}
        onSlotContextMenu={onSlotContextMenu}
      />
=======
      <SlotRow slots={block.top} position="top" filter={filter} query={query} m={m} />
      <SlotRow slots={block.bottom} position="bottom" filter={filter} query={query} m={m} />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

/* ---------- Toolbar ---------- */

function SlotSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
<<<<<<< HEAD
  const t = useT()
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
<<<<<<< HEAD
        aria-label={t('parking.toolbar.searchSlot')}
        className="h-8 w-44 rounded-xl border border-[var(--border)] bg-transparent pl-3.5 pr-8 text-xs text-[var(--text)] outline-none focus:border-brand sm:w-[200px]" />
      <Search size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
=======
        aria-label="Search slot"
        className="h-8 w-44 rounded-xl border border-[#d2d2d7] bg-white pl-3.5 pr-8 text-xs outline-none focus:border-brand sm:w-[200px]"
      />
      <Search size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

<<<<<<< HEAD
// Floor / Zone dropdown: ใช้ PillSelect ตัวใหม่ แต่คงหน้าตาเดิม (สูง 32px มุมโค้ง rounded-xl ตัวอักษร 13px สีเทา)
function LocationSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: LocationOption[]
}) {
  const t = useT()
  return (
    <PillSelect
      ariaLabel={t('parking.toolbar.floorAndZone')}
      value={value}
      onChange={onChange}
      options={options}
      widthClass="w-[176px]"
      triggerClassName={LOCATION_TRIGGER}
      panelClassName={LOCATION_PANEL}
    />
=======
function LocationSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <select
        aria-label="Floor and Zone"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-[176px] cursor-pointer appearance-none rounded-xl border border-[#d2d2d7] bg-white pl-4 pr-7 text-center text-[13px] text-[#6f6f72] outline-none transition hover:bg-gray-50 focus:border-brand"
      >
        {LOCATION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* สามเหลี่ยมมุมมน: ใช้ stroke + strokeLinejoin round (เพิ่ม strokeWidth = มนขึ้น) */}
      <svg
        aria-hidden="true"
        width="11"
        height="9"
        viewBox="0 0 11 9"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B9B9BF]"
      >
        <polygon
          points="2,2 9,2 5.5,7"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

/* ---------- Layout area ---------- */

function NoHardware() {
<<<<<<< HEAD
  const t = useT()
  return (
    <div className="flex min-h-[100%] flex-col items-center justify-center py-16 text-center text-[#7E7E81]">
      <p className="text-[17px] font-normal">{t('parking.empty.noHardwareTitle')}</p>
      <p className="mt-2 text-[13px] font-light">{t('parking.empty.noHardwareDesc')}</p>
=======
  return (
    <div className="flex min-h-[100px] flex-col items-center justify-center py-16 text-center text-[#7E7E81]">
      <p className="text-[17px] font-normal">No Hardware Found</p>
      <p className="mt-2 text-[13px] font-light">Please connect your hardware in Settings.</p>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

<<<<<<< HEAD
// saved layout exists, but the selected floor has nothing drawn inside the Focus frame
function EmptyFloor() {
  const t = useT()
  return (
    <div
      style={{ minHeight: CUSTOM_CANVAS_HEIGHT }}
      className="flex flex-col items-center justify-center py-16 text-center text-[#7E7E81]"
    >
      <p className="text-[17px] font-normal">{t('parking.empty.noElementsTitle')}</p>
      <p className="mt-2 text-[13px] font-light">
        {t('parking.empty.noElementsDescPre')}<strong>{t('parking.editFacility')}</strong>{t('parking.empty.noElementsDescPost')}
      </p>
    </div>
  )
}

/* ---------- Context menu ---------- */

interface SlotContextMenuProps {
  menu: SlotMenuState
  readOnly?: boolean // true = ไม่มีสิทธิ์ Can Edit: เห็นได้อย่างเดียว ไม่แสดงเมนูที่แก้ข้อมูล
  onClose: () => void
  onViewDetails: (slot: ParkingSlot) => void
  onClearSlot: (slot: ParkingSlot) => void
  onReportError: (slot: ParkingSlot) => void
  onResolveError: (slot: ParkingSlot) => void
}

function SlotContextMenu({
  menu,
  readOnly = false,
  onClose,
  onViewDetails,
  onClearSlot,
  onReportError,
  onResolveError,
}: SlotContextMenuProps) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: menu.x, y: menu.y })
  const { slot } = menu

  // keep the menu inside the viewport
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    setPos({
      x: Math.max(8, Math.min(menu.x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(menu.y, window.innerHeight - height - 8)),
    })
  }, [menu])

  // close on outside click / Escape / scroll / resize
  useEffect(() => {
    const onMouseDown = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    window.addEventListener('blur', onClose)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('blur', onClose)
    }
  }, [onClose])

  const isOffline = slot.status === 'offline'

  const allItems: MenuItem[] = isOffline
    ? [
      { label: t('parking.menu.slotError'), icon: ErrorIcon, reportText: t('parking.menu.reportedBy', { name: 'Suprawi', date: '13/11/26  14:30' }) },
      { label: t('parking.menu.vehicleDetails'), icon: EyeIcon, onClick: () => onViewDetails(slot) },
      { label: t('parking.menu.clearSlot'), icon: EraserIcon, onClick: () => onClearSlot(slot) },
      { label: t('parking.menu.resolveError'), icon: ResolveIcon, good: true, onClick: () => onResolveError(slot) },
    ]
    : [
      { label: t('parking.menu.vehicleDetails'), icon: EyeIcon, onClick: () => onViewDetails(slot) },
      { label: t('parking.menu.clearSlot'), icon: EraserIcon, onClick: () => onClearSlot(slot) },
      { label: t('parking.menu.reportError'), icon: FlagIcon, danger: true, onClick: () => onReportError(slot) },
    ]

  // ไม่มีสิทธิ์ Can Edit: เหลือเฉพาะ Vehicle details และข้อความแจ้งว่าช่องนี้มี error
  const items = readOnly
    ? allItems.filter((item) => item.label === t('parking.menu.vehicleDetails') || item.reportText)
    : allItems

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ left: pos.x, top: pos.y, fontFamily: 'Inter' }}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 min-w-[150px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-lg"
    >
      <div className="flex items-center justify-between gap-6 px-4 py-3 text-[14.2px] text-[var(--text)]">
        <span>กด 4997, แพร่</span>
        <span className="text-[12px] capitalize">{slot.id}</span>
      </div>

      <hr className="mx-[5%] border-t border-[var(--border)] py-1" />

      {items.map((item) => (
        <Fragment key={item.label}>
          {(item.danger || item.good) && <hr className="mx-[5%] my-[3px] border-t border-[var(--border)]" />}

          <button
            type="button"
            role="menuitem"
            disabled={!item.onClick}
            onClick={() => {
              item.onClick?.()
              onClose()
            }}
            className={`flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[13px] transition hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] disabled:cursor-default disabled:hover:bg-transparent ${item.danger ? 'text-[#e5173f]' : item.good ? 'text-[#3A9E21]' : 'text-[var(--text)]'
              }`}
          >
            <span>{item.icon}</span>
            {item.reportText ? (
              <span className="flex flex-col">
                <span className="text-[12px] text-[#e5173f]">{item.label}</span>
                <span className="text-[7.8px] text-[#e5173f]">{item.reportText}</span>
              </span>
            ) : (
              <span>{item.label}</span>
            )}
          </button>
        </Fragment>
      ))}
    </div>,
    document.body,
  )
}

/* ---------- Vehicle details modal (basic, replace with your own) ---------- */

function SlotDetailsModal({ slot, onClose }: { slot: ParkingSlot; onClose: () => void }) {
  const t = useT()
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t('parking.menu.vehicleDetails')}
        onClick={(e) => e.stopPropagation()}
        className="w-[320px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-xl"
      >
        <h3 className="text-[16px] font-medium text-[var(--text)]">{t('parking.menu.vehicleDetails')}</h3>
        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted, #6f6f72)]">{t('parking.details.slot')}</dt>
            <dd>{slot.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted, #6f6f72)]">{t('parking.details.status')}</dt>
            <dd className="capitalize">{t('parking.status.' + slot.status)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted, #6f6f72)]">{t('parking.details.plate')}</dt>
            <dd>กด 4997, แพร่</dd>
          </div>
        </dl>
        <button type="button" onClick={onClose} className={`mt-5 w-full ${MODAL_BUTTON}`}>
          {t('parking.details.close')}
        </button>
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Page ---------- */

function Parking() {
  const t = useT()
  const navigate = useNavigate()
  const { url_uuid } = useParams<{ url_uuid: string }>()
  const editable = canEdit() // false เมื่ออยู่ในโหมด View as และ role นั้นปิดสิทธิ์ Can Edit

  const [filter, setFilter] = useState<ParkingFilter>('all')
  const [location, setLocation] = useState('') // RESET: เดิมเป็น 'A'
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const [menu, setMenu] = useState<SlotMenuState | null>(null)
  const [detailSlot, setDetailSlot] = useState<ParkingSlot | null>(null)

  /* ---------- layout saved from the editor (parkingStore) ---------- */
  const [savedData, setSavedData] = useState<SavedLayout>(() => readSaved())

  useEffect(() => subscribe(() => setSavedData(readSaved())), [])

  // ทุกชั้นมี Focus อยู่แล้วเสมอ จึงต้องไม่นับ focus ตอนเช็กว่า "มี layout ที่วาดไว้หรือยัง"
  const hasCustomLayout =
    savedData.floors.length > 0 &&
    Object.values(savedData.elements).some((arr) => arr.some((e) => (e.tool as string) !== 'focus'))

  // dropdown: Floor X + Floor X - <Zone label> ของแต่ละชั้น, otherwise empty (mock ถูกล้างแล้ว)
  const locationOptions = useMemo<LocationOption[]>(
    () => (hasCustomLayout ? buildCustomLocationOptions(savedData.floors, savedData.elements, t) : LOCATION_OPTIONS),
    [hasCustomLayout, savedData, t],
  )

  // keep `location` valid when the option list changes (e.g. "" -> saved "floor-1", or a zone was deleted)
  useEffect(() => {
    if (locationOptions.length && !locationOptions.some((o) => o.value === location)) {
      setLocation(locationOptions[0].value)
    }
  }, [locationOptions, location])

  const { floorId: selectedFloorId, zoneId: selectedZoneId } = useMemo(
    () => (hasCustomLayout ? parseLocation(location, savedData.floors) : { floorId: null, zoneId: null }),
    [hasCustomLayout, location, savedData.floors],
  )

  // element ทั้งหมดของชั้นที่เลือก (รวม focus)
  const rawFloorElements = useMemo<ParkingElementData[]>(() => {
    if (!hasCustomLayout || !selectedFloorId) return []
    return savedData.elements[selectedFloorId] ?? []
  }, [hasCustomLayout, savedData.elements, selectedFloorId])

  // กรอบ Focus ของชั้น = "กล้องหลัก" (ไม่มี = ใช้กรอบที่ครอบ element ทั้งหมดแทน)
  const focusRect = useMemo<CameraRect | null>(() => {
    const f = rawFloorElements.find((e) => (e.tool as string) === 'focus')
    if (f) return rectOf(f)

    const rest = rawFloorElements.filter((e) => !e.hidden)
    if (!rest.length) return null
    const minX = Math.min(...rest.map((e) => e.x))
    const minY = Math.min(...rest.map((e) => e.y))
    const maxX = Math.max(...rest.map((e) => e.x + e.w))
    const maxY = Math.max(...rest.map((e) => e.y + e.h))
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
  }, [rawFloorElements])

  // เฉพาะ element ที่อยู่ในกรอบ Focus (นอกกรอบ = ไม่แสดง ไม่นับ) — ไม่รวมตัว focus เอง
  const floorElements = useMemo<ParkingElementData[]>(() => {
    const real = rawFloorElements.filter((e) => (e.tool as string) !== 'focus')
    if (!focusRect) return real
    return real.filter((e) => intersects(rectOf(e), focusRect))
  }, [rawFloorElements, focusRect])

  // zone ที่ถูกเลือกอยู่ (ถ้ามี)
  const selectedZone = useMemo(
    () => (selectedZoneId ? floorElements.find((e) => String(e.id) === selectedZoneId) ?? null : null),
    [floorElements, selectedZoneId],
  )

  // element ที่ใช้นับสถิติ: ถ้าเลือก zone = นับเฉพาะ element ใน zone นั้น
  const scopedElements = useMemo<ParkingElementData[]>(() => {
    if (!selectedZone) return floorElements
    return elementsInZone(floorElements, selectedZone)
  }, [floorElements, selectedZone])

  // กรอบกล้อง: เลือก zone = ซูมไปที่ zone, ไม่เลือก = ทั้ง Focus
  const cameraRect = useMemo<CameraRect | null>(() => {
    if (selectedZone) {
      return {
        x: selectedZone.x - ZONE_CAMERA_PAD,
        y: selectedZone.y - ZONE_CAMERA_PAD,
        w: selectedZone.w + ZONE_CAMERA_PAD * 2,
        h: selectedZone.h + ZONE_CAMERA_PAD * 2,
      }
    }
    return focusRect
  }, [selectedZone, focusRect])

  // สิ่งที่กล้องมองเห็น: zone ที่เลือก = zone + ของข้างใน, ไม่เลือก = ทุกอย่างในกรอบ Focus
  const cameraElements = useMemo<ParkingElementData[]>(() => {
    if (!selectedZone) return floorElements
    const inside = elementsInZone(floorElements, selectedZone)
    return inside.some((e) => e.id === selectedZone.id) ? inside : [selectedZone, ...inside]
  }, [floorElements, selectedZone])

  // search + status filter: dim non-matching slots instead of hiding them, so positions stay intact
  const filteredElements = useMemo<ParkingElementData[]>(
    () =>
      cameraElements.map((e) => {
        if (e.tool !== 'slot') return e // non-slot: always visible
        const id = String(e.slotId || e.label || e.id)
        const statusMatch = filter === 'all' || filter === toDisplayStatus(e.status)
        const queryMatch = !query || id.toLowerCase().includes(query)
        return { ...e, _dimmed: !(statusMatch && queryMatch) }
      }),
    [cameraElements, filter, query],
  )

  // status overrides by slot id (ตอนนี้ไม่มี mock layout แล้ว จึงว่างเสมอ)
  const [slotStatus, setSlotStatus] = useState<Record<string, SlotStatus>>({})

  const openSlotMenu: SlotContextMenuHandler = (e, slot) => setMenu({ x: e.clientX, y: e.clientY, slot })

  const updateSlotStatus = (slot: ParkingSlot, status: SlotStatus) =>
    setSlotStatus((prev) => ({ ...prev, [slot.id]: status }))

  const handleViewDetails = (slot: ParkingSlot) => setDetailSlot(slot)
  const handleClearSlot = (slot: ParkingSlot) => updateSlotStatus(slot, 'available')
  const handleReportError = (slot: ParkingSlot) => updateSlotStatus(slot, 'offline')
  const handleResolveError = (slot: ParkingSlot) => updateSlotStatus(slot, 'available')

  // mock mode: location เป็น "A" (ทั้งชั้น) หรือ "A-1" (ชั้น A โซน 1)
  // saved mode: location is a floor id such as "floor-1" or "floor-1::<zoneId>" (it contains "-", so don't split on it)
  const locationParts = hasCustomLayout ? [location] : location.split('-')
  const floor = locationParts[0]
  const zoneNum = locationParts[1] ? Number(locationParts[1]) : null

  // RESET: ไม่ดึง layout mock (รถทั้งหมดเคยมาจาก getParkingLayout)
  const baseLayout: ParkingBlock[] = useMemo(() => [], [])

  const layout: ParkingBlock[] = useMemo(() => {
    if (!baseLayout) return []
    const apply = (s: ParkingSlot): ParkingSlot => (slotStatus[s.id] ? { ...s, status: slotStatus[s.id] } : s)

    return baseLayout.map((block) => ({
      ...block,
      top: block.top.map(apply),
      bottom: block.bottom.map(apply),
    }))
  }, [baseLayout, slotStatus])

  const hasLayout = layout.length > 0
=======
/* ---------- Page ---------- */

function Parking() {
  const [filter, setFilter] = useState<ParkingFilter>('all')
  const [location, setLocation] = useState('A')
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()

  // location เป็น "A" (ทั้งชั้น) หรือ "A-1" (ชั้น A โซน 1)
  const [floor, zoneStr] = location.split('-')
  const zoneNum = zoneStr ? Number(zoneStr) : null

  const layout: ParkingBlock[] = useMemo(() => getParkingLayout(floor), [floor])
  const hasLayout = !!layout && layout.length > 0
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

  const blockByKey = useMemo(
    () => Object.fromEntries(layout.map((block) => [block.key, block])) as Partial<Record<BlockKey, ParkingBlock>>,
    [layout],
  )
  const activeBlock = zoneNum ? blockByKey[ZONE_BLOCK_KEY[zoneNum]] : undefined

<<<<<<< HEAD
  /* ---------- scale ตามความกว้างจอ (เฉพาะ mock layout เดิม) ---------- */
=======
  /* ---------- scale ตามความกว้างจอ ---------- */
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const [areaRef, areaWidth] = useElementWidth<HTMLDivElement>()

  // จำนวนช่องต่อแถวของ block ที่กว้างที่สุด
  const slotsPerRow = useMemo(
    () => layout.reduce((max, block) => Math.max(max, block.top?.length ?? 0), 0) || DEFAULT_SLOTS_PER_ROW,
    [layout],
  )

  const metrics = useMemo(
    () => getMetrics(computeSlotWidth(areaWidth, !!activeBlock, slotsPerRow)),
    [areaWidth, activeBlock, slotsPerRow],
  )

  /* ---------- สถิติ ---------- */
  const stats: ParkingStats = useMemo(() => {
<<<<<<< HEAD
    // saved layout: count the slots drawn inside the Focus frame (or only inside the selected zone)
    if (hasCustomLayout) {
      const slots = scopedElements.filter((e) => e.tool === 'slot')
      const count = (status: SlotStatus) => slots.filter((e) => toDisplayStatus(e.status) === status).length
      return {
        total: slots.length,
        occupied: count('occupied'),
        available: count('available'),
        offline: count('offline'),
      }
    }

    if (!hasLayout) return EMPTY_STATS
    if (!activeBlock) {
      // sum over the live layout so floor totals update after clear/report/resolve
      return layout.reduce<ParkingStats>(
        (acc, block) => {
          const s = statsOfBlock(block)
          return {
            total: (acc.total ?? 0) + (s.total ?? 0),
            occupied: (acc.occupied ?? 0) + (s.occupied ?? 0),
            available: (acc.available ?? 0) + (s.available ?? 0),
            offline: (acc.offline ?? 0) + (s.offline ?? 0),
          }
        },
        { total: 0, occupied: 0, available: 0, offline: 0 },
      )
    }
    return statsOfBlock(activeBlock)
  }, [hasCustomLayout, scopedElements, hasLayout, activeBlock, layout])

  const summaryItems = [
    { key: 'total', label: t('parking.summary.total'), value: stats.total },
    { key: 'occupied', label: t('parking.summary.occupied'), value: stats.occupied },
    { key: 'available', label: t('parking.summary.available'), value: stats.available },
    { key: 'offline', label: t('parking.summary.offline'), value: stats.offline },
=======
    if (!hasLayout) return EMPTY_STATS
    if (!activeBlock) return parkingStatsByFloor[floor] ?? EMPTY_STATS
    return statsOfBlock(activeBlock)
  }, [hasLayout, activeBlock, floor])

  const summaryItems = [
    { key: 'total', label: 'Total Slots', value: stats.total },
    { key: 'occupied', label: 'Occupied', value: stats.occupied },
    { key: 'available', label: 'Available', value: stats.available },
    { key: 'offline', label: 'Offline', value: stats.offline },
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  ]

  const blockHeight = metrics.slotH * 2 + 1

  const renderLayout = () => {
<<<<<<< HEAD
    // layout designed in the editor: read-only "กล้อง" = กรอบ Focus (หรือ zone ที่เลือก)
    // วาดเป็น stage สัดส่วนเดียวกับ Focus เป๊ะ (contain + กึ่งกลาง) → ตำแหน่งตรงกับ editor
    if (hasCustomLayout) {
      if (floorElements.length === 0 || !cameraRect) return <EmptyFloor />
      return (
        <div className="absolute inset-0">
          <ParkingCanvasView
            elements={filteredElements}
            height="100%"
            grayOnly
            camera={cameraRect}
            cameraAlign="center"
            /* เห็นเส้นกรอบเฉพาะตอนดู Focus ทั้งชั้น (ตอนซูมเข้า zone ไม่ต้องมี) */
            showFrame={!selectedZone}
            /* เลือก zone อยู่แล้ว = ไม่ต้องกดซูมซ้ำ */
            onSelectZone={
              selectedZone
                ? undefined
                : (id) => {
                  if (!selectedFloorId) return
                  setMenu(null)
                  setLocation(`${selectedFloorId}${ZONE_SEP}${id}`)
                }
            }
          />
        </div>
      )
    }

=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    if (!hasLayout) return <NoHardware />

    // โหมด zone: แสดง block เดียวกลางจอ
    if (activeBlock) {
      return (
        <div style={{ minHeight: blockHeight + 48 }} className="flex items-center justify-center py-6">
<<<<<<< HEAD
          <Block block={activeBlock} filter={filter} query={query} m={metrics} onSlotContextMenu={openSlotMenu} />
=======
          <Block block={activeBlock} filter={filter} query={query} m={metrics} />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        </div>
      )
    }

    // โหมดทั้งชั้น: block 6 ตำแหน่ง กด block เพื่อซูมเข้า zone
    return (
      <div
        style={{
          rowGap: Math.round(metrics.slotW * 0.9),
          columnGap: Math.round(metrics.slotW * 2.85), // ระยะห่างระหว่าง block
        }}
        className="grid grid-cols-[auto_auto_auto] justify-center px-[2%] py-2"
      >
        {FLOOR_GRID_ORDER.map((key) => {
          const zone = BLOCK_KEY_TO_ZONE[key]

          return (
            <Block
              key={key}
              block={blockByKey[key]}
              filter={filter}
              query={query}
              m={metrics}
              onSelectBlock={zone ? () => setLocation(`${floor}-${zone}`) : undefined}
            />
          )
        })}
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('parking.title')}
        actions={
          <>
            {editable && (
              <button type="button" className={`flex items-center gap-1.5 ${FACILITY_BUTTON}`} onClick={() => {
                if (url_uuid) {
                  navigate(`/system/${url_uuid}/edit_parking_layout`)
                }
              }}>
                <Icon icon="lucide:pencil-line" height="1.25em " className="[&_*]:stroke-[1.75]" /> {t('parking.editFacility')}
              </button>
            )}
=======
    <>
      <Navbar
        title="Parking Management"
        actions={
          <>
            <button type="button" className={FACILITY_BUTTON}>
              Remove Facility
            </button>
            <button type="button" className={`flex items-center gap-1.5 ${FACILITY_BUTTON}`}>
              <Plus size={13} /> Add Facility
            </button>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          </>
        }
      />

<<<<<<< HEAD
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5 sm:p-6 sm:px-8">
        <div className="shrink-0">
          <SummaryCards items={summaryItems} />
        </div>
        <section className="card flex min-h-[560px] flex-1 flex-col overflow-hidden">
          {/* border-transparent คงความสูงเดิมของเส้น 1px ไว้ แล้ววางเส้น gradient ทับด้านล่าง */}
          <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-transparent px-[26.5px] py-[14.5px]">
            <h2 className="text-[18.825px] font-medium text-ink-1">{t('parking.layoutTitle')}</h2>

            <div className="flex flex-wrap items-center gap-3">
              <Segmented options={parkingFilters.map((f) => ({ ...f, label: t('parking.filter.' + f.value) }))} value={filter} onChange={setFilter} />
              <SlotSearch value={search} onChange={setSearch} />
              {/* RESET: ซ่อน dropdown ตอนยังไม่มี floor */}
              {locationOptions.length > 0 && (
                <LocationSelect
                  value={location}
                  options={locationOptions}
                  onChange={(v) => {
                    setMenu(null)
                    setLocation(v)
                  }}
                />
              )}
            </div>

            <div aria-hidden className="absolute inset-x-0 bottom-[-1px] h-px" style={DIVIDER_STYLE} />
          </div>

          {/* ref วัดความกว้างอยู่ที่ตัวนี้
              - layout จาก editor: relative + overflow-hidden → กล้อง Focus fit พอดี ไม่มี scrollbar
              - mock layout เดิม: คง p-6 */}
          <div
            ref={areaRef}
            className={`min-h-0 flex-1 ${hasCustomLayout ? 'relative overflow-hidden' : 'p-6'}`}
          >
            {renderLayout()}
          </div>
        </section>

        {menu && (
          <SlotContextMenu
            menu={menu}
            readOnly={!editable}
            onClose={() => setMenu(null)}
            onViewDetails={handleViewDetails}
            onClearSlot={handleClearSlot}
            onReportError={handleReportError}
            onResolveError={handleResolveError}
          />
        )}

        {detailSlot && <SlotDetailsModal slot={detailSlot} onClose={() => setDetailSlot(null)} />}
      </main>
    </div>
=======
      <main className="space-y-6 p-5 sm:p-6 sm:px-8">
        <SummaryCards items={summaryItems} />

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-[26.5px] py-[14.5px]">
            <h2 className="text-[18.825px] font-medium text-[#0F172A]">Parking Layout</h2>

            <div className="flex flex-wrap items-center gap-3">
              <Segmented options={parkingFilters} value={filter} onChange={setFilter} />
              <SlotSearch value={search} onChange={setSearch} />
              <LocationSelect value={location} onChange={setLocation} />
            </div>
          </div>

          {/* ref วัดความกว้างอยู่ที่ตัวนี้ */}
          <div ref={areaRef} className="p-6">
            {renderLayout()}
          </div>
        </section>
      </main>
    </>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

export default Parking