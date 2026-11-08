import { useState, type FormEvent } from 'react'
import { Link, useParams  } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Navbar from '@/components/system_layout/layout/Navbar'

/* ---------- Data ---------- */

const PERMISSION_LIST = [
  {
    key: 'permissions_manage',
    title: 'Manage Permission',
    desc: 'Manages permission and create and assign roles to other people.',
  },
  {
    key: 'dashboard',
    title: 'See DashBoard',
    desc: 'Be able to see activity on the dashboard and export it as pdf or png.',
  },
  {
    key: 'parking',
    title: 'See Parking',
    desc: 'Be able to see parked vehicles, empty slots and obstructed slots for further fixing.',
  },
  {
    key: 'heatmap',
    title: 'See Heatmap',
    desc: 'Be able to see percentage of people who parked in each floor throughout the day and week.',
  },
  {
    key: 'reports',
    title: 'See Reports',
    desc: 'Be able to see daily, weekly, monthly, yearly revenue.',
  },
  {
    key: 'qr',
    title: 'See QR Code',
    desc: 'Be able to create a fixed QR code for customers to scan and see where they had parked their vehicles.',
  },
  {
    key: 'system_access',
    title: 'System Access',
    desc: 'Be able to access and configure main system.',
  },
  {
    key: 'can_edit',
    title: 'Can Edit',
    desc: 'Be able to edit.',
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

const HEADER_BUTTON =
  'flex h-[40px] min-w-[140px] items-center justify-center rounded-xl border border-[#D2D2D7] bg-white px-5 text-[16px] text-[#6F6F72] transition hover:bg-gray-50'

const COLUMN_HEADER = 'flex h-[72px] shrink-0 items-center justify-center border-b border-[#D2D2D7] px-4 text-[20px] font-medium text-[#212121]'

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
        checked ? 'bg-[#2771D8]' : 'bg-[#D2D2D7]'
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
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Role name"
        aria-label="New role name"
        className="h-10 flex-1 rounded-lg border border-[#D2D2D7] px-3 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        className="h-10 rounded-lg bg-[#2771D8] px-5 text-[13px] text-white transition hover:bg-brand-dark"
      >
        Create
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-[#D2D2D7] px-5 text-[13px] text-[#6F6F72] hover:bg-gray-50"
      >
        Cancel
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
  return (
    <div className="flex flex-col border-b border-[#D2D2D7] md:border-b-0 md:border-r">
      <div className={COLUMN_HEADER}>Roles</div>

      <div className="flex flex-1 flex-col">
        {roles.map((role) => {
          const isSelected = role.id === activeId

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              className={`flex h-[88px] w-full shrink-0 items-center justify-center border-b border-[#D2D2D7] px-4 text-[20px] font-normal transition-colors ${
                isSelected ? 'bg-[#2771D8] text-white' : 'bg-white text-[#212121] hover:bg-gray-50'
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
  return (
    <div className="flex min-h-[88px] flex-1 items-center justify-between gap-4 border-b border-[#D2D2D7] px-8 transition-colors last:border-b-0 hover:bg-gray-50/50">
      <div className="min-w-0 flex-1">
        <div className="text-[20px] font-normal text-[#212121]">{permission.title}</div>
        <p className="mt-1 truncate text-[16px] text-[#7E7E81]">{permission.desc}</p>
      </div>

      <Toggle checked={checked} onChange={onToggle} />
    </div>
  )
}

// คอลัมน์ขวา: สิทธิ์ทั้งหมดของ role ที่เลือก
function PermissionList({ role, onToggle }: { role: Role; onToggle: (key: PermissionKey) => void }) {
  return (
    <div className="flex flex-col">
      <div className={`${COLUMN_HEADER} px-6`}>Permissions</div>

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
  const { url_uuid } = useParams() 
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES)
  const [activeId, setActiveId] = useState(DEFAULT_ACTIVE_ROLE_ID)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const activeRole = roles.find((role) => role.id === activeId) ?? roles[0]

  const togglePermission = (key: PermissionKey) =>
    setRoles((prev) => prev.map((role) => (role.id === activeRole.id ? togglePermissionOf(role, key) : role)))

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
      title="Roles Management"
      actions={
        <>
          <Link to={`/system/${url_uuid}/permissions`} className={HEADER_BUTTON}>
            Back
          </Link>
          <button type="button" onClick={() => setAdding((open) => !open)} className={`gap-1.5 ${HEADER_BUTTON}`}>
            <Plus size={16} /> Add new role
          </button>
        </>
      }
    />

      <main className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4 sm:px-8 sm:py-8">
        {adding && <AddRoleForm name={newName} onNameChange={setNewName} onSubmit={addRole} onCancel={closeAddForm} />}

        {/* ตารางรวม Roles & Permissions: ขยายเต็มพื้นที่ที่เหลือ */}
        <section className="flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-[22px] border border-[#D2D2D7] bg-white">
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