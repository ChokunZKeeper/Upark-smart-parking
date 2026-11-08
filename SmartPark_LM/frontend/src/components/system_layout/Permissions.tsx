import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Icon } from '@iconify/react'
import Navbar from './layout/Navbar'
import DataTable, { type DataTableColumn } from './layout/DataTable'
import Select from './layout/Select'

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
  color: number
}

interface MemberForm {
  name: string
  email: string
  role: Role
  floor: FloorValue
}

/* ---------- Data ---------- */

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ใช้ array คงที่ เพื่อไม่ให้ DataTable คำนวณใหม่ทุก render
const NO_SEARCH_KEYS: (keyof Member)[] = []

/* ---------- Styles ---------- */

const head = (label: string): ReactNode => (
  <span className="text-[16px] font-medium text-[#1d1d1f]">{label}</span>
)

const cell = (value: ReactNode): ReactNode => (
  <span className="flex min-h-[72px] items-center justify-center text-[17px] text-[#0F172A]">{value}</span>
)

const ACTION_BTN =
  'flex !h-9 shrink-0 items-center justify-center whitespace-nowrap !rounded-full !py-0 !text-[14px] transition'

const NAV_BTN =
  'flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#d2d2d7] bg-white px-7 text-[14px] !text-[#6f6f72] transition hover:bg-gray-50'

const FORM_INPUT =
  'h-10 rounded-xl border border-[#D2D2D7] bg-white px-3.5 text-[13px] text-[#212121] outline-none focus:border-brand'

/* ---------- Helpers ---------- */

const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`

// Super Admin ดูแลทุกชั้นเสมอ
const floorForRole = (role: Role, floor: FloorValue): FloorValue =>
  role === 'Super Admin' ? 'All' : floor === 'All' ? 'A' : floor

/* ---------- Sub components ---------- */

function StatusTabs({ value, onChange }: { value: StatusValue; onChange: (value: StatusValue) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-[#d2d2d7] bg-white" role="tablist">
      {statusOptions.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-[36px] w-[80px] text-[13px] transition ${i > 0 ? 'border-l border-[#d2d2d7]' : ''} ${
            value === o.value ? 'bg-[#2771d8] text-white' : 'text-[#6f6f72] hover:bg-gray-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

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
  )
}

/* ---------- Page ---------- */

function Permissions() {
  const { url_uuid } = useParams()

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [status, setStatus] = useState<StatusValue>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM)
  const [error, setError] = useState('')

  // ตัวนับ ID/สี ไม่ซ้ำแม้ลบแล้วเพิ่มใหม่
  const nextId = useRef(Math.max(...initialMembers.map((m) => m.id)) + 1)
  const nextColor = useRef(initialMembers.length)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((m) => {
      if (status === 'active' && !m.active) return false
      if (status === 'inactive' && m.active) return false
      return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || String(m.id).includes(q)
    })
  }, [members, status, search])

  const superAdminCount = members.filter((m) => m.role === 'Super Admin').length

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  const toggleForm = () => {
    if (formOpen) {
      closeForm()
      return
    }
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setFormOpen(true)
  }

  const startEdit = (m: Member) => {
    setEditingId(m.id)
    setForm({ name: m.name, email: m.email, role: m.role, floor: m.floor })
    setError('')
    setFormOpen(true)
  }

  const removeMember = (m: Member) => {
    if (m.role === 'Super Admin' && superAdminCount <= 1) {
      window.alert('ไม่สามารถลบ Super Admin คนสุดท้ายได้')
      return
    }
    if (!window.confirm(`ต้องการลบ ${m.name} ใช่หรือไม่?`)) return
    setMembers((prev) => prev.filter((x) => x.id !== m.id))
    if (editingId === m.id) closeForm()
  }

  const changeRole = (m: Member, role: Role) => {
    if (m.role === 'Super Admin' && role !== 'Super Admin' && superAdminCount <= 1) {
      window.alert('ต้องมี Super Admin อย่างน้อย 1 คน')
      return
    }
    setMembers((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, role, floor: floorForRole(role, x.floor) } : x)),
    )
  }

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
      ])
    }
    closeForm()
  }

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
      render: (row) => <span className="text-[17px] font-normal text-brand">{row.floor}</span>,
    },
    {
      key: 'role',
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
          />
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-nowrap items-center justify-end gap-2.5 pr-6">
          <button type="button" className={`btn-outline ${ACTION_BTN} !px-5`} onClick={() => startEdit(row)}>
            Edit
          </button>
          <button type="button" className={`btn-outline ${ACTION_BTN} !px-5`} onClick={() => removeMember(row)}>
            Remove
          </button>
        </div>
      ),
    },
  ]

  return (
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
            </button>
          </>
        }
      />

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

        {/* แถวบน: แท็บสถานะ + ช่องค้นหา */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusTabs value={status} onChange={setStatus} />
          <div className="relative w-full sm:w-[230px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search member"
              className="h-[36px] w-full rounded-xl border border-[#D2D2D7] bg-white pl-3.5 pr-9 text-[13px] text-[#212121] outline-none focus:border-brand"
            />
            <Search
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
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
                <div className="flex min-h-[340px] flex-col items-center justify-center py-12 text-center text-[#0F172A]">
                  <p className="text-[17px] font-normal">No Members Found</p>
                  <p className="mt-2 text-[13px] font-normal">Click “Add new member” to add one.</p>
                </div>
              }
            />
          </div>
        </div>
      </main>
    </>
  )
}

export default Permissions