import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import Navbar from '@/components/system_layout/layout/Navbar'
import OccupancyChart, { type OccupancyPoint } from '@/components/system_layout/layout/OccupancyChart'
import Segmented from '@/components/system_layout/layout/Segmented'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import {
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
import { reportDaily, reportMetrics } from '@/services/data/mockData'
import { Icon } from '@iconify/react'
import { useT } from '@/i18n'

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

interface MetricConfig {
  format: (v: number) => string
  tick: (v: number) => string | number
}

/* ---------- Constants ---------- */

const chartTypes: { value: ChartType; labelKey: string }[] = [
  { value: 'bar', labelKey: 'reports.bar' },
  { value: 'line', labelKey: 'reports.line' },
]

// เส้นคั่นใต้หัวการ์ด Revenue trend: gradient กลางเข้ม -> ปลายสองข้างจางหาย
// (สีเดียวกับ radial #D2D2D7 20% -> rgba(195,195,250,0) 97.5%) ใช้ border-image ให้เส้นคม 1px เท่า border ปกติ
const DIVIDER_STYLE: CSSProperties = {
  borderImage:
    'linear-gradient(90deg, transparent 1.25%, var(--border) 40%, var(--border) 60%, transparent 98.75%) 1',
}

// ขนาด/สีของข้อความ "No Data" (แก้ที่เดียวให้ตรงกับ Dashboard ได้)
const NO_DATA_CLASS = 'text-[15px] text-[#7E7E81]'

// สีแถบ range ของปฏิทิน (แถบกลาง #1B2150 / วันเริ่ม-จบ #3347F5) แก้ได้ที่ไฟล์ range-calendar.tsx
// (RANGE_BAR / RANGE_END) ไม่ต้องมี class ไล่ทับที่หน้านี้แล้ว

// เส้นคั่นแถวของตาราง: วาดที่ท้ายทุกเซลล์ (after:) เซลล์แรกเริ่มเว้นซ้าย เซลล์สุดท้ายจบเว้นขวา 16px
// พื้นหลังตอน hover ของแถวจึงยังเต็มถึงขอบการ์ด
const ROW_LINE =
  "relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0 after:border-b after:border-[var(--border)] after:content-[''] first:after:left-4 last:after:right-4"

// ขีดแนวตั้งสั้นๆ คั่นหัวคอลัมน์ (ไม่ยาวเต็มความสูง) เหมือนหน้า Vehicle Search
const HEAD_DIVIDER =
  "before:absolute before:left-0 before:top-[15px] before:h-8 before:w-0 before:border-l before:border-[var(--border)] before:content-['']"

// ความสูงแถวเป็นเลขจำนวนเต็ม (ขีดหัวตาราง top-[15px] = (62 - 32) / 2 ให้ตรงกลางพอดี)
// เส้นทั้งหมดวาดด้วย border (ไม่ใช่กล่องสูง 1px) เพราะเบราว์เซอร์ปัดความหนา border เป็นพิกเซลเต็มเสมอ
// เส้นเลยหนาเท่ากันทุกเส้น แม้หน้าจอ/ซูมเป็นเลขเศษ เช่น 125%
// ถ้าเปลี่ยนความสูงแถว ให้ปรับ top-[15px] ของ HEAD_DIVIDER ด้วย
const ROW_HEIGHT = 'h-[62px]'

const HEAD_CELL = `${ROW_LINE} px-5`
const CELL = `${ROW_LINE} px-3`

const TABLE_COLUMNS: [string, string][] = [
  ['reports.columns.date', 'w-[15%]'],
  ['reports.columns.vehicles', 'w-[13%]'],
  ['reports.columns.avgOccupancy', 'w-[16%]'],
  ['reports.columns.peakOccupancy', 'w-[14%]'],
  ['reports.columns.avgParkTime', 'w-[14%]'],
  ['reports.columns.revenue', 'w-[28%]'],
]

const metricConfig: Record<MetricKey, MetricConfig> = {
  revenue: { format: (v) => v.toLocaleString(), tick: (v) => (v >= 1000 ? `${v / 1000}k` : v) },
  vehicles: { format: (v) => v.toLocaleString(), tick: (v) => v },
  parkTime: { format: (v) => String(v), tick: (v) => v },
  occupancy: { format: (v) => `${v}%`, tick: (v) => `${v}%` },
}

// Revenue ใช้สเกลคงที่ 0 / 7k / 14k ตามดีไซน์ (เส้นกริดทุก 3.5k แต่แสดงเลขเฉพาะ 0, 7k, 14k) ตัวอื่นให้คำนวณเอง
const REVENUE_Y_DOMAIN: [number, number] = [0, 14000]
const REVENUE_Y_TICKS = [0, 3500, 7000, 10500, 14000]
const REVENUE_LABEL_STEP = 7000

const daily = reportDaily as ReportRow[]

// ช่วงวันที่เริ่มต้นของปุ่มเลือกช่วง (แก้ปี/เดือนให้ตรงกับข้อมูลจริงได้ที่นี่)
const DEFAULT_RANGE: RangeValue<DateValue> = {
  start: new CalendarDate(2026, 10, 1),
  end: new CalendarDate(2026, 10, 13),
}

/* ---------- Page ---------- */

function Reports() {
  const t = useT()
  const thb = (v: number | string) => t('reports.thb', { value: v })
  const metricOptions = reportMetrics.map((m) => ({ ...m, label: t(`reports.metrics.${m.value}`) }))
  const chartTypeOptions = chartTypes.map((c) => ({ value: c.value, label: t(c.labelKey) }))
  const { url_uuid } = useParams()

  const [metric, setMetric] = useState<MetricKey>('revenue')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showAll] = useState(false)

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

  const hasData = daily.length > 0

  const summary = useMemo(() => {
    if (!hasData) {
      return [
        { label: t('reports.summary.totalRevenue'), value: t('reports.noData') },
        { label: t('reports.summary.totalVehicles'), value: t('reports.noData') },
        { label: t('reports.summary.avgRevenue'), value: t('reports.noData') },
        { label: t('reports.summary.avgOccupancy'), value: t('reports.noData') },
      ]
    }
    return [
      { label: t('reports.summary.totalRevenue'), value: thb('124,300'), left: '', trend: { text: t('reports.summary.previousPeriod', { value: '28.4%' }), up: true } },
      { label: t('reports.summary.totalVehicles'), value: '2,810', left: '', trend: { text: t('reports.summary.previousPeriod', { value: '2.2%' }), up: true } },
      { label: t('reports.summary.avgRevenue'), value: thb('44.2'), left: '', trend: { text: t('reports.summary.previousPeriod', { value: '1.2%' }), up: true } },
      { label: t('reports.summary.avgOccupancy'), value: '68%', left: '', trend: { text: t('reports.summary.previousPeriod', { value: '7%' }), up: true } },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData, t])

  // OccupancyChart ใช้แกน X ชื่อ time (string): ส่งวันที่เป็นข้อความ ไม่มีข้อมูล = ไม่ส่งจุดเลย (กราฟจะแสดงแบบว่างเอง)
  const chartData = useMemo<OccupancyPoint[]>(() => {
    if (!hasData) return []
    return daily.map((r) => ({ time: String(r.day), value: r[metric] }))
  }, [metric, hasData])

  // Newest day first, like the table in the design.
  const rows = useMemo(() => [...daily].reverse(), [])
  const visibleRows = showAll ? rows : rows.slice(0, 4)

  const handleExport = () => {
    const header = ['date', 'vehicles', 'avgOccupancy', 'peakOccupancy', 'avgParkTime', 'revenue'].map((k) => t(`reports.csv.${k}`))
    const lines = rows.map((r) => [t('reports.dayOct', { day: r.day }), r.vehicles, r.occupancy, r.peak, r.parkTime, r.revenue].join(','))
    // BOM so Excel opens the file with correct encoding.
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'parking-report-oct.csv'
    link.click()
    // ถ่วงเวลาเล็กน้อย กัน Safari ยกเลิกการดาวน์โหลด
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const cfg = metricConfig[metric]
  const isRevenue = metric === 'revenue'
  const yTickFormat = (v: number) => (isRevenue && v % REVENUE_LABEL_STEP !== 0 ? '' : cfg.tick(v))

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('reports.title')}
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
                    aria-label={t('reports.selectRange')}
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
              to={`/system/${url_uuid}/taxation`}
              className="ml-1 rounded-[9.5px] border border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-[15px] text-ink-2 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]"
            >
              {t('reports.seeTaxation')}
            </Link>
          </>
        }
        actions={
          <button
            type="button"
            className="rounded-full bg-[#2771D8] px-7 py-2.5 text-[15.5px] font-normal text-white transition hover:bg-brand-dark "
            onClick={handleExport}
          >
            {t('reports.exportExcel')}
          </button>
        }
      />
      <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 sm:px-8">
        <SummaryCards items={summary} />

        <section className="card overflow-hidden">
          <div
            style={DIVIDER_STYLE}
            className="flex flex-wrap items-center justify-between gap-2 border-b px-[26.5px] py-[14.5px]"
          >
            <h2 className="text-[18.825px] font-medium text-ink-1">{t('reports.revenueTrend')}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented options={metricOptions} value={metric} onChange={(v: string) => setMetric(v as MetricKey)} />
              <Segmented options={chartTypeOptions} value={chartType} onChange={(v: string) => setChartType(v as ChartType)} />
            </div>
          </div>
          <div className="p-6 pt-11">
            {/* ใช้กราฟตัวเดียวกับ Dashboard: สี ธีม tooltip และสถานะไม่มีข้อมูลเหมือนกันทุกอย่าง */}
            <OccupancyChart
              type={chartType}
              data={chartData}
              yDomain={isRevenue ? REVENUE_Y_DOMAIN : 'auto'}
              yTicks={isRevenue ? REVENUE_Y_TICKS : 'auto'}
              yAxisWidth={44}
              formatYTick={yTickFormat}
              showXTick={(_, value) => Number(value) % 2 === 1}
              formatTooltipLabel={(label) => t('reports.dayOct', { day: label })}
              formatTooltipValue={(value) => `${t(`reports.metrics.${metric}`)} : ${metric === 'revenue' ? thb(cfg.format(value)) : metric === 'parkTime' ? t('reports.hrs', { value: cfg.format(value) }) : cfg.format(value)}`}
            />
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-center text-[15.25px] text-ink-1">
              <thead>
                <tr className={`${ROW_HEIGHT} font-medium`}>
                  {TABLE_COLUMNS.map(([h, w], idx) => (
                    <th key={h} className={`${w} ${HEAD_CELL} align-middle ${idx > 0 ? HEAD_DIVIDER : ''}`}>
                      {t(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`px-3 py-12 text-center ${NO_DATA_CLASS}`}>
                      {t('reports.noData')}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((r) => (
                    <tr key={r.day} className={`${ROW_HEIGHT} transition-colors`}>
                      <td className={CELL}>{t('reports.dayOct', { day: r.day })}</td>
                      <td className={CELL}>{r.vehicles}</td>
                      <td className={CELL}>{r.occupancy}%</td>
                      <td className={CELL}>{r.peak}%</td>
                      <td className={CELL}>{t('reports.hrs', { value: r.parkTime })}</td>
                      <td className={CELL}>{thb(r.revenue.toLocaleString())}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-5 text-center text-[13.45px] text-ink-2">
            <span>
              {t('reports.showing', {
                shown: rows.length === 0 ? '-' : visibleRows.length,
                total: rows.length === 0 ? '-' : rows.length,
              })}
            </span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Reports