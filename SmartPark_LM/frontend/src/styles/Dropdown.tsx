import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface Option<T extends string> {
  value: T
  label: string
  hint?: string // optional gray text on the right (e.g. a shortcut)
  icon?: ReactNode // optional icon in front of the label (shown in the closed box only, not in the list)
}

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

// ใช้ CSS variables แค่ 3 ตัว: --dropdown-bg / --dropdown-border / --dropdown-text
// สี hover คำนวณจากสองตัวนั้น (ผสมสีตัวอักษร 8% เข้ากับพื้นหลัง) จึงไม่ต้องมีตัวแปรเพิ่ม
const HOVER_BG = '!bg-[var(--hover-dropdown-bg)] !border-[var(--hover-dropdown-border)] !text-[var(--hover-dropdown-text)]'

export default function PillSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  widthClass = 'w-[128px]',
  triggerClassName = 'h-[40px] rounded-full text-[15.5px]',
  panelClassName = 'min-w-[220px]',
  disabled = false,
  arrow,
}: {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  ariaLabel: string
  widthClass?: string
  triggerClassName?: string // height, radius and font size of the closed box
  panelClassName?: string // width of the open panel
  disabled?: boolean
  arrow?: ReactNode // replaces the default ▼; pass null to hide it (position custom icons absolutely)
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null) // ตำแหน่งปุ่มบนหน้าจอ ใช้วางแผงรายการ

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = options[selectedIndex]

  // close on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      // แผงอยู่นอก rootRef (portal) จึงต้องเช็กทั้งสองที่
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // วัดตำแหน่งปุ่มตอนเปิด และตามให้ทันตอนเลื่อนหน้า / ย่อขยายหน้าต่าง
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      if (buttonRef.current) setRect(buttonRef.current.getBoundingClientRect())
    }
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [open])

  // close if it becomes disabled while open
  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const openMenu = () => {
    setActiveIndex(Math.max(selectedIndex, 0))
    setOpen(true)
  }

  const commit = (i: number) => {
    onChange(options[i].value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) openMenu()
        else setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) openMenu()
        else setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open && activeIndex >= 0) commit(activeIndex)
        else openMenu()
        break
      case 'Escape':
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className={cx('relative inline-block', widthClass)}>
    <button
      ref={buttonRef}
      type="button"
      role="combobox"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      disabled={disabled}
      onClick={() => (open ? setOpen(false) : openMenu())}
      onKeyDown={onKeyDown}
      className={cx(
        'relative w-full cursor-pointer border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] text-center text-[var(--dropdown-text)] outline-none transition hover:!bg-[var(--hover-dropdown-bg)] hover:!border-[color:var(--hover-dropdown-border)] hover:!text-[color:var(--hover-dropdown-text)]',
        selected?.icon ? 'pl-9 pr-3' : 'px-4',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:border-[var(--text-tertiary)]',
        triggerClassName,
      )}
      style={
        open
          ? {
              background: 'var(--hover-dropdown-bg)',
              borderColor: 'var(--hover-dropdown-border)',
              color: 'var(--hover-dropdown-text)',
            }
          : undefined
      }
      >
      {selected?.icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
          {selected.icon}
        </span>
      )}
      <span className="block truncate">{selected?.label}</span>
      {arrow}
    </button>

      {open && rect && createPortal(
        // wrapper ทับตำแหน่งปุ่มพอดี (fixed) เพื่อให้ ul ใช้ right-0 / top-full / min-w-full เหมือนเดิม
        // pointer-events-none กันไม่ให้ wrapper บังการคลิกปุ่ม
        <div
          ref={panelRef}
          className="pointer-events-none fixed"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, zIndex: 9999 }}
        >
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={cx(
            'pointer-events-auto absolute right-0 top-full z-50 mt-2 w-max rounded-xl border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
            panelClassName,
          )}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value
            const isActive = i === activeIndex
            return (
            <li
            key={option.value}
            role="option"
            aria-selected={isSelected}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => commit(i)}
            className={cx(
                'flex cursor-pointer items-center justify-between gap-6 rounded-lg px-3 py-2 text-[13px] font-normal text-[var(--dropdown-text)] transition-colors',
                isActive && HOVER_BG,
                isSelected && 'font-medium',
            )}
            >
                <span>{option.label}</span>
                {option.hint && <span className="text-[13px] opacity-60">{option.hint}</span>}
              </li>
            )
          })}
        </ul>
        </div>,
        document.body,
      )}
    </div>
  )
}