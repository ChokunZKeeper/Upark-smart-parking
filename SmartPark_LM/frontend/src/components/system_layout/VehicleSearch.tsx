import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'
import { initialVehicles } from '@/types/_mockData'

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
]

const TOTAL_PAGES = 7
// 'input' marks where the "go to page" field is rendered
const PAGE_ITEMS: PageItem[] = [1, 2, 3, 'input', 5, 6, 7]

const SELECT_BASE =
  'h-[36px] appearance-none rounded-[10.5px] border border-[#D2D2D7] bg-white text-center text-[13px] text-[#6F6F72] outline-none transition hover:bg-gray-50 focus:border-brand'

const CELL = 'px-4 text-center font-normal text-[16px] text-[#0F172A]'

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

function buildVehiclesCsv(rows: Vehicle[]): string {
  const header = COLUMNS.map((c) => c.label)
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
  )
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (value: SortKey) => void }) {
  return (
    <div className="relative">
      <FilterSelect
        label="Sort by"
        value={value}
        options={SORT_OPTIONS}
        onChange={onChange}
        className="min-w-[110px] pl-5 pr-8"
      />
      <svg
        aria-hidden="true"
        width="11"
        height="9"
        viewBox="0 0 11 9"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B9B9BF]"
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
  return (
    <div className="relative w-full sm:w-[230px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search vehicles"
        className="h-[36px] w-full rounded-xl border border-[#D2D2D7] bg-white pl-3.5 pr-9 text-[13px] text-[#212121] outline-none focus:border-brand"
      />
      <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

function EmptyState({ hasAnyVehicles }: { hasAnyVehicles: boolean }) {
  if (hasAnyVehicles) {
    return <p className="text-[17px]">No vehicles found</p>
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F7]">
        <svg
          className="h-6 w-6 text-[#A1A1A6]"
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
      <p className="text-[20px] font-medium text-[#212121]">No Hardware Found</p>
      <p className="mt-2 text-[15px] font-light">Please connect your hardware in Settings.</p>
    </div>
  )
}

interface VehicleTableProps {
  rows: Vehicle[]
  hasAnyVehicles: boolean
  onPreview: (vehicle: Vehicle) => void
}

function VehicleTable({ rows, hasAnyVehicles, onPreview }: VehicleTableProps) {
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
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="h-[92px] border-b-[1.6px] border-[#D2D2D7] transition-colors last:border-b-0 hover:bg-[#FAFAFB]"
              >
                <td className="px-4 text-center text-[16.75px] font-normal text-[#0F172A]">{row.plate}</td>
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
                <td colSpan={COLUMNS.length} className="py-32 text-center text-[#7E7E81]">
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

const ARROW_BUTTON = 'px-1.5 text-[11px] text-[#AEAEB2] transition hover:text-[#212121]'

interface PaginationProps {
  currentPage: number
  onChange: (page: number) => void
}

function Pagination({ currentPage, onChange }: PaginationProps) {
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
    <div className="flex items-center justify-center gap-4 pt-1 text-[14px] text-[#7E7E81]">
      <button type="button" onClick={() => goToPage(currentPage - 1)} className={ARROW_BUTTON} aria-label="Previous page">
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
              aria-label={`Go to page (1-${TOTAL_PAGES})`}
              title={`Type a page number (1-${TOTAL_PAGES}) and press Enter`}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onKeyDown={handleInputKeyDown}
              onBlur={commitPageInput}
              className={`h-[28px] w-[52px] rounded-lg border bg-white text-center text-[13px] outline-none transition placeholder:text-[#AEAEB2] focus:border-brand ${
                inputIsActive ? 'border-[#2771D8] font-medium text-[#2771D8]' : 'border-[#D2D2D7] text-[#212121]'
              }`}
            />
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              className={`px-1 transition ${
                currentPage === item ? 'font-medium text-[#2771D8]' : 'text-[#7E7E81] hover:text-[#212121]'
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button type="button" onClick={() => goToPage(currentPage + 1)} className={ARROW_BUTTON} aria-label="Next page">
        ▶
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Image preview modal                                                        */
/* -------------------------------------------------------------------------- */

function ImagePreviewModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
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
    downloadCsv(buildVehiclesCsv(filteredRows), 'vehicle-search.csv')
  }

  return (
    <>
      <Navbar
        title="Vehicle Search"
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full bg-[#2771D8] px-7 py-2.5 text-[15.5px] font-normal text-white transition hover:bg-brand-dark"
          >
            Export Excel
          </button>
        }
      />

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
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>

          <SearchBox value={search} onChange={setSearch} />
        </div>

        <VehicleTable rows={filteredRows} hasAnyVehicles={vehicles.length > 0} onPreview={setPreviewVehicle} />

        <Pagination currentPage={currentPage} onChange={setCurrentPage} />
      </main>

      {previewVehicle && <ImagePreviewModal vehicle={previewVehicle} onClose={() => setPreviewVehicle(null)} />}
    </>
  )
}

export default VehicleSearch