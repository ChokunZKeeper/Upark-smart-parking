import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'
import Segmented from '@/components/system_layout/layout/Segmented'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import { floors, getParkingLayout, parkingFilters, parkingStatsByFloor } from '@/types/_mockData'
import carImg from '@/assets/logos/Car_white.png'
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

/* ---------- Constants ---------- */

// zone (1-4) <-> block ในผัง
const ZONE_BLOCK_KEY: Record<number, BlockKey> = { 1: 'tl', 2: 'bl', 3: 'tm', 4: 'bm' }
const BLOCK_KEY_TO_ZONE: Partial<Record<BlockKey, number>> = { tl: 1, bl: 2, tm: 3, bm: 4 }

// ลำดับ block ในมุมมองทั้งชั้น (grid 3 คอลัมน์ x 2 แถว)
const FLOOR_GRID_ORDER: BlockKey[] = ['tl', 'tm', 'tr', 'bl', 'bm', 'br']

const ZONES = [1, 2, 3, 4]

const LOCATION_OPTIONS = floors.flatMap((floor) => [
  { value: floor, label: `Floor ${floor}` },
  ...ZONES.map((zone) => ({ value: `${floor}-${zone}`, label: `Floor ${floor} - Zone ${floor}${zone}` })),
])

const EMPTY_STATS: ParkingStats = { total: null, occupied: null, available: null, offline: null }

const AREA_PADDING = 48 // p-6 ซ้าย + ขวา
const ZONE_VIEW_WIDTH_RATIO = 0.55 // โหมด zone: block เดียวกว้างประมาณ 55% ของกรอบ
const DEFAULT_SLOTS_PER_ROW = 6

const FACILITY_BUTTON =
  'h-9 rounded-xl border border-[#d2d2d7] bg-white px-7 text-[13.5px] text-[#6f6f72] transition hover:bg-gray-50'

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
  )
}

// เส้นแบ่งช่องแนวตั้ง (div กว้าง 1px ให้หนาเท่ากันทุกเส้น)
function SlotDivider({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden="true"
      style={side === 'left' ? { left: 0 } : { right: 0 }}
      className="pointer-events-none absolute top-0 h-full w-px bg-[#d2d2d7]" /* เข้มขึ้นถ้าอยากเห็นชัดขึ้น เช่น bg-[#b8b8be] */
    />
  )
}

function SlotLabel({ slot, dimmed, fontSize }: { slot: ParkingSlot; dimmed: boolean; fontSize: number }) {
  const color = slot.status === 'offline' ? 'font-semibold text-[#e5173f]' : 'text-[#212121]'

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
}

function Slot({ slot, position, filter, query, m, isFirst }: SlotProps) {
  const isTop = position === 'top'

  const statusMatch = filter === 'all' || filter === slot.status
  const queryMatch = !query || slot.id.toLowerCase().includes(query)
  const matches = statusMatch && queryMatch
  const dimmed = !matches

  const showMarker = slot.status === 'offline' || (slot.status === 'available' && matches && filter === 'available')
  const label = <SlotLabel slot={slot} dimmed={dimmed} fontSize={m.font} />

  return (
    <div
      style={{
        width: m.slotW,
        height: m.slotH,
        // ฝั่งป้ายชื่อเว้น padY, ฝั่งเส้นกลางไม่เว้น เพื่อให้รถชิดเส้นกลางได้
        paddingTop: isTop ? m.padY : 0,
        paddingBottom: isTop ? 0 : m.padY,
      }}
      className="relative flex shrink-0 flex-col items-center justify-between"
      title={`${slot.id} - ${slot.status}`}
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
}

function SlotRow({
  slots,
  position,
  filter,
  query,
  m,
}: {
  slots: ParkingSlot[]
  position: SlotPosition
  filter: ParkingFilter
  query: string
  m: Metrics
}) {
  return (
    <div className={position === 'top' ? 'flex border-b border-[#d2d2d7]' : 'flex'}>
      {slots.map((slot, index) => (
        <Slot
          key={slot.id}
          slot={slot}
          position={position}
          filter={filter}
          query={query}
          m={m}
          isFirst={index === 0}
        />
      ))}
    </div>
  )
}

function Block({ block, filter, query, m, onSelectBlock }: BlockProps) {
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
      <SlotRow slots={block.top} position="top" filter={filter} query={query} m={m} />
      <SlotRow slots={block.bottom} position="bottom" filter={filter} query={query} m={m} />
    </div>
  )
}

/* ---------- Toolbar ---------- */

function SlotSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search slot"
        className="h-8 w-44 rounded-xl border border-[#d2d2d7] bg-white pl-3.5 pr-8 text-xs outline-none focus:border-brand sm:w-[200px]"
      />
      <Search size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

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
  )
}

/* ---------- Layout area ---------- */

function NoHardware() {
  return (
    <div className="flex min-h-[100px] flex-col items-center justify-center py-16 text-center text-[#7E7E81]">
      <p className="text-[17px] font-normal">No Hardware Found</p>
      <p className="mt-2 text-[13px] font-light">Please connect your hardware in Settings.</p>
    </div>
  )
}

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

  const blockByKey = useMemo(
    () => Object.fromEntries(layout.map((block) => [block.key, block])) as Partial<Record<BlockKey, ParkingBlock>>,
    [layout],
  )
  const activeBlock = zoneNum ? blockByKey[ZONE_BLOCK_KEY[zoneNum]] : undefined

  /* ---------- scale ตามความกว้างจอ ---------- */
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
    if (!hasLayout) return EMPTY_STATS
    if (!activeBlock) return parkingStatsByFloor[floor] ?? EMPTY_STATS
    return statsOfBlock(activeBlock)
  }, [hasLayout, activeBlock, floor])

  const summaryItems = [
    { key: 'total', label: 'Total Slots', value: stats.total },
    { key: 'occupied', label: 'Occupied', value: stats.occupied },
    { key: 'available', label: 'Available', value: stats.available },
    { key: 'offline', label: 'Offline', value: stats.offline },
  ]

  const blockHeight = metrics.slotH * 2 + 1

  const renderLayout = () => {
    if (!hasLayout) return <NoHardware />

    // โหมด zone: แสดง block เดียวกลางจอ
    if (activeBlock) {
      return (
        <div style={{ minHeight: blockHeight + 48 }} className="flex items-center justify-center py-6">
          <Block block={activeBlock} filter={filter} query={query} m={metrics} />
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
          </>
        }
      />

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
  )
}

export default Parking