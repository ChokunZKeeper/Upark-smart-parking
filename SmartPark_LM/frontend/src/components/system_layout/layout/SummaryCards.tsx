import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

/* ---------- Types ---------- */

export interface SummaryTrend {
  up: boolean
  text: string
}

export interface SummaryItem {
  key: string
  label: string
  value?: string | number | null
  left?: ReactNode // ข้อความด้านซ้ายใต้ค่าหลัก
  right?: ReactNode // ข้อความด้านขวาใต้ค่าหลัก
  trend?: SummaryTrend
}

interface SummaryCardsProps {
  items: SummaryItem[]
  onSelect?: (key: string) => void // ถ้าใส่ การ์ดจะกดได้
  selectedKey?: string
  columns?: 3 | 4
}

/* ---------- Constants ---------- */

const GRID_COLUMNS = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
} as const

const CARD_BASE = 'card flex flex-col justify-between overflow-hidden !rounded-[17.5px] p-0 text-left'
const CARD_SELECTED = 'border-brand ring-1 ring-brand'
const CARD_CLICKABLE = 'transition hover:border-brand/60'

// ค่า default เมื่อยังไม่มีข้อมูล
const DEFAULT_VALUE = 0

/* ---------- Helpers ---------- */

const hasNoValue = (value: SummaryItem['value']) =>
  value === null || value === undefined || value === '' || value === 'No Data'

/* ---------- Sub components ---------- */

function Trend({ trend, pushLeft }: { trend: SummaryTrend; pushLeft: boolean }) {
  const color = trend.up ? 'text-[#3A9E21]' : 'text-[#DC2626]'
  const Arrow = trend.up ? ArrowUp : ArrowDown

  return (
    <span
      className={`flex shrink-0 items-center gap-0.5 text-[12px] font-medium ${color} ${pushLeft ? 'mr-auto' : ''}`}
    >
      <Arrow size={12} />
      {trend.text}
    </span>
  )
}

function CardBody({ item }: { item: SummaryItem }) {
  // ไม่มีข้อมูล -> แสดง 0 และซ่อน left / trend / right (เช่น Private 26%)
  const empty = hasNoValue(item.value)
  const displayValue = empty ? DEFAULT_VALUE : item.value

  return (
    <>
      <span className="block w-full border-b border-line px-5 py-[7px] text-[13.25px] font-medium leading-5 text-[#0F172A]">
        {item.label}
      </span>

      <div className="px-5 pb-3 pt-2.5">
        <span className="block text-[18.5px] font-medium leading-7 tracking-tight text-[#0F172A]">
          {displayValue}
        </span>

        {!empty && (item.left || item.trend || item.right) ? (
          <div className="mt-1 flex items-center justify-between gap-1 text-[12px] leading-[18px] text-[#7E7E81]">
            {item.left ? <span className="truncate">{item.left}</span> : null}
            {item.trend && <Trend trend={item.trend} pushLeft={!item.left} />}
            {item.right && <span className="shrink-0">{item.right}</span>}
          </div>
        ) : null}
      </div>
    </>
  )
}

function SummaryCard({
  item,
  selected,
  onSelect,
}: {
  item: SummaryItem
  selected: boolean
  onSelect?: (key: string) => void
}) {
  // การ์ดที่กดได้ใช้ <button> ส่วนการ์ดทั่วไปใช้ <div>
  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(item.key)}
        className={`${CARD_BASE} ${CARD_CLICKABLE} ${selected ? CARD_SELECTED : ''}`}
      >
        <CardBody item={item} />
      </button>
    )
  }

  return (
    <div className={`${CARD_BASE} ${selected ? CARD_SELECTED : ''}`}>
      <CardBody item={item} />
    </div>
  )
}

/* ---------- Main component ---------- */

function SummaryCards({ items, onSelect, selectedKey, columns = 4 }: SummaryCardsProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${GRID_COLUMNS[columns]}`}>
      {items.map((item) => (
        <SummaryCard
          key={item.key}
          item={item}
          selected={selectedKey !== undefined && selectedKey === item.key}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export default SummaryCards