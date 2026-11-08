import { useState } from 'react'
import { Search } from 'lucide-react'
import { Icon } from '@iconify/react'
import Navbar from '@/components/system_layout/layout/Navbar'
import DataTable, { type DataTableColumn } from '@/components/system_layout/layout/DataTable'
import { initialQrCodes } from '@/types/_mockData'

/* ---------- Types ---------- */

interface QrCodeItem {
  id: number
  name: string
  url: string
  zone: string
  floor: string
  created: string // dd/mm/yy
}

/* ---------- Constants ---------- */

// ช่องที่ใช้ค้นหา
const SEARCH_KEYS: (keyof QrCodeItem)[] = ['name', 'url', 'zone', 'floor']

const DEFAULT_FLOOR = 'A'

// ปุ่มในแถว ใช้ความสูงเท่ากันทั้งสามปุ่ม
const ACTION_BTN =
  'flex !h-9 shrink-0 items-center justify-center whitespace-nowrap !rounded-full !py-0 !text-[14px] transition'

const CREATE_BTN =
  'flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#d2d2d7] bg-white px-7 text-[14px] !text-[#6f6f72] transition hover:bg-gray-50'

// ความกว้างขั้นต่ำของตาราง ถ้าจอแคบกว่านี้จะเลื่อนแนวนอนแทนการบีบ/ตัดบรรทัด
const TABLE_MIN_WIDTH = 'min-w-[1100px]'

// ปรับแต่งตารางจาก DataTable:
// - [&_input] / [&_.lucide-search]: ซ่อนช่องค้นหาเดิมของ DataTable (ใช้ช่องใหม่ด้านบนแทน)
const TABLE_OVERRIDES = [
  '[&_td]:whitespace-nowrap',
  '[&_th]:whitespace-nowrap',
  '[&_input]:!hidden',
  '[&_.lucide-search]:!hidden',
].join(' ')

/* ---------- Helpers ---------- */

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// กรองแถวตามช่องค้นหา (ค้นจาก name, url, zone, floor)
const filterCodes = (codes: QrCodeItem[], search: string) => {
  const query = search.trim().toLowerCase()
  if (!query) return codes

  return codes.filter((code) => SEARCH_KEYS.some((key) => String(code[key] ?? '').toLowerCase().includes(query)))
}

// สร้าง zone ใหม่ต่อจาก floor ล่าสุด เช่น A1, A2, A3 -> A4
const buildNewCode = (codes: QrCodeItem[]): QrCodeItem => {
  const floor = codes.length > 0 ? codes[codes.length - 1].floor : DEFAULT_FLOOR
  const nextNumber = codes.filter((code) => code.floor === floor).length + 1
  const zone = `${floor}${nextNumber}`

  return {
    id: Date.now(),
    name: `Floor ${floor}`,
    url: `https://upark.com/parking/${zone}`,
    zone,
    floor,
    created: formatDate(new Date()),
  }
}

const buildFileName = (code: QrCodeItem) =>
  `${code.name.replace(/\s+/g, '-').toLowerCase()}-${String(code.zone ?? '').toLowerCase()}-qr.svg`

// ดาวน์โหลด QR เป็นไฟล์ SVG
const downloadQrSvg = (code: QrCodeItem) => {
  const blob = new Blob([qrToSvgString(code.url)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = buildFileName(code)
  link.click()

  URL.revokeObjectURL(url)
}

// หัวคอลัมน์
const headerLabel = (label: string) => <span className="text-[16px] font-medium text-[#1d1d1f]">{label}</span>

// เซลล์ทั่วไป: กำหนดความสูงแถวขั้นต่ำ 72px (เดิมคอลัมน์รูป QR เป็นตัวกำหนด)
const centeredCell = (value: string | number) => (
  <span className="flex min-h-[72px] items-center justify-center text-[17px] text-[#0F172A]">{value}</span>
)

/* ---------- Sub components ---------- */

// ช่องค้นหา: ขนาดและสไตล์เดียวกับหน้า Vehicle Search
function QrSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <div className="relative w-full sm:w-[230px]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search QR code"
          className="h-[36px] w-full rounded-xl border border-[#D2D2D7] bg-white pl-3.5 pr-9 text-[13px] text-[#212121] outline-none focus:border-brand"
        />
        <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
      </div>
    </div>
  )
}

