import { useMemo, useState } from 'react'

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

/* ---------- Helpers ---------- */

const sortByCountDesc = (rows: VehicleTypeRow[]) => [...rows].sort((a, b) => b.count - a.count)

const barWidth = (count: number) => `calc((100% - ${LABEL_SPACE}px) * ${count / MAX_AXIS})`

/* ---------- Sub components ---------- */

function SortButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const stateClass = active ? 'bg-[#2771D8] text-[#FFFFFF]' : 'text-[#6F6F72] hover:bg-gray-50'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[8px] border border-line px-6.5 py-1 text-[13.5px] font-normal transition ${stateClass}`}
    >
      Sort
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[210px] flex-1 items-center justify-center p-6">
      <span className="text-[18.5px] font-normal text-[#7E7E81]">No Data</span>
    </div>
  )
}

function BarChartRows({ rows }: { rows: VehicleTypeRow[] }) {
  return (
    <div className="flex flex-1 px-6 py-5">
      {/* คอลัมน์ซ้าย: ชื่อประเภทรถ */}
      <ul className="flex w-20 shrink-0 flex-col justify-around pr-4 text-right text-[15px] font-normal text-[#0F172A]">
        {rows.map((row) => (
          <li key={row.name} className="flex h-6 items-center justify-end">
            {row.name}
          </li>
        ))}
      </ul>

      {/* คอลัมน์ขวา: แท่งกราฟ + จำนวน */}
      <ul className="flex flex-1 flex-col justify-around border-b border-l border-line">
        {rows.map((row) => (
          <li key={row.name} className="flex h-6 items-center gap-2.5">
            <div
              className="h-8.5 rounded-r-sm border border-[#2563EB] bg-gradient-to-r from-white to-[#2347E8] transition-all"
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
  const [sorted, setSorted] = useState(false)

  const rows = useMemo(() => (sorted ? sortByCountDesc(data) : data), [data, sorted])

  return (
    <section className="card flex h-full min-h-[385px] flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-line px-8 py-3.5">
        <h2 className="text-[16.5px] font-medium text-[#0F172A]">Type of Vehicles</h2>
        <SortButton active={sorted} onClick={() => setSorted((value) => !value)} />
      </header>

      {rows.length === 0 ? <EmptyState /> : <BarChartRows rows={rows} />}
    </section>
  )
}

export default VehicleTypes