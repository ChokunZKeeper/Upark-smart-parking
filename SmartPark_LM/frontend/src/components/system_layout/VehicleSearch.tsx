import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'
<<<<<<< HEAD
import { useT, type TFunction } from '@/i18n'
import PillSelect from '@/styles/Dropdown'
import { initialVehicles } from '@/services/data/mockData'
=======
import { initialVehicles } from '@/types/_mockData'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Vehicle {
  id: number
  plate: string
  type: string
  floor: string
  zone: string
  timeIn: string
  timeOut: string
  date: string
  image: string
}

type SortKey = 'default' | 'timeIn' | 'timeOut' | 'floor' | 'type'

interface Option<T extends string = string> {
  value: T
  label: string
}

interface Column {
  label: string
  width: string
}

type PageItem = number | 'input'

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DATE_RANGES: Option[] = [
  { value: '24 Oct - 26 Oct', label: '24 Oct - 26 Oct' },
  { value: '20 Oct - 26 Oct', label: '20 Oct - 26 Oct' },
  { value: '1 Oct - 26 Oct', label: '1 Oct - 26 Oct' },
]

const TIME_RANGES: Option[] = [
  { value: '08:00 - 15:00', label: '08:00 - 15:00' },
  { value: '06:00 - 12:00', label: '06:00 - 12:00' },
  { value: '12:00 - 18:00', label: '12:00 - 18:00' },
<<<<<<< HEAD
  { value: 'All day', label: 'vehicleSearch.allDay' },
]

const SORT_OPTIONS: Option<SortKey>[] = [
  { value: 'default', label: 'vehicleSearch.sort.default' },
  { value: 'timeIn', label: 'vehicleSearch.columns.timeIn' },
  { value: 'timeOut', label: 'vehicleSearch.columns.timeOut' },
  { value: 'floor', label: 'vehicleSearch.columns.floor' },
  { value: 'type', label: 'vehicleSearch.columns.vehicleType' },
]

const COLUMNS: Column[] = [
  { label: 'vehicleSearch.columns.plate', width: 'w-[18%]' },
  { label: 'vehicleSearch.columns.vehicleType', width: 'w-[11.5%]' },
  { label: 'vehicleSearch.columns.floor', width: 'w-[10%]' },
  { label: 'vehicleSearch.columns.zone', width: 'w-[10.5%]' },
  { label: 'vehicleSearch.columns.timeIn', width: 'w-[12.5%]' },
  { label: 'vehicleSearch.columns.timeOut', width: 'w-[12%]' },
  { label: 'vehicleSearch.columns.date', width: 'w-[12.5%]' },
  { label: 'vehicleSearch.columns.image', width: 'w-[13%]' },
=======
  { value: 'All day', label: 'All day' },
]

const SORT_OPTIONS: Option<SortKey>[] = [
  { value: 'default', label: 'Sort' },
  { value: 'timeIn', label: 'Time in' },
  { value: 'timeOut', label: 'Time out' },
  { value: 'floor', label: 'Floor' },
  { value: 'type', label: 'Vehicle Type' },
]

const COLUMNS: Column[] = [
  { label: 'License plate number', width: 'w-[18%]' },
  { label: 'Vehicle Type', width: 'w-[11.5%]' },
  { label: 'Floor', width: 'w-[10%]' },
  { label: 'Zone', width: 'w-[10.5%]' },
  { label: 'Time in', width: 'w-[12.5%]' },
  { label: 'Time out', width: 'w-[12%]' },
  { label: 'Date', width: 'w-[12.5%]' },
  { label: 'Image', width: 'w-[13%]' },
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
]

const TOTAL_PAGES = 7
// 'input' marks where the "go to page" field is rendered
const PAGE_ITEMS: PageItem[] = [1, 2, 3, 'input', 5, 6, 7]

<<<<<<< HEAD
// สีทั้งหมดอิง CSS variables ใน theme (--border, --surface, --bg, --text, --text-secondary, --text-tertiary)
// เหมือนหน้า Parking เพื่อให้เปลี่ยน Light/Dark ได้ ไม่ฮาร์ดโค้ดสี