function NoQrCodes() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center py-12 text-center text-[#0F172A]">
      <p className="text-[17px] font-normal">No QR Code Found</p>
      <p className="mt-2 text-[13px] font-normal">Click “Create new QR” to add one.</p>
    </div>
  )
}

/* ---------- Table columns ---------- */

interface ColumnHandlers {
  onDownload: (code: QrCodeItem) => void
  onEdit: (code: QrCodeItem) => void
  onRemove: (code: QrCodeItem) => void
}

function createColumns({ onDownload, onEdit, onRemove }: ColumnHandlers): DataTableColumn<QrCodeItem>[] {
  return [
    { key: 'name', label: headerLabel('QR Code Name'), render: (row) => centeredCell(row.name) },
    {
      key: 'url',
      label: headerLabel('URLs'),
      render: (row) => (
        <a
          href={row.url}
          className="whitespace-nowrap text-[17px] text-brand underline underline-offset-2 hover:opacity-80"
          onClick={(e) => e.preventDefault()}
        >
          {row.url}
        </a>
      ),
    },
    { key: 'zone', label: headerLabel('Zone'), render: (row) => centeredCell(row.zone) },
    {
      key: 'floor',
      label: headerLabel('Floor'),
      render: (row) => <span className="text-[17px] font-normal text-brand">{row.floor}</span>,
    },
    { key: 'created', label: headerLabel('Created'), render: (row) => centeredCell(row.created) },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-nowrap items-center justify-end gap-2.5 pr-6">
          <button type="button" className={`btn-primary ${ACTION_BTN} !px-7 font-normal`} onClick={() => onDownload(row)}>
            Download
          </button>
          <button type="button" className={`btn-outline ${ACTION_BTN} !px-5`} onClick={() => onEdit(row)}>
            Edit
          </button>
          <button type="button" className={`btn-outline ${ACTION_BTN} !px-5`} onClick={() => onRemove(row)}>
            Remove
          </button>
        </div>
      ),
    },
  ]
}

/* ---------- Page ---------- */

function QrCodePage() {
  const [codes, setCodes] = useState<QrCodeItem[]>(initialQrCodes)
  const [search, setSearch] = useState('')

  const filteredCodes = filterCodes(codes, search)

  const handleCreate = () => setCodes((prev) => [...prev, buildNewCode(prev)])

  const handleEdit = (code: QrCodeItem) => {
    const name = window.prompt('QR code name', code.name)?.trim()
    if (!name) return

    setCodes((prev) => prev.map((item) => (item.id === code.id ? { ...item, name } : item)))
  }

  const handleRemove = (code: QrCodeItem) => setCodes((prev) => prev.filter((item) => item.id !== code.id))

  const columns = createColumns({ onDownload: downloadQrSvg, onEdit: handleEdit, onRemove: handleRemove })

  return (
    <>
      <Navbar
        title="QR Code"
        actions={
          <button type="button" className={CREATE_BTN} onClick={handleCreate}>
            <Icon icon="coolicons:note-plus-corner" height="1.25em" /> Create new QR
          </button>
        }
      />

      <main className="p-4 sm:p-6">
        <QrSearch value={search} onChange={setSearch} />

        {/* จอแคบ: เลื่อนตารางแนวนอน ไม่บีบคอลัมน์ ไม่ให้ข้อความ/ปุ่มตกบรรทัด */}
        <div className="overflow-x-auto">
          <div className={`${TABLE_MIN_WIDTH} ${TABLE_OVERRIDES}`}>
            <DataTable
              columns={columns}
              rows={filteredCodes}
              searchKeys={[]}
              searchPlaceholder=""
              emptyText={<NoQrCodes />}
            />
          </div>
        </div>
      </main>
    </>
  )
}

export default QrCodePage