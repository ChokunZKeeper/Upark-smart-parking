import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import Navbar from '@/components/system_layout/layout/Navbar'
import Segmented from '@/components/system_layout/layout/Segmented'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import { reportDaily, reportMetrics, reportRangeLabel } from '@/types/_mockData'

/* ---------- Types ---------- */

type MetricKey = 'revenue' | 'vehicles' | 'parkTime' | 'occupancy'
type ChartType = 'bar' | 'line'

interface ReportRow {
  day: number
  vehicles: number
  occupancy: number
  peak: number
  parkTime: number
  revenue: number
}

interface ChartPoint {
  day: number
  value: number | null
}

interface MetricConfig {
  label: string
  format: (v: number) => string
  tick: (v: number) => string | number
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
  format?: (v: number) => string | number
}

interface ReportTooltipProps {
  active?: boolean
  payload?: { value?: number | null }[]
  label?: string | number
  cfg: MetricConfig
}

interface StripedBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number | null
}

/* ---------- Constants ---------- */

const chartTypes: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
]

const TICK_FONT_SIZE = 13
const TICK_COLOR = '#7E7E81'
const GRID_COLOR = '#D2D2D7'

const metricConfig: Record<MetricKey, MetricConfig> = {
  revenue: { label: 'Revenue', format: (v) => `THB ${v.toLocaleString()}`, tick: (v) => (v >= 1000 ? `${v / 1000}k` : v) },
  vehicles: { label: 'Vehicles', format: (v) => v.toLocaleString(), tick: (v) => v },
  parkTime: { label: 'Avg. park time', format: (v) => `${v} hrs`, tick: (v) => v },
  occupancy: { label: 'Occupancy', format: (v) => `${v}%`, tick: (v) => `${v}%` },
}

const daily = reportDaily as ReportRow[]

/* ---------- Custom ticks / tooltip / bar ---------- */

function XTick({ x = 0, y = 0, payload, index = 0, visibleTicksCount = 0 }: XTickProps) {
  if (Number(payload?.value) % 2 !== 1) return null
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

function ReportTooltip({ active, payload, label, cfg }: ReportTooltipProps) {
  const value = payload?.[0]?.value
  if (!active || value == null) return null
  return (
    <div className="rounded-lg border border-[#D2D2D7] bg-white px-3 py-3 text-[12px] shadow-sm">
      <div className="mb-1 text-[#0F172A]">{label} Oct</div>
      <div className="text-[#0055ff]">
        {cfg.label} : {cfg.format(value)}
      </div>
    </div>
  )
}

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
      <path d={`${d} Z`} fill="url(#reportBarGrad)" />
      <path d={d} fill="none" stroke="#2563EB" strokeWidth={1} />
    </g>
  )
}

