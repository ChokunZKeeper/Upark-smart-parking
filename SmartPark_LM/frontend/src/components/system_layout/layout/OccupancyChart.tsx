import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useT } from '@/i18n'

/* ---------- Types ---------- */

export interface OccupancyPoint {
  time: string
  value: number | null
}

export type OccupancyChartType = 'line' | 'bar'

type TickValue = string | number

interface OccupancyChartProps {
  data?: OccupancyPoint[]
  type: OccupancyChartType

  /* ---- ตัวเลือกเสริม: ไม่ใส่ = ทำงานเหมือนเดิมทุกอย่าง (ใช้กับ Dashboard) ---- */

  // ช่วงแกน Y: [ต่ำสุด, สูงสุด] หรือ 'auto' ให้คำนวณเอง (ค่าเริ่มต้น [0, 1000])
  yDomain?: [number, number] | 'auto'
  // ตำแหน่งเส้นกริด/เลขแกน Y หรือ 'auto' (ค่าเริ่มต้น 0, 250, 500, 750, 1000)
  yTicks?: number[] | 'auto'
  // ความกว้างพื้นที่เลขแกน Y (ค่าเริ่มต้น 36)
  yAxisWidth?: number
  // แปลงเลขแกน Y เป็นข้อความ เช่น 7000 -> '7k' (คืนค่า '' = ไม่แสดงเลขตำแหน่งนั้น)
  formatYTick?: (value: number) => TickValue
  // เลือกว่าจะแสดงเลขแกน X ที่จุดไหน (ค่าเริ่มต้น: ทุก 4 จุด)
  showXTick?: (index: number, value: TickValue) => boolean
  // ข้อความบรรทัดบนของ tooltip (ค่าเริ่มต้น: label ของแกน X ตรง ๆ)
  formatTooltipLabel?: (label: TickValue) => TickValue
  // ข้อความบรรทัดค่าของ tooltip (ค่าเริ่มต้น: `Vehicles : ${value}`)
  formatTooltipValue?: (value: number) => string
}

interface XTickProps {
  x?: number
  y?: number
  payload?: { value: TickValue }
  index?: number
  visibleTicksCount?: number
  show?: (index: number, value: TickValue) => boolean
}

interface YTickProps {
  x?: number
  y?: number
  payload?: { value: TickValue }
  format?: (value: number) => TickValue
}

interface TooltipContentProps {
  active?: boolean
  payload?: { value?: number | null }[]
  label?: TickValue
  formatLabel?: (label: TickValue) => TickValue
  formatValue?: (value: number) => string
}

interface StripedBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number | null
  gradients?: boolean
}

interface AxesOptions {
  empty: boolean
  yDomain: [number, number] | 'auto'
  yTicks: number[] | 'auto'
  yAxisWidth: number
  formatYTick?: (value: number) => TickValue
  showXTick?: (index: number, value: TickValue) => boolean
}

/* ---------- Constants ---------- */

const TICK_FONT_SIZE = 13
// สีตามธีม: ค่าจริงอยู่ใน CSS global (Light / Dark)
const TICK_COLOR = 'var(--text-tertiary)'
const GRID_COLOR = 'var(--border)'
const DEFAULT_Y_DOMAIN: [number, number] = [0, 1000]
const DEFAULT_Y_TICKS = [0, 250, 500, 750, 1000]
const DEFAULT_Y_WIDTH = 36

// สีทึบตอนปิด gradient
const SOLID_BAR_COLOR = '#2563EB'

// ตอนยังไม่มีข้อมูล: แสดงเส้นกริดแต่ไม่แสดงค่าบนแกน
// ปรับจำนวนเส้นได้ที่นี่ (ตอนนี้ 4 เส้น)
const EMPTY_GRID_LINES = 4
const emptyYTicks = Array.from({ length: EMPTY_GRID_LINES }, (_, i) =>
  Math.round((i * 1000) / (EMPTY_GRID_LINES - 1)),
)

// ข้อมูลว่าง: 25 จุด 00:00 - 24:00 (ใช้แสดงแกนตอนยังไม่มีข้อมูล)
const emptyChartData: OccupancyPoint[] = Array.from({ length: 25 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  value: null,
}))

/* ---------- Helpers ---------- */

// ไม่มีข้อมูล = ไม่มีจุดเลย หรือทุกจุดเป็น null / 0
const hasNoData = (data?: OccupancyPoint[]) => !data || data.every((point) => !point.value)

// อ่านค่าที่บันทึกจากหน้า Settings (ค่าเริ่มต้นคือเปิด)
const readGradients = () => localStorage.getItem('gradients') !== 'off'

/* ---------- Ticks / tooltip ---------- */

// tick ที่ไม่วาดอะไรเลย: ให้ Recharts ยังคำนวณ tick (เพื่อใช้วาดเส้นกริด) แต่ไม่แสดงตัวเลข
// (ถ้าใช้ tick={false} เส้นกริดอาจหายเหลือแค่เส้นบนสุดกับล่างสุด)
const HiddenTick = () => null

