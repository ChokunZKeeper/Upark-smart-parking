import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import Navbar from '@/components/system_layout/layout/Navbar'
import PillSelect from '@/styles/Dropdown'
import { Icon } from '@iconify/react'
import { useT } from '@/i18n'
import { colorProfile, type ColorName } from '@/services/data/mockData'
import api, { API_BASE } from '@/module/Allmodules'

// ไฟล์อื่นที่ import API_BASE จาก Profile จะไม่พัง
export { API_BASE }

/* ---------- Types ---------- */

type Avatar = { kind: 'gradient'; name: ColorName } | { kind: 'image'; src: string }

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  dialCode: string
  phone: string
  avatar: Avatar
}

interface Option<T extends string> {
  value: T
  label: string
}

type SetField = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void

/* ---------- Constants ---------- */

const GRADIENTS = Object.keys(colorProfile) as ColorName[]

const DIAL_OPTIONS: Option<string>[] = ['+66', '+81', '+65', '+60', '+84', '+1'].map((v) => ({ value: v, label: v }))

const COUNTRY_OPTIONS: Option<string>[] = [
  'Thailand',
  'Japan',
  'Singapore',
  'Malaysia',
  'Vietnam',
  'United States',
].map((v) => ({ value: v, label: v }))

const DEFAULT_PROFILE: ProfileData = {
  firstName: '',
  lastName: '',
  email: '',
  dialCode: '+66',
  phone: '',
  avatar: { kind: 'gradient', name: 'dark' },
}

// ---- สไตล์ชุดเดียวกับหน้า System Settings ----

// ปุ่มบน Navbar
const HEADER_BUTTON =
  'flex h-[40px] min-w-[140px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-[16px] text-ink-2 transition hover:bg-[#F2F2F2] hover:!text-[#212121] hover:!border-[#E5E5E5] disabled:pointer-events-none disabled:opacity-50'

// สี hover / focus / เมนูเปิด ของช่องกรอกและ dropdown
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

const SELECT_TRIGGER = `h-[40px] rounded-full border-[var(--border)] text-[15.5px] !text-ink-2 ${HOVER_THEME}`

// scrollbar บางและโค้งมน
const SCROLL_AREA =
  'min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[3.5px] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb:hover]:bg-[var(--text-tertiary)] [&::-webkit-scrollbar-track]:my-6 [&::-webkit-scrollbar-track]:bg-transparent'

const TEXT_INPUT = `h-[40px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-center text-[16px] text-ink-2 outline-none transition placeholder:text-ink-3 ${HOVER_THEME}`

/* ---------- Helpers ---------- */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

const isGradientName = (v: unknown): v is ColorName => typeof v === 'string' && GRADIENTS.includes(v as ColorName)

const avatarStyle = (a: Avatar): React.CSSProperties =>
  a.kind === 'gradient'
    ? { background: colorProfile[a.name] }
    : { backgroundImage: `url("${a.src}")`, backgroundSize: 'cover', backgroundPosition: 'center' }

const sameAvatar = (a: Avatar, b: Avatar) =>
  a.kind === b.kind && (a.kind === 'gradient' ? a.name === (b as typeof a).name : a.src === (b as typeof a).src)

// แปลงแถวจาก DB (snake_case) เป็นข้อมูลในหน้านี้
const fromApi = (row: any): ProfileData => ({
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  email: row.email ?? '',
  dialCode: row.phone_dial_code ?? '+66',
  phone: row.phone ?? '',
  avatar: row.avatar_url
    ? { kind: 'image', src: `${API_BASE}${row.avatar_url}` }
    : { kind: 'gradient', name: isGradientName(row.avatar_color) ? row.avatar_color : 'dark' },
})

/* ---------- Layout pieces ---------- */