function Reports() {
  const { url_uuid } = useParams()

  const [metric, setMetric] = useState<MetricKey>('revenue')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showAll] = useState(false)

  const summary = useMemo(() => {
    if (daily.length === 0) {
      return [
        { label: 'Total Revenue', value: 'No Data' },
        { label: 'Total Vehicles', value: 'No Data' },
        { label: 'Avg. Revenue per Vehicle', value: 'No Data' },
        { label: 'Avg. occupancy', value: 'No Data' },
      ]
    }
    return [
      { label: 'Total Revenue', value: 'THB 124,300', left: '', trend: { text: '28.4% previous period', up: true } },
      { label: 'Total Vehicles', value: '2,810', left: '', trend: { text: '2.2% previous period', up: true } },
      { label: 'Avg. Revenue per Vehicle', value: 'THB 44.2', left: '', trend: { text: '1.2% previous period', up: true } },
      { label: 'Avg. occupancy', value: '68%', left: '', trend: { text: '7% previous period', up: true } },
    ]
  }, [])

  const chartData = useMemo<ChartPoint[]>(() => {
    if (daily.length === 0) {
      return Array.from({ length: 13 }, (_, i) => ({ day: i + 1, value: null }))
    }
    return daily.map((r) => ({ day: r.day, value: r[metric] }))
  }, [metric])

  // Newest day first, like the table in the design.
  const rows = useMemo(() => [...daily].reverse(), [])
  const visibleRows = showAll ? rows : rows.slice(0, 4)

  const handleExport = () => {
    const header = ['Date', 'Vehicles', 'Avg. occupancy (%)', 'Peak occupancy (%)', 'Avg. park time (hrs)', 'Revenue (THB)']
    const lines = rows.map((r) => [`${r.day} Oct`, r.vehicles, r.occupancy, r.peak, r.parkTime, r.revenue].join(','))
    // BOM so Excel opens the file with correct encoding.
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'parking-report-oct.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const cfg = metricConfig[metric]
  // Revenue uses fixed 0 / 7k / 14k scale like the design; other metrics fall back to auto.
  const yProps: { domain?: [number, number]; ticks?: number[] } =
    metric === 'revenue' ? { domain: [0, 14000], ticks: [0, 3500, 7000, 10500, 14000] } : {}
  const yTickFormat = (v: number) => (metric === 'revenue' && v % 7000 !== 0 ? '' : cfg.tick(v))
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={GRID_COLOR} shapeRendering="crispEdges" />
      <XAxis dataKey="day" tick={<XTick />} tickLine={false} axisLine={false} interval={0} />
      <YAxis tick={<YTick format={yTickFormat} />} tickLine={false} axisLine={false} width={44} {...yProps} />
    </>
  )

  return (
    <>
      <Navbar
        title="Reports"
        subtitle={
          <>
            <span className="ml-3 rounded-[9.5px] border border-[#D2D2D7] bg-white px-8 py-2 text-[15px] text-[#6F6F72]">
              {reportRangeLabel}
            </span>
            <Link
              to={`/system/${url_uuid}/taxation`}
              className="ml-1 rounded-[9.5px] border border-[#D2D2D7] bg-white px-6 py-2 text-[15px] text-[#6F6F72] transition hover:bg-gray-50"
            >
              See Taxation
            </Link>
          </>
        }
        actions={
          <button
            type="button"
            className="rounded-full bg-[#2771D8] px-7 py-2.5 text-[15.5px] font-normal text-white transition hover:bg-brand-dark "
            onClick={handleExport}
          >
            Export Excel
          </button>
        }
      />
      <main className="space-y-6 p-4 sm:p-6">
        <SummaryCards items={summary} />

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-[26.5px] py-[14.5px]">
            <h2 className="text-[18.825px] font-medium text-[#0F172A]">Revenue trend</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented options={reportMetrics} value={metric} onChange={(v: string) => setMetric(v as MetricKey)} />
              <Segmented options={chartTypes} value={chartType} onChange={(v: string) => setChartType(v as ChartType)} />
            </div>
          </div>
          <div className="p-6 pt-11">
            <div className="h-56 w-full sm:h-64 lg:h-[262px]">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 262 }}>
                {chartType === 'line' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="20%" stopColor="#0055ff" stopOpacity={1} />
                        <stop offset="30%" stopColor="#0055ff" stopOpacity={0.9} />
                        <stop offset="55%" stopColor="#0055ffb9" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#0055ff11" stopOpacity={0.375} />
                      </linearGradient>
                    </defs>
                    {axes}
                    <Tooltip
                      isAnimationActive={false}
                      cursor={{ stroke: GRID_COLOR }}
                      content={<ReportTooltip cfg={cfg} />}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3369FF"
                      strokeWidth={2.8}
                      activeDot={{ r: 5.15, fill: '#ffffff', stroke: '#3369FF', strokeWidth: 3.5 }}
                      fill="url(#reportAreaFill)"
                      fillOpacity={1}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }} barCategoryGap="12%">
                    <defs>
                      <linearGradient id="reportBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="#2347E8" stopOpacity={1} />
                        <stop offset="55%" stopColor="#3B82F6" stopOpacity={0.75} />
                        <stop offset="100%" stopColor="#8abaf8" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    {axes}
                    <Tooltip
                      isAnimationActive={false}
                      cursor={{ fill: '#227eff1c' }}
                      content={<ReportTooltip cfg={cfg} />}
                      wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    />
                    <Bar
                      dataKey="value"
                      shape={(props: unknown) => <StripedBar {...(props as StripedBarProps)} />}
                      isAnimationActive={false}
                    />
                    {/* เส้นล่างสุด (y=0) ให้อยู่หน้าแท่ง: ต้องอยู่หลัง <Bar> */}
                    <ReferenceLine y={0} stroke={GRID_COLOR} ifOverflow="visible" shapeRendering="crispEdges" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse table-fixed text-center text-[15.25px] text-[#0F172A]">
              <thead>
                <tr className="border-b border-line font-medium">
                  {[
                    ['Date', 'w-[15%]'],
                    ['Vehicles', 'w-[13%]'],
                    ['Avg. occupancy', 'w-[16%]'],
                    ['Peak occupancy', 'w-[14%]'],
                    ['Avg.park time', 'w-[14%]'],
                    ['Revenue', 'w-[28%]'],
                  ].map(([h, w]) => (
                    <th key={h} className={`${w} border-r border-line px-5 py-[18px] last:border-r-0`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-[15px] text-[#7E7E81]">
                      No Data
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((r) => (
                    <tr key={r.day} className="border-b border-line transition-colors hover:bg-gray-50">
                      <td className="border-r border-line px-3 py-[18px]">{r.day} Oct</td>
                      <td className="border-r border-line px-3 py-[18px]">{r.vehicles}</td>
                      <td className="border-r border-line px-3 py-[18px]">{r.occupancy}%</td>
                      <td className="border-r border-line px-3 py-[18px]">{r.peak}%</td>
                      <td className="border-r border-line px-3 py-[18px]">{r.parkTime} hrs</td>
                      <td className="px-3 py-[18px]">THB {r.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center py-5 text-[13.45px] text-[#7E7E81]">
            <span>
              Showing {rows.length === 0 ? '-' : visibleRows.length} of {rows.length === 0 ? '-' : rows.length} days - Export Excel downloads every row in this table.
            </span>
          </div>
        </section>
      </main>
    </>
  )
}

export default Reports