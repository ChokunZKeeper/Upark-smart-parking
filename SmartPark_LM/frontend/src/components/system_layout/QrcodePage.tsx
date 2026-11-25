import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Search, X, Pencil, Download } from 'lucide-react'
import { Icon } from '@iconify/react'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import Navbar from '@/components/system_layout/layout/Navbar'
import DataTable, { type DataTableColumn } from '@/components/system_layout/layout/DataTable'
import PillSelect from '@/styles/Dropdown'
import { floors, initialQrCodes } from '@/services/data/mockData'
import { canEdit } from '@/constants/viewAs'
import { useT, type TFunction } from '@/i18n'

type Ecc = 'L' | 'M' | 'Q' | 'H'

interface QrCodeItem {
  id: number
  name: string
  url: string
  zone: string
  floor: string
  created: string
  note?: string
  active?: boolean
  format?: string
  ecc?: string
}

interface DownloadOptions {
  format?: string
  ecc?: string
}

const ZONES = [1, 2, 3, 4]
// The user page lives in this same site at public/parking/ (see parking/index.html).
// The QR opens it with the zone in the link, e.g. https://<this-site>/parking/index.html?zone=D2
const URL_BASE = `${window.location.origin}/parking/index.html?zone=`
const FORMATS = ['PNG', 'SVG', 'PDF']
const ECC_LEVELS = ['L', 'M', 'Q', 'H']

const DEFAULT_FORMAT = 'PNG'
const DEFAULT_ECC = 'M'

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

const HOVER_BG = 'hover:bg-[var(--hover-dropdown-bg)]'
const HOVER_TEXT = 'hover:text-[color:var(--hover-dropdown-text)]'
const HOVER_BORDER = 'hover:border-[color:var(--hover-dropdown-border)]'
const HOVER_FORCED = cx(
  'hover:!bg-[var(--hover-dropdown-bg)]',
  'hover:!text-[color:var(--hover-dropdown-text)]',
  'hover:!border-[color:var(--hover-dropdown-border)]',
)

const FIELD = cx(
  'h-[41px] w-full rounded-lg px-[15px]',
  'border border-[var(--border)] bg-[var(--surface)]',
  'text-[16px] text-[var(--text)] outline-none',
  'placeholder:text-[color:var(--text-muted,#A0A0A0)] focus:border-brand',
)
const LOCKED_FIELD = '!bg-[var(--bg)] !text-[var(--text-secondary)]'
const LABEL = 'mb-2 block text-[12.5px] leading-4 text-[var(--text-secondary)]'
const HINT = 'mt-2 text-[12px] leading-[18px] text-[var(--text-secondary)]'

const SELECT_TRIGGER = cx(
  'h-[41px] !rounded-lg !px-[15px]',
  'border border-[var(--border)]',
  'text-[16px] !text-[var(--text)]',
  HOVER_FORCED,
)
const SELECT_PROPS = {
  widthClass: 'w-full',
  triggerClassName: SELECT_TRIGGER,
  panelClassName: 'min-w-full',
}

const BTN = 'flex h-[41px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 text-[14px] transition'
const BTN_OUTLINE = cx(
  BTN,
  'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]',
  HOVER_BORDER,
  HOVER_BG,
  HOVER_TEXT,
)
const BTN_PRIMARY = cx(BTN, 'bg-brand text-white hover:opacity-90')

const ICON_BTN_HOVER = HOVER_BG

const CREATE_BTN = cx(
  'flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-7',
  'border border-[var(--border)] bg-[var(--surface)]',
  'text-[14px] !text-ink-2 transition',
  HOVER_FORCED,
)

const ACTION_BTN = cx(
  'flex !h-9 shrink-0 items-center justify-center whitespace-nowrap',
  '!rounded-full !py-0 !text-[14px] transition',
)
const ACTION_PRIMARY = cx('btn-primary', ACTION_BTN, '!px-7 font-normal')
const ACTION_OUTLINE = cx('btn-outline', ACTION_BTN, HOVER_FORCED, '!px-5')

const TABLE_OVERRIDES = cx(
  '[&_td]:whitespace-nowrap',
  '[&_th]:whitespace-nowrap',
  '[&_input]:!hidden',
  '[&_.lucide-search]:!hidden',
)

