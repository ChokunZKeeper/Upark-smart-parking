import { useState } from 'react'
import Navbar from '@/components/system_layout/layout/Navbar'
import Select, { type SelectOption } from '@/components/system_layout/layout/Select'
import SummaryCards, { type SummaryItem } from '@/components/system_layout/layout/SummaryCards'
import { floors, getHeatData, heatDays, heatHours, heatLegend, heatPalettes, heatSummary } from '@/types/_mockData'

/* ---------- Types ---------- */

type HeatLevel = 'high' | 'mid' | 'low'
type HeatPalette = Record<HeatLevel, string>
type HeatColor = keyof typeof heatPalettes
type HeatSummaryItem = (typeof heatSummary)[number]

/* ---------- Constants ---------- */

const HIGH_THRESHOLD = 45 // มากกว่านี้ = high
const MID_THRESHOLD = 25 // มากกว่านี้ = mid, นอกนั้น = low

const GRID_STYLE = { gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' } // 13 คอลัมน์ตามจำนวนชั่วโมง

const SELECT_CLASS = '!rounded-[7.5px] border-line py-1 text-center text-[13px] !text-[#6F6F72]'

const COLOR_OPTIONS: SelectOption<HeatColor>[] = (Object.keys(heatPalettes) as HeatColor[]).map((name) => ({
  value: name,
  label: name,
}))

const FLOOR_OPTIONS: SelectOption<string>[] = floors.map((floor) => ({
  value: floor,
  label: `Floor ${floor} - Zone ${floor}1`,
}))

/* ---------- Helpers ---------- */

const levelOf = (value: number): HeatLevel => {
  if (value > HIGH_THRESHOLD) return 'high'
  if (value > MID_THRESHOLD) return 'mid'
  return 'low'
}

const hasPercent = (item: HeatSummaryItem) => item.percent !== null && item.percent !== undefined

// แปลงข้อมูลสรุปแต่ละชั้น ให้เป็นรูปแบบที่ SummaryCards ใช้
const toSummaryItem = (item: HeatSummaryItem): SummaryItem => ({
  key: item.floor,
  label: `Floor ${item.floor}`,
  value: hasPercent(item) ? `${item.percent} %` : 'No Data',
  left: item.used !== undefined && item.total !== undefined ? `${item.used} / ${item.total}` : '',
  right: hasPercent(item) ? 'Occupied' : '',
})

/* ---------- Sub components ---------- */

function EmptyState() {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center py-16 text-center text-[#7E7E81]">
      <p className="text-[14px] font-normal">No Hardware Found</p>
      <p className="mt-2 text-[12px] font-light">Please connect your hardware in Settings.</p>
    </div>
  )
}

function HeatLegend({ palette }: { palette: HeatPalette }) {
  return (
    <div className="mb-7 flex justify-end gap-2.5">
      {heatLegend.map((item) => (
        <div key={item.level} className="flex flex-col items-center gap-1.5">
          <span className="text-[13.5px] leading-5 text-[#7E7E81]">{item.label}</span>
          <span className="h-4 w-[72px] rounded-[4px]" style={{ backgroundColor: palette[item.level] }} />
        </div>
      ))}
    </div>
  )
}

function HeatGrid({ data, palette }: { data: number[][]; palette: HeatPalette }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* แถวของแต่ละวัน */}
        <div className="space-y-3.5">
          {heatDays.map((day, row) => (
            <div key={`${day}-${row}`} className="flex items-center gap-4">
              <span className="w-12 shrink-0 text-center text-[14px] font-normal leading-5 text-[#7E7E81]">{day}</span>

              <div className="grid flex-1 gap-3" style={GRID_STYLE}>
                {data[row].map((value, col) => (
                  <div
                    key={heatHours[col]}
                    title={`${day} ${heatHours[col]} - ${value}`}
                    className="h-[52px] rounded-[6px] transition-transform hover:scale-105"
                    style={{ backgroundColor: palette[levelOf(value)] }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* แถวชั่วโมงด้านล่าง */}
        <div className="mt-5 flex items-center gap-4">
          <span className="w-12 shrink-0" />
          <div className="grid flex-1 gap-3" style={GRID_STYLE}>
            {heatHours.map((hour) => (
              <span key={hour} className="text-center text-[14px] leading-5 text-[#7E7E81]">
                {hour}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */

function HeatMap() {
  const [floor, setFloor] = useState('A')
  const [color, setColor] = useState<HeatColor>('Blue')

  const palette: HeatPalette = heatPalettes[color]
  const data = getHeatData(floor)
  const hasData = !!data && data.length > 0

  return (
    <>
      <Navbar title="Heat Map" />

      <main className="space-y-6 p-4 sm:p-6">
        <SummaryCards items={heatSummary.map(toSummaryItem)} />

        <section className="card overflow-hidden !rounded-[17.5px] p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-[26.5px] py-[14.5px]">
            <h2 className="text-[18.825px] font-medium text-[#0F172A]">Heat Map Floor {floor}</h2>

            <div className="flex items-center gap-2.5">
              <Select
                ariaLabel="Color"
                value={color}
                onChange={setColor}
                options={COLOR_OPTIONS}
                className="w-[100px]"
                selectClassName={SELECT_CLASS}
              />
              <Select
                ariaLabel="Floor"
                value={floor}
                onChange={setFloor}
                options={FLOOR_OPTIONS}
                className="w-[170px]"
                selectClassName={SELECT_CLASS}
              />
            </div>
          </div>

          <div className="px-5 py-5 sm:px-5 sm:py-6">
            {hasData ? (
              <>
                <HeatLegend palette={palette} />
                <HeatGrid data={data} palette={palette} />
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default HeatMap