function XTick({ x = 0, y = 0, payload, index = 0, visibleTicksCount = 0, show }: XTickProps) {
  const visible = show ? show(index, payload?.value ?? '') : index % 4 === 0
  if (!visible) return null
  const anchor = index === 0 ? 'start' : index === visibleTicksCount - 1 ? 'end' : 'middle'
  return (
    <text x={x} y={y + 12} dy={4} textAnchor={anchor} fontSize={TICK_FONT_SIZE} fill={TICK_COLOR}>
      {payload?.value}
    </text>
  )
}

function YTick({ x = 0, y = 0, payload, format }: YTickProps) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={TICK_FONT_SIZE} fill={TICK_COLOR}>
      {format ? format(Number(payload?.value)) : payload?.value}
    </text>
  )
}

const GOO_ID = 'occupancy-goo'

// ต้อง render ไว้ใน DOM 1 ครั้ง เพื่อให้ CSS filter: url(#...) อ้างถึงได้
function GooFilter() {
  return (
    <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden="true">
      <defs>
        {/* region ใหญ่กว่า bounding box เพื่อไม่ให้ blur ถูกตัดขอบ */}
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

const PILL_MAIN = 'flex h-7.5 min-w-[60px] items-center justify-center rounded-xl px-3 text-[13px] font-medium'
const PILL_SUB = 'flex h-6 min-w-[54px] items-center justify-center rounded-full px-2 text-[11px] font-medium'

function OccupancyTooltip({ active, payload, label, formatLabel, formatValue }: TooltipContentProps) {
  const t = useT()
  const value = payload?.[0]?.value
  if (!active || value == null) return null

  const valueText = formatValue ? formatValue(value) : t('occupancyChart.vehiclesValue', { value })
  const labelText = formatLabel ? formatLabel(label ?? '') : label

  return (
    <div className="relative -translate-x-1/2 -translate-y-[calc(100%+12px)]">
      {/* shapes layer: พื้นหลังสีเดียว + goo filter (ข้อความ invisible เพื่อให้ขนาดเท่ากับ text layer) */}
      <div className="flex items-center gap-1.5" style={{ filter: `url(#${GOO_ID})` }} aria-hidden="true">
        <div className={`${PILL_MAIN} bg-[#F5F5F7]`}>
          <span className="invisible whitespace-nowrap">{valueText}</span>
        </div>
        <div className={`${PILL_SUB} bg-[#F5F5F7]`}>
          <span className="invisible whitespace-nowrap">{labelText}</span>
        </div>
      </div>

      {/* text layer: ขนาดเดียวกับ shapes layer */}
      <div className="absolute inset-0 flex items-center gap-1.5">
        <span className={`${PILL_MAIN} whitespace-nowrap text-[#212121]`}>{valueText}</span>
        <span className={`${PILL_SUB} whitespace-nowrap text-[#0055ff]`}>{labelText}</span>
      </div>
    </div>
  )
}

// empty = true -> ไม่มีเส้นกริด ไม่มีตัวเลขบนแกน x / y (ยังเว้นพื้นที่แกนไว้ให้ layout ไม่ขยับ)
const buildAxes = ({ empty, yDomain, yTicks, yAxisWidth, formatYTick, showXTick }: AxesOptions) => {
  const yProps: { domain?: [number, number]; ticks?: number[] } = empty
    ? { domain: DEFAULT_Y_DOMAIN, ticks: emptyYTicks }
    : {
        ...(yDomain === 'auto' ? {} : { domain: yDomain }),
        ...(yTicks === 'auto' ? {} : { ticks: yTicks }),
      }

  return (
    <>
      {/* ไม่มีข้อมูล -> ไม่วาดเส้นกริดเลย */}
      {!empty && <CartesianGrid vertical={false} stroke={GRID_COLOR} shapeRendering="crispEdges" />}
      <XAxis
        dataKey="time"
        tick={empty ? <HiddenTick /> : <XTick show={showXTick} />}
        tickLine={false}
        axisLine={false}
        interval={0}
      />
      <YAxis
        {...yProps}
        tick={empty ? <HiddenTick /> : <YTick format={formatYTick} />}
        tickLine={false}
        axisLine={false}
        interval={0}
        width={yAxisWidth}
      />
    </>
  )
}

/* ---------- Striped bar ---------- */

// ต้องวางเป็น <defs> ตรง ๆ ใน BarChart (Recharts จะตัด component ที่ไม่รู้จักทิ้ง)
const barDefs = (
  <defs>
    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="10%" stopColor="var(--bar-start)" stopOpacity={1} />
      <stop offset="55%" stopColor="var(--bar-mid)" stopOpacity={0.75} />
      <stop offset="100%" stopColor="var(--bar-end)" stopOpacity={0.25} />
    </linearGradient>
  </defs>
)

// แท่งสิ้นสุดที่เส้น y=0 พอดี: มุมบนมน มุมล่างเหลี่ยม ไม่มีเส้นขอบล่าง (ให้เส้นกริดเป็นเส้นฐานแทน)
// gradients = false -> ใช้สีทึบสีเดียว
function StripedBar({ x = 0, y = 0, width = 0, height = 0, value, gradients = true }: StripedBarProps) {
  if (!value || height <= 0) return null

  const r = Math.min(2, width / 2, height / 2)
  const bottom = y + height
  const d =
    `M${x},${bottom} V${y + r} ` +
    `A${r},${r} 0 0 1 ${x + r},${y} H${x + width - r} A${r},${r} 0 0 1 ${x + width},${y + r} ` +
    `V${bottom}`

  return (
    <g>
      <path d={`${d} Z`} fill={gradients ? 'url(#barGrad)' : SOLID_BAR_COLOR} />
      <path d={d} fill="none" stroke={SOLID_BAR_COLOR} strokeWidth={1} />
    </g>
  )
}

/* ---------- Chart ---------- */

function OccupancyChart({
  data,
  type,
  yDomain = DEFAULT_Y_DOMAIN,
  yTicks = DEFAULT_Y_TICKS,
  yAxisWidth = DEFAULT_Y_WIDTH,
  formatYTick,
  showXTick,
  formatTooltipLabel,
  formatTooltipValue,
}: OccupancyChartProps) {
  const gradients = readGradients()
  const empty = hasNoData(data)
  const chartData = empty ? emptyChartData : (data as OccupancyPoint[])
  const axes = buildAxes({ empty, yDomain, yTicks, yAxisWidth, formatYTick, showXTick })

  const tooltipContent = <OccupancyTooltip formatLabel={formatTooltipLabel} formatValue={formatTooltipValue} />
  // offset 0 + allowEscapeViewBox: ให้ wrapper อยู่ที่จุด cursor พอดี แล้ว translate ใน content จัดตำแหน่งเอง
  const tooltipCommon = {
    isAnimationActive: false,
    content: tooltipContent,
    offset: 0,
    allowEscapeViewBox: { x: true, y: true },
    wrapperStyle: { outline: 'none', zIndex: 50, pointerEvents: 'none' as const },
  }


  return (
    // outline-none: เอากรอบสีส้ม (focus outline) ตอนคลิกกราฟออก
    <div className="relative h-56 w-full sm:h-64 lg:h-[262px] [&_*]:outline-none [&_*:focus]:outline-none [&_*:focus-visible]:outline-none">
      <GooFilter />
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 262 }}>
        {type === 'line' ? (
          <AreaChart accessibilityLayer={false} data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            {/* เปิด gradient -> มี defs / ปิด -> ไม่ต้องมี */}
            {gradients && (
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="20%" stopColor="#0055ff" stopOpacity={1} />
                  <stop offset="30%" stopColor="#0055ff" stopOpacity={0.9} />
                  <stop offset="55%" stopColor="#0055ffb9" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#0055ff11" stopOpacity={0.575} />
                </linearGradient>
              </defs>
            )}
            {axes}
            {/* ไม่มีข้อมูล -> ไม่ใส่ Tooltip / เส้นเลื่อน / จุดวงกลม เลื่อนเมาส์แล้วไม่มีอะไรขยับ */}
            {!empty && (
              <Tooltip
                isAnimationActive={false}
                cursor={{ stroke: GRID_COLOR }}
                content={tooltipContent}
                wrapperStyle={{ outline: 'none', zIndex: 50 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3369FF"
              strokeWidth={2.8}
              activeDot={empty ? false : { r: 5.15, fill: 'var(--surface)', stroke: '#3369FF', strokeWidth: 3.5 }}
              // ปิด gradient -> เหลือแค่เส้น ไม่มีพื้นที่สีใต้เส้น
              fill={gradients ? 'url(#areaFill)' : 'none'}
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <BarChart accessibilityLayer={false} data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }} barCategoryGap="12%">
            {gradients && barDefs}
            {axes}
            {!empty && (
              <Tooltip
                isAnimationActive={false}
                cursor={{ fill: '#227eff1c' }}
                content={tooltipContent}
                wrapperStyle={{ outline: 'none', zIndex: 50 }}
              />
            )}
            <Bar
              dataKey="value"
              shape={(props: unknown) => (
                <StripedBar {...(props as StripedBarProps)} gradients={gradients} />
              )}
              isAnimationActive={false}
            />

            {/* เส้นล่างสุด (y=0) ให้อยู่หน้าแท่ง: ต้องอยู่หลัง <Bar> */}
            {!empty && (
              <ReferenceLine y={0} stroke={GRID_COLOR} ifOverflow="visible" shapeRendering="crispEdges" />
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default OccupancyChart