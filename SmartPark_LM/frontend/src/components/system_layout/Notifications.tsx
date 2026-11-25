import { useState } from 'react'
import { Search } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'
import { useT } from '@/i18n'

/* ---------- Types ---------- */

type NotificationType = 'info' | 'error' | 'normal'

interface NotificationItem {
  id: string | number
  type: NotificationType
  title: string
  description?: string
}

interface Column {
  labelKey: string
  width: string
  hasLeftDivider?: boolean
}

/* ---------- Constants ---------- */

// ยังไม่มีข้อมูลแจ้งเตือน (ไม่มีวันที่/เนื้อหาละเอียด)
const INITIAL_NOTIFICATIONS: NotificationItem[] = []

// สีทั้งหมดอิง CSS variables ใน theme (--border, --surface, --bg, --text, --text-secondary, --text-tertiary)
// เหมือนหน้า Parking เพื่อให้เปลี่ยน Light/Dark ได้ ไม่ฮาร์ดโค้ดสี
const TITLE_COLOR: Record<NotificationType, string> = {
  info: 'text-[#2771D8]',
  error: 'text-[#E53E3E]',
  normal: 'text-ink-1',
}

// คอลัมน์ของตาราง: หัวตารางสไตล์เดียวกับหน้า Vehicle Search
const COLUMNS: Column[] = [
  { labelKey: 'notifications.columns.dateTime', width: 'w-[22%]' },
  { labelKey: 'notifications.columns.contents', width: 'w-[63%]', hasLeftDivider: true },
  { labelKey: '', width: 'w-[15%]' },
]

const LEFT_DIVIDER =
  'before:absolute before:left-0 before:top-1/2 before:h-10 before:w-px before:-translate-y-1/2 before:bg-[var(--border)]'

// เส้นคั่นแถวที่เว้นซ้ายขวา 16px จากขอบการ์ด:
// วาดที่ท้ายทุกเซลล์ (after:) โดยเซลล์แรกเริ่มเว้นซ้าย เซลล์สุดท้ายจบเว้นขวา
// พื้นหลังตอน hover ของแถวจึงยังเต็มถึงขอบการ์ด
const ROW_LINE =
  "relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[var(--border)] after:content-[''] first:after:left-4 last:after:right-4"

// ขนาดปุ่มเดียวกับปุ่มในแถวของหน้า QR Code
const DISMISS_BUTTON =
  'mx-auto flex h-9 shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full bg-[#2771D8] px-7 text-[14px] font-normal text-white transition-all duration-150 hover:bg-[#1f5fc2] hover:shadow-md active:scale-95'

const DISMISS_ALL_BUTTON =
  'flex h-[40px] min-w-[140px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-[16px] text-ink-2 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]'

/* ---------- Helpers ---------- */

const filterByTitle = (items: NotificationItem[], search: string) => {
  const query = search.toLowerCase()
  return query ? items.filter((item) => item.title.toLowerCase().includes(query)) : items
}

/* ---------- Sub components ---------- */

// ช่องค้นหา: ขนาดและสไตล์เดียวกับหน้า QR Code
function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT()
  return (
    <div className="mb-4 flex justify-end">
      <div className="relative w-full sm:w-[230px]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('notifications.searchAria')}
          className="h-[36px] w-full rounded-xl border border-[var(--border)] bg-transparent pl-3.5 pr-9 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[#2771D8]"
        />
        <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
      </div>
    </div>
  )
}

function TableHead() {
  const t = useT()
  return (
    <thead>
      <tr className="h-[84px]">
        {COLUMNS.map((col) => (
          <th
            key={col.width}
            className={`${col.width} ${ROW_LINE} px-5 text-center align-middle text-[18px] font-medium text-ink-1 ${
              col.hasLeftDivider ? LEFT_DIVIDER : ''
            }`}
          >
            {col.labelKey && t(col.labelKey)}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function NotificationRow({ item, onDismiss }: { item: NotificationItem; onDismiss: (id: NotificationItem['id']) => void }) {
  const t = useT()
  return (
    <tr className="group h-[92px] transition-colors hover:bg-[var(--bg)]">
      {/* Date & Time: เว้นว่างไว้ตั้งใจ */}
      <td className={`${ROW_LINE} px-4 text-center text-[16px] font-normal tabular-nums text-ink-1 group-last:after:hidden`} />

      {/* Contents */}
      <td className={`${ROW_LINE} px-4 text-center group-last:after:hidden`}>
        <p className={`text-[16px] font-normal ${TITLE_COLOR[item.type]}`}>{item.title}</p>
        {item.description && <p className="mt-1 text-[13px] text-ink-2">{item.description}</p>}
      </td>

      {/* Dismiss */}
      <td className={`${ROW_LINE} px-4 text-center group-last:after:hidden`}>
        <button type="button" onClick={() => onDismiss(item.id)} className={DISMISS_BUTTON}>
          {t('notifications.dismiss')}
        </button>
      </td>
    </tr>
  )
}

function EmptyRow() {
  const t = useT()
  return (
    <tr>
      <td colSpan={COLUMNS.length} className="py-32 text-center text-ink-2">
        <p className="text-[17px]">{t('notifications.empty')}</p>
      </td>
    </tr>
  )
}

/* ---------- Page ---------- */

function Notifications() {
  const t = useT()
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [search, setSearch] = useState('')

  const visible = filterByTitle(notifications, search)

  const dismiss = (id: NotificationItem['id']) => setNotifications((prev) => prev.filter((item) => item.id !== id))
  const dismissAll = () => setNotifications([])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('notifications.title')}
        actions={
          <button type="button" onClick={dismissAll} className={DISMISS_ALL_BUTTON}>
            {t('notifications.dismissAll')}
          </button>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 ">
        <SearchBar value={search} onChange={setSearch} />

        <section className="card overflow-hidden rounded-[16.5px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed border-collapse text-center text-[17px] text-ink-1">
              <TableHead />

              <tbody>
                {visible.map((item) => (
                  <NotificationRow key={item.id} item={item} onDismiss={dismiss} />
                ))}

                {visible.length === 0 && <EmptyRow />}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Notifications