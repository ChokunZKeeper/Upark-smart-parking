import { useState, type FormEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'
import { setViewAs, getFirstAllowedPath } from '@/constants/viewAs'
import { useT } from '@/i18n'

/* ---------- Data ---------- */

const PERMISSION_LIST = [
  {
    key: 'permissions_manage',
    title: 'roles.permissionList.permissions_manage.title',
    desc: 'roles.permissionList.permissions_manage.desc',
  },
  {
    key: 'dashboard',
    title: 'roles.permissionList.dashboard.title',
    desc: 'roles.permissionList.dashboard.desc',
  },
  {
    key: 'parking',
    title: 'roles.permissionList.parking.title',
    desc: 'roles.permissionList.parking.desc',
  },
  {
    key: 'heatmap',
    title: 'roles.permissionList.heatmap.title',
    desc: 'roles.permissionList.heatmap.desc',
  },
  {
    key: 'reports',
    title: 'roles.permissionList.reports.title',
    desc: 'roles.permissionList.reports.desc',
  },
  {
    key: 'qr',
    title: 'roles.permissionList.qr.title',
    desc: 'roles.permissionList.qr.desc',
  },
  {
    key: 'system_access',
    title: 'roles.permissionList.system_access.title',
    desc: 'roles.permissionList.system_access.desc',
  },
  {
    key: 'can_edit',
    title: 'roles.permissionList.can_edit.title',
    desc: 'roles.permissionList.can_edit.desc',
  },
] as const satisfies readonly { key: string; title: string; desc: string }[]

/* ---------- Types ---------- */

type PermissionItem = (typeof PERMISSION_LIST)[number]
type PermissionKey = PermissionItem['key']

interface Role {
  id: string
  name: string
  permissions: PermissionKey[]
}

/* ---------- Constants ---------- */

const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_LIST.map((permission) => permission.key)

const INITIAL_ROLES: Role[] = [
  { id: 'super-admin', name: 'Super Admin', permissions: ALL_PERMISSION_KEYS },
  { id: 'admin', name: 'Admin', permissions: ['dashboard', 'parking', 'heatmap', 'reports', 'qr'] },
]

const DEFAULT_ACTIVE_ROLE_ID = 'admin'

// สีทั้งหมดอิง CSS variables ใน theme (--border, --surface, --text, --text-secondary, --text-tertiary)
// เหมือนหน้า Parking เพื่อให้เปลี่ยน Light/Dark ได้ ไม่ฮาร์ดโค้ดสี
const HEADER_BUTTON =
  'flex h-[40px] min-w-[140px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-[16px] text-ink-2 transition hover:bg-[#F2F2F2] hover:text-[#212121] hover:border-[#E5E5E5]'

const COLUMN_HEADER = 'flex h-[72px] shrink-0 items-center justify-center border-b border-[var(--border)] px-4 text-[20px] font-medium text-ink-1'

/* ---------- Helpers ---------- */

// เปิด/ปิดสิทธิ์ใน role นั้น (มีอยู่แล้ว = เอาออก, ยังไม่มี = เพิ่ม)
const togglePermissionOf = (role: Role, key: PermissionKey): Role => ({
  ...role,
  permissions: role.permissions.includes(key)
    ? role.permissions.filter((permission) => permission !== key)
    : [...role.permissions, key],
})

const buildRoleId = (name: string) => `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

/* ---------- Sub components ---------- */

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`relative inline-flex h-[32px] w-[58px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-[#2771D8]' : 'bg-[var(--border)]'
      }`}
    >
      <span
        className={`inline-block h-[26px] w-[26px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[29px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function AddRoleForm({
  name,
  onNameChange,
  onSubmit,
  onCancel,
}: {
  name: string
  onNameChange: (name: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
}) {
  const t = useT()
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={t('roles.form.placeholder')}
        aria-label={t('roles.form.ariaLabel')}
        className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--text)] outline-none focus:border-brand"
      />
      <button
        type="submit"
        className="h-10 rounded-lg bg-[#2771D8] px-5 text-[13px] text-white transition hover:bg-brand-dark"
      >
        {t('roles.form.create')}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-[var(--border)] px-5 text-[13px] text-ink-2 hover:bg-[#F2F2F2] hover:text-[#212121]"
      >
        {t('roles.form.cancel')}
      </button>
    </form>
  )
}

// คอลัมน์ซ้าย: รายชื่อ role
function RoleList({
  roles,
  activeId,
  onSelect,
}: {
  roles: Role[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const t = useT()
  return (
    <div className="flex flex-col border-b border-[var(--border)] md:border-b-0 md:border-r">
      <div className={COLUMN_HEADER}>{t('roles.rolesColumn')}</div>

      <div className="flex flex-1 flex-col">
        {roles.map((role) => {
          const isSelected = role.id === activeId

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              className={`flex h-[88px] w-full shrink-0 items-center justify-center border-b border-[var(--border)] px-4 text-[20px] font-normal transition-colors ${
                isSelected ? 'bg-[#2771D8] text-white' : 'bg-[var(--surface)] text-ink-1 hover:bg-[var(--hover-dropdown-bg)] hover:text-[var(--hover-dropdown-text)] hover:border-[var(--hover-dropdown-border)]'
              }`}
            >
              {role.name}
            </button>
          )
        })}

        <div className="flex-1" />
      </div>
    </div>
  )
}

function PermissionRow({
  permission,
  checked,
  onToggle,
}: {
  permission: PermissionItem
  checked: boolean
  onToggle: () => void
}) {
  const t = useT()
  return (
    <div className="flex min-h-[88px] flex-1 items-center justify-between gap-4 border-b border-[var(--border)] px-8 transition-colors last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-[20px] font-normal text-ink-1">{t(permission.title)}</div>
        <p className="mt-1 truncate text-[16px] text-ink-2">{t(permission.desc)}</p>
      </div>

      <Toggle checked={checked} onChange={onToggle} />
    </div>
  )
}

// คอลัมน์ขวา: สิทธิ์ทั้งหมดของ role ที่เลือก
function PermissionList({ role, onToggle }: { role: Role; onToggle: (key: PermissionKey) => void }) {
  const t = useT()
  return (
    <div className="flex flex-col">
      <div className={`${COLUMN_HEADER} px-6`}>{t('roles.permissionsColumn')}</div>

      <div className="flex flex-1 flex-col">
        {PERMISSION_LIST.map((permission) => (
          <PermissionRow
            key={permission.key}
            permission={permission}
            checked={role.permissions.includes(permission.key)}
            onToggle={() => onToggle(permission.key)}
          />
        ))}
      </div>
    </div>
  )
}

/* ---------- Page ---------- */

function Roles() {
  const t = useT()
  const { url_uuid } = useParams()
  const navigate = useNavigate()
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES)
  const [activeId, setActiveId] = useState(DEFAULT_ACTIVE_ROLE_ID)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const activeRole = roles.find((role) => role.id === activeId) ?? roles[0]

  const togglePermission = (key: PermissionKey) =>
    setRoles((prev) => prev.map((role) => (role.id === activeRole.id ? togglePermissionOf(role, key) : role)))

  // เก็บ role ที่เลือกไว้ แล้วไปหน้าแรกที่ role นั้นมีสิทธิ์เข้าได้
  const viewAsRole = () => {
    const firstPath = getFirstAllowedPath(activeRole.permissions)

    if (!firstPath) {
      window.alert(t('roles.noPermissionAlert', { name: activeRole.name }))
      return
    }

    setViewAs({ name: activeRole.name, permissions: [...activeRole.permissions] })
    navigate(`/system/${url_uuid}/${firstPath}`)
  }

  const closeAddForm = () => {
    setAdding(false)
    setNewName('')
  }

  const addRole = (e: FormEvent) => {
    e.preventDefault()

    const name = newName.trim()
    if (!name) return

    const id = buildRoleId(name)
    setRoles((prev) => [...prev, { id, name, permissions: [] }])
    setActiveId(id)
    closeAddForm()
  }

  return (
    <>
    <Navbar
      title={t('roles.title')}
      actions={
        <>
          <button type="button" onClick={viewAsRole} className={`gap-1.5 ${HEADER_BUTTON}`}>
            <Eye size={16} /> {t('roles.viewAsRole')}
          </button>
          <Link to={`/system/${url_uuid}/permissions`} className={HEADER_BUTTON}>
            {t('roles.back')}
          </Link>
          <button type="button" onClick={() => setAdding((open) => !open)} className={`gap-1.5 ${HEADER_BUTTON}`}>
            <Plus size={16} /> {t('roles.addRole')}
          </button>
        </>
      }
    />

      <main className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4 sm:px-8 sm:py-8">
        {adding && <AddRoleForm name={newName} onNameChange={setNewName} onSubmit={addRole} onCancel={closeAddForm} />}

        {/* ตารางรวม Roles & Permissions: ขยายเต็มพื้นที่ที่เหลือ */}
        <section className="flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="grid flex-1 grid-cols-1 md:grid-cols-[22%_1fr]">
            <RoleList roles={roles} activeId={activeRole.id} onSelect={setActiveId} />
            <PermissionList role={activeRole} onToggle={togglePermission} />
          </div>
        </section>
      </main>
    </>
  )
}

export default Roles