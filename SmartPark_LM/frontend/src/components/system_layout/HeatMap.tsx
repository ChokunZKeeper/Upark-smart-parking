import { useState, type CSSProperties } from 'react'
import Navbar from '@/components/system_layout/layout/Navbar'
import SummaryCards, { type SummaryItem } from '@/components/system_layout/layout/SummaryCards'
import PillSelect, { type Option } from '@/styles/Dropdown'
import { useT, type TFunction } from '@/i18n'
import {
  floors,
  getHeatData,
  heatDays,
  heatHours,
  heatLegend,
  heatSummary,
  type HeatLevel,
  type HeatPaletteName,
  type HeatSummaryItem,
} from '@/services/data/mockData'

/* ---------- Types ---------- */

type HeatColor = HeatPaletteName

/* ---------- Constants ---------- */

const HIGH_THRESHOLD = 45 // มากกว่านี้ = high
const MID_THRESHOLD = 25 // มากกว่านี้ = mid, นอกนั้น = low

// ชุดสีที่เลือกได้ (ค่าสีจริงอยู่ใน index.css ตาม data-heat + data-theme)
const HEAT_COLORS: HeatColor[] = ['Blue', 'Green', 'Purple', 'Orange']

// ต้องเป็นชื่อ class เต็ม ๆ เพื่อให้ Tailwind สแกนเจอ (ห้ามต่อสตริงเช่น `bg-heat-${level}`)
const CELL_CLASS: Record<HeatLevel, string> = {
  low: 'bg-heat-low',
  mid: 'bg-heat-mid',
  high: 'bg-heat-high',
}