// หน้าตาของ PillSelect ในแถบ filter: สูง 36px มุม 10.5px ตัวอักษร 13px (ขนาดเดียวกับ select เดิม)
// ! กันชนกับ padding / สีตัวอักษรพื้นฐานของ PillSelect
const FILTER_TRIGGER =
  'h-[36px] rounded-[10.5px] border-[var(--border)] text-[13px] !text-ink-2 hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]'

// panel ตอนเปิด: กว้างอย่างน้อยเท่ากล่อง (ไม่ใช้ min-w-[220px] ค่าเดิม)
const FILTER_PANEL = 'min-w-full'

const CELL = 'px-4 text-center font-normal text-[16px] text-ink-1'
=======
const SELECT_BASE =
  'h-[36px] appearance-none rounded-[10.5px] border border-[#D2D2D7] bg-white text-center text-[13px] text-[#6F6F72] outline-none transition hover:bg-gray-50 focus:border-brand'

const CELL = 'px-4 text-center font-normal text-[16px] text-[#0F172A]'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const SORTERS: Record<Exclude<SortKey, 'default'>, (a: Vehicle, b: Vehicle) => number> = {
  floor: (a, b) => a.floor.localeCompare(b.floor),
  type: (a, b) => a.type.localeCompare(b.type),
  timeIn: (a, b) => a.id - b.id,
  timeOut: (a, b) => a.timeOut.localeCompare(b.timeOut),
}

function matchesSearch(vehicle: Vehicle, query: string): boolean {
  if (!query) return true
  return [vehicle.plate, vehicle.type, vehicle.floor, vehicle.zone, vehicle.date].some((field) =>
    field.toLowerCase().includes(query),
  )
}

function clampPage(page: number): number {
  return Math.min(TOTAL_PAGES, Math.max(1, page))
}

