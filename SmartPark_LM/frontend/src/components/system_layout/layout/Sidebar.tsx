import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Bell,
  Car,
  CircleHelp,
  Eye,
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
import { footerNavItems, navItems, secondaryNavItems, colorProfile, type ColorName } from '@/services/data/mockData'
import { useUserInfo } from '@/pages/system/System'
import * as icons_svg from '@/styles/Icons';
import {
  MENU_PERMISSION,
  getViewAs,
  clearViewAs,
  canAccessPath,
  getFirstAllowedPath,
  type ViewAsRole,
} from '@/constants/viewAs'
import { useT } from '@/i18n'
import api, { API_BASE } from '@/module/Allmodules'

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

// ข้อมูลโปรไฟล์ล่าสุดจากเซิร์ฟเวอร์ (หรือจาก event ตอนกด Save ในหน้า Profile)
type ProfileAvatar = { kind: 'gradient'; name: ColorName } | { kind: 'image'; src: string }

interface ProfileOverride {
  firstName: string
  lastName: string
  avatar: ProfileAvatar | null
}

const isColorName = (v: unknown): v is ColorName => typeof v === 'string' && v in colorProfile

// แปลง event 'profile-updated' (ProfileData จากหน้า Profile) เป็นข้อมูลของ Sidebar
const toOverride = (raw: unknown): ProfileOverride | null => {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Partial<ProfileOverride>
  return {
    firstName: typeof p.firstName === 'string' ? p.firstName : '',
    lastName: typeof p.lastName === 'string' ? p.lastName : '',
    avatar: p.avatar ?? null,
  }
}

// แปลงแถวจาก GET /profile (snake_case) เป็นข้อมูลของ Sidebar
const fromApiRow = (row: any): ProfileOverride => ({
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  avatar: row.avatar_url
    ? { kind: 'image', src: `${API_BASE}${row.avatar_url}` }
    : { kind: 'gradient', name: isColorName(row.avatar_color) ? row.avatar_color : 'dark' },
})

/* ---------- Nav item ---------- */

