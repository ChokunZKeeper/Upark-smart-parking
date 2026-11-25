import { useMemo, useState, type CSSProperties } from 'react'
import Navbar from '@/components/system_layout/layout/Navbar'
import Segmented, { type SegmentedOption } from '@/components/system_layout/layout/Segmented'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import OccupancyChart, { type OccupancyChartType, type OccupancyPoint } from '@/components/system_layout/layout/OccupancyChart'
import VehicleTypes from '@/components/system_layout/layout/VehicleTypes'
import RecentActivity from '@/components/system_layout/layout/RecentActivity'
import { getInfomation } from '@/services/data/dbData'
import { useT } from '@/i18n'

// FIX: ใช้ alias @/ ให้เหมือน import อื่น
import {
  chartScaleByPeriod,
  occupancyBarData,
  occupancyLineData,
  periods,
  recentActivity,
  summaryByPeriod,
  vehicleTypes,
} from '@/services/data/mockData'

/* ---------- Types ---------- */

// ชื่อช่วงเวลา (เช่น 'day' | 'week' | ...) อ้างอิงจาก key ใน mockData
type Period = keyof typeof chartScaleByPeriod

/* ---------- Constants ---------- */

const MAX_OCCUPANCY = 1000 

const CHART_TYPE_KEYS: { value: OccupancyChartType; labelKey: string }[] = [
  { value: 'bar', labelKey: 'dashboard.chartType.bar' },
  { value: 'line', labelKey: 'dashboard.chartType.line' },
]

// เส้นคั่นใต้หัวการ์ด: Radial gradient (กลางเข้ม -> ปลายสองข้างจางหาย)
const DIVIDER_STYLE: CSSProperties = {
  background:
        'radial-gradient(ellipse closest-side at 50% 50%, var(--border) 20%, transparent 97.5%)',

}

/* ---------- Helpers ---------- */

// ปรับค่าตามช่วงเวลาที่เลือก และไม่ให้เกินค่าสูงสุดของแกน
const scalePoint = (point: OccupancyPoint, scale: number): OccupancyPoint => ({
  ...point,
  value: Math.min(MAX_OCCUPANCY, Math.round(point.value * scale)),
})

// สร้างไฟล์ CSV จากข้อมูลกราฟแล้วสั่งดาวน์โหลด
const downloadOccupancyCsv = (points: OccupancyPoint[], period: Period) => {
  const lines = ['time,vehicles', ...points.map((point) => `${point.time},${point.value}`)]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `occupancy-${period}.csv`
  link.click()

  // FIX: ถ่วงเวลาเล็กน้อย กัน Safari ยกเลิกการดาวน์โหลด
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/* ---------- Sub components ---------- */

function OccupancySection({
  chartType,
  onChartTypeChange,
  data,
}: {
  chartType: OccupancyChartType
  onChartTypeChange: (type: OccupancyChartType) => void
  data: OccupancyPoint[]
}) {
  const t = useT()
  const chartTypeOptions: SegmentedOption<OccupancyChartType>[] = CHART_TYPE_KEYS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }))

  return (
    <section className="card overflow-hidden">
      {/* border-transparent คงความสูงเดิมของเส้น 1px ไว้ แล้ววางเส้น gradient ทับด้านล่าง */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-transparent px-[26.5px] py-[14.5px]">
        <h2 className="text-[18.825px] font-medium text-text">{t('dashboard.occupancyByHours')}</h2>
        <Segmented options={chartTypeOptions} value={chartType} onChange={onChartTypeChange} />
        <div aria-hidden className="absolute inset-x-0 bottom-[-1px] h-px" style={DIVIDER_STYLE} />
      </div>

      <div className="p-6 pt-11">
        <OccupancyChart data={data} type={chartType} />
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

function Dashboard() {
  const t = useT()
  const [period, setPeriod] = useState<Period>('today')
  const periodOptions = useMemo(
    () => periods.map((p) => ({ value: p.value, label: t(`dashboard.periods.${p.value}`) })),
    [t],
  )
  const [chartType, setChartType] = useState<OccupancyChartType>('line')

  const chartData = useMemo(() => {
    const source = chartType === 'line' ? occupancyLineData : occupancyBarData
    const scale = chartScaleByPeriod[period]
    return source.map((point) => scalePoint(point, scale))
  }, [period, chartType])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('dashboard.title')}
        actions={
          <div className="flex items-center gap-2.5">
            <Segmented options={periodOptions} value={period} onChange={setPeriod} />
          </div>
        }
      />

      <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 sm:px-8">
        <SummaryCards items={summaryByPeriod[period]} />

        <OccupancySection chartType={chartType} onChartTypeChange={setChartType} data={chartData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <VehicleTypes data={vehicleTypes} />
          <RecentActivity items={recentActivity} />
        </div>
      </main>
    </div>
  )
}

export default Dashboard