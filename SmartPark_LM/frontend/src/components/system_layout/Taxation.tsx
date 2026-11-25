<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
=======
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
import { ArrowRight } from 'lucide-react'
import {
  Bar,
  BarChart,
<<<<<<< HEAD
=======
  CartesianGrid,
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
<<<<<<< HEAD
  type TooltipContentProps
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
} from 'recharts'
import Navbar from '@/components/system_layout/layout/Navbar'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import {
<<<<<<< HEAD
  RangeCalendar,
  RangeCalendarCell,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeNavButton,
  type DateValue,
  type RangeValue,
} from '@/components/tailgrids/core/range-calendar'
import {
=======
  reportRangeLabel,
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  taxDeadlines,
  taxMonthly,
  taxSummary,
  taxTransactions,
  type TaxDeadline,
  type TaxMonthly,
  type TaxTransaction,
<<<<<<< HEAD
} from '@/services/data/mockData'

import { Icon } from '@iconify/react'
import { useT, type TFunction } from '@/i18n'


=======
} from '@/types/_mockData'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface BarSeriesProps {
  name: string
  dataKey: 'revenue' | 'tax'
  gradientId: string
  color: string
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

<<<<<<< HEAD
// สีทั้งหมดอิง CSS variables ใน theme (--border, --surface, --text, --text-secondary)
// เพื่อให้เปลี่ยน Light/Dark ได้ ไม่ฮาร์ดโค้ดสี
const GRID_COLOR = 'var(--border)'

// เส้นคั่นใต้หัวการ์ดแบบ gradient (ใช้เฉพาะ Revenue vs Tax): กลางเข้ม -> ปลายสองข้างจางหาย
// ใช้ border-image ให้เส้นคม 1px เท่า border ปกติ (เหมือนหน้า Reports)
const DIVIDER_STYLE: CSSProperties = {
  borderImage:
    'linear-gradient(90deg, transparent 1.25%, var(--border) 40%, var(--border) 60%, transparent 98.75%) 1',
}

const COLORS = {
  // ดึงสีจาก theme (--chart-revenue-* / --chart-tax-*) เพื่อให้ Light/Dark ใช้คนละชุดได้
  revenue: { top: 'var(--chart-revenue-top)', bottom: 'var(--chart-revenue-bottom)' },
  tax: { top: 'var(--chart-tax-top)', bottom: 'var(--chart-tax-bottom)' },
} as const

const AXIS_TICK = { fontSize: 13, fill: 'var(--text-secondary)' }
=======
const GRID_COLOR = '#D2D2D7'
const GRID_WIDTH = 1

const COLORS = {
  revenue: { top: '#4D73F8', bottom: '#D6DFFE' },
  tax: { top: '#FF0037', bottom: '#FFD4DC' },
} as const

const AXIS_TICK = { fontSize: 13, fill: '#7E7E81' }
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
const Y_TICKS = [0, 100, 200, 300, 400, 500]
const formatYTick = (value: number) => (value === 0 ? '0' : `${value}K`)

const STATUS_COLOR: Record<TaxDeadline['status'], string> = {
  Overdue: 'text-[#C81E3A]',
  'Due Soon': 'text-[#C81E3A]',
  Upcoming: 'text-[#2771D8]',
}

<<<<<<< HEAD
const STATUS_KEY: Record<TaxDeadline['status'], string> = {
  Overdue: 'taxation.status.overdue',
  'Due Soon': 'taxation.status.dueSoon',
  Upcoming: 'taxation.status.upcoming',
}

const BAR_SERIES: BarSeriesProps[] = [
  { name: 'taxation.chart.revenue', dataKey: 'revenue', gradientId: 'taxRevenueFill', color: COLORS.revenue.top },
  { name: 'taxation.chart.tax', dataKey: 'tax', gradientId: 'taxTaxFill', color: COLORS.tax.top },
]

// เส้นคั่นแถวของตาราง: วาดที่ท้ายทุกเซลล์ (after:) เซลล์แรกเริ่มเว้นซ้าย เซลล์สุดท้ายจบเว้นขวา 16px
// วาดด้วย border (ไม่ใช่กล่องสูง 1px) เพื่อให้เส้นหนาเท่ากันทุกเส้นแม้ซูมเป็นเลขเศษ
// พื้นหลังตอน hover ของแถวจึงยังเต็มถึงขอบการ์ด
const ROW_LINE =
  "relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0 after:border-b after:border-[var(--border)] after:content-[''] first:after:left-4 last:after:right-4"

// ความสูงแถวเป็นเลขจำนวนเต็ม
const ROW_HEIGHT = 'h-[62px]'

// พื้นที่วาดกราฟ (ต้องตรงกับ margin ของ BarChart + ความกว้างแกน Y + ความสูงแกน X ด้านล่าง)
// ใช้ให้เส้นกริด HTML วางทับพื้นที่เดียวกับกราฟพอดี
const PLOT = { top: 10, right: 16, bottom: 30, left: 44 }
const Y_MAX = 500

// ช่วงวันที่เริ่มต้นของปุ่มเลือกช่วง (แก้ปี/เดือนให้ตรงกับข้อมูลจริงได้ที่นี่)
// ตั้งให้ตรงกับหน้า Reports
const DEFAULT_RANGE: RangeValue<DateValue> = {
  start: new CalendarDate(2026, 10, 1),
  end: new CalendarDate(2026, 10, 13),
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

// อ่านค่าที่บันทึกจากหน้า Settings (ค่าเริ่มต้นคือเปิด)
const readGradients = () => localStorage.getItem('gradients') !== 'off'

=======
const BAR_SERIES: BarSeriesProps[] = [
  { name: 'Revenue', dataKey: 'revenue', gradientId: 'taxRevenueFill', color: COLORS.revenue.top },
  { name: 'Tax', dataKey: 'tax', gradientId: 'taxTaxFill', color: COLORS.tax.top },
]

>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
/* -------------------------------------------------------------------------- */
/* CSV export                                                                 */
/* -------------------------------------------------------------------------- */

<<<<<<< HEAD
function buildDeadlinesCsv(deadlines: TaxDeadline[], t: TFunction): string {
  const header = [t('taxation.csv.date'), t('taxation.csv.code'), t('taxation.csv.description'), t('taxation.csv.status')]
=======
function buildDeadlinesCsv(deadlines: TaxDeadline[]): string {
  const header = ['Date', 'Code', 'Description', 'Status']
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const rows = deadlines.map((d) => [`"${d.date}"`, d.code, `"${d.title}"`, d.status])

  // BOM (\uFEFF) so Excel opens UTF-8 correctly
  return '\uFEFF' + [header, ...rows].map((cols) => cols.join(',')).join('\n')
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/* -------------------------------------------------------------------------- */
/* Small components                                                           */
/* -------------------------------------------------------------------------- */

<<<<<<< HEAD
// gradient = true -> เส้นล่างเป็น gradient, ไม่ใส่ -> เส้นทึบปกติ
function CardHeader({ title, gradient = false, children }: { title: string; gradient?: boolean; children?: ReactNode }) {
  return (
    <div
      style={gradient ? DIVIDER_STYLE : undefined}
      className={`flex items-center justify-between border-b px-[26.5px] py-[14.5px] ${gradient ? '' : 'border-[var(--border)]'}`}
    >
      <h2 className="text-[18.825px] font-medium text-ink-1">{title}</h2>
=======
function LegendItem({ label, from, to, className }: { label: string; from: string; to: string; className: string }) {
  return (
    <span className={`flex items-center gap-4 ${className}`}>
      <span
        className="h-4 w-4 rounded-full"
        style={{ backgroundImage: `linear-gradient(to bottom, ${from}, ${to})` }}
      />
      {label}
    </span>
  )
}

function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-[26.5px] py-[14.5px]">
      <h2 className="text-[18.825px] font-medium text-[#0F172A]">{title}</h2>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      {children}
    </div>
  )
}

function ViewAllButton() {
<<<<<<< HEAD
  const t = useT()
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-[9.5px] border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-[13.45px] text-ink-1 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]"
    >
      {t('taxation.viewAll')} <ArrowRight size={13} />
=======
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-[9.5px] border border-line bg-white px-4 py-1.5 text-[13.45px] text-[#0F172A] transition hover:bg-gray-50"
    >
      View all <ArrowRight size={13} />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </button>
  )
}

function CardFooter({ text }: { text: string }) {
  return (
<<<<<<< HEAD
    <div className="flex items-center justify-center py-5 text-[13.45px] text-ink-2">
=======
    <div className="flex items-center justify-center py-5 text-[13.45px] text-[#7E7E81]">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      <span>{text}</span>
    </div>
  )
}

<<<<<<< HEAD
/** One bar with a white label inside the top. gradients = false -> solid color. */
function TaxBar({ name, dataKey, gradientId, color, gradients }: BarSeriesProps & { gradients: boolean }) {
  const t = useT()
  return (
    <Bar
      name={t(name)}
      dataKey={dataKey}
      // เปิด gradient -> ไล่สี / ปิด -> สีทึบสีเดียว (ใช้สีเดียวกับเส้นขอบ)
      fill={gradients ? `url(#${gradientId})` : color}
=======
/** One gradient-filled bar with a white label inside the top. */
function TaxBar({ name, dataKey, gradientId, color }: BarSeriesProps) {
  return (
    <Bar
      name={name}
      dataKey={dataKey}
      fill={`url(#${gradientId})`}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      stroke={color}
      strokeWidth={1}
      radius={[2, 2, 0, 0]}
      maxBarSize={68}
      isAnimationActive={false}
    >
      <LabelList
        dataKey={dataKey}
        position="insideTop"
        offset={10}
        formatter={(value: unknown) => `${String(value)}K`}
        style={{ fill: '#FFFFFF', fontSize: 13, fontWeight: 400 }}
      />
    </Bar>
  )
}

<<<<<<< HEAD
export const GOO_ID = 'chart-goo'

// Must be rendered once inside any chart that uses the goo tooltip,
// so that filter: url(#...) can resolve in the DOM.
export function GooFilter() {
  return (
    <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden="true">
      <defs>
        <filter id={GOO_ID} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
          />
        </filter>
      </defs>
    </svg>
  )
}

const TAX_PILL = 'flex h-6 min-w-[62px] items-center justify-center px-2 text-[11px] font-bold whitespace-nowrap'

function TaxationTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload || payload.length === 0) return null

  // look values up by key, so the order of your <Bar>s doesn't matter
  const revenue = payload.find((p) => p.dataKey === 'revenue')
  const tax = payload.find((p) => p.dataKey === 'tax')

  const revenueText = `${Number(revenue?.value ?? 0)}K`
  const taxText = `${Number(tax?.value ?? 0)}K`

  return (
    <div className="relative -translate-x-1/2 -translate-y-[calc(100%+12px)]">
      {/* shapes layer: single-color background + goo filter (text is invisible so sizes match the text layer) */}
      <div className="flex items-center gap-0.5" style={{ filter: `url(#${GOO_ID})` }} aria-hidden="true">
        <div className={`${TAX_PILL} rounded-xl bg-[#F5F5F7]`}>
          <span className="invisible">{revenueText}</span>
        </div>
        <div className={`${TAX_PILL} rounded-full bg-[#F5F5F7]`}>
          <span className="invisible">{taxText}</span>
        </div>
      </div>

      {/* text layer: same sizes as the shapes layer */}
      <div className="absolute inset-0 flex items-center gap-0.5">
        <span className={`${TAX_PILL} text-[#4D73F8]`}>{revenueText}</span>
        <span style={{ color: tax?.color }} className={`${TAX_PILL} text-[#FF416A]`}>
          {taxText}
        </span>
      </div>
    </div>
  )
}

/**
 * เส้นกริดแนวนอนวาดด้วย border ของ HTML (ไม่ใช่เส้น SVG ของ recharts)
 * เพราะเบราว์เซอร์ปัดความหนา border เป็นพิกเซลเต็มเสมอ เส้นจึงหนาเท่ากันทุกเส้น แม้ซูมเป็นเลขเศษ
 */
function ChartGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-0"
      style={{ top: PLOT.top, right: PLOT.right, bottom: PLOT.bottom, left: PLOT.left }}
    >
      {Y_TICKS.map((tick) => (
        <div
          key={tick}
          className="absolute inset-x-0 border-t"
          style={{ top: `${100 - (tick / Y_MAX) * 100}%`, borderColor: GRID_COLOR }}
        />
      ))}
    </div>
  )
}

function RevenueTaxChart({ data }: { data: TaxMonthly[] }) {
  const gradients = readGradients()

  return (
    <div className="relative h-56 w-full sm:h-64 lg:h-[262px]">
      <GooFilter />
      <ChartGrid />
      <div className="relative z-10 h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: PLOT.top, right: PLOT.right, left: 0, bottom: 0 }}
          barGap={14}
          barCategoryGap="24%"
        >
          {/* เปิด gradient -> มี defs / ปิด -> ไม่ต้องมี */}
          {gradients && (
            <defs>
              <linearGradient id="taxRevenueFill" x1="0" y1="0" x2="0" y2="1">
                {/* ใช้ style แทน attribute เพื่อให้ var(--...) ทำงานได้แน่นอนใน SVG */}
                <stop offset="0%" style={{ stopColor: COLORS.revenue.top }} />
                <stop offset="100%" style={{ stopColor: COLORS.revenue.bottom }} />
              </linearGradient>
              <linearGradient id="taxTaxFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: COLORS.tax.top }} />
                <stop offset="100%" style={{ stopColor: COLORS.tax.bottom }} />
              </linearGradient>
            </defs>
          )}

          {/* เส้นกริดอยู่ใน <ChartGrid /> ด้านหลังกราฟ จึงไม่ใช้ CartesianGrid และไม่วาดเส้นแกน X */}
=======
function RevenueTaxChart({ data }: { data: TaxMonthly[] }) {
  return (
    <div className="h-56 w-full sm:h-64 lg:h-[262px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          barGap={14}
          barCategoryGap="24%"
        >
          <defs>
            <linearGradient id="taxRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.revenue.top} />
              <stop offset="100%" stopColor={COLORS.revenue.bottom} />
            </linearGradient>
            <linearGradient id="taxTaxFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.tax.top} />
              <stop offset="100%" stopColor={COLORS.tax.bottom} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={GRID_WIDTH} shapeRendering="crispEdges" />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          <XAxis
            dataKey="month"
            tick={AXIS_TICK}
            tickLine={false}
<<<<<<< HEAD
            axisLine={false}
            tickMargin={10}
            height={PLOT.bottom}
          />
          <YAxis
            domain={[0, Y_MAX]}
=======
            axisLine={{ stroke: GRID_COLOR }}
            tickMargin={10}
          />
          <YAxis
            domain={[0, 500]}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
            ticks={Y_TICKS}
            tickFormatter={formatYTick}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
<<<<<<< HEAD
            width={PLOT.left}
=======
            width={44}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ fill: '#227eff1c' }}
<<<<<<< HEAD
            content={<TaxationTooltip />}
            labelStyle={{ color: 'var(--text)' }}
=======
            contentStyle={{ fontSize: 12, padding: 12, borderRadius: 8, border: `1px solid ${GRID_COLOR}` }}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
            wrapperStyle={{ outline: 'none', zIndex: 50 }}
            formatter={(value, name) => [`${Number(value)}K`, String(name)]}
          />

          {BAR_SERIES.map((series) => (
<<<<<<< HEAD
            <TaxBar key={series.dataKey} {...series} gradients={gradients} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      </div>
=======
            <TaxBar key={series.dataKey} {...series} />
          ))}
        </BarChart>
      </ResponsiveContainer>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

function TransactionsCard({ items }: { items: TaxTransaction[] }) {
<<<<<<< HEAD
  const t = useT()
  return (
    <section className="card flex flex-col overflow-hidden">
      <CardHeader title={t('taxation.recentTransaction')}>
=======
  return (
    <section className="card flex flex-col overflow-hidden">
      <CardHeader title="Recent Transaction">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        <ViewAllButton />
      </CardHeader>

      <div className="overflow-x-auto">
<<<<<<< HEAD
        <table className="w-full table-fixed border-collapse text-left text-[15.25px] text-ink-1">
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`${ROW_HEIGHT} transition-colors`}>
                <td className={`${ROW_LINE} w-[34%] whitespace-nowrap border-r border-[var(--border)] px-3 text-center`}>
                  {item.date}
                </td>
                <td className={`${ROW_LINE} truncate px-5`}>{item.message}</td>
=======
        <table className="w-full table-fixed border-collapse text-left text-[15.25px] text-[#0F172A]">
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line transition-colors hover:bg-gray-50">
                <td className="w-[34%] whitespace-nowrap border-r border-line px-3 py-[18px] text-center">
                  {item.date}
                </td>
                <td className="truncate px-5 py-[18px]">{item.message}</td>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
              </tr>
            ))}
          </tbody>
        </table>
      </div>

<<<<<<< HEAD
      <CardFooter text={t('taxation.transactionsMore')} />
=======
      <CardFooter text="50+ Transactions, More" />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </section>
  )
}