// แถวข้อมูล: ขนาดเดียวกับ SettingRow ในหน้า System Settings
function InfoRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-[104px] shrink-0 items-center justify-between gap-10 px-10 py-6 after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-[var(--border)] after:content-[''] last:after:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-[20px] font-normal leading-[1.3] text-ink-1">{label}</p>
        <p className="mt-2 max-w-[880px] text-[16px] leading-[1.55] text-ink-2">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  )
}

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex h-[88px] shrink-0 items-center justify-center border-b border-[var(--border)] text-[20px] font-normal text-ink-1">
      {children}
    </h2>
  )
}

/* ---------- Crop modal (เลือกรูป → ลาก/ซูม/หมุน → Apply) ---------- */

const CROP_STAGE = 360 // กรอบแสดงผล (px)
const CROP_CIRCLE = 280 // วงกลมที่จะถูกครอป (px)
const CROP_OUT = 512 // ขนาดรูปที่ได้ (px) ทำให้ไฟล์เล็กเสมอ ไม่ต้องจำกัดขนาดรูปต้นฉบับ
const CROP_MAX_ZOOM = 3

const clampNum = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

function CropModal({
  file,
  onCancel,
  onApply,
  L,
}: {
  file: File
  onCancel: () => void
  onApply: (cropped: File) => void
  L: (key: string, fallback: string) => string
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    // cancelled กัน StrictMode (mount 2 รอบ): รอบแรกถูก cleanup revoke URL ระหว่างโหลดจะยิง onerror มาทำให้ขึ้น "อ่านไฟล์ไม่สำเร็จ" ทั้งที่ไฟล์ปกติ
    let cancelled = false
    const url = URL.createObjectURL(file)
    const img = new Image()
    setFailed(false)
    setSrc(null)
    setNat(null)
    img.onload = () => {
      if (cancelled) return
      setNat({ w: img.naturalWidth, h: img.naturalHeight })
      setSrc(url)
    }
    img.onerror = () => {
      if (!cancelled) setFailed(true)
    }
    img.src = url
    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  // ขนาดรูปหลังหมุน และ scale ขั้นต่ำให้รูปคลุมวงกลมเต็ม
  const swap = rot % 180 !== 0
  const rw = nat ? (swap ? nat.h : nat.w) : 1
  const rh = nat ? (swap ? nat.w : nat.h) : 1
  const base = CROP_CIRCLE / Math.min(rw, rh)
  const scale = base * zoom

  // ไม่ให้ลากจนเห็นขอบรูปในวงกลม
  const clampOff = (x: number, y: number, z = zoom) => {
    const sc = base * z
    const mx = Math.max(0, (rw * sc - CROP_CIRCLE) / 2)
    const my = Math.max(0, (rh * sc - CROP_CIRCLE) / 2)
    return { x: clampNum(x, -mx, mx), y: clampNum(y, -my, my) }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, ox: off.x, oy: off.y }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    setOff(clampOff(d.ox + e.clientX - d.px, d.oy + e.clientY - d.py))
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const changeZoom = (z: number) => {
    setZoom(z)
    setOff((o) => clampOff(o.x, o.y, z))
  }
  const rotate = () => {
    setRot((r) => (r + 90) % 360)
    setOff({ x: 0, y: 0 })
  }
  const reset = () => {
    setZoom(1)
    setRot(0)
    setOff({ x: 0, y: 0 })
  }

  const apply = () => {
    const img = imgRef.current
    if (!img || !nat) return
    const canvas = document.createElement('canvas')
    canvas.width = CROP_OUT
    canvas.height = CROP_OUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const k = CROP_OUT / CROP_CIRCLE
    ctx.fillStyle = '#fff' // PNG โปร่งใส → พื้นขาว
    ctx.fillRect(0, 0, CROP_OUT, CROP_OUT)
    ctx.translate(CROP_OUT / 2 + off.x * k, CROP_OUT / 2 + off.y * k)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.scale(scale * k, scale * k)
    ctx.drawImage(img, -nat.w / 2, -nat.h / 2)

    canvas.toBlob(
      (blob) => {
        if (blob) onApply(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92,
    )
  }

  const ghostBtn =
    'h-[40px] rounded-xl border border-[var(--border)] bg-transparent px-5 text-[15px] text-ink-2 transition hover:bg-[var(--hover-dropdown-bg)]'

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-label={L('profile.crop.title', 'Edit Image')}
        onClick={(e) => e.stopPropagation()}
        className="w-[440px] max-w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[20px] font-normal text-ink-1">{L('profile.crop.title', 'Edit Image')}</h3>
          <button type="button" aria-label="Close" onClick={onCancel} className="text-ink-2 transition hover:text-ink-1">
            <Icon icon="lucide:x" height="1.3em" />
          </button>
        </div>

        {failed ? (
          <p className="py-16 text-center text-[15px] text-ink-2">{L('profile.toast.readFailed', 'Could not read the picture.')}</p>
        ) : (
          <>
            {/* พื้นที่ครอป: ลากเพื่อเลื่อนรูป */}
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ width: CROP_STAGE, height: CROP_STAGE, maxWidth: '100%' }}
              className="relative mx-auto cursor-grab touch-none select-none overflow-hidden rounded-xl bg-black/40 active:cursor-grabbing"
            >
              {src && nat && (
                <img
                  ref={imgRef}
                  src={src}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: nat.w,
                    height: nat.h,
                    maxWidth: 'none',
                    transform: `translate(-50%, -50%) translate(${off.x}px, ${off.y}px) rotate(${rot}deg) scale(${scale})`,
                  }}
                />
              )}
              {/* วงกลมครอป + ม่านมืดนอกวง */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: CROP_CIRCLE,
                  height: CROP_CIRCLE,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '9999px',
                  border: '3px solid #fff',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* ซูม + หมุน */}
            <div className="mt-5 flex items-center gap-3 px-1">
              <Icon icon="lucide:image" height="0.95em" className="shrink-0 text-ink-3" />
              <input
                type="range"
                min={1}
                max={CROP_MAX_ZOOM}
                step={0.01}
                value={zoom}
                aria-label="Zoom"
                onChange={(e) => changeZoom(Number(e.target.value))}
                className="h-1 w-full cursor-pointer accent-[#2771D8]"
              />
              <Icon icon="lucide:image" height="1.4em" className="shrink-0 text-ink-3" />
              <button type="button" aria-label="Rotate" onClick={rotate} className="ml-2 shrink-0 text-ink-2 transition hover:text-ink-1">
                <Icon icon="lucide:rotate-cw" height="1.4em" />
              </button>
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={reset} disabled={failed} className="text-[15px] text-[#2771D8] transition hover:opacity-80 disabled:opacity-40">
            {L('profile.crop.reset', 'Reset')}
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className={ghostBtn}>
              {L('profile.crop.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!nat || failed}
              className="h-[40px] rounded-xl bg-[#2771D8] px-6 text-[15px] text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {L('profile.crop.apply', 'Apply')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Page ---------- */

function Profile() {
  const t = useT()
  const { url_uuid } = useParams()

  // ถ้า key ยังไม่มีใน locales (t คืน key กลับมา) จะใช้ข้อความ fallback
  const L = (key: string, fallback: string) => {
    const v = t(key)
    return !v || v === key ? fallback : v
  }

  const [saved, setSaved] = useState<ProfileData>(DEFAULT_PROFILE) // ค่าล่าสุดจาก DB
  const [form, setForm] = useState<ProfileData>(DEFAULT_PROFILE) // ค่าที่กำลังแก้
  const [pendingFile, setPendingFile] = useState<File | null>(null) // รูปใหม่ที่ยังไม่ได้อัปโหลด
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  // ช่องที่อยู่: ประดับไว้เฉย ๆ ไม่ส่งไป server ไม่นับเป็น dirty และไม่ถูกรีเซ็ต/บันทึก
  const [deco, setDeco] = useState({ address: '', country: 'Thailand', city: '', area: '', postalCode: '' })
  const setDecoField = (key: keyof typeof deco, value: string) => setDeco((d) => ({ ...d, [key]: value }))

  const [cropFile, setCropFile] = useState<File | null>(null) // รูปที่เพิ่งเลือก รอครอป
  const fileRef = useRef<HTMLInputElement>(null)
  const previewUrl = useRef<string | null>(null) // blob: URL ของรูปตัวอย่าง

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(form), [saved, form])

  const dropPreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = null
  }
  useEffect(() => dropPreview, [])

  /* โหลดข้อมูลจริงจาก DB */
  useEffect(() => {
    if (!url_uuid) return
    const ctrl = new AbortController()
    setLoading(true)

    api
      .request('profile', 'GET', null, { headers: { 'x-user-uuid': url_uuid }, signal: ctrl.signal })
      .then((r) => {
        if (r.aborted) return // ถูกยกเลิก (เช่น StrictMode) ห้ามแตะ state

        if (!r.ok || !r.data) {
          console.error('load profile failed:', r.status, r.message)
          setToast({ ok: false, text: r.message || L('profile.toast.loadFailed', 'Could not load your profile.') })
        } else {
          const p = fromApi(r.data)
          setSaved(p)
          setForm(p)
        }
        setLoading(false)
      })

    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url_uuid])

  // toast หายเอง
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // เตือนก่อนปิดแท็บถ้ายังไม่ได้บันทึก
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const set: SetField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const pickGradient = (name: ColorName) => {
    dropPreview()
    setPendingFile(null)
    set('avatar', { kind: 'gradient', name })
  }

  const onReset = () => {
    dropPreview()
    setPendingFile(null)
    setForm(saved)
  }

  // เลือกรูป → เปิดหน้าครอป (ไม่จำกัดขนาด/ความละเอียดของรูปต้นฉบับ เพราะผลลัพธ์ถูกย่อเป็น 512×512 เอง)
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setToast({ ok: false, text: L('profile.toast.badType', 'Please choose an image file.') })
      return
    }
    setCropFile(file)
  }

  const onCropApply = (cropped: File) => {
    dropPreview()
    previewUrl.current = URL.createObjectURL(cropped)
    setPendingFile(cropped)
    set('avatar', { kind: 'image', src: previewUrl.current })
    setCropFile(null)
  }

  const onSave = async () => {
    if (!url_uuid || saving) return
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setToast({ ok: false, text: L('profile.toast.nameRequired', 'Please enter your first and last name.') })
      return
    }

    // multipart/form-data เพื่อส่งไฟล์รูปไปพร้อมข้อมูล
    const body = new FormData()
    body.append('firstName', form.firstName)
    body.append('lastName', form.lastName)
    body.append('dialCode', form.dialCode)
    body.append('phone', form.phone)
    if (form.avatar.kind === 'gradient') {
      body.append('avatarMode', 'gradient')
      body.append('avatarColor', form.avatar.name)
    } else {
      body.append('avatarMode', 'image')
      if (pendingFile) body.append('avatar', pendingFile)
    }

    setSaving(true)
    // api.request ไม่ throw และไม่คืน undefined เสมอ (FormData จะไม่ใส่ Content-Type ให้เอง)
    const r = await api.request('profile', 'PUT', body, { headers: { 'x-user-uuid': url_uuid } })
    setSaving(false)

    if (!r.ok || !r.data) {
      setToast({ ok: false, text: r.message || L('profile.toast.saveFailed', 'Could not save your profile.') })
      return
    }

    const p = fromApi(r.data)
    dropPreview()
    setPendingFile(null)
    setSaved(p)
    setForm(p)
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: p })) // ให้ Sidebar อัปเดตทันที
    setToast({ ok: true, text: L('profile.toast.saved', 'Profile saved') })
  }

  const letter = (form.firstName || form.email || '?').charAt(0).toUpperCase()
  const fullName = `${form.firstName} ${form.lastName}`.trim()
  const busy = loading || saving

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={L('profile.title', 'Edit Profile')}
        actions={
          <>
            <button type="button" className={HEADER_BUTTON} disabled={!dirty || busy} onClick={onReset}>
              <Icon icon="lucide:timer-reset" height="1.1em" className="shrink-0 [&_*]:stroke-[1.75] mr-1.5" /> {L('profile.reset', 'Reset')}
            </button>
            <button type="button" className={HEADER_BUTTON} disabled={!dirty || busy} onClick={onSave}>
              <Icon icon="lucide:save" height="1.1em" className="shrink-0 [&_*]:stroke-[1.75] mr-1.5" /> {L('profile.save', 'Save')}
            </button>
          </>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 space-y-4 overflow-hidden px-6 py-4 sm:px-8 sm:py-8">
        {/* ใช้ .card เพื่อให้ขอบเป็น gradient (ห้ามใส่ border / bg-white ซ้ำ ไม่งั้นทับ gradient) */}
        <section className="card grid max-h-[calc(100dvh-260px)] min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-[22px] lg:grid-cols-[380px_1fr]">
          {/* ---------- ซ้าย: รูปโปรไฟล์ ---------- */}
          <div className="flex min-h-0 flex-col border-b border-[var(--border)] lg:border-b-0 lg:border-r">
            <PanelTitle>{L('profile.pictureTitle', 'Profile picture')}</PanelTitle>

            <div className={cx(SCROLL_AREA, 'flex flex-col items-center px-8 py-10')}>
              <div
                className="flex h-[176px] w-[176px] shrink-0 items-center justify-center rounded-full text-[72px] font-light text-white"
                style={avatarStyle(form.avatar)}
              >
                {form.avatar.kind === 'gradient' ? letter : null}
              </div>

              <p className="mt-6 text-[20px] font-normal text-ink-1">{fullName || '—'}</p>
              <p className="mt-1 text-[16px] text-ink-2">{form.email}</p>

              <button type="button" className={cx(TEXT_INPUT, 'mt-6 w-[240px] cursor-pointer')} onClick={() => fileRef.current?.click()}>
                {L('profile.changePicture', 'Change Picture')}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
              <p className="mt-3 text-[14px] text-ink-3">{L('profile.pictureHint', 'Any picture works. You can crop it next.')}</p>

              <p className="mt-10 self-start text-[16px] text-ink-2">{L('profile.pickAvatar', 'Pick an avatar')}</p>
              <div role="radiogroup" aria-label="Avatar color" className="mt-4 grid w-full grid-cols-3 justify-items-center gap-5">
                {GRADIENTS.map((name) => {
                  const choice: Avatar = { kind: 'gradient', name }
                  const active = sameAvatar(form.avatar, choice)
                  return (
                    <button
                      key={name}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={name}
                      onClick={() => pickGradient(name)}
                      style={{ background: colorProfile[name], WebkitTapHighlightColor: 'transparent' }}
                      className={cx(
                        'flex h-[64px] w-[64px] items-center justify-center rounded-full text-[26px] font-light text-white transition focus:outline-none',
                        active
                          ? 'ring-[3px] ring-[#2771D8] ring-offset-[3px] ring-offset-[var(--surface)]'
                          : 'hover:scale-105',
                      )}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ---------- ขวา: ข้อมูลส่วนตัว ---------- */}
          <div className="flex min-h-0 flex-col">
            <PanelTitle>{L('profile.infoTitle', 'Personal Information')}</PanelTitle>

            <div className={cx(SCROLL_AREA, 'flex flex-col')}>
              <InfoRow
                label={L('profile.firstName.label', 'First Name')}
                description={L('profile.firstName.description', 'Your given name, as it appears on your profile and in messages.')}
              >
                <input maxLength={50} className={cx(TEXT_INPUT, 'w-[240px]')} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </InfoRow>

              <InfoRow
                label={L('profile.lastName.label', 'Last Name')}
                description={L('profile.lastName.description', 'Your family name, as it appears on your profile and in messages.')}
              >
                <input maxLength={50} className={cx(TEXT_INPUT, 'w-[240px]')} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </InfoRow>

              <InfoRow
                label={L('profile.email.label', 'Email')}
                description={L('profile.email.description', 'The address used to sign in and receive notifications.')}
              >
                <input readOnly className={cx(TEXT_INPUT, 'w-[300px] cursor-not-allowed opacity-70')} value={form.email} />
              </InfoRow>

              <InfoRow
                label={L('profile.phone.label', 'Phone Number')}
                description={L('profile.phone.description', 'Used for account recovery and important alerts.')}
              >
                <PillSelect
                  ariaLabel="Dial code"
                  value={form.dialCode}
                  onChange={(v: string) => set('dialCode', v)}
                  options={DIAL_OPTIONS}
                  widthClass="w-[112px]"
                  triggerClassName={SELECT_TRIGGER}
                />
                <input
                  inputMode="tel"
                  placeholder={L('profile.placeholder.phone', '812345678')}
                  className={cx(TEXT_INPUT, 'w-[200px]')}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 12))}
                />
              </InfoRow>

              {/* ---- ประดับเท่านั้น: ไม่ส่งไป server ---- */}
              <InfoRow
                label={L('profile.address.label', 'Address')}
                description={L('profile.address.description', 'Your street address, used for billing and official documents.')}
              >
                <input
                  maxLength={500}
                  placeholder={L('profile.placeholder.address', 'House no., street')}
                  className={cx(TEXT_INPUT, 'w-[380px] !text-left')}
                  value={deco.address}
                  onChange={(e) => setDecoField('address', e.target.value)}
                />
              </InfoRow>

              <InfoRow
                label={L('profile.country.label', 'Country')}
                description={L('profile.country.description', 'The country where you live or where your business is registered.')}
              >
                <PillSelect
                  ariaLabel="Country"
                  value={deco.country}
                  onChange={(v: string) => setDecoField('country', v)}
                  options={COUNTRY_OPTIONS}
                  widthClass="w-[200px]"
                  triggerClassName={SELECT_TRIGGER}
                />
              </InfoRow>

              <InfoRow
                label={L('profile.city.label', 'City')}
                description={L('profile.city.description', 'The city, area and postal code where you live or where your business operates.')}
              >
                <input
                  maxLength={80}
                  placeholder={L('profile.placeholder.city', 'City')}
                  className={cx(TEXT_INPUT, 'w-[150px]')}
                  value={deco.city}
                  onChange={(e) => setDecoField('city', e.target.value)}
                />
                <input
                  maxLength={80}
                  placeholder={L('profile.placeholder.area', 'Area')}
                  className={cx(TEXT_INPUT, 'w-[150px]')}
                  value={deco.area}
                  onChange={(e) => setDecoField('area', e.target.value)}
                />
                <input
                  inputMode="numeric"
                  placeholder={L('profile.placeholder.postalCode', 'Postal code')}
                  className={cx(TEXT_INPUT, 'w-[130px]')}
                  value={deco.postalCode}
                  onChange={(e) => setDecoField('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                />
              </InfoRow>
            </div>
          </div>
        </section>
      </main>

      {cropFile && <CropModal file={cropFile} onCancel={() => setCropFile(null)} onApply={onCropApply} L={L} />}

      {toast && (
        <div
          role="status"
          className={cx(
            'fixed bottom-7 right-7 z-50 rounded-xl px-5 py-3 text-[16px] text-white shadow-lg',
            toast.ok ? 'bg-[#2771D8]' : 'bg-[#C0392B]',
          )}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}

export default Profile