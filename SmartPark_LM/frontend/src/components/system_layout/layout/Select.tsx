/* ---------- Types ---------- */

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

interface SelectProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  dotColor?: string // ถ้าใส่ จะแสดงจุดสีด้านซ้ายของ select
  className?: string // class ของกล่องครอบนอก
  selectClassName?: string // class ของตัว <select>
  ariaLabel?: string
}

/* ---------- Styles ---------- */

const SELECT_BASE =
  'w-full cursor-pointer appearance-none rounded-md border border-line bg-white py-1.5 pr-8 text-[10px] text-ink outline-none focus:border-line'

/* ---------- Sub components ---------- */

function ColorDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
      style={{ background: color }}
    />
  )
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      width="11"
      height="9"
      viewBox="0 0 11 9"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B9B9BF]"
    >
      <polygon
        points="2,2 9,2 5.5,7"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------- Main component ---------- */

function Select<T extends string = string>({
  value,
  onChange,
  options,
  dotColor,
  className = '',
  selectClassName = '',
  ariaLabel,
}: SelectProps<T>) {
  // มีจุดสีทางซ้าย ต้องเว้นที่ด้านในเพิ่ม
  const paddingLeft = dotColor ? 'pl-8' : 'pl-3'

  return (
    <div className={`relative inline-block ${className}`}>
      {dotColor && <ColorDot color={dotColor} />}

      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${SELECT_BASE} ${paddingLeft} ${selectClassName}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronIcon />
    </div>
  )
}

export default Select