const toOptions = (values: (string | number)[]) =>
  values.map((value) => ({ value: String(value), label: String(value) }))

const zonesOfFloor = (floor: string) => ZONES.map((z) => `${floor}${z}`)

const firstFreeZone = (codes: QrCodeItem[], floor: string) => {
  const freeZone = zonesOfFloor(floor).find((zone) => !codes.some((c) => c.zone === zone))
  return freeZone ?? `${floor}${ZONES[0]}`
}

const formatToday = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })

const matchesQuery = (code: QrCodeItem, query: string) =>
  [code.name, code.url, code.zone, code.floor].some((value) => value.toLowerCase().includes(query))

const saveHref = (href: string, filename: string) => {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

const downloadSvg = async (url: string, filename: string, options: object) => {
  const svg = await QRCode.toString(url, { ...options, type: 'svg' })
  const href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))

  saveHref(href, filename)
  URL.revokeObjectURL(href)
}

const downloadPdf = (code: QrCodeItem, png: string, filename: string) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })

  pdf.addImage(png, 'PNG', 55, 40, 100, 100)
  pdf.setFontSize(14)
  pdf.text(`${code.name} · ${code.zone}`, 105, 150, { align: 'center' })
  pdf.setFontSize(10)
  pdf.text(code.url, 105, 158, { align: 'center' })
  pdf.save(filename)
}

const downloadQr = async (
  code: QrCodeItem,
  { format = code.format ?? DEFAULT_FORMAT, ecc = code.ecc ?? DEFAULT_ECC }: DownloadOptions = {},
) => {
  const baseName = `${code.name.replace(/\s+/g, '-').toLowerCase()}-${code.zone.toLowerCase()}-qr`
  const options = { errorCorrectionLevel: ecc as Ecc, margin: 4 }

  try {
    if (format === 'SVG') {
      await downloadSvg(code.url, `${baseName}.svg`, options)
      return
    }

    const png = await QRCode.toDataURL(code.url, { ...options, width: 1024 })

    if (format === 'PDF') {
      downloadPdf(code, png, `${baseName}.pdf`)
      return
    }

    saveHref(png, `${baseName}.png`)
  } catch (error) {
    console.error('Download QR failed', error)
  }
}

interface FieldProps {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}

function Field({ label, hint, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <span className={LABEL}>{label}</span>
      {children}
      {hint && <p className={`${HINT} max-w-[300px]`}>{hint}</p>}
    </div>
  )
}

