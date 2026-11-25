import { useState, type ReactNode } from 'react'
import Navbar from '@/components/system_layout/layout/Navbar'
import PillSelect from '@/styles/Dropdown'
import { Icon } from '@iconify/react'
import { useT } from '@/i18n'

/* ---------- Types ---------- */

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
}

// สีทั้งหมดอิง CSS variables ใน theme (--border, --surface, --text, --text-secondary, --text-tertiary)
// เหมือนหน้า Parking เพื่อให้เปลี่ยน Light/Dark ได้ ไม่ฮาร์ดโค้ดสี

// ปุ่มบน Navbar: ขนาดเดียวกับหน้า Roles
const HEADER_BUTTON =
  'flex h-[40px] min-w-[140px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-[16px] text-ink-2 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5]'

// สี hover / focus / เมนูเปิด ของช่องกรอกและ dropdown: อ่านจาก --hover-dropdown-* ใน theme
// (สลับ Light/Dark เองตาม data-theme)
const HOVER_THEME = [
  'hover:!bg-[var(--hover-dropdown-bg)]',
  'hover:!border-[color:var(--hover-dropdown-border)]',
  'hover:!text-[color:var(--hover-dropdown-text)]',
  'focus:!bg-[var(--hover-dropdown-bg)]',
  'focus:!border-[color:var(--hover-dropdown-border)]',
  'focus:!text-[color:var(--hover-dropdown-text)]',
  'aria-expanded:!bg-[var(--hover-dropdown-bg)]',
  'aria-expanded:!border-[color:var(--hover-dropdown-border)]',
  'aria-expanded:!text-[color:var(--hover-dropdown-text)]',
].join(' ')

// dropdown ในแถวตั้งค่า: ขนาดเดิมของ PillSelect + สี hover จาก theme
// (ต้องใส่ขนาดเดิมซ้ำ เพราะ triggerClassName จะแทนที่ค่าเริ่มต้นทั้งก้อน)
const SELECT_TRIGGER = `h-[40px] rounded-full border-[var(--border)] text-[15.5px] !text-ink-2 ${HOVER_THEME}`

// scrollbar บางและโค้งมน สำหรับรายการตั้งค่า
const SCROLL_AREA =
  'flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:w-[3.5px] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[var(--text-tertiary)] [&::-webkit-scrollbar-track]:my-6 [&::-webkit-scrollbar-track]:bg-transparent'

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
        value ? 'bg-[#2771D8]' : 'bg-[var(--border)]',
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
      className={cx(
        'h-[40px] w-[112px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-[16px] text-ink-2 outline-none transition',
        HOVER_THEME,
      )}
    />
  )
}

/* ---------- Layout pieces ---------- */

