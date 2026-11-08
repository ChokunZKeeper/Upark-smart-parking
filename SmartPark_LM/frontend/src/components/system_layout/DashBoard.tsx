import { useMemo, useState } from 'react'
import Navbar from '@/components/system_layout/layout/Navbar'
import Segmented, { type SegmentedOption } from '@/components/system_layout/layout/Segmented'
import SummaryCards from '@/components/system_layout/layout/SummaryCards'
import OccupancyChart, { type OccupancyChartType, type OccupancyPoint } from '@/components/system_layout/layout/OccupancyChart'
import VehicleTypes from '@/components/system_layout/layout/VehicleTypes'
import RecentActivity from '@/components/system_layout/layout/RecentActivity'

// FIX: ใช้ alias @/ ให้เหมือน import อื่น
import {
  chartScaleByPeriod,
  occupancyBarData,
  occupancyLineData,
  periods,
  recentActivity,
  summaryByPeriod,
  vehicleTypes,
} from '@/types/_mockData'

/* ---------- Types ---------- */

// ชื่อช่วงเวลา (เช่น 'day' | 'week' | ...) อ้างอิงจาก key ใน mockData
type Period = keyof typeof chartScaleByPeriod

/* ---------- Constants ---------- */

const MAX_OCCUPANCY = 1000 

const CHART_TYPE_OPTIONS: SegmentedOption<OccupancyChartType>[] = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
]

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
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-[26.5px] py-[14.5px]">
        <h2 className="text-[18.825px] font-medium text-[#0F172A]">Occupancy by hours</h2>
        <Segmented options={CHART_TYPE_OPTIONS} value={chartType} onChange={onChartTypeChange} />
      </div>

      <div className="p-6 pt-11">
        <OccupancyChart data={data} type={chartType} />
      </div>
    </section>
  )
}

/* ---------- Page ---------- */

function Dashboard() {
  const [period, setPeriod] = useState<Period>('week')
  const [chartType, setChartType] = useState<OccupancyChartType>('line')

  const chartData = useMemo(() => {
    const source = chartType === 'line' ? occupancyLineData : occupancyBarData
    const scale = chartScaleByPeriod[period]
    return source.map((point) => scalePoint(point, scale))
  }, [period, chartType])



  return (
    <>
      <Navbar
        // FIX: เปลี่ยน "DashBoard" เป็น "Dashboard" (ถ้าตั้งใจใช้แบบเดิม ให้แก้กลับได้)
        title="Dashboard"
        actions={
          <div className="flex items-center gap-2.5">
            <Segmented options={periods} value={period} onChange={setPeriod} />
          </div>
        }
      />

      <main className="space-y-6 p-5 sm:p-6 sm:px-8">
        <SummaryCards items={summaryByPeriod[period]} />

        <OccupancySection chartType={chartType} onChartTypeChange={setChartType} data={chartData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <VehicleTypes data={vehicleTypes} />
          <RecentActivity items={recentActivity} />
        </div>
      </main>
    </>
  )
}

export default Dashboard