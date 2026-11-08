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

/* ---------- Types ---------- */

export interface OccupancyPoint {
  time: string
  value: number | null
}

export type OccupancyChartType = 'line' | 'bar'

interface OccupancyChartProps {
  data?: OccupancyPoint[]
  type: OccupancyChartType
}

interface XTickProps {
  x?: number
  y?: number
  payload?: { value: string | number }
  index?: number
  visibleTicksCount?: number
}

interface YTickProps {
  x?: number
  y?: number
  payload?: { value: string | number }
}

interface TooltipContentProps {
  active?: boolean
  payload?: { value?: number | null }[]
  label?: string | number
}

interface StripedBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number | null
}

/* ---------- Constants ---------- */

const TICK_FONT_SIZE = 13
const TICK_COLOR = '#7E7E81'
const GRID_COLOR = '#D2D2D7'
const yTicks = [0, 250, 500, 750, 1000]

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

/* ---------- Ticks / tooltip ---------- */

// tick ที่ไม่วาดอะไรเลย: ให้ Recharts ยังคำนวณ tick (เพื่อใช้วาดเส้นกริด) แต่ไม่แสดงตัวเลข
// (ถ้าใช้ tick={false} เส้นกริดอาจหายเหลือแค่เส้นบนสุดกับล่างสุด)
const HiddenTick = () => null

function XTick({ x = 0, y = 0, payload, index = 0, visibleTicksCount = 0 }: XTickProps) {
  if (index % 4 !== 0) return null
  const anchor = index === 0 ? 'start' : index === visibleTicksCount - 1 ? 'end' : 'middle'
  return (
    <text x={x} y={y + 12} dy={4} textAnchor={anchor} fontSize={TICK_FONT_SIZE} fill={TICK_COLOR}>
      {payload?.value}
    </text>
  )
}

function YTick({ x = 0, y = 0, payload }: YTickProps) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={TICK_FONT_SIZE} fill={TICK_COLOR}>
      {payload?.value}
    </text>
  )
}

function OccupancyTooltip({ active, payload, label }: TooltipContentProps) {
  const value = payload?.[0]?.value
  if (!active || value == null) return null
  return (
    <div className="rounded-lg border border-[#D2D2D7] bg-white px-3 py-3 text-[12px] shadow-sm">
      <div className="text-[#0F172A] mb-1">{label}</div>
      <div className="text-[#0055ff]">Vehicles : {value}</div>
    </div>
  )
}

// empty = true -> ไม่มีเส้นกริด ไม่มีตัวเลขบนแกน x / y (ยังเว้นพื้นที่แกนไว้ให้ layout ไม่ขยับ)
const buildAxes = (empty: boolean) => (
  <>
    {/* ไม่มีข้อมูล -> ไม่วาดเส้นกริดเลย */}
    {!empty && <CartesianGrid vertical={false} stroke={GRID_COLOR} shapeRendering="crispEdges" />}
    <XAxis
      dataKey="time"
      tick={empty ? <HiddenTick /> : <XTick />}
      tickLine={false}
      axisLine={false}
      interval={0}
    />
    <YAxis
      domain={[0, 1000]}
      ticks={empty ? emptyYTicks : yTicks}
      tick={empty ? <HiddenTick /> : <YTick />}
      tickLine={false}
      axisLine={false}
      interval={0}
      width={36}
    />
  </>
)

/* ---------- Striped bar ---------- */

// ต้องวางเป็น <defs> ตรง ๆ ใน BarChart (Recharts จะตัด component ที่ไม่รู้จักทิ้ง)
const barDefs = (
  <defs>
    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="10%" stopColor="#2347E8" stopOpacity={1} />
      <stop offset="55%" stopColor="#3B82F6" stopOpacity={0.75} />
      <stop offset="100%" stopColor="#8abaf8" stopOpacity={0.25} />
    </linearGradient>
  </defs>
)

// แท่งสิ้นสุดที่เส้น y=0 พอดี: มุมบนมน มุมล่างเหลี่ยม ไม่มีเส้นขอบล่าง (ให้เส้นกริดเป็นเส้นฐานแทน)
function StripedBar({ x = 0, y = 0, width = 0, height = 0, value }: StripedBarProps) {
  if (!value || height <= 0) return null

  const r = Math.min(2, width / 2, height / 2)
  const bottom = y + height
  const d =
    `M${x},${bottom} V${y + r} ` +
    `A${r},${r} 0 0 1 ${x + r},${y} H${x + width - r} A${r},${r} 0 0 1 ${x + width},${y + r} ` +
    `V${bottom}`

  return (
    <g>
      <path d={`${d} Z`} fill="url(#barGrad)" />
      <path d={d} fill="none" stroke="#2563EB" strokeWidth={1} />
    </g>
  )
}

/* ---------- Chart ---------- */

function OccupancyChart({ data, type }: OccupancyChartProps) {
  const empty = hasNoData(data)
  const chartData = empty ? emptyChartData : (data as OccupancyPoint[])
  const axes = buildAxes(empty)

  return (
    // outline-none: เอากรอบสีส้ม (focus outline) ตอนคลิกกราฟออก
    <div className="relative h-56 w-full sm:h-64 lg:h-[262px] [&_*]:outline-none [&_*:focus]:outline-none [&_*:focus-visible]:outline-none">
      {/* ไม่มีข้อมูล -> แสดง No Data ตรงกลางกราฟ */}
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 262 }}>
        {type === 'line' ? (
          <AreaChart accessibilityLayer={false} data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="20%" stopColor="#0055ff" stopOpacity={1} />
                <stop offset="30%" stopColor="#0055ff" stopOpacity={0.9} />
                <stop offset="55%" stopColor="#0055ffb9" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#0055ff11" stopOpacity={0.575} />
              </linearGradient>
            </defs>
            {axes}
            {/* ไม่มีข้อมูล -> ไม่ใส่ Tooltip / เส้นเลื่อน / จุดวงกลม เลื่อนเมาส์แล้วไม่มีอะไรขยับ */}
            {!empty && (
              <Tooltip
                isAnimationActive={false}
                cursor={{ stroke: GRID_COLOR }}
                content={<OccupancyTooltip />}
                wrapperStyle={{ outline: 'none', zIndex: 50 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3369FF"
              strokeWidth={2.8}
              activeDot={empty ? false : { r: 5.15, fill: '#ffffff', stroke: '#3369FF', strokeWidth: 3.5 }}
              fill="url(#areaFill)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <BarChart accessibilityLayer={false} data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }} barCategoryGap="12%">
            {barDefs}
            {axes}
            {!empty && (
              <Tooltip
                isAnimationActive={false}
                cursor={{ fill: '#227eff1c' }}
                content={<OccupancyTooltip />}
                wrapperStyle={{ outline: 'none', zIndex: 50 }}
              />
            )}
            <Bar
              dataKey="value"
              shape={(props: unknown) => <StripedBar {...(props as StripedBarProps)} />}
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