<<<<<<< HEAD
function buildVehiclesCsv(rows: Vehicle[], t: TFunction): string {
  const header = COLUMNS.map((c) => t(c.label))
=======
function buildVehiclesCsv(rows: Vehicle[]): string {
  const header = COLUMNS.map((c) => c.label)
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const lines = rows.map((r) => [`"${r.plate}"`, r.type, r.floor, r.zone, r.timeIn, r.timeOut, r.date, r.image])

  // BOM (\uFEFF) so Excel opens UTF-8 correctly
  return '\uFEFF' + [header, ...lines].map((cols) => cols.join(',')).join('\n')
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
/* Filter bar                                                                 */
/* -------------------------------------------------------------------------- */

interface FilterSelectProps<T extends string> {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
<<<<<<< HEAD
  widthClass?: string
  triggerClassName?: string
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  widthClass = 'w-[144px]',
  triggerClassName = '!px-5',
}: FilterSelectProps<T>) {
  return (
    <PillSelect
      ariaLabel={label}
      value={value}
      onChange={onChange}
      options={options}
      widthClass={widthClass}
      triggerClassName={`${FILTER_TRIGGER} ${triggerClassName}`}
      panelClassName={FILTER_PANEL}
    />
=======
  className?: string
}

function FilterSelect<T extends string>({ label, value, options, onChange, className = '' }: FilterSelectProps<T>) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`${SELECT_BASE} ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (value: SortKey) => void }) {
<<<<<<< HEAD
  const t = useT()
  return (
    <div className="relative">
      <FilterSelect
        label={t('vehicleSearch.sortBy')}
        value={value}
        options={SORT_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        onChange={onChange}
        widthClass="w-[132px]"
        triggerClassName="!pl-5 !pr-8"
=======
  return (
    <div className="relative">
      <FilterSelect
        label="Sort by"
        value={value}
        options={SORT_OPTIONS}
        onChange={onChange}
        className="min-w-[110px] pl-5 pr-8"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      />
      <svg
        aria-hidden="true"
        width="11"
        height="9"
        viewBox="0 0 11 9"
<<<<<<< HEAD
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
=======
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B9B9BF]"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      >
        <polygon
          points="2,2 9,2 5.5,7"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
<<<<<<< HEAD
  const t = useT()
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  return (
    <div className="relative w-full sm:w-[230px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
<<<<<<< HEAD
        aria-label={t('vehicleSearch.searchVehicles')}
        className="h-[36px] w-full rounded-xl border border-[var(--border)] bg-transparent pl-3.5 pr-9 text-[13px] text-[var(--text)] outline-none focus:border-brand"
      />
      <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
=======
        aria-label="Search vehicles"
        className="h-[36px] w-full rounded-xl border border-[#D2D2D7] bg-white pl-3.5 pr-9 text-[13px] text-[#212121] outline-none focus:border-brand"
      />
      <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

function EmptyState({ hasAnyVehicles }: { hasAnyVehicles: boolean }) {
<<<<<<< HEAD
  const t = useT()
  if (hasAnyVehicles) {
    return <p className="text-[17px]">{t('vehicleSearch.noVehicles')}</p>
=======
  if (hasAnyVehicles) {
    return <p className="text-[17px]">No vehicles found</p>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  }

  return (
    <div className="flex flex-col items-center justify-center">
<<<<<<< HEAD
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg)]">
        <svg
          className="h-6 w-6 text-[var(--text-tertiary)]"
=======
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F7]">
        <svg
          className="h-6 w-6 text-[#A1A1A6]"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      </div>
<<<<<<< HEAD
      <p className="text-[20px] font-medium text-ink-1">{t('vehicleSearch.noHardware')}</p>
      <p className="mt-2 text-[15px] font-light">{t('vehicleSearch.connectHardware')}</p>
=======
      <p className="text-[20px] font-medium text-[#212121]">No Hardware Found</p>
      <p className="mt-2 text-[15px] font-light">Please connect your hardware in Settings.</p>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

interface VehicleTableProps {
  rows: Vehicle[]
  hasAnyVehicles: boolean
  onPreview: (vehicle: Vehicle) => void
}

function VehicleTable({ rows, hasAnyVehicles, onPreview }: VehicleTableProps) {
<<<<<<< HEAD
  const t = useT()
  return (
    <section className="card overflow-hidden">
      <div className="overflow-x-auto px-4">
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-center text-[17px] text-ink-1">
          <thead>
            <tr className="h-[84px] border-b border-[var(--border)]">
              {COLUMNS.map((col, idx) => (
                <th
                  key={col.label}
                  className={`${col.width} relative px-5 text-center align-middle text-[18px] font-medium text-ink-1 ${
                    idx > 0
                      ? 'before:absolute before:left-0 before:top-1/2 before:h-10 before:w-px before:-translate-y-1/2 before:bg-[var(--border)]'
                      : ''
                  }`}
                >
                  {t(col.label)}
=======
  return (
    <section className="overflow-hidden rounded-[16.5px] border border-[#D2D2D7] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] table-fixed border-collapse text-center text-[17px] text-[#212121]">
          <thead>
            <tr className="h-[84px] border-b border-[#D2D2D7]">
              {COLUMNS.map((col, idx) => (
                <th
                  key={col.label}
                  className={`${col.width} relative px-5 text-center align-middle text-[18px] font-medium text-[#0F172A] ${
                    idx > 0
                      ? 'before:absolute before:left-0 before:top-1/2 before:h-10 before:w-px before:-translate-y-1/2 before:bg-[#D2D2D7]'
                      : ''
                  }`}
                >
                  {col.label}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
<<<<<<< HEAD
                className="h-[92px] border-b border-[var(--border)] transition-colors last:border-b-0"
              >
                <td className="px-4 text-center text-[16.75px] font-normal text-ink-1">{row.plate}</td>
=======
                className="h-[92px] border-b-[1.6px] border-[#D2D2D7] transition-colors last:border-b-0 hover:bg-[#FAFAFB]"
              >
                <td className="px-4 text-center text-[16.75px] font-normal text-[#0F172A]">{row.plate}</td>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                <td className={CELL}>{row.type}</td>
                <td className={CELL}>{row.floor}</td>
                <td className={CELL}>{row.zone}</td>
                <td className={`${CELL} tabular-nums`}>{row.timeIn}</td>
                <td className={`${CELL} tabular-nums`}>{row.timeOut}</td>
                <td className={`${CELL} tabular-nums`}>{row.date}</td>
                <td className="px-4 text-center">
                  <button
                    type="button"
                    onClick={() => onPreview(row)}
                    className="text-[16px] text-[#2771D8] underline underline-offset-2 transition-opacity hover:opacity-70"
                  >
                    {row.image}
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
<<<<<<< HEAD
                <td colSpan={COLUMNS.length} className="py-32 text-center text-ink-2">
=======
                <td colSpan={COLUMNS.length} className="py-32 text-center text-[#7E7E81]">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                  <EmptyState hasAnyVehicles={hasAnyVehicles} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

<<<<<<< HEAD
const ARROW_BUTTON = 'px-1.5 text-[11px] text-[var(--text-tertiary)] transition hover:text-[var(--text)]'
=======
const ARROW_BUTTON = 'px-1.5 text-[11px] text-[#AEAEB2] transition hover:text-[#212121]'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

interface PaginationProps {
  currentPage: number
  onChange: (page: number) => void
}

function Pagination({ currentPage, onChange }: PaginationProps) {
<<<<<<< HEAD
  const t = useT()
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const [pageInput, setPageInput] = useState('')

  // The input is highlighted when the current page has no visible button
  const inputIsActive = !PAGE_ITEMS.includes(currentPage)

  // Go to a page via buttons / arrows (clears the input)
  const goToPage = (page: number) => {
    onChange(clampPage(page))
    setPageInput('')
  }

  // Go to a page typed into the input
  const commitPageInput = () => {
    if (pageInput === '') return

    const n = parseInt(pageInput, 10)
    if (Number.isNaN(n)) {
      setPageInput('')
      return
    }

    const next = clampPage(n)
    onChange(next)
    // keep the number in the input only if that page has no visible button
    setPageInput(PAGE_ITEMS.includes(next) ? '' : String(next))
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPageInput()
      e.currentTarget.blur()
    }
  }

  return (
<<<<<<< HEAD
    <div className="flex items-center justify-center gap-4 pt-1 text-[14px] text-ink-2">
      <button type="button" onClick={() => goToPage(currentPage - 1)} className={ARROW_BUTTON} aria-label={t('vehicleSearch.previousPage')}>
=======
    <div className="flex items-center justify-center gap-4 pt-1 text-[14px] text-[#7E7E81]">
      <button type="button" onClick={() => goToPage(currentPage - 1)} className={ARROW_BUTTON} aria-label="Previous page">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        ◀
      </button>

      <div className="flex items-center gap-3.5">
        {PAGE_ITEMS.map((item) =>
          item === 'input' ? (
            <input
              key="page-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pageInput}
              placeholder="..."
<<<<<<< HEAD
              aria-label={t('vehicleSearch.goToPage', { max: TOTAL_PAGES })}
              title={t('vehicleSearch.goToPageHint', { max: TOTAL_PAGES })}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onKeyDown={handleInputKeyDown}
              onBlur={commitPageInput}
              className={`h-[28px] w-[52px] rounded-lg border bg-transparent text-center text-[13px] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-brand ${
                inputIsActive ? 'border-[#2771D8] font-medium text-[#2771D8]' : 'border-[var(--border)] text-[var(--text)]'
=======
              aria-label={`Go to page (1-${TOTAL_PAGES})`}
              title={`Type a page number (1-${TOTAL_PAGES}) and press Enter`}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onKeyDown={handleInputKeyDown}
              onBlur={commitPageInput}
              className={`h-[28px] w-[52px] rounded-lg border bg-white text-center text-[13px] outline-none transition placeholder:text-[#AEAEB2] focus:border-brand ${
                inputIsActive ? 'border-[#2771D8] font-medium text-[#2771D8]' : 'border-[#D2D2D7] text-[#212121]'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
              }`}
            />
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              className={`px-1 transition ${
<<<<<<< HEAD
                currentPage === item ? 'font-medium text-[#2771D8]' : 'text-ink-2 hover:text-[var(--text)]'
=======
                currentPage === item ? 'font-medium text-[#2771D8]' : 'text-[#7E7E81] hover:text-[#212121]'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>

<<<<<<< HEAD
      <button type="button" onClick={() => goToPage(currentPage + 1)} className={ARROW_BUTTON} aria-label={t('vehicleSearch.nextPage')}>
=======
      <button type="button" onClick={() => goToPage(currentPage + 1)} className={ARROW_BUTTON} aria-label="Next page">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        ▶
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Image preview modal                                                        */
/* -------------------------------------------------------------------------- */

function ImagePreviewModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
<<<<<<< HEAD
  const t = useT()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-medium text-ink-1">{vehicle.plate}</h3>
          <button type="button" onClick={onClose} className="text-xs text-ink-2 hover:text-[var(--text)]">
            {t('vehicleSearch.close')}
          </button>
        </div>

        <div className="mt-4 flex h-44 flex-col items-center justify-center rounded-xl bg-[var(--bg)] text-xs text-ink-2">
          <span className="font-medium text-ink-1">{vehicle.image}.jpg</span>
          <span className="mt-1 text-[11px]">
            {vehicle.type} • {t('vehicleSearch.floorLabel')} {vehicle.floor} ({vehicle.zone})
=======
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#D2D2D7] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#D2D2D7] pb-3">
          <h3 className="text-sm font-medium text-[#212121]">{vehicle.plate}</h3>
          <button type="button" onClick={onClose} className="text-xs text-[#7E7E81] hover:text-[#212121]">
            Close
          </button>
        </div>

        <div className="mt-4 flex h-44 flex-col items-center justify-center rounded-xl bg-gray-100 text-xs text-[#6F6F72]">
          <span className="font-medium text-[#212121]">{vehicle.image}.jpg</span>
          <span className="mt-1 text-[11px]">
            {vehicle.type} • Floor {vehicle.floor} ({vehicle.zone})
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          </span>
          <span className="mt-0.5 text-[11px]">
            {vehicle.date} ({vehicle.timeIn} - {vehicle.timeOut})
          </span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

function VehicleSearch() {
<<<<<<< HEAD
  const t = useT()
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const vehicles = initialVehicles as Vehicle[]

  const [dateRange, setDateRange] = useState('24 Oct - 26 Oct')
  const [timeRange, setTimeRange] = useState('08:00 - 15:00')
  const [sortBy, setSortBy] = useState<SortKey>('default')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewVehicle, setPreviewVehicle] = useState<Vehicle | null>(null)

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matched = vehicles.filter((v) => matchesSearch(v, query))

    return sortBy === 'default' ? matched : [...matched].sort(SORTERS[sortBy])
  }, [vehicles, search, sortBy])

  const handleExport = () => {
<<<<<<< HEAD
    downloadCsv(buildVehiclesCsv(filteredRows, t), 'vehicle-search.csv')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('vehicleSearch.title')}
=======
    downloadCsv(buildVehiclesCsv(filteredRows), 'vehicle-search.csv')
  }

  return (
    <>
      <Navbar
        title="Vehicle Search"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full bg-[#2771D8] px-7 py-2.5 text-[15.5px] font-normal text-white transition hover:bg-brand-dark"
          >
<<<<<<< HEAD
            {t('vehicleSearch.exportExcel')}
=======
            Export Excel
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          </button>
        }
      />

<<<<<<< HEAD
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4 sm:px-8 sm:py-5">
        {/* Filters and search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect label={t('vehicleSearch.dateRange')} value={dateRange} options={DATE_RANGES} onChange={setDateRange} />
            <FilterSelect label={t('vehicleSearch.timeRange')} value={timeRange} options={TIME_RANGES.map((o) => (o.value === 'All day' ? { ...o, label: t(o.label) } : o))} onChange={setTimeRange} />
=======
      <main className="flex flex-1 flex-col gap-6 px-6 py-4 sm:px-8 sm:py-5">
        {/* Filters and search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect
              label="Date range"
              value={dateRange}
              options={DATE_RANGES}
              onChange={setDateRange}
              className="min-w-[144px] px-5"
            />
            <FilterSelect
              label="Time range"
              value={timeRange}
              options={TIME_RANGES}
              onChange={setTimeRange}
              className="min-w-[144px] px-5"
            />
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>

          <SearchBox value={search} onChange={setSearch} />
        </div>

        <VehicleTable rows={filteredRows} hasAnyVehicles={vehicles.length > 0} onPreview={setPreviewVehicle} />

        <Pagination currentPage={currentPage} onChange={setCurrentPage} />
      </main>

      {previewVehicle && <ImagePreviewModal vehicle={previewVehicle} onClose={() => setPreviewVehicle(null)} />}
<<<<<<< HEAD
    </div>
=======
    </>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

export default VehicleSearch