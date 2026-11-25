import { useMemo, useState, type CSSProperties } from 'react'
import { useT } from '@/i18n'

/* ---------- Types ---------- */

export interface VehicleTypeRow {
  name: string
  count: number
}

interface VehicleTypesProps {
  data: VehicleTypeRow[]
}

/* ---------- Constants ---------- */

// ค่าสูงสุดของแกน: ปรับตัวเลขนี้เพื่อเปลี่ยนความยาวของแท่งทั้งหมด
const MAX_AXIS = 10.55

// ความกว้างที่เว้นไว้ท้ายแท่ง สำหรับแสดงตัวเลข
const LABEL_SPACE = 32

// เส้นคั่นใต้หัวการ์ด: Radial gradient (กลางเข้ม -> ปลายสองข้างจางหาย)
const DIVIDER_STYLE: CSSProperties = {
  background:
     'radial-gradient(ellipse closest-side at 50% 50%, var(--border) 20%, transparent 97.5%)',
}

// คลาสของแท่ง: เปิด gradient = ไล่สี / ปิด = สีทึบสีเดียว
const BAR_BASE_CLASS = 'h-8.5 rounded-r-sm border border-[#2563EB] transition-all'
const BAR_GRADIENT_CLASS = 'bg-gradient-to-r from-white/0 to-[#2347E8]'
const BAR_SOLID_CLASS = 'bg-[#2563EB]'

// ชื่อประเภทรถจาก mock data -> key (ถ้าไม่พบจะแสดงชื่อเดิม)
const VEHICLE_NAME_KEYS: Record<string, string> = {
  Sedans: 'vehicleTypes.names.sedans',
  SUVs: 'vehicleTypes.names.suvs',
  Pickups: 'vehicleTypes.names.pickups',
  Vans: 'vehicleTypes.names.vans',
}

/* ---------- Helpers ---------- */

const sortByCountDesc = (rows: VehicleTypeRow[]) => [...rows].sort((a, b) => b.count - a.count)

const barWidth = (count: number) => `calc((100% - ${LABEL_SPACE}px) * ${count / MAX_AXIS})`

// อ่านค่าที่บันทึกจากหน้า Settings (ค่าเริ่มต้นคือเปิด)
const readGradients = () => localStorage.getItem('gradients') !== 'off'

/* ---------- Sub components ---------- */

function SortButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const t = useT()
  const stateClass = active ? 'bg-[#2771D8] text-[#FFFFFF]' : 'text-[#6F6F72] hover:bg-[#F2F2F2] hover:text-[#212121] hover:border-[#E5E5E5]'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[8px] border border-line px-6.5 py-1 text-[13.5px] font-normal transition ${stateClass}`}
    >
      {t('vehicleTypes.sort')}
    </button>
  )
}

function EmptyState() {
  const t = useT()
  return (
    <div className="flex min-h-[210px] flex-1 items-center justify-center p-6">
      <span className="text-[18.5px] font-normal text-[#7E7E81]">{t('vehicleTypes.noData')}</span>
    </div>
  )
}

function BarChartRows({ rows, gradients }: { rows: VehicleTypeRow[]; gradients: boolean }) {
  const t = useT()
  return (
    <div className="flex flex-1 px-6 py-5">
      {/* คอลัมน์ซ้าย: ชื่อประเภทรถ */}
      <ul className="flex w-20 shrink-0 flex-col justify-around pr-4 text-right text-[15px] font-normal text-[var(--text)]">
        {rows.map((row) => (
          <li key={row.name} className="flex h-6 items-center justify-end">
            {VEHICLE_NAME_KEYS[row.name] ? t(VEHICLE_NAME_KEYS[row.name]) : row.name}
          </li>
        ))}
      </ul>

      {/* คอลัมน์ขวา: แท่งกราฟ + จำนวน */}
      <ul className="flex flex-1 flex-col justify-around border-b border-l border-line">
        {rows.map((row) => (
          <li key={row.name} className="flex h-6 items-center gap-2.5">
            <div
              className={`${BAR_BASE_CLASS} ${gradients ? BAR_GRADIENT_CLASS : BAR_SOLID_CLASS}`}
              style={{ width: barWidth(row.count) }}
            />
            <span className="text-[14px] font-semibold text-[#2563EB]">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Main component ---------- */

function VehicleTypes({ data }: VehicleTypesProps) {
  const t = useT()
  const [sorted, setSorted] = useState(false)
  const gradients = readGradients()

  const rows = useMemo(() => (sorted ? sortByCountDesc(data) : data), [data, sorted])

  return (
    <section className="card flex h-full min-h-[385px] flex-col overflow-hidden">
      {/* border-transparent คงความสูงเดิมของเส้น 1px ไว้ แล้ววางเส้น gradient ทับด้านล่าง */}
      <header className="relative flex items-center justify-between border-b border-transparent px-8 py-3.5">
        <h2 className="text-[16.5px] font-medium text-[var(--text)]">{t('vehicleTypes.title')}</h2>
        <SortButton active={sorted} onClick={() => setSorted((value) => !value)} />
        <div aria-hidden className="absolute inset-x-0 bottom-[-1px] h-px" style={DIVIDER_STYLE} />
      </header>

      {rows.length === 0 ? <EmptyState /> : <BarChartRows rows={rows} gradients={gradients} />}
    </section>
  )
}

export default VehicleTypes