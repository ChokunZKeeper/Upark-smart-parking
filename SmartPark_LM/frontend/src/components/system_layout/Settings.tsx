import { useState, type ReactNode } from 'react'
import Navbar from '@/components/system_layout/layout/Navbar'

/* ---------- Types ---------- */

type TabValue = 'normal' | 'system'
type Language = 'English' | 'Thai'
type TimeFormat = '12hour' | '24hour'
type NotifRole = 'roles' | 'admin' | 'super_admin'
type SyncInterval = '1' | '5' | '10' | '15' | '30'

interface SettingsState {
  // System settings
  chargePerTime: string
  latePaymentFee: string
  customTimeRate: string
  gracePeriod: string
  maxParking: string
  lateNotifEnabled: boolean
  lateNotifRole: NotifRole
  hardwareAlerts: boolean
  deviceHealth: boolean
  autoSync: SyncInterval
  // Normal settings
  language: Language
  timeFormat: TimeFormat
  nightMode: boolean
}

interface Option<T extends string> {
  value: T
  label: string
}

interface SettingRowConfig {
  key: string
  label: string
  description: string
  control: ReactNode
}

// ฟังก์ชันสร้างตัวอัปเดตของแต่ละช่อง: update('language') จะได้ (value) => ...
type UpdateField = <K extends keyof SettingsState>(key: K) => (value: SettingsState[K]) => void

/* ---------- Constants ---------- */

const DEFAULT_SETTINGS: SettingsState = {
  chargePerTime: '60',
  latePaymentFee: '320',
  customTimeRate: '60',
  gracePeriod: '15',
  maxParking: '7',
  lateNotifEnabled: true,
  lateNotifRole: 'roles',
  hardwareAlerts: false,
  deviceHealth: true,
  autoSync: '5',
  language: 'English',
  timeFormat: '12hour',
  nightMode: false,
}

const TABS: Option<TabValue>[] = [
  { value: 'normal', label: 'Normal Settings' },
  { value: 'system', label: 'System Settings' },
]