function DeadlinesCard({ items }: { items: TaxDeadline[] }) {
<<<<<<< HEAD
  const t = useT()
  return (
    <section className="card flex flex-col overflow-hidden">
      <CardHeader title={t('taxation.taxDeadlines')}>
=======
  return (
    <section className="card flex flex-col overflow-hidden">
      <CardHeader title="Tax Deadlines">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        <ViewAllButton />
      </CardHeader>

      <div className="overflow-x-auto">
<<<<<<< HEAD
        <table className="w-full table-fixed border-collapse text-left text-[15.25px] text-ink-1">
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={`${ROW_HEIGHT} transition-colors`}>
                <td className={`${ROW_LINE} w-[22%] whitespace-nowrap border-r border-[var(--border)] px-3 text-center`}>
                  {item.date}
                </td>
                <td className={`${ROW_LINE} w-[14%] whitespace-nowrap border-r border-[var(--border)] px-3 text-center`}>
                  {item.code}
                </td>
                <td className={`${ROW_LINE} truncate border-r border-[var(--border)] px-5`}>{item.title}</td>
                <td
                  className={`${ROW_LINE} w-[16%] whitespace-nowrap px-3 text-center font-normal ${STATUS_COLOR[item.status]}`}
                >
                  {t(STATUS_KEY[item.status])}
=======
        <table className="w-full table-fixed border-collapse text-left text-[15.25px] text-[#0F172A]">
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line transition-colors hover:bg-gray-50">
                <td className="w-[22%] whitespace-nowrap border-r border-line px-3 py-[18px] text-center">
                  {item.date}
                </td>
                <td className="w-[14%] whitespace-nowrap border-r border-line px-3 py-[18px] text-center">
                  {item.code}
                </td>
                <td className="truncate border-r border-line px-5 py-[18px]">{item.title}</td>
                <td
                  className={`w-[16%] whitespace-nowrap px-3 py-[18px] text-center font-normal ${STATUS_COLOR[item.status]}`}
                >
                  {item.status}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

<<<<<<< HEAD
      <CardFooter text={t('taxation.deadlinesMore')} />
=======
      <CardFooter text="2+ Transactions, More" />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

function Taxation() {
<<<<<<< HEAD
  const t = useT()
  const { url_uuid } = useParams()

  // ปุ่มเลือกช่วงวันที่ + ปฏิทิน popover
  const [range, setRange] = useState<RangeValue<DateValue>>(DEFAULT_RANGE)
  const [calOpen, setCalOpen] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  // ปิดเมื่อคลิกนอกกล่อง หรือกด Esc
  useEffect(() => {
    if (!calOpen) return
    const onDown = (e: MouseEvent) => {
      if (!calRef.current?.contains(e.target as Node)) setCalOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCalOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [calOpen])

  const rangeLabel = useMemo(() => {
    const fmt = (d: DateValue) =>
      d.toDate(getLocalTimeZone()).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    return `${fmt(range.start)} - ${fmt(range.end)}`
  }, [range])

  const handleExport = () => {
    downloadCsv(buildDeadlinesCsv(taxDeadlines, t), 'tax-and-accounting.csv')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('taxation.title')}
        subtitle={
          <>
            <div ref={calRef} className="relative ml-3">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={calOpen}
                onClick={() => setCalOpen((o) => !o)}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-[9.5px] border border-[var(--border)] bg-[var(--surface)] px-8 py-2 text-[15px] text-ink-2 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]"
              >
                <Icon icon="lucide:calendar-fold" height="1.25em" className="shrink-0 [&_*]:stroke-[1.55]" />
                {rangeLabel}
              </button>

              {calOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                  <RangeCalendar
                    aria-label={t('taxation.selectDateRange')}
                    value={range}
                    onChange={(v) => {
                      setRange(v)
                      setCalOpen(false)
                    }}
                  >
                    <RangeCalendarHeader>
                      <RangeNavButton slot="previous" />
                      <RangeCalendarHeading />
                      <RangeNavButton slot="next" />
                    </RangeCalendarHeader>
                    <RangeCalendarGrid>
                      <RangeCalendarGridHeader />
                      <RangeCalendarGridBody>
                        {(date) => <RangeCalendarCell date={date} />}
                      </RangeCalendarGridBody>
                    </RangeCalendarGrid>
                  </RangeCalendar>
                </div>
              )}
            </div>
            <Link
              to={`/system/${url_uuid}/reports`}
              className="ml-1 rounded-[9.5px] border border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-[15px] text-ink-2 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]"
            >
              {t('taxation.seeReports')}
=======
  const { url_uuid } = useParams()

  const handleExport = () => {
    downloadCsv(buildDeadlinesCsv(taxDeadlines), 'tax-and-accounting.csv')
  }

  return (
    <>
      <Navbar
        title="Tax & Accounting"
        subtitle={
          <>
            <span className="ml-3 rounded-[9.5px] border border-[#D2D2D7] bg-white px-8 py-2 text-[15px] text-[#6F6F72]">
              {reportRangeLabel}
            </span>
            <Link
              to={`/system/${url_uuid}/reports`}
              className="ml-1 rounded-[9.5px] border border-[#D2D2D7] bg-white px-6 py-2 text-[15px] text-[#6F6F72] transition hover:bg-gray-50"
            >
              See Reports
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
            </Link>
          </>
        }
        actions={
          <button
            type="button"
            className="rounded-full bg-[#2771D8] px-7 py-2.5 text-[15.5px] font-normal text-white transition hover:bg-brand-dark"
            onClick={handleExport}
          >
<<<<<<< HEAD
            {t('taxation.exportExcel')}
=======
            Export Excel
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          </button>
        }
      />

<<<<<<< HEAD
      <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 sm:px-8">
=======
      <main className="space-y-6 p-4 sm:p-6">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        <SummaryCards items={taxSummary} />

        {/* Revenue vs. tax chart */}
        <section className="card overflow-hidden">
<<<<<<< HEAD
          <CardHeader title={t('taxation.revenueVsTax')} gradient />
=======
          <CardHeader title="Revenue vs Tax">
            <div className="flex items-center gap-5 text-[15px] text-[#7E7E81]">
              <LegendItem label="Revenue" from={COLORS.revenue.top} to={COLORS.revenue.bottom} className="mr-3" />
              <LegendItem label="Tax" from={COLORS.tax.top} to={COLORS.tax.bottom} className="mr-7" />
            </div>
          </CardHeader>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

          <div className="p-6 pt-11">
            <RevenueTaxChart data={taxMonthly} />
          </div>
        </section>

        {/* Tables */}
        <div className="grid gap-6 lg:grid-cols-[44%_1fr]">
          <TransactionsCard items={taxTransactions} />
          <DeadlinesCard items={taxDeadlines} />
        </div>
      </main>
<<<<<<< HEAD
    </div>
=======
    </>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

export default Taxation