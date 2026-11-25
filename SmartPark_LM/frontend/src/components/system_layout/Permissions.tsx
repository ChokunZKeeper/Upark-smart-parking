<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Icon } from '@iconify/react'
import Navbar from '@components/system_layout/layout/Navbar'
import DataTable, { type DataTableColumn } from '@components/system_layout/layout/DataTable'
// แก้ path ให้ตรงกับไฟล์ที่ export colorProfile / getRandomColor
import { colorProfile, getRandomColor, type ColorName } from '@/services/data/mockData'
import PillSelect from '@/styles/Dropdown'
import { useT } from '@/i18n'
// ตรวจสิทธิ์ View as Role
import { canManagePermissions } from '@/constants/viewAs'
// ข้อมูลผู้ใช้ที่ล็อกอิน: ตัวเดียวกับที่ Sidebar ใช้ (ดึงมาจาก DB)
import { useUserInfo } from '@/pages/system/System'
// ใช้ต่อ URL รูปโปรไฟล์ที่อัปโหลด (/uploads/avatars/xxx.jpg)
import { API_BASE } from '@/module/Allmodules'
=======
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Icon } from '@iconify/react'
import Navbar from './layout/Navbar'
import DataTable, { type DataTableColumn } from './layout/DataTable'
import Select from './layout/Select'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* ---------- Types ---------- */

type Role = 'Admin' | 'Super Admin'
type FloorValue = 'A' | 'B' | 'C' | 'D' | 'All'
type StatusValue = 'all' | 'active' | 'inactive'

interface Member {
  id: number
  name: string
  role: Role
  email: string
  joined: string
  floor: FloorValue
  active: boolean
<<<<<<< HEAD
  color: ColorName
  avatarUrl?: string | null // รูปโปรไฟล์ที่อัปโหลด (ถ้ามี จะใช้แทนวงกลมไล่สี)
  isOwner?: boolean // Owner มีได้คนเดียว ส่วน Super Admin มีได้หลายคน
}

// คอลัมน์จากตาราง users ใน DB (รับทั้ง snake_case / camelCase เผื่อ hook แปลงชื่อไว้)
interface DbUser {
  employee_id?: number
  employeeId?: number
  id?: number
  first_name?: string
  last_name?: string
  email?: string
  avatar_color?: string
  avatar_url?: string | null // path จาก DB เช่น /uploads/avatars/xxx.jpg
  created_at?: string
  createdAt?: string
  avatarSrc?: string | null // URL เต็มของรูป (คำนวณในหน้านี้)
}

// ข้อมูลที่หน้า Profile ส่งมาทาง event 'profile-updated'
interface ProfileUpdatedDetail {
  firstName?: string
  lastName?: string
  avatar?: { kind: 'gradient'; name: ColorName } | { kind: 'image'; src: string }
}

// ค่าที่ใช้ทับข้อมูลผู้ใช้ทันทีหลังบันทึกโปรไฟล์ (ไม่ต้องรีเฟรช)
interface LiveProfile {
  firstName?: string
  lastName?: string
  color?: ColorName
  avatarUrl: string | null
=======
  color: number
}

interface MemberForm {
  name: string
  email: string
  role: Role
  floor: FloorValue
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
}

/* ---------- Data ---------- */

<<<<<<< HEAD
const initialMembers: Member[] = [
  { id: 31, name: 'Rachan Kwaonueng', role: 'Admin', email: 'creepertv@gmail.com', joined: '15/11/26', floor: 'A', active: true, color: 'red' },
  { id: 30, name: 'Suprawi Kwaosong', role: 'Admin', email: 'ice_cream@gmail.com', joined: '14/11/26', floor: 'B', active: false, color: 'green' },
  { id: 32, name: 'Narunat Kwaosam', role: 'Admin', email: 'delta_mark@gmail.com', joined: '17/11/26', floor: 'C', active: false, color: 'blue' },
  { id: 33, name: 'Thunjira Kwaosee', role: 'Admin', email: 'alpnum@gmail.com', joined: '17/11/26', floor: 'D', active: true, color: 'orange' },
  { id: 34, name: 'Tadthep Kasenee', role: 'Super Admin', email: 'Tadthep@hotmail.com', joined: '14/11/26', floor: 'All', active: true, color: 'purple' },
]

const roleOptions: { value: Role; label: string }[] = [
  { value: 'Admin', label: 'permissions.role.admin' },
  { value: 'Super Admin', label: 'permissions.role.superAdmin' },
]

// ตัวเลือกแรกของ dropdown ในช่องเชิญ/แถวลิงก์: value '' = ยังไม่เลือก แสดงคำว่า "Roles"
const rolePlaceholder = { value: '' as Role | '', label: 'permissions.rolesPlaceholder' }

const statusOptions: { value: StatusValue; label: string }[] = [
  { value: 'all', label: 'permissions.status.all' },
  { value: 'active', label: 'permissions.status.active' },
  { value: 'inactive', label: 'permissions.status.inactive' },
]