const ROLE_OPTIONS: Option<NotifRole>[] = [
  { value: 'roles', label: 'roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

const SYNC_OPTIONS: Option<SyncInterval>[] = [
  { value: '1', label: '1 Min' },
  { value: '5', label: '5 Min' },
  { value: '10', label: '10 Min' },
  { value: '15', label: '15 Min' },
  { value: '30', label: '30 Min' },
]

const LANGUAGE_OPTIONS: Option<Language>[] = [
  { value: 'English', label: 'English' },
  { value: 'Thai', label: 'Thai' },
]

const TIME_FORMAT_OPTIONS: Option<TimeFormat>[] = [
  { value: '12hour', label: '12 hour' },
  { value: '24hour', label: '24 hour' },
]

// ปุ่มบน Navbar: ขนาดเดียวกับหน้า Roles
const HEADER_BUTTON =
  'flex h-[40px] min-w-[140px] items-center justify-center rounded-xl border border-[#D2D2D7] bg-white px-5 text-[16px] text-[#6F6F72] transition hover:bg-gray-50'

// scrollbar บางและโค้งมน สำหรับรายการตั้งค่า
const SCROLL_AREA =
  'flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:w-[3.5px] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D2D2D7] [&::-webkit-scrollbar-thumb:hover]:bg-[#AEAEB2] [&::-webkit-scrollbar-track]:my-6 [&::-webkit-scrollbar-track]:bg-transparent'

/* ---------- Helpers ---------- */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/* ---------- Controls ---------- */

// สวิตช์เปิด/ปิด (ขนาดเดียวกับหน้า Roles)
function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={cx(
        'relative inline-flex h-[32px] w-[58px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none',
        value ? 'bg-[#2771D8]' : 'bg-[#D2D2D7]',
      )}
    >
      <span
        className={cx(
          'inline-block h-[26px] w-[26px] rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'translate-x-[29px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

// ช่องกรอกตัวเลขทรงแคปซูล พร้อมหน่วยต่อท้าย (แสดงหน่วยตอนไม่ได้โฟกัส)
function PillInput({
  value,
  onChange,
  unit,
  noSpace = false,
}: {
  value: string
  onChange: (value: string) => void
  unit: string
  noSpace?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const displayValue = focused ? value : `${value}${noSpace ? '' : ' '}${unit}`

  return (
    <input
      type="text"
      value={displayValue}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))} // รับเฉพาะตัวเลขและจุด
      className="h-[40px] w-[112px] rounded-full border border-[#D2D2D7] bg-white px-4 text-center text-[16px] text-[#212121] outline-none transition focus:border-[#2771D8]"
    />
  )
}

// dropdown ทรงแคปซูล พร้อมสามเหลี่ยมชี้ลง
function PillSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  widthClass = 'w-[128px]',
}: {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  ariaLabel: string
  widthClass?: string
}) {
  return (
    <div className={cx('relative inline-block', widthClass)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-[40px] w-full cursor-pointer appearance-none rounded-full border border-[#D2D2D7] bg-white pl-4 pr-8 text-center text-[16px] text-[#212121] outline-none transition hover:bg-gray-50 focus:border-[#2771D8]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-[#8E8E93]">▼</span>
    </div>
  )
}

/* ---------- Layout pieces ---------- */

// แถวการตั้งค่า (ขนาดเดียวกับแถวสิทธิ์ในหน้า Roles)
function SettingRow({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[104px] shrink-0 items-center justify-between gap-10 border-b border-[#D2D2D7] px-10 py-6 transition-colors last:border-b-0 hover:bg-gray-50/50">
      <div className="min-w-0 flex-1">
        <p className="text-[20px] font-normal leading-[1.3] text-[#212121]">{label}</p>
        {description && (
          <p className="mt-2 max-w-[880px] text-[16px] leading-[1.55] text-[#7E7E81]">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function TabBar({ value, onChange }: { value: TabValue; onChange: (value: TabValue) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cx(
            'flex h-[40px] min-w-[160px] items-center justify-center rounded-xl border px-5 text-[16px] transition',
            value === tab.value
              ? 'border-[#2771D8] bg-[#2771D8] text-white'
              : 'border-[#D2D2D7] bg-white text-[#6F6F72] hover:bg-gray-50',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function SettingsList({ rows }: { rows: SettingRowConfig[] }) {
  if (rows.length === 0) {
    return <p className="px-6 py-12 text-center text-[16px] text-[#8E8E93]">No settings found.</p>
  }

  return (
    <>
      {rows.map((row) => (
        <SettingRow key={row.key} label={row.label} description={row.description}>
          {row.control}
        </SettingRow>
      ))}
    </>
  )
}

/* ---------- Row definitions ---------- */

function buildNormalRows(s: SettingsState, update: UpdateField): SettingRowConfig[] {
  return [
    {
      key: 'language',
      label: 'Language',
      description: 'Choose the preferred language for the UPark interface.',
      control: (
        <PillSelect
          ariaLabel="Language"
          value={s.language}
          onChange={update('language')}
          options={LANGUAGE_OPTIONS}
          widthClass="w-[136px]"
        />
      ),
    },
    {
      key: 'timeFormat',
      label: 'Time Format',
      description: 'Choose between 12-hour and 24-hour time display.',
      control: (
        <PillSelect
          ariaLabel="Time Format"
          value={s.timeFormat}
          onChange={update('timeFormat')}
          options={TIME_FORMAT_OPTIONS}
          widthClass="w-[136px]"
        />
      ),
    },
    {
      key: 'nightMode',
      label: 'Night Mode',
      description: 'Switch between light and dark interface themes.',
      control: <Toggle value={s.nightMode} onChange={update('nightMode')} />,
    },
  ]
}

function buildSystemRows(s: SettingsState, update: UpdateField): SettingRowConfig[] {
  return [
    {
      key: 'chargePerTime',
      label: 'Charge per time',
      description: 'Set the parking fee charged for each hour a vehicle occupies a parking space.',
      control: <PillInput value={s.chargePerTime} onChange={update('chargePerTime')} unit="฿" noSpace />,
    },
    {
      key: 'latePaymentFee',
      label: 'Late Payment Fee',
      description:
        'Set the maximum amount of time a vehicle can occupy a parking space. (Put 0 if this feature is not desired)',
      control: <PillInput value={s.latePaymentFee} onChange={update('latePaymentFee')} unit="฿" noSpace />,
    },
    {
      key: 'customTimeRate',
      label: 'Custom Time Rate',
      description:
        'Configure flexible parking rates based on custom time intervals, allowing different charges for specific durations, such as the first hour, subsequent hours, or overnight parking.',
      control: <PillInput value={s.customTimeRate} onChange={update('customTimeRate')} unit="Min" />,
    },
    {
      key: 'gracePeriod',
      label: 'Grace Period',
      description:
        'Set the additional time allowed before parking fees or penalties begin to apply. (Put 0 if this feature is not desired)',
      control: <PillInput value={s.gracePeriod} onChange={update('gracePeriod')} unit="Min" />,
    },
    {
      key: 'maxParking',
      label: 'Max parking duration',
      description:
        'Set the maximum amount of time a vehicle can occupy a parking space. (Put 0 if this feature is not desired)',
      control: <PillInput value={s.maxParking} onChange={update('maxParking')} unit="Hour" />,
    },
    {
      key: 'lateNotif',
      label: 'Late Payment Notifications',
      description:
        'Automatically notify designated staff members when a parking payment becomes overdue, allowing them to follow up and manage outstanding payments.',
      control: (
        <div className="flex items-center gap-8">
          <PillSelect
            ariaLabel="Notification role"
            value={s.lateNotifRole}
            onChange={update('lateNotifRole')}
            options={ROLE_OPTIONS}
            widthClass="w-[160px]"
          />
          <Toggle value={s.lateNotifEnabled} onChange={update('lateNotifEnabled')} />
        </div>
      ),
    },
    {
      key: 'hardwareAlerts',
      label: 'Hardware Connection Alerts',
      description:
        'Notify administrators when connected parking hardware, such as sensors or cameras, loses its connection to the system.',
      control: <Toggle value={s.hardwareAlerts} onChange={update('hardwareAlerts')} />,
    },
    {
      key: 'deviceHealth',
      label: 'Device Health Monitoring',
      description:
        'Monitor the operational status of connected hardware devices and identify potential malfunctions or maintenance needs.',
      control: <Toggle value={s.deviceHealth} onChange={update('deviceHealth')} />,
    },
    {
      key: 'autoSync',
      label: 'Automatic Device Synchronization',
      description:
        'Configure how frequently connected hardware devices synchronize their data with the UPark platform to maintain up-to-date parking information.',
      control: (
        <PillSelect
          ariaLabel="Sync interval"
          value={s.autoSync}
          onChange={update('autoSync')}
          options={SYNC_OPTIONS}
          widthClass="w-[128px]"
        />
      ),
    },
  ]
}

/* ---------- Page ---------- */

function Settings() {
  const [tab, setTab] = useState<TabValue>('system')
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)

  const update: UpdateField = (key) => (value) => setSettings((prev) => ({ ...prev, [key]: value }))

  const rows = tab === 'system' ? buildSystemRows(settings, update) : buildNormalRows(settings, update)

  return (
    <>
      <Navbar
        title="Settings"
        actions={
          <>
            <button type="button" className={HEADER_BUTTON} onClick={() => setSettings(DEFAULT_SETTINGS)}>
              Reset
            </button>
            <button type="button" className={HEADER_BUTTON}>
              Save
            </button>
          </>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 space-y-4 overflow-hidden px-6 py-4 sm:px-8 sm:py-8">
        <TabBar value={tab} onChange={setTab} />

        {/* การ์ดการตั้งค่า: ขยายเต็มพื้นที่ที่เหลือเหมือนหน้า Roles */}
        <section className="flex max-h-[calc(100dvh-260px)] min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[#D2D2D7] bg-white">
          <div className={SCROLL_AREA}>
            <SettingsList rows={rows} />
          </div>
        </section>
      </main>
    </>
  )
}

export default Settings