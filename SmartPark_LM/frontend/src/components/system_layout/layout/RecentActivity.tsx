import { LogIn, LogOut, type LucideIcon } from 'lucide-react'
<<<<<<< HEAD
import type { CSSProperties } from 'react'
import { useT, type TFunction } from '@/i18n'
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* ---------- Types ---------- */

export type ActivityType = 'entered' | 'left'

export interface ActivityItem {
  id: string | number
  type: ActivityType
  message: string
  time: string
}

interface RecentActivityProps {
  items?: ActivityItem[]
}

/* ---------- Constants ---------- */

// ไอคอนและสีของแต่ละประเภทกิจกรรม
const ACTIVITY_STYLES: Record<ActivityType, { icon: LucideIcon; iconColor: string }> = {
  entered: { icon: LogIn, iconColor: 'text-[#2E9E3E]' },
  left: { icon: LogOut, iconColor: 'text-[#E5302B]' },
}

<<<<<<< HEAD
// เส้นคั่นใต้หัวการ์ด: Radial gradient (กลางเข้ม -> ปลายสองข้างจางหาย)
const DIVIDER_STYLE: CSSProperties = {
  background:
    'radial-gradient(ellipse closest-side at 50% 50%, var(--border) 20%, transparent 97.5%)',
}

// แปลข้อความจาก mock data (อังกฤษ); ถ้าไม่ตรงรูปแบบจะแสดงข้อความเดิม
const translateMessage = (t: TFunction, text: string): string => {
  const m = text.match(/^A car just (entered|left) (\(.*?\))(?: Paid (\d+) THB)?$/)
  if (!m) return text
  const plate = m[2]
  return m[3]
    ? t('recentActivity.message.leftPaid', { plate, amount: m[3] })
    : t('recentActivity.message.' + m[1], { plate })
}

const translateTime = (t: TFunction, text: string): string => {
  if (text === 'Just now') return t('recentActivity.time.justNow')
  if (text === 'A minute ago') return t('recentActivity.time.minuteAgo')
  const m = text.match(/^(\d+) minutes ago$/)
  return m ? t('recentActivity.time.minutesAgo', { count: m[1] }) : text
}

/* ---------- Sub components ---------- */

function EmptyState() {
  const t = useT()
  return (
    <div className="flex min-h-[210px] flex-1 items-center justify-center p-6">
      <span className="text-[18.5px] font-normal text-[#7E7E81]">{t('recentActivity.noData')}</span>
=======
/* ---------- Sub components ---------- */

function EmptyState() {
  return (
    <div className="flex min-h-[210px] flex-1 items-center justify-center p-6">
      <span className="text-[18.5px] font-normal text-[#7E7E81]">No Data</span>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
<<<<<<< HEAD
  const t = useT()
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const { icon: Icon, iconColor } = ACTIVITY_STYLES[item.type]

  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
        <Icon size={20} strokeWidth={2.5} />
      </span>

<<<<<<< HEAD
      <span className="min-w-0 flex-1 truncate text-base text-[var(--text)]">{translateMessage(t, item.message)}</span>

      <span className="w-28 shrink-0 text-right text-[15.5px] text-ink-3">{translateTime(t, item.time)}</span>
=======
      <span className="min-w-0 flex-1 truncate text-base text-[#0F172A]">{item.message}</span>

      <span className="w-28 shrink-0 text-right text-[15.5px] text-[#7E7E81]">{item.time}</span>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </li>
  )
}

/* ---------- Main component ---------- */

function RecentActivity({ items }: RecentActivityProps) {
<<<<<<< HEAD
  const t = useT()
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  const hasItems = !!items && items.length > 0

  return (
    <section className="card flex h-full min-h-[385px] flex-col overflow-hidden">
<<<<<<< HEAD
      {/* border-transparent คงความสูงเดิมของเส้น 1px ไว้ แล้ววางเส้น gradient ทับด้านล่าง */}
      <header className="relative flex h-[60px] shrink-0 items-center justify-between border-b border-transparent px-8">
        <h2 className="text-[16.5px] font-medium text-[var(--text)]">{t('recentActivity.title')}</h2>
        <div aria-hidden className="absolute inset-x-0 bottom-[-1px] h-px" style={DIVIDER_STYLE} />
=======
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-line px-8">
        <h2 className="text-[16.5px] font-medium text-[#0F172A]">Recent Activity</h2>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      </header>

      {hasItems ? (
        <ul className="divide-y divide-line px-6">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <EmptyState />
      )}
    </section>
  )
}

export default RecentActivity