=======
const gradients = [
  'linear-gradient(180deg,#ff0000 0%,#FFEA00 100%)',
  'linear-gradient(180deg,#00d853 0%,#ffea00 100%)',
  'linear-gradient(180deg,#0066FF 0%,#00FFE1 100%)',
  'linear-gradient(180deg,#ff8000 0%,#fff600 100%)',
  'linear-gradient(180deg,#00BBFF 0%,#FFFF00 100%)',
]

const initialMembers: Member[] = [
  { id: 1107, name: 'Rachan Kwaonueng', role: 'Admin', email: 'creepertv@gmail.com', joined: '01/10/26', floor: 'A', active: true, color: 0 },
  { id: 1106, name: 'Suprawi Kwaosong', role: 'Admin', email: 'ice_cream@gmail.com', joined: '02/10/26', floor: 'B', active: false, color: 1 },
  { id: 1105, name: 'Narunat Kwaosam', role: 'Admin', email: 'delta_mark@gmail.com', joined: '03/10/26', floor: 'C', active: false, color: 2 },
  { id: 1104, name: 'Thunjira Kwaosee', role: 'Admin', email: 'alpnum@gmail.com', joined: '04/10/26', floor: 'D', active: true, color: 3 },
  { id: 1000, name: 'Company', role: 'Super Admin', email: 'company@hotmail.com', joined: '30/9/26', floor: 'All', active: true, color: 4 },
]

const roleOptions: { value: Role; label: string }[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Super Admin', label: 'Super Admin' },
]

const floorOptions: FloorValue[] = ['A', 'B', 'C', 'D', 'All']