interface SegmentedProps {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

function Segmented({ label, options, value, onChange }: SegmentedProps) {
  return (
    <div className="mt-5">
      <span className={LABEL}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-lg border border-[var(--border)]">
        {options.map((option, index) => {
          const selected = option === value

          const className = cx(
            'h-[39px] flex-1 text-[15px] transition',
            index > 0 && 'border-l border-[var(--border)]',
            selected
              ? 'bg-brand text-white'
              : cx('bg-[var(--surface)] text-[var(--text)]', HOVER_BG, HOVER_TEXT),
          )

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={className}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface ToggleSwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-[22px] w-[38px] rounded-full transition',
          checked ? 'bg-brand' : 'bg-[var(--border)]',
        )}
      >
        <span
          className={cx(
            'absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white transition-all',
            checked ? 'left-[18px]' : 'left-[2px]',
          )}
        />
      </button>
    </div>
  )
}

interface QrPreviewProps {
  svg: string
  name: string
  zone: string
  url: string
}

function QrPreview({ svg, name, zone, url }: QrPreviewProps) {
  const t = useT()
  return (
    <div className="rounded-2xl bg-[var(--bg)] px-4 pb-4 pt-5 text-center">
      <p className="text-[12px] leading-4 text-ink-2">{t('qrcode.preview')}</p>

      <div
        className={cx(
          'mx-auto mt-3 flex h-[198px] w-[198px] items-center justify-center',
          'rounded-lg bg-white p-[11px] text-[12px] text-[#555]',
          '[&>svg]:h-full [&>svg]:w-full',
        )}
        dangerouslySetInnerHTML={{ __html: svg || t('qrcode.previewFailed') }}
      />

      <p className="mt-3 text-[13px] font-medium leading-4 text-[#111]">
        {name} · {zone}
      </p>
      <p className="mt-1 break-all text-[12.5px] leading-4 text-ink-2">{url}</p>
    </div>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT()
  return (
    <div className="relative mb-4 ml-auto w-full sm:w-[230px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('qrcode.searchAria')}
        className={cx(
          'h-[36px] w-full rounded-xl pl-3.5 pr-9',
          'border border-[var(--border)] bg-transparent',
          'text-[13px] text-[var(--text)] outline-none focus:border-brand',
        )}
      />
      <Search
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
      />
    </div>
  )
}

function EmptyState() {
  const t = useT()
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center py-12 text-center text-ink-1">
      <p className="text-[17px]">{t('qrcode.empty.title')}</p>
      <p className="mt-2 text-[13px]">{t('qrcode.empty.hint')}</p>
    </div>
  )
}

function DialogHeader({ editing, onClose }: { editing: boolean; onClose: () => void }) {
  const t = useT()
  return (
    <div className="flex items-start justify-between border-b border-[var(--border)] px-6 pb-5 pt-[21px]">
      <div>
        <h2 className="text-[16px] font-medium leading-5">{editing ? t('qrcode.dialog.editTitle') : t('qrcode.dialog.createTitle')}</h2>
        <p className="mt-0.5 text-[13px] leading-4 text-[var(--text-secondary)]">
          {editing ? t('qrcode.dialog.editSubtitle') : t('qrcode.dialog.createSubtitle')}
        </p>
      </div>
      <button
        type="button"
        aria-label={t('qrcode.dialog.close')}
        onClick={onClose}
        className={cx('-mr-1 rounded-md p-1', ICON_BTN_HOVER)}
      >
        <X size={20} />
      </button>
    </div>
  )
}

interface DialogFooterProps {
  editing: boolean
  onCancel: () => void
  onSubmit: (download: boolean) => void
}

function DialogFooter({ editing, onCancel, onSubmit }: DialogFooterProps) {
  const t = useT()
  return (
    <div className="flex flex-wrap justify-end gap-[9px] border-t border-[var(--border)] px-6 py-4">
      <button type="button" className={BTN_OUTLINE} onClick={onCancel}>
        {t('qrcode.footer.cancel')}
      </button>
      <button type="button" className={BTN_OUTLINE} onClick={() => onSubmit(true)}>
        <Download size={15} /> {editing ? t('qrcode.footer.saveDownload') : t('qrcode.footer.createDownload')}
      </button>
      <button type="button" className={BTN_PRIMARY} onClick={() => onSubmit(false)}>
        {editing ? t('qrcode.footer.save') : t('qrcode.footer.create')}
      </button>
    </div>
  )
}

interface QrDialogProps {
  codes: QrCodeItem[]
  editing?: QrCodeItem
  onClose: () => void
  onSubmit: (code: QrCodeItem, download: boolean) => void
}

function QrDialog({ codes, editing, onClose, onSubmit }: QrDialogProps) {
  const t = useT()
  const isEditing = Boolean(editing)
  const otherCodes = codes.filter((c) => c.id !== editing?.id)
  const initialFloor = editing?.floor ?? codes[codes.length - 1]?.floor ?? floors[0]
  const initialZone = editing?.zone ?? firstFreeZone(otherCodes, initialFloor)

  const [floor, setFloor] = useState(initialFloor)
  const [zone, setZone] = useState(initialZone)
  const [customName, setCustomName] = useState<string | null>(
    editing && editing.name !== `Floor ${initialFloor}` ? editing.name : null,
  )
  const [customUrl, setCustomUrl] = useState<string | null>(
    editing && editing.url !== `${URL_BASE}${initialZone}` ? editing.url : null,
  )
  const [note, setNote] = useState(editing?.note ?? '')
  const [active, setActive] = useState(editing?.active ?? true)
  const [format, setFormat] = useState(editing?.format ?? DEFAULT_FORMAT)
  const [ecc, setEcc] = useState(editing?.ecc ?? DEFAULT_ECC)
  const [svg, setSvg] = useState('')
  const [urlEditable, setUrlEditable] = useState(!isEditing)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const name = customName ?? `Floor ${floor}`
  const url = customUrl ?? `${URL_BASE}${zone}`
  const zoneTaken = otherCodes.some((c) => c.zone === zone)

  useEffect(() => {
    let cancelled = false

    QRCode.toString(url, { type: 'svg', errorCorrectionLevel: ecc as Ecc, margin: 1 })
      .then((result) => !cancelled && setSvg(result))
      .catch(() => !cancelled && setSvg(''))

    return () => {
      cancelled = true
    }
  }, [url, ecc])

  const handleFloorChange = (newFloor: string) => {
    setFloor(newFloor)
    setZone(firstFreeZone(otherCodes, newFloor))
  }

  const unlockUrl = () => {
    setCustomUrl(url)
    setUrlEditable(true)
    urlInputRef.current?.focus()
  }

  const submit = (download: boolean) => {
    if (zoneTaken || !name.trim() || !url.trim()) return

    const code: QrCodeItem = {
      id: editing?.id ?? Date.now(),
      name: name.trim(),
      url: url.trim(),
      zone,
      floor,
      created: editing?.created ?? formatToday(),
      note: note.trim() || undefined,
      active,
      format,
      ecc,
    }

    onSubmit(code, download)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? t('qrcode.dialog.editTitle') : t('qrcode.dialog.createTitle')}
        className={cx(
          'max-h-[calc(100vh-2rem)] w-full max-w-[745px] overflow-y-auto',
          'rounded-2xl bg-[var(--surface)] text-[var(--text)]',
        )}
      >
        <DialogHeader editing={isEditing} onClose={onClose} />

        <div className="grid gap-6 px-6 pb-8 pt-[26px] md:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-[15px]">
              <Field label={t('qrcode.dialog.floor')}>
                <PillSelect
                  ariaLabel={t('qrcode.dialog.floor')}
                  value={floor}
                  onChange={handleFloorChange}
                  options={toOptions(floors)}
                  {...SELECT_PROPS}
                />
              </Field>
              <Field label={t('qrcode.dialog.zone')}>
                <PillSelect
                  ariaLabel={t('qrcode.dialog.zone')}
                  value={zone}
                  onChange={setZone}
                  options={toOptions(zonesOfFloor(floor))}
                  {...SELECT_PROPS}
                />
              </Field>
            </div>

            {zoneTaken && (
              <p className="mt-2 text-[12px] leading-[18px] text-red-600">
                {t('qrcode.dialog.zoneTaken', { zone })}
              </p>
            )}

            <Field label={t('qrcode.dialog.name')} hint={t('qrcode.dialog.nameHint')} className="mt-6">
              <input value={name} onChange={(e) => setCustomName(e.target.value)} className={FIELD} />
            </Field>

            <Field
              label={t('qrcode.dialog.url')}
              hint={t('qrcode.dialog.urlHint')}
              className="mt-5"
            >
              <div className="flex gap-2.5">
                <input
                  ref={urlInputRef}
                  value={url}
                  readOnly={!urlEditable}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className={cx(FIELD, !urlEditable && LOCKED_FIELD)}
                />
                {isEditing && (
                  <button
                    type="button"
                    aria-label={t('qrcode.dialog.editUrl')}
                    onClick={unlockUrl}
                    className={cx(
                      'flex h-[41px] w-[41px] shrink-0 items-center justify-center rounded-lg',
                      'border border-[var(--border)]',
                      ICON_BTN_HOVER,
                    )}
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </Field>

            <Field label={t('qrcode.dialog.note')} className="mt-4">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('qrcode.dialog.notePlaceholder')}
                className={FIELD}
              />
            </Field>

            <div className="mt-6">
              <ToggleSwitch label={t('qrcode.dialog.active')} checked={active} onChange={setActive} />
            </div>
          </div>

          <div className="min-w-0">
            <QrPreview svg={svg} name={name} zone={zone} url={url} />

            <Segmented label={t('qrcode.dialog.downloadFormat')} options={FORMATS} value={format} onChange={setFormat} />
            <Segmented label={t('qrcode.dialog.errorCorrection')} options={ECC_LEVELS} value={ecc} onChange={setEcc} />
            <p className={`${HINT} !mt-2.5 max-w-[240px]`}>{t('qrcode.dialog.errorHint')}</p>
          </div>
        </div>

        <DialogFooter editing={isEditing} onCancel={onClose} onSubmit={submit} />
      </div>
    </div>
  )
}

const header = (label: string) => <span className="text-[16px] font-medium text-ink-1">{label}</span>

const cell = (value: string) => (
  <span className="flex min-h-[72px] items-center justify-center text-[17px] text-ink-1">{value}</span>
)

function createColumns(
  t: TFunction,
  onEdit: (code: QrCodeItem) => void,
  onRemove: (code: QrCodeItem) => void,
  hasEditPerm: boolean,
): DataTableColumn<QrCodeItem>[] {
  return [
    { key: 'name', label: header(t('qrcode.table.name')), render: (row) => cell(row.name) },
    {
      key: 'url',
      label: header(t('qrcode.table.urls')),
      render: (row) => (
        <a
          href={row.url}
          className="whitespace-nowrap text-[17px] text-brand underline underline-offset-2 hover:opacity-80"
          onClick={(e) => e.preventDefault()}
        >
          {row.url}
        </a>
      ),
    },
    { key: 'zone', label: header(t('qrcode.table.zone')), render: (row) => cell(row.zone) },
    {
      key: 'floor',
      label: header(t('qrcode.table.floor')),
      render: (row) => <span className="text-[17px] text-brand">{row.floor}</span>,
    },
    { key: 'created', label: header(t('qrcode.table.created')), render: (row) => cell(row.created) },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex flex-nowrap items-center justify-end gap-2.5 pr-6">
          <button type="button" className={ACTION_PRIMARY} onClick={() => downloadQr(row)}>
            {t('qrcode.table.download')}
          </button>
          {/* ซ่อนปุ่ม Edit และ Remove เมื่อ role ไม่มีสิทธิ์ can_edit (View as mode) */}
          {hasEditPerm && (
            <>
              <button type="button" className={ACTION_OUTLINE} onClick={() => onEdit(row)}>
                {t('qrcode.table.edit')}
              </button>
              <button type="button" className={ACTION_OUTLINE} onClick={() => onRemove(row)}>
                {t('qrcode.table.remove')}
              </button>
            </>
          )}
        </div>
      ),
    },
  ]
}

