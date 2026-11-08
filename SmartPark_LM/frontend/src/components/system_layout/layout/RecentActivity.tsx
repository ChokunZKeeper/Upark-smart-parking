import { LogIn, LogOut, type LucideIcon } from 'lucide-react'

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

/* ---------- Sub components ---------- */

function EmptyState() {
  return (
    <div className="flex min-h-[210px] flex-1 items-center justify-center p-6">
      <span className="text-[18.5px] font-normal text-[#7E7E81]">No Data</span>
    </div>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const { icon: Icon, iconColor } = ACTIVITY_STYLES[item.type]

  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
        <Icon size={20} strokeWidth={2.5} />
      </span>

      <span className="min-w-0 flex-1 truncate text-base text-[#0F172A]">{item.message}</span>

      <span className="w-28 shrink-0 text-right text-[15.5px] text-[#7E7E81]">{item.time}</span>
    </li>
  )
}

/* ---------- Main component ---------- */

function RecentActivity({ items }: RecentActivityProps) {
  const hasItems = !!items && items.length > 0

  return (
    <section className="card flex h-full min-h-[385px] flex-col overflow-hidden">
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-line px-8">
        <h2 className="text-[16.5px] font-medium text-[#0F172A]">Recent Activity</h2>
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