const statusOptions: { value: StatusValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const EMPTY_FORM: MemberForm = { name: '', email: '', role: 'Admin', floor: 'A' }

>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ใช้ array คงที่ เพื่อไม่ให้ DataTable คำนวณใหม่ทุก render
const NO_SEARCH_KEYS: (keyof Member)[] = []

<<<<<<< HEAD
// ลิงก์ที่ใช้ปุ่ม Copy (เปลี่ยนเป็นลิงก์จริงของระบบ)
const INVITE_LINK = 'https://upark.co/file/e598efdb'

/* ---------- Styles ---------- */

// สีทั้งหมดอิง CSS variables ใน theme (--border, --surface, --text, --text-secondary) เหมือนหน้า Parking
// เพื่อให้เปลี่ยน Light/Dark ได้ ไม่ฮาร์ดโค้ดสี
const head = (label: string): ReactNode => (
  <span className="text-[16px] font-medium text-ink-1">{label}</span>
)

const cell = (value: ReactNode): ReactNode => (
  <span className="flex min-h-[72px] items-center justify-center text-[17px] text-ink-1">{value}</span>
=======
/* ---------- Styles ---------- */

const head = (label: string): ReactNode => (
  <span className="text-[16px] font-medium text-[#1d1d1f]">{label}</span>
)

const cell = (value: ReactNode): ReactNode => (
  <span className="flex min-h-[72px] items-center justify-center text-[17px] text-[#0F172A]">{value}</span>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
)

const ACTION_BTN =
  'flex !h-9 shrink-0 items-center justify-center whitespace-nowrap !rounded-full !py-0 !text-[14px] transition'

const NAV_BTN =
<<<<<<< HEAD
  'flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-7 text-[14px] !text-ink-2 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]'

const OUTLINE_HOVER =
  'hover:!bg-[var(--hover-dropdown-bg)] hover:!text-[color:var(--hover-dropdown-text)] hover:!border-[color:var(--hover-dropdown-border)]'

// พื้นเทาของช่องกรอก / pill ใน popover
const SOFT_BG = 'bg-[var(--hover-dropdown-bg)]'

// scrollbar บาง ๆ โทนเทาโปร่ง ไม่มีลูกศร (Firefox + Chrome/Edge/Safari)
const THIN_SCROLL =
  '[scrollbar-width:thin] [scrollbar-color:color-mix(in_srgb,var(--text-secondary)_35%,transparent)_transparent] ' +
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
  '[&::-webkit-scrollbar-thumb]:rounded-full ' +
  '[&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--text-secondary)_35%,transparent)] ' +
  '[&::-webkit-scrollbar-thumb:hover]:bg-[color-mix(in_srgb,var(--text-secondary)_55%,transparent)] ' +
  '[&::-webkit-scrollbar-button]:hidden'
=======
  'flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#d2d2d7] bg-white px-7 text-[14px] !text-[#6f6f72] transition hover:bg-gray-50'

const FORM_INPUT =
  'h-10 rounded-xl border border-[#D2D2D7] bg-white px-3.5 text-[13px] text-[#212121] outline-none focus:border-brand'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* ---------- Helpers ---------- */

const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`

// Super Admin ดูแลทุกชั้นเสมอ
const floorForRole = (role: Role, floor: FloorValue): FloorValue =>
  role === 'Super Admin' ? 'All' : floor === 'All' ? 'A' : floor

<<<<<<< HEAD
// ช่อง "Email, name..." ช่องเดียว: พิมพ์อีเมลอย่างเดียว หรือ "ชื่อ อีเมล" ก็ได้
// ถ้าไม่ใส่ชื่อ จะใช้ส่วนหน้า @ ของอีเมลเป็นชื่อ
const parseInvite = (text: string): { name: string; email: string } => {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  const email = tokens.find((t) => EMAIL_RE.test(t)) ?? ''
  const name = tokens.filter((t) => t !== email).join(' ') || email.split('@')[0] || ''
  return { name, email }
}

// พื้นหลังอวตาร: มีรูปอัปโหลด = ใช้รูป, ไม่มี = วงกลมไล่สี (colorProfile เดียวกับ Sidebar)
const avatarBg = (color: ColorName, url?: string | null): CSSProperties =>
  url
    ? { backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: colorProfile[color] ?? colorProfile.dark }

// แปลงข้อมูลผู้ใช้ที่ล็อกอิน (จาก DB) เป็นแถวในตาราง: Owner + Super Admin
// fallbackId ใช้เมื่อ useUserInfo() ไม่ได้ส่ง employee_id มา
const userToMember = (u: DbUser, fallbackId: number): Member => {
  const rawId = u.employee_id ?? u.employeeId ?? u.id
  const created = new Date(u.created_at ?? u.createdAt ?? Date.now())
  return {
    id: rawId != null ? Number(rawId) : fallbackId,
    name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
    role: 'Super Admin',
    email: u.email ?? '',
    joined: formatDate(Number.isNaN(created.getTime()) ? new Date() : created),
    floor: 'All',
    active: true, // กำลังล็อกอินอยู่ = ออนไลน์ (เหมือนจุดเขียวใน Sidebar)
    color: ((u.avatar_color as ColorName) ?? 'dark') as ColorName,
    avatarUrl: u.avatarSrc ?? null,
    isOwner: true,
  }
}

/* ---------- Sub components ---------- */

function StatusTabs({ value, onChange }: { value: StatusValue; onChange: (value: StatusValue) => void }) {
  const t = useT()
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]" role="tablist">
=======
/* ---------- Sub components ---------- */

function StatusTabs({ value, onChange }: { value: StatusValue; onChange: (value: StatusValue) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-[#d2d2d7] bg-white" role="tablist">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      {statusOptions.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
<<<<<<< HEAD
          className={`h-[36px] w-[80px] text-[13px] transition ${i > 0 ? 'border-l border-[var(--border)]' : ''} ${
            value === o.value
              ? 'bg-[#2771d8] text-white'
              : 'text-ink-2 hover:!bg-[var(--hover-dropdown-bg)] hover:!text-[color:var(--hover-dropdown-text)]'
          }`}
        >
          {t(o.label)}
=======
          className={`h-[36px] w-[80px] text-[13px] transition ${i > 0 ? 'border-l border-[#d2d2d7]' : ''} ${
            value === o.value ? 'bg-[#2771d8] text-white' : 'text-[#6f6f72] hover:bg-gray-50'
          }`}
        >
          {o.label}
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        </button>
      ))}
    </div>
  )
}

<<<<<<< HEAD
// วงกลมไล่สี (หรือรูปที่อัปโหลด) + ตัวอักษรแรกของชื่อ + จุดสถานะ
function Avatar({ name, color, active, avatarUrl }: { name: string; color: ColorName; active: boolean; avatarUrl?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <span
      className="relative mx-auto flex h-[43.5px] w-[43.5px] shrink-0 items-center justify-center rounded-full"
      style={avatarBg(color, avatarUrl)}
    >
      {/* ตัวอักษรกลางวงกลม (ถ้ามีรูปไม่ต้องแสดง) */}
      {!avatarUrl && <span className="select-none text-[20px] font-light leading-none text-white">{initial}</span>}
      {/* จุดสถานะ: เขียว = ออนไลน์ / เทา = ออฟไลน์ (ขอบจุดใช้สีพื้นหลังของ theme) */}
      <span
        className={
          active
            ? 'absolute -bottom-0.5 -right-0.5 h-[14.2px] w-[14.2px] rounded-full border-[2.4px] border-[var(--surface)] bg-[#3CD815]'
            : 'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2.4px] border-[var(--surface)] bg-[#B9B9BF]'
        }
      />
    </span>
  )
}

// dropdown "Roles" แบบไม่มีกรอบ ใช้ PillSelect ของระบบ (ทั้งในช่องเชิญและแถวลิงก์)
function RoleSelect({
  value,
  onChange,
  label,
}: {
  value: Role | ''
  onChange: (role: Role) => void
  label: string
}) {
  const t = useT()
  return (
    <PillSelect
      ariaLabel={label}
      value={value}
      onChange={(v) => {
        if (v) onChange(v as Role) // ไม่ให้กลับไปเลือก placeholder
      }}
      options={[rolePlaceholder, ...roleOptions].map((o) => ({ ...o, label: t(o.label) }))}
      widthClass="w-[135px]"
      triggerClassName="h-9 !border-transparent !bg-transparent hover:!border-transparent hover:!bg-transparent !rounded-lg text-[14px] !text-[var(--text-secondary)] hover:!text-[var(--text)]"
      panelClassName="min-w-[165px]"
    />
  )
}

// วงกลมไล่สี (หรือรูปที่อัปโหลด) + ตัวอักษรแรกของชื่อ สำหรับรายการ People with Access (ไม่มีจุดสถานะ)
function MiniAvatar({ name, color, avatarUrl }: { name: string; color: ColorName; avatarUrl?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={avatarBg(color, avatarUrl)}
      aria-hidden="true"
    >
      {!avatarUrl && <span className="select-none text-[18px] font-light leading-none text-white">{initial}</span>}
    </span>
=======
function Avatar({ color, active }: { color: number; active: boolean }) {
  return (
    <div className="relative mx-auto h-[43.5px] w-[43.5px]">
      <div className="h-full w-full rounded-full" style={{ background: gradients[color % gradients.length] }} />
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-[11px] w-[11px] rounded-full ${
          active ? 'bg-[#3cc719]' : 'bg-[#d2d2d7]'
        }`}
      />
    </div>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

/* ---------- Page ---------- */

function Permissions() {
<<<<<<< HEAD
  const t = useT()
  const roleLabel = (r: Role) => t(r === 'Super Admin' ? 'permissions.role.superAdmin' : 'permissions.role.admin')
  const { url_uuid } = useParams()
  const userInfo = useUserInfo() as DbUser | null | undefined

  // ตรวจสิทธิ์ Manage Permission: อ่านใหม่ทุก render
  const canManage = canManagePermissions()

  // ค่าที่ได้จากหน้า Profile หลังกด Save (ให้ตารางนี้อัปเดตทันที ไม่ต้องรีเฟรช)
  const [live, setLive] = useState<LiveProfile | null>(null)

  useEffect(() => {
    const onUpdated = (e: Event) => {
      const p = (e as CustomEvent<ProfileUpdatedDetail>).detail
      if (!p) return
      setLive({
        firstName: p.firstName,
        lastName: p.lastName,
        color: p.avatar?.kind === 'gradient' ? p.avatar.name : undefined,
        avatarUrl: p.avatar?.kind === 'image' ? p.avatar.src : null,
      })
    }
    window.addEventListener('profile-updated', onUpdated)
    return () => window.removeEventListener('profile-updated', onUpdated)
  }, [])

  // ข้อมูลผู้ใช้ที่ล็อกอิน = จาก DB + ทับด้วยค่าที่เพิ่งแก้ในหน้า Profile
  const meInfo = useMemo<DbUser | null | undefined>(() => {
    if (!userInfo) return userInfo
    return {
      ...userInfo,
      first_name: live?.firstName ?? userInfo.first_name,
      last_name: live?.lastName ?? userInfo.last_name,
      avatar_color: live?.color ?? userInfo.avatar_color,
      avatarSrc: live ? live.avatarUrl : userInfo.avatar_url ? `${API_BASE}${userInfo.avatar_url}` : null,
    }
  }, [userInfo, live])
=======
  const { url_uuid } = useParams()
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [status, setStatus] = useState<StatusValue>('all')
  const [search, setSearch] = useState('')
<<<<<<< HEAD

  // popover เชิญสมาชิก
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [inviteText, setInviteText] = useState('')
  const [inviteRole, setInviteRole] = useState<Role | ''>('')
  const [linkRole, setLinkRole] = useState<Role | ''>('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // ตัวนับ ID ไม่ซ้ำแม้ลบแล้วเพิ่มใหม่
  const nextId = useRef(Math.max(...initialMembers.map((m) => m.id)) + 1)

  // เมื่อข้อมูลผู้ใช้จาก DB มา (หรือเพิ่งแก้โปรไฟล์): ใส่ตัวเองเป็น Owner + Super Admin
  // - อีเมลซ้ำกับแถวเดิม -> อัปเดตแถวนั้น ไม่เพิ่มซ้ำ (ชื่อ / สี / รูปอัปเดตตามโปรไฟล์)
  // - Owner มีได้คนเดียว -> ล้าง flag ของคนอื่นเสมอ
  useEffect(() => {
    if (!meInfo?.email) return
    const meEmail = meInfo.email.toLowerCase()

    setMembers((prev) => {
      const me = userToMember(meInfo, nextId.current)
      const existing = prev.find((m) => m.email.toLowerCase() === meEmail)

      if (existing) {
        return prev.map((m) =>
          m.email.toLowerCase() === meEmail
            ? {
                ...m,
                id: me.id,
                name: me.name,
                color: me.color,
                avatarUrl: me.avatarUrl,
                joined: me.joined,
                role: 'Super Admin',
                floor: 'All',
                isOwner: true,
              }
            : { ...m, isOwner: false },
        )
      }

      if (meInfo.employee_id == null && meInfo.employeeId == null && meInfo.id == null) nextId.current++
      return [me, ...prev.map((m) => ({ ...m, isOwner: false }))]
    })
  }, [meInfo])
=======
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM)
  const [error, setError] = useState('')

  // ตัวนับ ID/สี ไม่ซ้ำแม้ลบแล้วเพิ่มใหม่
  const nextId = useRef(Math.max(...initialMembers.map((m) => m.id)) + 1)
  const nextColor = useRef(initialMembers.length)
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((m) => {
      if (status === 'active' && !m.active) return false
      if (status === 'inactive' && m.active) return false
      return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || String(m.id).includes(q)
    })
  }, [members, status, search])

  const superAdminCount = members.filter((m) => m.role === 'Super Admin').length

