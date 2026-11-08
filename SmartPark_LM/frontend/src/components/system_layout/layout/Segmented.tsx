/* ---------- Types ---------- */

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
}

interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  scale?: number
}

/* ---------- Helpers ---------- */

// รวม class โดยข้ามค่าที่เป็น false / null / undefined
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/* ---------- Styles ---------- */

const BUTTON_BASE =
  'min-w-[74.25px] whitespace-nowrap px-4 text-[11px] transition-all duration-150 select-none active:scale-95'

const BUTTON_PADDING = {
  sm: 'py-1.5',
  md: 'py-2',
} as const

const BUTTON_ACTIVE = 'bg-[#2771D8] font-normal text-white'
const BUTTON_INACTIVE = 'text-[#6F6F72] hover:bg-gray-50'

/* ---------- Component ---------- */

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'sm',
  scale = 1.1,
}: SegmentedProps<T>) {
  return (
    <div
      style={{ zoom: scale }}
      className="inline-flex divide-x divide-[#D2D2D7] overflow-hidden rounded-[8px] border border-[#D2D2D7] bg-white"
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cx(BUTTON_BASE, BUTTON_PADDING[size], isActive ? BUTTON_ACTIVE : BUTTON_INACTIVE)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default Segmented