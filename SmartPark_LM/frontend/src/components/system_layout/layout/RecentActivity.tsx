import { LogIn, LogOut, type LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useT, type TFunction } from '@/i18n'

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
    </div>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const t = useT()
  const { icon: Icon, iconColor } = ACTIVITY_STYLES[item.type]

  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
        <Icon size={20} strokeWidth={2.5} />
      </span>

      <span className="min-w-0 flex-1 truncate text-base text-[var(--text)]">{translateMessage(t, item.message)}</span>

      <span className="w-28 shrink-0 text-right text-[15.5px] text-ink-3">{translateTime(t, item.time)}</span>
    </li>
  )
}

/* ---------- Main component ---------- */

function RecentActivity({ items }: RecentActivityProps) {
  const t = useT()
  const hasItems = !!items && items.length > 0

  return (
    <section className="card flex h-full min-h-[385px] flex-col overflow-hidden">
      {/* border-transparent คงความสูงเดิมของเส้น 1px ไว้ แล้ววางเส้น gradient ทับด้านล่าง */}
      <header className="relative flex h-[60px] shrink-0 items-center justify-between border-b border-transparent px-8">
        <h2 className="text-[16.5px] font-medium text-[var(--text)]">{t('recentActivity.title')}</h2>
        <div aria-hidden className="absolute inset-x-0 bottom-[-1px] h-px" style={DIVIDER_STYLE} />
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