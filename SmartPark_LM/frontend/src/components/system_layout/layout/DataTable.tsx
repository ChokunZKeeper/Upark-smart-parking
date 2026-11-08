import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

/* ---------- Types ---------- */

type Align = 'left' | 'center'

export interface DataTableColumn<T> {
  key: string
  label: string
  align?: Align
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T extends { id: string | number }> {
  columns: DataTableColumn<T>[]
  rows: T[]
  searchKeys: (keyof T)[]
  searchPlaceholder?: string
  pageSize?: number
  emptyText?: string
}

/* ---------- Helpers ---------- */

const alignClass = (align?: Align) => (align === 'left' ? 'text-left' : 'text-center')

function matchesQuery<T>(row: T, keys: (keyof T)[], query: string) {
  return keys.some((key) => String(row[key]).toLowerCase().includes(query))
}

/* ---------- Hooks ---------- */

function useSearch<T>(rows: T[], searchKeys: (keyof T)[]) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => matchesQuery(row, searchKeys, q))
  }, [rows, query, searchKeys])

  return { query, setQuery, filtered }
}

function usePagination<T>(items: T[], pageSize: number, resetKey: string) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))

  // กลับไปหน้า 1 เมื่อคำค้นหาเปลี่ยน
  useEffect(() => {
    setPage(1)
  }, [resetKey])

  // กันกรณีหน้าปัจจุบันเกินจำนวนหน้าทั้งหมด
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)

  return {
    page,
    pageCount,
    pageItems,
    hasMultiplePages: items.length > pageSize,
    goPrev: () => setPage((p) => Math.max(1, p - 1)),
    goNext: () => setPage((p) => Math.min(pageCount, p + 1)),
  }
}

/* ---------- Sub components ---------- */

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="mb-3 flex justify-end">
      <label className="relative w-full max-w-[220px]">
        <span className="sr-only">Search</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-xs outline-none focus:border-brand"
        />
        <Search size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </label>
    </div>
  )
}

function Pagination({
  page,
  pageCount,
  onPrev,
  onNext,
}: {
  page: number
  pageCount: number
  onPrev: () => void
  onNext: () => void
}) {
  const buttonClass = 'rounded-md border border-gray-300 p-1 disabled:opacity-40'

  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-600">
      <button type="button" onClick={onPrev} disabled={page === 1} className={buttonClass} aria-label="Previous page">
        <ChevronLeft size={14} />
      </button>

      <span>
        {page} / {pageCount}
      </span>

      <button type="button" onClick={onNext} disabled={page === pageCount} className={buttonClass} aria-label="Next page">
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

/* ---------- Main component ---------- */

function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = 'Search',
  pageSize = 8,
  emptyText = 'No results found',
}: DataTableProps<T>) {
  const { query, setQuery, filtered } = useSearch(rows, searchKeys)
  const { page, pageCount, pageItems, hasMultiplePages, goPrev, goNext } = usePagination(filtered, pageSize, query)

  const renderCell = (row: T, col: DataTableColumn<T>) =>
    col.render ? col.render(row) : (row[col.key as keyof T] as ReactNode)

  return (
    <div>
      <SearchBox value={query} onChange={setQuery} placeholder={searchPlaceholder} />

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${alignClass(col.align)}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageItems.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-gray-50/70">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${alignClass(col.align)}`}>
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}

            {pageItems.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMultiplePages && <Pagination page={page} pageCount={pageCount} onPrev={goPrev} onNext={goNext} />}
    </div>
  )
}

export default DataTable