<<<<<<< HEAD
  // People with Access: Owner/ผู้ใช้ที่ล็อกอินขึ้นบนสุด (อีเมลซ้ำจะไม่แสดงซ้ำ)
  const accessList = useMemo(() => {
    const meEmail = meInfo?.email?.toLowerCase() ?? ''
    const mine = meEmail ? members.find((m) => m.email.toLowerCase() === meEmail) : undefined
    const others = meEmail ? members.filter((m) => m.email.toLowerCase() !== meEmail) : members

    const rows = others.map((m) => ({
      key: String(m.id),
      name: m.name,
      email: m.email,
      color: m.color,
      avatarUrl: m.avatarUrl ?? null,
      label: m.isOwner ? t('permissions.owner') : roleLabel(m.role),
      isMe: false,
    }))

    if (!meInfo) return rows

    return [
      {
        key: 'me',
        name: `${meInfo.first_name ?? ''} ${meInfo.last_name ?? ''}`.trim(),
        email: meInfo.email ?? '',
        color: ((meInfo.avatar_color as ColorName) ?? 'dark') as ColorName,
        avatarUrl: meInfo.avatarSrc ?? null,
        label: mine?.isOwner ? t('permissions.owner') : mine ? roleLabel(mine.role) : t('permissions.role.admin'),
        isMe: true,
      },
      ...rows,
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, meInfo, t])

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setInviteText('')
    setInviteRole('')
=======
  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    setError('')
  }

  const toggleForm = () => {
    if (formOpen) {
      closeForm()
      return
    }
    setEditingId(null)
<<<<<<< HEAD
    setInviteText('')
    setInviteRole('')
=======
    setForm(EMPTY_FORM)
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    setError('')
    setFormOpen(true)
  }