// กรองเมนูตามสิทธิ์ของ role ที่กำลังดูอยู่ (View as)
// - ไม่ได้อยู่ในโหมดดู: แสดงทุกเมนู
// - เมนูที่ไม่ได้ผูกสิทธิ์ไว้ (เช่น Vehicle Search, Settings, Notifications): แสดงเสมอ
const filterByViewAs = (items: readonly { path: string }[], viewAs: ViewAsRole | null): NavItemData[] => {
  const list = items as NavItemData[]
  if (!viewAs) return list

  return list.filter((item) => {
    const permissionKey = MENU_PERMISSION[item.path.replace(/^\//, '')]
    return !permissionKey || viewAs.permissions.includes(permissionKey)
  })
}

// key ของชื่อเมนูใน sidebar.json (ผูกกับ path)
const NAV_KEYS: Record<string, string> = {
  '/dashboard': 'sidebar.nav.dashboard',
  '/parking': 'sidebar.nav.parking',
  '/heatmap': 'sidebar.nav.heatmap',
  '/reports': 'sidebar.nav.reports',
  '/qrcode': 'sidebar.nav.qrcode',
  '/permissions': 'sidebar.nav.permissions',
  '/vehicle-search': 'sidebar.nav.vehicleSearch',
  '/system-settings': 'sidebar.nav.systemSettings',
  '/settings': 'sidebar.nav.settings',
  '/notifications': 'sidebar.nav.notifications',
}

function NavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItemData
  collapsed: boolean
  onNavigate: () => void
}) {
  const t = useT()
  const navLabel = (i: NavItemData) => (NAV_KEYS[i.path] ? t(NAV_KEYS[i.path]) : i.label)
  const Icon = ICONS[item.icon]
  const { pathname } = useLocation()
  const { url_uuid } = useParams()

  // ต่อ /system/<uuid> หน้า path เดิม (path ใน mockData ขึ้นต้นด้วย / เช่น /parking)
  const base = `/system/${url_uuid}`
  const to = `${base}${item.path}`

  const isOnSubPage = SUB_PAGE_OF[item.path] === pathname.replace(base, '')
  // icon ใน mockData เป็นชื่อของ SVG ใน @/styles/Icons (เช่น dashboard_icon) จึงดึงด้วย string key
  const Icon_ = (icons_svg as unknown as Record<string, ComponentType>)[item.icon]

  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      title={navLabel(item)}
      className={({ isActive }) =>
        cx(
          'flex items-center rounded-md text-[15px] transition-colors',
          collapsed ? 'justify-center px-0 py-3' : 'px-2 py-3',
          isActive || isOnSubPage ? 'font-normal text-[var(--primary)]' : 'font-light text-ink-2 hover:text-[var(--text)]',
        )
      }
    >
      <div className="flex items-center gap-2.5">
        <Icon_ />
        {collapsed ? <Icon size={20} /> : navLabel(item)}
      </div>
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

/* ---------- Header (ผู้ใช้ + เมนูบัญชี) ---------- */

function UserAvatar({
  online_check = false,
  char_name = '',
  gradient_color = '',
  image_src,
}: {
  online_check: boolean
  char_name: string
  gradient_color: string
  image_src?: string // ถ้ามี จะแสดงรูปแทนสี gradient
}) {
  const Logo_gradient = colorProfile[gradient_color as ColorName] ?? colorProfile.dark

  return (
    <span
      className="relative my-1.5 flex h-[42.5px] w-[42.5px] shrink-0 items-center justify-center rounded-full"
      style={
        image_src
          ? { backgroundImage: `url("${image_src}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: Logo_gradient }
      }
    >
      {/* ตัวอักษรกลางวงกลม (ไม่แสดงเมื่อใช้รูป) */}
      {!image_src && <span className="select-none text-[20px] font-light leading-none text-white">{char_name}</span>}
      {/* จุดสีเขียว = ออนไลน์ เดียวมาทำต่อ*/}
      <span className={online_check? "absolute -bottom-0.5 -right-0.5 h-[14.2px] w-[14.2px] rounded-full border-[2.4px] border-sidebar bg-[#3CD815]": "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-0 border-sidebar bg-[#B9B9BF]" } />
    </span>
  )
}

function UserMenu({ onClose }: { onClose: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const { url_uuid } = useParams()

  // ถ้ายังไม่ได้เพิ่ม key 'sidebar.profile' ใน locales จะ fallback เป็น "Profile"
  const profileKey = t('sidebar.profile')
  const profileLabel = !profileKey || profileKey === 'sidebar.profile' ? 'Profile' : profileKey

  const handleProfile = () => {
    onClose()
    navigate(`/system/${url_uuid}/profile`)
  }

  const handleSignOut = () => {
    onClose()
    localStorage.removeItem('token')
    navigate('/', { replace: true })
  }

  const itemCls =
    'block w-full px-3 py-2.5 text-left hover:bg-[var(--hover-dropdown-bg)] hover:text-[color:var(--hover-dropdown-text)]'

  return (
    <div className="absolute left-3 right-3 top-full z-10 mt-1 overflow-hidden rounded-md border border-[color:var(--dropdown-border)] bg-[var(--bg)] py-1 text-sm text-ink-2 shadow-lg">
      <button type="button" className={itemCls} onClick={handleProfile}>
        {profileLabel}
      </button>
      <button type="button" className={itemCls} onClick={handleSignOut}>
        {t('sidebar.signOut')}
      </button>
    </div>
  )
}

function SidebarHeader({ isCollapsed, onCloseMobile }: { isCollapsed: boolean; onCloseMobile: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const userInfo = useUserInfo()
  const t = useT()
  const { url_uuid } = useParams()

  // ข้อมูลโปรไฟล์ล่าสุด: โหลดจากเซิร์ฟเวอร์ตอนเปิด และอัปเดตทันทีเมื่อกด Save (event: profile-updated)
  const [override, setOverride] = useState<ProfileOverride | null>(null)

  // โหลดโปรไฟล์จริงจาก DB (รูปที่อัปโหลดจึงไม่หายหลัง login ใหม่)
  useEffect(() => {
    if (!url_uuid) return
    const ctrl = new AbortController()

    api
      .request('profile', 'GET', null, { headers: { 'x-user-uuid': url_uuid }, signal: ctrl.signal })
      .then((r: any) => {
        if (r.aborted || !r.ok || !r.data) return
        setOverride(fromApiRow(r.data))
      })

    return () => ctrl.abort()
  }, [url_uuid])

  useEffect(() => {
    const handler = (e: Event) => setOverride(toOverride((e as CustomEvent).detail))
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [])

  const firstName = override?.firstName || userInfo?.first_name || ''
  const lastName = override?.lastName || userInfo?.last_name || ''

  // ระหว่างรอโหลดจากเซิร์ฟเวอร์ ใช้ข้อมูลจาก userInfo (/systemuuid) ไปก่อน
  const fallbackAvatar: ProfileAvatar | null = userInfo?.avatar_url
    ? { kind: 'image', src: `${API_BASE}${userInfo.avatar_url}` }
    : null
  const avatar = override?.avatar ?? fallbackAvatar
  const gradientName = avatar?.kind === 'gradient' ? avatar.name : userInfo?.avatar_color
  const imageSrc = avatar?.kind === 'image' ? avatar.src : undefined

  return (
    <div className="relative p-4 pb-2 py-5">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className={cx('flex w-full items-center gap-3 rounded-md text-left', isCollapsed && 'justify-center')}
      >
        <UserAvatar online_check={true}
          char_name={firstName.slice(0, 1).toUpperCase()}
          gradient_color={gradientName ?? ''}
          image_src={imageSrc}
        />

        {!isCollapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15.5px] font-normal text-[var(--text)]">
              {userInfo ? `${firstName} ${lastName}` : ''}
            </span>
            <span className="block truncate text-[11.5px] text-ink-3">{userInfo?.email}</span>
          </span>
        )}
      </button>

      {menuOpen && !isCollapsed && <UserMenu onClose={() => setMenuOpen(false)} />}

      {/* ปุ่มปิด: แสดงเฉพาะ mobile */}
      <button
        type="button"
        onClick={onCloseMobile}
        className="absolute right-2 top-2 rounded p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label={t('sidebar.closeMenu')}
      >
        <X size={18} />
      </button>
    </div>
  )
}

/* ---------- Quick actions ---------- */

function QuickActions() {
  const t = useT()
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-5.5 text-[15px] font-light text-ink-2">
      <span>{t('sidebar.quickActions')}</span>
      <span>
        ⌘<span className="ml-0.5">K</span>
      </span>
    </div>
  )
}

/* ---------- Viewing as banner ---------- */

function ViewingAsBanner({
  roleName,
  collapsed,
  onExit,
}: {
  roleName: string
  collapsed: boolean
  onExit: () => void
}) {
  const t = useT()
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onExit}
        title={`${t('sidebar.viewingAs', { role: roleName })} - ${t('sidebar.exitViewAs')}`}
        className="mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-md bg-[#2771D8] text-white"
      >
        <X size={16} />
      </button>
    )
  }

  return (
    <div className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-lg bg-[#2771D8] px-3 py-2 text-[13px] text-white">
      <span className="flex min-w-0 items-center gap-1.5">
        <Eye size={14} className="shrink-0" />
        <span className="truncate">{t('sidebar.viewingAs', { role: roleName })}</span>
      </span>
      <button type="button" onClick={onExit} className="shrink-0 rounded px-2 py-0.5 font-medium hover:bg-white/20">
        {t('sidebar.exitViewAs')}
      </button>
    </div>
  )
}

/* ---------- Main component ---------- */

function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  // บน mobile (drawer) ให้แสดงแบบเต็มเสมอ ไม่ย่อ
  const isCollapsed = collapsed && !mobileOpen

  const navigate = useNavigate()
  const { url_uuid } = useParams()
  const { pathname } = useLocation()

  // อ่านใหม่ทุกครั้งที่เปลี่ยนหน้า เพราะ Sidebar ไม่ถูก mount ใหม่ตอนกด View as Role
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const viewAs = useMemo(() => getViewAs(), [pathname])

  // บล็อกหน้าที่ role ไม่มีสิทธิ์ (กรณีพิมพ์ URL เอง หรือกด back) ให้เด้งไปหน้าแรกที่เข้าได้
  useEffect(() => {
    if (!viewAs) return

    const base = `/system/${url_uuid}`
    const relativePath = pathname.replace(base, '')
    if (canAccessPath(viewAs.permissions, relativePath)) return

    const firstPath = getFirstAllowedPath(viewAs.permissions)
    if (firstPath) {
      navigate(`${base}/${firstPath}`, { replace: true })
    } else {
      clearViewAs()
      navigate(`${base}/roles`, { replace: true })
    }
  }, [viewAs, pathname, url_uuid, navigate])

  const visibleNavItems = filterByViewAs(navItems, viewAs)
  const visibleSecondaryNavItems = filterByViewAs(secondaryNavItems, viewAs)
  const visibleFooterNavItems = filterByViewAs(footerNavItems, viewAs)

  // ออกจากโหมดดู แล้วกลับไปหน้า Roles
  const exitViewAs = () => {
    clearViewAs()
    navigate(`/system/${url_uuid}/roles`)
  }

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

        {viewAs && <ViewingAsBanner roleName={viewAs.name} collapsed={isCollapsed} onExit={exitViewAs} />}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavGroup items={visibleNavItems} collapsed={isCollapsed} onNavigate={onCloseMobile} />
          {visibleSecondaryNavItems.length > 0 && <div className="!my-4 border-t border-line" />}
          <NavGroup items={visibleSecondaryNavItems} collapsed={isCollapsed} onNavigate={onCloseMobile} />
        </nav>

        <div className="space-y-1 border-t border-line px-3 py-3">
          <NavGroup items={visibleFooterNavItems} collapsed={isCollapsed} onNavigate={onCloseMobile} />
        </div>
      </aside>
    </>
  )
}

export default Sidebar