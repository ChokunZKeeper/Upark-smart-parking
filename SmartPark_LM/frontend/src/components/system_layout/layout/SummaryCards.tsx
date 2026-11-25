import type { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useT, type TFunction } from '@/i18n'

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

// เส้นคั่นใต้หัวการ์ด: Radial gradient (ตรงกลางเข้ม -> ขอบจางหาย)
// ใช้สี --border ของธีม จึงเปลี่ยนตาม Light / Dark อัตโนมัติ
const DIVIDER_STYLE: CSSProperties = {
  background:
    'radial-gradient(ellipse closest-side at 50% 50%, var(--border) 20%, transparent 97.5%)',
}

/* ---------- Helpers ---------- */

const hasNoValue = (value: SummaryItem['value']) =>
  value === null || value === undefined || value === '' || value === 'No Data'

// แปลข้อความจาก mock data (ภาษาอังกฤษ) เป็น key ใน summaryCards.json ถ้าไม่ตรงรูปแบบจะแสดงข้อความเดิม
const LABEL_KEYS: Record<string, string> = {
  'Total Revenue': 'summaryCards.label.totalRevenue',
  'Current Vehicles': 'summaryCards.label.currentVehicles',
  'Today Revenue': 'summaryCards.label.todayRevenue',
  'This Week Revenue': 'summaryCards.label.weekRevenue',
  'This Month Revenue': 'summaryCards.label.monthRevenue',
  'This Year Revenue': 'summaryCards.label.yearRevenue',
  'Avg. Park time': 'summaryCards.label.avgParkTime',
  'No Data': 'summaryCards.noData',
}

const PREVIOUS_ITEM_KEYS: Record<string, string> = { Revenue: 'revenue', Cars: 'cars', 'Park time': 'parkTime' }

const translateText = (t: TFunction, text: string): string => {
  if (LABEL_KEYS[text]) return t(LABEL_KEYS[text])
  const prev = text.match(/^Previous (Day|Week|Month|Year) (Revenue|Cars|Park time)$/)
  if (prev) return t('summaryCards.previous.' + prev[1].toLowerCase() + '.' + PREVIOUS_ITEM_KEYS[prev[2]])
  const trend = text.match(/^([\d.]+)% vs last (day|week|month|year)$/)
  if (trend) return t('summaryCards.trend.' + trend[2], { percent: trend[1] })
  const hours = text.match(/^([\d.]+) Hours$/)
  if (hours) return t('summaryCards.hours', { value: hours[1] })
  return text
}

/* ---------- Sub components ---------- */

function Trend({ trend, pushLeft }: { trend: SummaryTrend; pushLeft: boolean }) {
  const t = useT()
  const color = trend.up ? 'text-[#24A703]' : 'text-[#DC2626]'
  const Arrow = trend.up ? ArrowUp : ArrowDown

  return (
    <span
      className={`flex shrink-0 items-center gap-0.5 text-[12px] font-medium ${color} ${pushLeft ? 'mr-auto' : ''}`}
    >
      <Arrow size={12} />
      {translateText(t, trend.text)}
    </span>
  )
}

function CardBody({ item }: { item: SummaryItem }) {
  const t = useT()
  // ไม่มีข้อมูล -> แสดง 0 และซ่อน left / trend / right (เช่น Private 26%)
  const empty = hasNoValue(item.value)
  const displayValue = empty ? DEFAULT_VALUE : item.value

  return (
    <>
      {/* border-transparent คงความสูงเดิมของเส้น 1px ไว้ แล้ววางเส้น gradient ทับด้านล่าง */}
      <span className="relative block w-full border-b border-transparent px-5 py-[7px] text-[13.25px] font-medium leading-5 text-ink">
        {translateText(t, item.label)}
        <span aria-hidden className="absolute inset-x-0 bottom-[-1px] h-px" style={DIVIDER_STYLE} />
      </span>

      <div className="px-5 pb-3 pt-2.5">
        <span className="block text-[18.5px] font-medium leading-7 tracking-tight text-ink">
          {typeof displayValue === 'string' ? translateText(t, displayValue) : displayValue}
        </span>

        {!empty && (item.left || item.trend || item.right) ? (
          <div className="mt-1 flex items-center justify-between gap-1 text-[12px] leading-[18px] text-ink-3">
            {item.left ? <span className="truncate">{typeof item.left === 'string' ? translateText(t, item.left) : item.left}</span> : null}
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