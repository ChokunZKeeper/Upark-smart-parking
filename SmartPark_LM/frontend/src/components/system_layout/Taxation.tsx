import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Navbar from '@/components/system_layout/layout/Navbar'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import {
  reportRangeLabel,
  taxDeadlines,
  taxMonthly,
  taxSummary,
  taxTransactions,
  type TaxDeadline,
  type TaxMonthly,
  type TaxTransaction,
} from '@/types/_mockData'

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

const GRID_COLOR = '#D2D2D7'
const GRID_WIDTH = 1

const COLORS = {
  revenue: { top: '#4D73F8', bottom: '#D6DFFE' },
  tax: { top: '#FF0037', bottom: '#FFD4DC' },
} as const

const AXIS_TICK = { fontSize: 13, fill: '#7E7E81' }
const Y_TICKS = [0, 100, 200, 300, 400, 500]
const formatYTick = (value: number) => (value === 0 ? '0' : `${value}K`)

const STATUS_COLOR: Record<TaxDeadline['status'], string> = {
  Overdue: 'text-[#C81E3A]',
  'Due Soon': 'text-[#C81E3A]',
  Upcoming: 'text-[#2771D8]',
}

const BAR_SERIES: BarSeriesProps[] = [
  { name: 'Revenue', dataKey: 'revenue', gradientId: 'taxRevenueFill', color: COLORS.revenue.top },
  { name: 'Tax', dataKey: 'tax', gradientId: 'taxTaxFill', color: COLORS.tax.top },
]

/* -------------------------------------------------------------------------- */
/* CSV export                                                                 */
/* -------------------------------------------------------------------------- */

function buildDeadlinesCsv(deadlines: TaxDeadline[]): string {
  const header = ['Date', 'Code', 'Description', 'Status']
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
      {children}
    </div>
  )
}

function ViewAllButton() {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-[9.5px] border border-line bg-white px-4 py-1.5 text-[13.45px] text-[#0F172A] transition hover:bg-gray-50"
    >
      View all <ArrowRight size={13} />
    </button>
  )
}

function CardFooter({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-5 text-[13.45px] text-[#7E7E81]">
      <span>{text}</span>
    </div>
  )
}

/** One gradient-filled bar with a white label inside the top. */
function TaxBar({ name, dataKey, gradientId, color }: BarSeriesProps) {
  return (
    <Bar
      name={name}
      dataKey={dataKey}
      fill={`url(#${gradientId})`}
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
          <XAxis
            dataKey="month"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            tickMargin={10}
          />
          <YAxis
            domain={[0, 500]}
            ticks={Y_TICKS}
            tickFormatter={formatYTick}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ fill: '#227eff1c' }}
            contentStyle={{ fontSize: 12, padding: 12, borderRadius: 8, border: `1px solid ${GRID_COLOR}` }}
            wrapperStyle={{ outline: 'none', zIndex: 50 }}
            formatter={(value, name) => [`${Number(value)}K`, String(name)]}
          />

          {BAR_SERIES.map((series) => (
            <TaxBar key={series.dataKey} {...series} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TransactionsCard({ items }: { items: TaxTransaction[] }) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <CardHeader title="Recent Transaction">
        <ViewAllButton />
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-[15.25px] text-[#0F172A]">
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line transition-colors hover:bg-gray-50">
                <td className="w-[34%] whitespace-nowrap border-r border-line px-3 py-[18px] text-center">
                  {item.date}
                </td>
                <td className="truncate px-5 py-[18px]">{item.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CardFooter text="50+ Transactions, More" />
    </section>
  )
}

function DeadlinesCard({ items }: { items: TaxDeadline[] }) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <CardHeader title="Tax Deadlines">
        <ViewAllButton />
      </CardHeader>

      <div className="overflow-x-auto">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CardFooter text="2+ Transactions, More" />
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

function Taxation() {
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
            </Link>
          </>
        }
        actions={
          <button
            type="button"
            className="rounded-full bg-[#2771D8] px-7 py-2.5 text-[15.5px] font-normal text-white transition hover:bg-brand-dark"
            onClick={handleExport}
          >
            Export Excel
          </button>
        }
      />

      <main className="space-y-6 p-4 sm:p-6">
        <SummaryCards items={taxSummary} />

        {/* Revenue vs. tax chart */}
        <section className="card overflow-hidden">
          <CardHeader title="Revenue vs Tax">
            <div className="flex items-center gap-5 text-[15px] text-[#7E7E81]">
              <LegendItem label="Revenue" from={COLORS.revenue.top} to={COLORS.revenue.bottom} className="mr-3" />
              <LegendItem label="Tax" from={COLORS.tax.top} to={COLORS.tax.bottom} className="mr-7" />
            </div>
          </CardHeader>

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
    </>
  )
}

export default Taxation