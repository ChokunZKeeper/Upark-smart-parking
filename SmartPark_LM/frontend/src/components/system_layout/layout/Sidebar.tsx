import { useState } from 'react'
import { NavLink, useLocation, useParams } from 'react-router-dom'
import {
  Bell,
  Car,
  CircleHelp,
  FileText,
  Flame,
  LayoutDashboard,
  ParkingSquare,
  QrCode,
  Settings,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { company, footerNavItems, navItems, secondaryNavItems } from '@/types/_mockData'

/* ---------- Types ---------- */

const ICONS = {
  dashboard: LayoutDashboard,
  parking: ParkingSquare,
  vehicleSearch: Car,
  heatmap: Flame,
  reports: FileText,
  qr: QrCode,
  permissions: ShieldCheck,
  settings: Settings,
  notifications: Bell,
  help: CircleHelp,
} satisfies Record<string, LucideIcon>

export type NavIconName = keyof typeof ICONS

export interface NavItemData {
  path: string
  label: string
  icon: NavIconName
}

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

/* ---------- Constants ---------- */

const SIDEBAR_WIDTH = 'w-[264px]'
const SIDEBAR_WIDTH_COLLAPSED = 'w-[76px]'

// หน้าย่อย: เมนูหลักยังต้อง active ค้างไว้เมื่ออยู่ในหน้าย่อยนี้
// (Taxation อยู่ใต้ Reports, Roles อยู่ใต้ Permissions)
const SUB_PAGE_OF: Record<string, string> = {
  '/reports': '/taxation',
  '/permissions': '/roles',
}

/* ---------- Helpers ---------- */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/* ---------- Nav item ---------- */

function NavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItemData
  collapsed: boolean
  onNavigate: () => void
}) {
  const Icon = ICONS[item.icon]
  const { pathname } = useLocation()
  const { url_uuid } = useParams()

  // ต่อ /system/<uuid> หน้า path เดิม (path ใน mockData ขึ้นต้นด้วย / เช่น /parking)
  const base = `/system/${url_uuid}`
  const to = `${base}${item.path}`

  const isOnSubPage = SUB_PAGE_OF[item.path] === pathname.replace(base, '')

  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      title={item.label}
      className={({ isActive }) =>
        cx(
          'flex items-center rounded-md text-[15px] transition-colors',
          collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3',
          isActive || isOnSubPage ? 'font-normal text-[#2771D8]' : 'font-light text-[#6D6D70] hover:text-[#0F172A]',
        )
      }
    >
      {collapsed ? <Icon size={20} /> : item.label}
    </NavLink>
  )
}

function NavGroup({
  items,
  collapsed,
  onNavigate,
}: {
  items: NavItemData[]
  collapsed: boolean
  onNavigate: () => void
}) {
  return (
    <>
      {items.map((item) => (
        <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </>
  )
}

/* ---------- Header (บริษัท + เมนูบัญชี) ---------- */

function CompanyAvatar() {
  return (
    <span
      className="relative my-1.5 h-10.25 w-10.25 shrink-0 rounded-full"
      style={{ background: 'linear-gradient(180deg, #00BBFF 0%, #FFFF00 100%)' }}
    >
      {/* จุดสีเขียว = ออนไลน์ */}
      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-0 border-sidebar bg-[#3CC719]" />
    </span>
  )
}

function CompanyMenu() {
  const menuItemClass = 'block w-full px-3 py-2.5 text-left hover:bg-gray-50'

  return (
    <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-md border border-line bg-white py-1 text-sm shadow-lg">
      <button type="button" className={menuItemClass}>
        Switch company
      </button>
      <button type="button" className={menuItemClass}>
        Sign out
      </button>
    </div>
  )
}

function SidebarHeader({ isCollapsed, onCloseMobile }: { isCollapsed: boolean; onCloseMobile: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative p-4 pb-2 py-5">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className={cx('flex w-full items-center gap-3 rounded-md text-left', isCollapsed && 'justify-center')}
      >
        <CompanyAvatar />

        {!isCollapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15.5px] font-medium">{company.name}</span>
            <span className="block truncate text-[13.5px] text-[#6D6D70]">{company.email}</span>
          </span>
        )}
      </button>

      {menuOpen && !isCollapsed && <CompanyMenu />}

      {/* ปุ่มปิด: แสดงเฉพาะ mobile */}
      <button
        type="button"
        onClick={onCloseMobile}
        className="absolute right-2 top-2 rounded p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Close menu"
      >
        <X size={18} />
      </button>
    </div>
  )
}

/* ---------- Quick actions ---------- */

function QuickActions() {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-5.5 text-[15px] font-light text-[#6D6D70]">
      <span>Quick actions</span>
      <span>
        ⌘<span className="ml-0.5">K</span>
      </span>
    </div>
  )
}

/* ---------- Main component ---------- */

function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  // บน mobile (drawer) ให้แสดงแบบเต็มเสมอ ไม่ย่อ
  const isCollapsed = collapsed && !mobileOpen

  return (
    <>
      {/* พื้นหลังมืดตอนเปิด drawer บน mobile */}
      <div
        className={cx(
          'fixed inset-0 z-30 bg-black/30 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col bg-sidebar transition-all duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        )}
      >
        <SidebarHeader isCollapsed={isCollapsed} onCloseMobile={onCloseMobile} />

        {!isCollapsed && <QuickActions />}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavGroup items={navItems} collapsed={isCollapsed} onNavigate={onCloseMobile} />
          <div className="!my-4 border-t border-line" />
          <NavGroup items={secondaryNavItems} collapsed={isCollapsed} onNavigate={onCloseMobile} />
        </nav>

        <div className="space-y-1 border-t border-line px-3 py-3">
          <NavGroup items={footerNavItems} collapsed={isCollapsed} onNavigate={onCloseMobile} />
        </div>
      </aside>
    </>
  )
}

export default Sidebar