<<<<<<< HEAD
  // กด Edit: เปิด popover เดิม เติมชื่อ + อีเมล + role ของคนนั้นให้
  const startEdit = (m: Member) => {
    setEditingId(m.id)
    setInviteText(`${m.name} ${m.email}`)
    setInviteRole(m.role)
=======
  const startEdit = (m: Member) => {
    setEditingId(m.id)
    setForm({ name: m.name, email: m.email, role: m.role, floor: m.floor })
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    setError('')
    setFormOpen(true)
  }

<<<<<<< HEAD
  // ปิด popover เมื่อคลิกข้างนอกหรือกด Esc
  useEffect(() => {
    if (!formOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-invite-popover]') || target.closest('[data-invite-toggle]')) return
      closeForm()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeForm()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [formOpen])

  const removeMember = (m: Member) => {
    if (m.isOwner) {
      window.alert(t('permissions.errors.cannotRemoveOwner'))
      return
    }
    if (m.role === 'Super Admin' && superAdminCount <= 1) {
      window.alert(t('permissions.errors.cannotRemoveLastSuperAdmin'))
      return
    }
    if (!window.confirm(t('permissions.confirmRemove', { name: m.name }))) return
=======
  const removeMember = (m: Member) => {
    if (m.role === 'Super Admin' && superAdminCount <= 1) {
      window.alert('ไม่สามารถลบ Super Admin คนสุดท้ายได้')
      return
    }
    if (!window.confirm(`ต้องการลบ ${m.name} ใช่หรือไม่?`)) return
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    setMembers((prev) => prev.filter((x) => x.id !== m.id))
    if (editingId === m.id) closeForm()
  }

  const changeRole = (m: Member, role: Role) => {
<<<<<<< HEAD
    if (m.isOwner && role !== 'Super Admin') {
      window.alert(t('permissions.errors.ownerMustBeSuperAdmin'))
      return
    }
    if (m.role === 'Super Admin' && role !== 'Super Admin' && superAdminCount <= 1) {
      window.alert(t('permissions.errors.needOneSuperAdmin'))
=======
    if (m.role === 'Super Admin' && role !== 'Super Admin' && superAdminCount <= 1) {
      window.alert('ต้องมี Super Admin อย่างน้อย 1 คน')
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      return
    }
    setMembers((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, role, floor: floorForRole(role, x.floor) } : x)),
    )
  }

<<<<<<< HEAD
  const submitInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { name, email } = parseInvite(inviteText)

    if (!email) return setError(t('permissions.errors.invalidEmail'))
    if (members.some((m) => m.id !== editingId && m.email.toLowerCase() === email.toLowerCase()))
      return setError(t('permissions.errors.emailTaken'))

    // ไม่เลือก Roles = Admin (สิทธิ์ต่ำสุดที่มี)
    const role: Role = inviteRole || 'Admin'

    if (editingId !== null) {
      const target = members.find((m) => m.id === editingId)
      if (!target) return
      if (target.isOwner && role !== 'Super Admin') return setError(t('permissions.errors.ownerMustBeSuperAdmin'))
      if (target.role === 'Super Admin' && role !== 'Super Admin' && superAdminCount <= 1)
        return setError(t('permissions.errors.needOneSuperAdmin'))
      const floor = floorForRole(role, target.floor)
      setMembers((prev) => prev.map((m) => (m.id === editingId ? { ...m, name, email, role, floor } : m)))
    } else {
      const id = nextId.current++
      const color = getRandomColor()
      const floor = floorForRole(role, 'A')
      setMembers((prev) => [
        ...prev,
        { id, name, email, role, floor, joined: formatDate(new Date()), active: true, color },
=======
  const submitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()

    if (!name || !email) return setError('กรุณากรอกชื่อและอีเมล')
    if (!EMAIL_RE.test(email)) return setError('รูปแบบอีเมลไม่ถูกต้อง')
    if (members.some((m) => m.id !== editingId && m.email.toLowerCase() === email.toLowerCase()))
      return setError('อีเมลนี้ถูกใช้แล้ว')

    const floor = floorForRole(form.role, form.floor)

    if (editingId !== null) {
      const target = members.find((m) => m.id === editingId)
      if (target?.role === 'Super Admin' && form.role !== 'Super Admin' && superAdminCount <= 1)
        return setError('ต้องมี Super Admin อย่างน้อย 1 คน')
      setMembers((prev) =>
        prev.map((m) => (m.id === editingId ? { ...m, name, email, role: form.role, floor } : m)),
      )
    } else {
      const id = nextId.current++
      const color = nextColor.current++ % gradients.length
      setMembers((prev) => [
        ...prev,
        { id, name, email, role: form.role, floor, joined: formatDate(new Date()), active: true, color },
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      ])
    }
    closeForm()
  }

<<<<<<< HEAD
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(INVITE_LINK)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setError(t('permissions.errors.copyFailed'))
    }
  }

  const columns: DataTableColumn<Member>[] = [
    {
      key: 'profile',
      label: head(t('permissions.columns.profile')),
      render: (row) => (
        <span className="flex min-h-[72px] items-center justify-center">
          <Avatar name={row.name} color={row.color} active={row.active} avatarUrl={row.avatarUrl} />
        </span>
      ),
    },
    {
      key: 'name',
      label: head(t('permissions.columns.name')),
      render: (row) =>
        cell(
          <>
            {row.name}
            {row.isOwner && <span className="ml-1.5 text-[13px] text-[var(--text-secondary)]">({t('permissions.owner')})</span>}
          </>,
        ),
    },
    { key: 'id', label: head(t('permissions.columns.employeeId')), render: (row) => cell(row.id) },
    {
      key: 'email',
      label: head(t('permissions.columns.email')),
      render: (row) => <span className="whitespace-nowrap text-[17px] text-brand">{row.email}</span>,
    },
    { key: 'joined', label: head(t('permissions.columns.joined')), render: (row) => cell(row.joined) },
    {
      key: 'floor',
      label: head(t('permissions.columns.floor')),
=======
  const columns: DataTableColumn<Member>[] = [
    {
      key: 'profile',
      label: head('Profile'),
      render: (row) => (
        <span className="flex min-h-[72px] items-center justify-center">
          <Avatar color={row.color} active={row.active} />
        </span>
      ),
    },
    { key: 'name', label: head('Name'), render: (row) => cell(row.name) },
    { key: 'id', label: head('Employee ID'), render: (row) => cell(row.id) },
    {
      key: 'email',
      label: head('Email'),
      render: (row) => <span className="whitespace-nowrap text-[17px] text-brand">{row.email}</span>,
    },
    { key: 'joined', label: head('Date of joining'), render: (row) => cell(row.joined) },
    {
      key: 'floor',
      label: head('Floor Responsible'),
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      render: (row) => <span className="text-[17px] font-normal text-brand">{row.floor}</span>,
    },
    {
      key: 'role',
<<<<<<< HEAD
      label: head(t('permissions.columns.role')),
      render: (row) => (
        <div className="flex min-h-[72px] items-center justify-center">
          <PillSelect
            ariaLabel={t('permissions.roleOf', { name: row.name })}
            value={row.role}
            onChange={(role) => changeRole(row, role)}
            options={roleOptions.map((o) => ({ ...o, label: t(o.label) }))}
            widthClass="w-[175px]"
            triggerClassName="h-9 rounded-full border-[var(--border)] text-[14.5px] !text-ink-2 hover:!bg-transparent hover:!border-[var(--border)] hover:!text-[color:var(--hover-dropdown-text)]"
            panelClassName="min-w-[175px]"
=======
      label: head('Role'),
      render: (row) => (
        <div className="flex min-h-[72px] items-center justify-center">
          <Select
            ariaLabel={`Role of ${row.name}`}
            value={row.role}
            onChange={(v: string) => changeRole(row, v as Role)}
            options={roleOptions}
            className="w-[175px]"
            selectClassName="h-9 !rounded-full border-[#d2d2d7] py-0 pl-4 pr-8 text-[14.5px] text-center !text-[#0F172A] font-normal"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
          />
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-nowrap items-center justify-end gap-2.5 pr-6">
<<<<<<< HEAD
          {/* ซ่อนปุ่ม Edit และ Remove เมื่อ role มีสิทธิ์ permissions_manage (View as mode) */}
          {canManage && (
            <>
              <button type="button" className={`btn-outline ${ACTION_BTN} ${OUTLINE_HOVER} !px-5`} onClick={() => startEdit(row)}>
                {t('permissions.edit')}
              </button>
              <button
                type="button"
                disabled={row.isOwner}
                title={row.isOwner ? t('permissions.errors.cannotRemoveOwner') : undefined}
                className={`btn-outline ${ACTION_BTN} ${OUTLINE_HOVER} !px-5 ${row.isOwner ? 'cursor-not-allowed opacity-40' : ''}`}
                onClick={() => removeMember(row)}
              >
                {t('permissions.remove')}
              </button>
            </>
          )}
=======
          <button type="button" className={`btn-outline ${ACTION_BTN} !px-5`} onClick={() => startEdit(row)}>
            Edit
          </button>
          <button type="button" className={`btn-outline ${ACTION_BTN} !px-5`} onClick={() => removeMember(row)}>
            Remove
          </button>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        </div>
      ),
    },
  ]

  return (
<<<<<<< HEAD
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('permissions.title')}
        actions={
          <>
            {/* ซ่อนปุ่ม Manage Role เมื่อ role มีสิทธิ์ permissions_manage (View as mode) */}
            {url_uuid && canManage && (
              <Link to={`/system/${url_uuid}/roles`} className={NAV_BTN}>
                <Icon icon="lucide:user-key" height="1.25em " className="[&_*]:stroke-[1.75]" /> {t('permissions.manageRole')}
              </Link>
            )}
            <button type="button" data-invite-toggle className={NAV_BTN} onClick={toggleForm}>
              <Icon icon="akar-icons:link-chain" height="1.25em " className="[&_*]:stroke-[1.75]" /> {t('permissions.addMember')}
=======
    <>
      <Navbar
        title="Permissions"
        actions={
          <>
            {url_uuid && (
              <Link to={`/system/${url_uuid}/roles`} className={NAV_BTN}>
                Manage Role
              </Link>
            )}
            <button type="button" className={NAV_BTN} onClick={toggleForm}>
              <Icon icon="akar-icons:link-chain" height="1.25em " /> Add new member
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
            </button>
          </>
        }
      />

<<<<<<< HEAD
      <main className="relative min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6 sm:px-8">
=======
      <main className="space-y-4 p-4 sm:p-6">
        {formOpen && (
          <form onSubmit={submitForm} noValidate className="space-y-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input
                className={FORM_INPUT}
                placeholder="Name"
                aria-label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className={FORM_INPUT}
                placeholder="Email"
                type="email"
                aria-label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <select
                className={FORM_INPUT}
                aria-label="Role"
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value as Role
                  setForm({ ...form, role, floor: floorForRole(role, form.floor) })
                }}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                className={FORM_INPUT}
                aria-label="Floor"
                value={form.floor}
                disabled={form.role === 'Super Admin'}
                onChange={(e) => setForm({ ...form, floor: e.target.value as FloorValue })}
              >
                {floorOptions.map((f) => (
                  <option key={f} value={f}>
                    {f === 'All' ? 'All floors' : `Floor ${f}`}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary !h-10 flex-1 !rounded-xl !py-0 !text-[14px]">
                  {editingId !== null ? 'Save' : 'Add'}
                </button>
                {editingId !== null && (
                  <button type="button" className="btn-outline !h-10 !rounded-xl !py-0 !text-[14px]" onClick={closeForm}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {error && (
              <p role="alert" className="text-[13px] text-red-600">
                {error}
              </p>
            )}
          </form>
        )}

>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
        {/* แถวบน: แท็บสถานะ + ช่องค้นหา */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusTabs value={status} onChange={setStatus} />
          <div className="relative w-full sm:w-[230px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
<<<<<<< HEAD
              aria-label={t('permissions.searchMember')}
              className="h-[36px] w-full rounded-xl border border-[var(--border)] bg-transparent pl-3.5 pr-9 text-[13px] text-[var(--text)] outline-none focus:border-brand"
            />
            <Search
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
=======
              aria-label="Search member"
              className="h-[36px] w-full rounded-xl border border-[#D2D2D7] bg-white pl-3.5 pr-9 text-[13px] text-[#212121] outline-none focus:border-brand"
            />
            <Search
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
            />
          </div>
        </div>

        {/* จอแคบ: เลื่อนตารางแนวนอน ไม่บีบคอลัมน์ ไม่ให้ข้อความ/ปุ่มตกบรรทัด */}
        <div className="overflow-x-auto">
          {/* [&_input] / [&_.lucide-search]: ซ่อนช่องค้นหาเดิมของ DataTable (ใช้ช่องด้านบนแทน) */}
          <div className="[&_table]:min-w-[1100px] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap [&_td:first-child]:!pl-10 [&_th:first-child]:!pl-10 [&_input]:!hidden [&_.lucide-search]:!hidden">
            <DataTable<Member>
              columns={columns}
              rows={visible}
              searchKeys={NO_SEARCH_KEYS}
              searchPlaceholder=""
              emptyText={
<<<<<<< HEAD
                <div className="flex min-h-[340px] flex-col items-center justify-center py-12 text-center text-ink-1">
                  <p className="text-[17px] font-normal">{t('permissions.empty.title')}</p>
                  <p className="mt-2 text-[13px] font-normal">{t('permissions.empty.hint')}</p>
=======
                <div className="flex min-h-[340px] flex-col items-center justify-center py-12 text-center text-[#0F172A]">
                  <p className="text-[17px] font-normal">No Members Found</p>
                  <p className="mt-2 text-[13px] font-normal">Click “Add new member” to add one.</p>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
                </div>
              }
            />
          </div>
        </div>
<<<<<<< HEAD

        {/* popover เชิญสมาชิก: ลอยทับมุมขวาบน ใต้ปุ่ม Add new member */}
        {formOpen && (
          <div
            data-invite-popover
            role="dialog"
            aria-label={t('permissions.invite.dialog')}
            className="absolute right-8 top-2 z-30 !mt-0 w-[560px] max-w-[calc(100%-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
          >
            {/* แถวเชิญ: ช่อง Email, name... + Roles + ปุ่ม Invite */}
            <form onSubmit={submitInvite} noValidate className="flex items-center gap-3 p-5">
              <div className={`flex h-12 min-w-0 flex-1 items-center rounded-xl pl-4 ${SOFT_BG}`}>
                <input
                  autoFocus
                  type="text"
                  value={inviteText}
                  onChange={(e) => {
                    setInviteText(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={t('permissions.invite.placeholder')}
                  aria-label={t('permissions.invite.inputLabel')}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-secondary)]"
                />
                <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border)]" aria-hidden="true" />
                <RoleSelect value={inviteRole} onChange={setInviteRole} label={t('permissions.invite.roleLabel')} />
              </div>
              <button
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-[#2771d8] px-8 text-[15px] text-white transition hover:bg-[#1f63c4]"
              >
                {editingId !== null ? t('permissions.invite.save') : t('permissions.invite.invite')}
              </button>
            </form>

            {error && (
              <p role="alert" className="px-5 pb-4 text-[13px] text-red-600">
                {error}
              </p>
            )}

            {/* People with Access: จำนวนตามสมาชิกจริง */}
            <div className="border-t border-[var(--border)] px-5 py-5">
              <p className="mb-4 text-[14px] text-[var(--text-secondary)]">
                {t('permissions.invite.peopleWithAccess', { count: accessList.length })}
              </p>
              <ul className={`max-h-[300px] space-y-5 overflow-y-auto pr-3 ${THIN_SCROLL}`}>
                {accessList.map((p) => (
                  <li key={p.key} className="flex items-center gap-4">
                    <MiniAvatar name={p.name} color={p.color} avatarUrl={p.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] text-[var(--text)]">
                        {p.name}
                        {p.isMe && <span className="ml-1.5 text-[13px] text-[var(--text-secondary)]">({t('permissions.you')})</span>}
                      </p>
                      <p className="truncate text-[12px] text-[var(--text-secondary)]">{p.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-5 py-1.5 text-[13px] text-[var(--text-secondary)] ${SOFT_BG}`}
                    >
                      {p.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ลิงก์ + Roles + Copy */}
            <div className="flex items-center border-t border-[var(--border)] px-5 py-4">
              <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--text-secondary)]">
                {INVITE_LINK}
              </span>
              <span className="mx-2 h-5 w-px shrink-0 bg-[var(--border)]" aria-hidden="true" />
              <RoleSelect value={linkRole} onChange={setLinkRole} label={t('permissions.invite.linkRole')} />
              <button
                type="button"
                onClick={copyLink}
                className="ml-2 flex shrink-0 items-center gap-1.5 text-[14px] text-brand"
              >
                <Icon icon="lucide:copy" height="1.1em" />
                {copied ? t('permissions.invite.copied') : t('permissions.invite.copy')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
=======
      </main>
    </>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  )
}

export default Permissions