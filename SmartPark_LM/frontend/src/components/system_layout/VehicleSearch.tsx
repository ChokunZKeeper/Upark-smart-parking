import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'
import { useT, type TFunction } from '@/i18n'
import PillSelect from '@/styles/Dropdown'
import { initialVehicles } from '@/services/data/mockData'

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
]

const TOTAL_PAGES = 7
// 'input' marks where the "go to page" field is rendered
const PAGE_ITEMS: PageItem[] = [1, 2, 3, 'input', 5, 6, 7]

// สีทั้งหมดอิง CSS variables ใน theme (--border, --surface, --bg, --text, --text-secondary, --text-tertiary)
// เหมือนหน้า Parking เพื่อให้เปลี่ยน Light/Dark ได้ ไม่ฮาร์ดโค้ดสี

// หน้าตาของ PillSelect ในแถบ filter: สูง 36px มุม 10.5px ตัวอักษร 13px (ขนาดเดียวกับ select เดิม)
// ! กันชนกับ padding / สีตัวอักษรพื้นฐานของ PillSelect
const FILTER_TRIGGER =
  'h-[36px] rounded-[10.5px] border-[var(--border)] text-[13px] !text-ink-2 hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]'

// panel ตอนเปิด: กว้างอย่างน้อยเท่ากล่อง (ไม่ใช้ min-w-[220px] ค่าเดิม)
const FILTER_PANEL = 'min-w-full'

const CELL = 'px-4 text-center font-normal text-[16px] text-ink-1'

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

function buildVehiclesCsv(rows: Vehicle[], t: TFunction): string {
  const header = COLUMNS.map((c) => t(c.label))
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
  )
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (value: SortKey) => void }) {
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
      />
      <svg
        aria-hidden="true"
        width="11"
        height="9"
        viewBox="0 0 11 9"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
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
  const t = useT()
  return (
    <div className="relative w-full sm:w-[230px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('vehicleSearch.searchVehicles')}
        className="h-[36px] w-full rounded-xl border border-[var(--border)] bg-transparent pl-3.5 pr-9 text-[13px] text-[var(--text)] outline-none focus:border-brand"
      />
      <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

function EmptyState({ hasAnyVehicles }: { hasAnyVehicles: boolean }) {
  const t = useT()
  if (hasAnyVehicles) {
    return <p className="text-[17px]">{t('vehicleSearch.noVehicles')}</p>
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg)]">
        <svg
          className="h-6 w-6 text-[var(--text-tertiary)]"
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
      <p className="text-[20px] font-medium text-ink-1">{t('vehicleSearch.noHardware')}</p>
      <p className="mt-2 text-[15px] font-light">{t('vehicleSearch.connectHardware')}</p>
    </div>
  )
}

interface VehicleTableProps {
  rows: Vehicle[]
  hasAnyVehicles: boolean
  onPreview: (vehicle: Vehicle) => void
}

function VehicleTable({ rows, hasAnyVehicles, onPreview }: VehicleTableProps) {
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
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="h-[92px] border-b border-[var(--border)] transition-colors last:border-b-0"
              >
                <td className="px-4 text-center text-[16.75px] font-normal text-ink-1">{row.plate}</td>
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
                <td colSpan={COLUMNS.length} className="py-32 text-center text-ink-2">
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

const ARROW_BUTTON = 'px-1.5 text-[11px] text-[var(--text-tertiary)] transition hover:text-[var(--text)]'

interface PaginationProps {
  currentPage: number
  onChange: (page: number) => void
}

function Pagination({ currentPage, onChange }: PaginationProps) {
  const t = useT()
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
    <div className="flex items-center justify-center gap-4 pt-1 text-[14px] text-ink-2">
      <button type="button" onClick={() => goToPage(currentPage - 1)} className={ARROW_BUTTON} aria-label={t('vehicleSearch.previousPage')}>
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
              aria-label={t('vehicleSearch.goToPage', { max: TOTAL_PAGES })}
              title={t('vehicleSearch.goToPageHint', { max: TOTAL_PAGES })}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onKeyDown={handleInputKeyDown}
              onBlur={commitPageInput}
              className={`h-[28px] w-[52px] rounded-lg border bg-transparent text-center text-[13px] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-brand ${
                inputIsActive ? 'border-[#2771D8] font-medium text-[#2771D8]' : 'border-[var(--border)] text-[var(--text)]'
              }`}
            />
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => goToPage(item)}
              className={`px-1 transition ${
                currentPage === item ? 'font-medium text-[#2771D8]' : 'text-ink-2 hover:text-[var(--text)]'
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button type="button" onClick={() => goToPage(currentPage + 1)} className={ARROW_BUTTON} aria-label={t('vehicleSearch.nextPage')}>
        ▶
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Image preview modal                                                        */
/* -------------------------------------------------------------------------- */

function ImagePreviewModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
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
  const t = useT()
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
    downloadCsv(buildVehiclesCsv(filteredRows, t), 'vehicle-search.csv')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('vehicleSearch.title')}
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full bg-[#2771D8] px-7 py-2.5 text-[15.5px] font-normal text-white transition hover:bg-brand-dark"
          >
            {t('vehicleSearch.exportExcel')}
          </button>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4 sm:px-8 sm:py-5">
        {/* Filters and search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect label={t('vehicleSearch.dateRange')} value={dateRange} options={DATE_RANGES} onChange={setDateRange} />
            <FilterSelect label={t('vehicleSearch.timeRange')} value={timeRange} options={TIME_RANGES.map((o) => (o.value === 'All day' ? { ...o, label: t(o.label) } : o))} onChange={setTimeRange} />
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>

          <SearchBox value={search} onChange={setSearch} />
        </div>

        <VehicleTable rows={filteredRows} hasAnyVehicles={vehicles.length > 0} onPreview={setPreviewVehicle} />

        <Pagination currentPage={currentPage} onChange={setCurrentPage} />
      </main>

      {previewVehicle && <ImagePreviewModal vehicle={previewVehicle} onClose={() => setPreviewVehicle(null)} />}
    </div>
  )
}

export default VehicleSearch