// แถวการตั้งค่า (ขนาดเดียวกับแถวสิทธิ์ในหน้า Roles)
// ส่วนเส้นคั่นวาดด้วย after: เว้นซ้ายขวา 16px
function SettingRow({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-[104px] shrink-0 items-center justify-between gap-10 px-10 py-6 after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-[var(--border)] after:content-[''] last:after:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-[20px] font-normal leading-[1.3] text-ink-1">{label}</p>
        {description && (
          <p className="mt-2 max-w-[880px] text-[16px] leading-[1.55] text-ink-2">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingsList({ rows }: { rows: SettingRowConfig[] }) {
  const t = useT()
  if (rows.length === 0) {
    return <p className="px-6 py-12 text-center text-[16px] text-ink-2">{t('settingsSystem.noSettings')}</p>
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

function buildSystemRows(s: SettingsState, update: UpdateField, t: (k: string) => string): SettingRowConfig[] {
  const roleOptions: Option<NotifRole>[] = [
    { value: 'roles', label: t('settingsSystem.roles.roles') },
    { value: 'admin', label: t('settingsSystem.roles.admin') },
    { value: 'super_admin', label: t('settingsSystem.roles.super_admin') },
  ]
  const syncOptions: Option<SyncInterval>[] = (['1', '5', '10', '15', '30'] as SyncInterval[]).map((v) => ({
    value: v,
    label: `${v} ${t('settingsSystem.units.min')}`,
  }))
  return [
    {
      key: 'chargePerTime',
      label: t('settingsSystem.chargePerTime.label'),
      description: t('settingsSystem.chargePerTime.description'),
      control: <PillInput value={s.chargePerTime} onChange={update('chargePerTime')} unit="฿" noSpace />,
    },
    {
      key: 'latePaymentFee',
      label: t('settingsSystem.latePaymentFee.label'),
      description:
        t('settingsSystem.latePaymentFee.description'),
      control: <PillInput value={s.latePaymentFee} onChange={update('latePaymentFee')} unit="฿" noSpace />,
    },
    {
      key: 'customTimeRate',
      label: t('settingsSystem.customTimeRate.label'),
      description:
        t('settingsSystem.customTimeRate.description'),
      control: <PillInput value={s.customTimeRate} onChange={update('customTimeRate')} unit={t('settingsSystem.units.min')} />,
    },
    {
      key: 'gracePeriod',
      label: t('settingsSystem.gracePeriod.label'),
      description:
        t('settingsSystem.gracePeriod.description'),
      control: <PillInput value={s.gracePeriod} onChange={update('gracePeriod')} unit={t('settingsSystem.units.min')} />,
    },
    {
      key: 'maxParking',
      label: t('settingsSystem.maxParking.label'),
      description:
        t('settingsSystem.maxParking.description'),
      control: <PillInput value={s.maxParking} onChange={update('maxParking')} unit={t('settingsSystem.units.hour')} />,
    },
    {
      key: 'lateNotif',
      label: t('settingsSystem.lateNotif.label'),
      description:
        t('settingsSystem.lateNotif.description'),
      control: (
        <div className="flex items-center gap-8">
          <PillSelect
            ariaLabel={t('settingsSystem.ariaNotifRole')}
            value={s.lateNotifRole}
            onChange={update('lateNotifRole')}
            options={roleOptions}
            widthClass="w-[160px]"
            triggerClassName={SELECT_TRIGGER}
          />
          <Toggle value={s.lateNotifEnabled} onChange={update('lateNotifEnabled')} />
        </div>
      ),
    },
    {
      key: 'hardwareAlerts',
      label: t('settingsSystem.hardwareAlerts.label'),
      description:
        t('settingsSystem.hardwareAlerts.description'),
      control: <Toggle value={s.hardwareAlerts} onChange={update('hardwareAlerts')} />,
    },
    {
      key: 'deviceHealth',
      label: t('settingsSystem.deviceHealth.label'),
      description:
        t('settingsSystem.deviceHealth.description'),
      control: <Toggle value={s.deviceHealth} onChange={update('deviceHealth')} />,
    },
    {
      key: 'autoSync',
      label: t('settingsSystem.autoSync.label'),
      description:
        t('settingsSystem.autoSync.description'),
      control: (
        <PillSelect
          ariaLabel={t('settingsSystem.ariaSyncInterval')}
          value={s.autoSync}
          onChange={update('autoSync')}
          options={syncOptions}
          widthClass="w-[128px]"
          triggerClassName={SELECT_TRIGGER}
        />
      ),
    },
  ]
}

/* ---------- Page ---------- */

function Settings() {
  const t = useT()
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)

  const update: UpdateField = (key) => (value) => setSettings((prev) => ({ ...prev, [key]: value }))

  const rows = buildSystemRows(settings, update, t)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('settingsSystem.title')}
        actions={
          <>
            <button type="button" className={HEADER_BUTTON} onClick={() => setSettings(DEFAULT_SETTINGS)}>
             <Icon icon="lucide:timer-reset" height="1.1em" className="shrink-0 [&_*]:stroke-[1.75] mr-1.5" /> {t('settingsSystem.reset')}
            </button>
            <button type="button" className={HEADER_BUTTON}>
              <Icon icon="lucide:save" height="1.1em" className="shrink-0 [&_*]:stroke-[1.75] mr-1.5" /> {t('settingsSystem.save')}
            </button>
          </>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 space-y-4 overflow-hidden px-6 py-4 sm:px-8 sm:py-8">
        {/* ใช้ .card เพื่อให้ขอบเป็น gradient (ห้ามใส่ border / bg-white ซ้ำ ไม่งั้นทับ gradient) */}
        <section className="card flex max-h-[calc(100dvh-260px)] min-h-0 flex-1 flex-col overflow-hidden rounded-[22px]">
          <div className={SCROLL_AREA}>
            <SettingsList rows={rows} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default Settings