const GRID_STYLE = { gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' } // 13 คอลัมน์ตามจำนวนชั่วโมง

// เส้นคั่นใต้หัวการ์ด: gradient กลางเข้ม -> ปลายสองข้างจางหาย
// สีกลางใช้ var(--border) จึงสลับตามธีมอัตโนมัติ (light #D2D2D7 / dark #2A2A2A)
// ใช้ border-image แทน div ทับ เพื่อให้เส้นคมและบาง 1px เท่า border ปกติ (ไม่เบลอเป็น 2px เมื่อจอ scale)
const DIVIDER_STYLE: CSSProperties = {
  borderImage:
    'linear-gradient(90deg, rgba(195, 195, 250, 0) 1.25%, var(--border) 40%, var(--border) 60%, rgba(195, 195, 250, 0) 98.75%) 1',
}

// หน้าตา dropdown เดิมของ Heat Map: สูง 32px มุมโค้ง 7.5px ตัวอักษร 13px สีเทา
// ใช้ ! กันชนกับ text-ink ที่ PillSelect ใส่ไว้เป็นค่าพื้นฐาน
const SELECT_TRIGGER =
  'h-8 rounded-[7.5px] text-[13px] !text-ink-2 hover:bg-page hover:!text-ink hover:!border-line border-[var(--border)]'

// panel ตอนเปิด: กว้างอย่างน้อยเท่ากล่อง (ไม่ใช้ min-w-[220px] ค่าเดิม)
const SELECT_PANEL = 'min-w-full'

// ลูกศรสามเหลี่ยมมุมมนสีเทาอ่อน (เหมือนของเดิม)
const SELECT_ARROW = (
  <svg
    aria-hidden="true"
    width="11"
    height="9"
    viewBox="0 0 11 9"
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3/60"
  >
    <polygon points="2,2 9,2 5.5,7" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

// ไอคอนวงกลม gradient หน้าชื่อสี: ตั้ง data-heat ที่ตัวเอง จึงได้ gradient ของสีนั้นเสมอ
// (ไม่ขึ้นกับสีที่เลือกอยู่) และสลับ light/dark ตามธีม
function ColorOrb({ name }: { name: HeatColor }) {
  return (
    <span
      aria-hidden="true"
      data-heat={name}
      className="h-4 w-4 shrink-0 rounded-full"
      style={{ backgroundImage: 'var(--heat-gradient)' }}
    />
  )
}

const buildColorOptions = (t: TFunction): Option<HeatColor>[] =>
  HEAT_COLORS.map((name) => ({
    value: name,
    label: t(`heatMap.colors.${name}`),
    icon: <ColorOrb name={name} />,
  }))

const buildFloorOptions = (t: TFunction): Option<string>[] =>
  floors.map((floor) => ({
    value: floor,
    label: t('heatMap.floorZone', { floor, zone: `${floor}1` }),
  }))

/* ---------- Helpers ---------- */

const levelOf = (value: number): HeatLevel => {
  if (value > HIGH_THRESHOLD) return 'high'
  if (value > MID_THRESHOLD) return 'mid'
  return 'low'
}

const hasPercent = (item: HeatSummaryItem) => item.percent !== null && item.percent !== undefined

// แปลงข้อมูลสรุปแต่ละชั้น ให้เป็นรูปแบบที่ SummaryCards ใช้
const toSummaryItem = (item: HeatSummaryItem, t: TFunction): SummaryItem => ({
  key: item.floor,
  label: t('heatMap.floorLabel', { floor: item.floor }),
  value: hasPercent(item) ? `${item.percent} %` : t('heatMap.noData'),
  left: item.used !== undefined && item.total !== undefined ? `${item.used} / ${item.total}` : '',
  right: hasPercent(item) ? t('heatMap.occupied') : '',
})

/* ---------- Sub components ---------- */

function EmptyState() {
  const t = useT()
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center py-16 text-center text-ink-2">
      <p className="text-[16px] font-medium">{t('heatMap.noHardwareTitle')}</p>
      <p className="mt-2 text-[14px] font-light">{t('heatMap.noHardwareDesc')}</p>
    </div>
  )
}

function HeatLegend() {
  const t = useT()
  return (
    <div className="mb-7 flex justify-end gap-2.5">
      {heatLegend.map((item) => (
        <div key={item.level} className="flex flex-col items-center gap-1.5">
          <span className="text-[13.5px] leading-5 text-ink-2">{t(`heatMap.legend.${item.level}`)}</span>
          <span className={`h-4 w-[72px] rounded-[4px] transition-colors duration-200 ${CELL_CLASS[item.level]}`} />
        </div>
      ))}
    </div>
  )
}

function HeatGrid({ data }: { data: number[][] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* แถวของแต่ละวัน */}
        <div className="space-y-3.5">
          {heatDays.map((day, row) => (
            <div key={`${day}-${row}`} className="flex items-center gap-4">
              <span className="w-12 shrink-0 text-center text-[14px] font-normal leading-5 text-ink-3">{day}</span>

              <div className="grid flex-1 gap-3" style={GRID_STYLE}>
                {data[row].map((value, col) => (
                  <div
                    key={heatHours[col]}
                    title={`${day} ${heatHours[col]} - ${value}`}
                    className={`h-[52px] rounded-[6px] transition-[transform,background-color] duration-200 hover:scale-105 ${CELL_CLASS[levelOf(value)]}`}
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
              <span key={hour} className="text-center text-[14px] leading-5 text-ink-3">
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
  const t = useT()
  const [floor, setFloor] = useState('A')
  const [color, setColor] = useState<HeatColor>('Blue')

  const data = getHeatData(floor)
  const hasData = !!data && data.length > 0

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar title={t('heatMap.title')} />

      <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 sm:px-8">
        <SummaryCards items={heatSummary.map((item) => toSummaryItem(item, t))} />

        {/* data-heat อยู่ที่การ์ด: ลูกทุกตัว (legend + กริด) จะได้สีของชุดที่เลือก */}
        <section data-heat={color} className="card overflow-hidden !rounded-[17.5px] p-0">
          <div
            style={DIVIDER_STYLE}
            className="flex flex-wrap items-center justify-between gap-2 border-b px-[26.5px] py-[14.5px]"
          >
            <h2 className="text-[18.825px] font-medium text-ink">{t('heatMap.sectionTitle', { floor })}</h2>

            <div className="flex items-center gap-2.5">
              <PillSelect
                ariaLabel={t('heatMap.ariaColor')}
                value={color}
                onChange={setColor}
                options={buildColorOptions(t)}
                widthClass="w-[116px]"
                triggerClassName={SELECT_TRIGGER}
                panelClassName={SELECT_PANEL}
                arrow={null}
              />
              <PillSelect
                ariaLabel={t('heatMap.ariaFloor')}
                value={floor}
                onChange={setFloor}
                options={buildFloorOptions(t)}
                widthClass="w-[170px]"
                triggerClassName={SELECT_TRIGGER}
                panelClassName={SELECT_PANEL}
              />
            </div>
          </div>

          <div className="px-5 py-5 sm:px-5 sm:py-6">
            {hasData ? (
              <>
                <HeatLegend />
                <HeatGrid data={data} />
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default HeatMap