function QrCodePage() {
  const t = useT()
  const [codes, setCodes] = useState<QrCodeItem[]>(initialQrCodes)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<QrCodeItem | null>(null)

  // ตรวจสิทธิ์ Can Edit: อ่านใหม่ทุก render
  const hasEditPerm = canEdit()

  const query = search.trim().toLowerCase()
  const rows = query ? codes.filter((code) => matchesQuery(code, query)) : codes

  const closeDialog = () => {
    setCreateOpen(false)
    setEditingCode(null)
  }

  const handleSubmit = (code: QrCodeItem, download: boolean) => {
    if (editingCode) {
      setCodes((prev) => prev.map((c) => (c.id === code.id ? code : c)))
    } else {
      setCodes((prev) => [...prev, code])
    }

    closeDialog()
    if (download) downloadQr(code)
  }

  const handleEdit = (code: QrCodeItem) => setEditingCode(code)

  const handleRemove = (code: QrCodeItem) => {
    setCodes((prev) => prev.filter((c) => c.id !== code.id))
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        title={t('qrcode.title')}
        actions={
          /* ซ่อนปุ่ม Create new QR เมื่อ role ไม่มีสิทธิ์ can_edit */
          hasEditPerm ? (
            <button type="button" className={CREATE_BTN} onClick={() => setCreateOpen(true)}>
              <Icon icon="coolicons:note-plus-corner" height="1.25em" className="[&_*]:stroke-[1.75]" /> {t('qrcode.createNew')}
            </button>
          ) : undefined
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 sm:px-8">
        <SearchInput value={search} onChange={setSearch} />

        <div className="overflow-x-auto">
          <div className={cx('min-w-[1100px]', TABLE_OVERRIDES)}>
            <DataTable
              columns={createColumns(t, handleEdit, handleRemove, hasEditPerm)}
              rows={rows}
              searchKeys={[]}
              searchPlaceholder=""
              emptyText={<EmptyState />}
            />
          </div>
        </div>
      </main>

      {(createOpen || editingCode) && (
        <QrDialog
          key={editingCode?.id ?? 'new'}
          codes={codes}
          editing={editingCode ?? undefined}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default QrCodePage