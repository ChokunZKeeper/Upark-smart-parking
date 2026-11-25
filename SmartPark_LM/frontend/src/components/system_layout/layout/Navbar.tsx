import type { ReactNode } from 'react'
import { PanelLeft } from 'lucide-react'
import { useLayoutContext } from './Layout'
<<<<<<< HEAD
import { useT } from '@/i18n'
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

/* ---------- Types ---------- */

interface NavbarProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

/* ---------- Sub components ---------- */

function SidebarToggleButton({ onClick }: { onClick: () => void }) {
<<<<<<< HEAD
  const t = useT()
=======
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
<<<<<<< HEAD
      aria-label={t('navbar.toggleSidebar')}
=======
      aria-label="Toggle sidebar"
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    >
      <PanelLeft size={18} />
    </button>
  )
}

/* ---------- Main component ---------- */

function Navbar({ title, subtitle, actions }: NavbarProps) {
<<<<<<< HEAD
  // useLayoutContext อาจเป็น null ถ้าหน้านี้ไม่ได้อยู่ใต้ Layout Provider
  const layout = useLayoutContext()
  const toggleSidebar = layout?.toggleSidebar ?? (() => {})

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3.5 sm:px-8 sm:py-4">
=======
  const { toggleSidebar } = useLayoutContext()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-3.5 sm:px-8 sm:py-4">
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
      {/* ซ้าย: ปุ่มเมนู + ชื่อหน้า + subtitle */}
      <div className="flex flex-wrap items-center gap-3">
        <SidebarToggleButton onClick={toggleSidebar} />

<<<<<<< HEAD
        <h1 className="my-1 text-2xl font-normal text-text sm:my-1.5 sm:text-[30px]">{title}</h1>
=======
        <h1 className="my-1 text-2xl font-normal text-[#212121] sm:my-1.5 sm:text-[30px]">{title}</h1>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd

        {subtitle && <div className="flex items-center gap-2.5">{subtitle}</div>}
      </div>

      {/* ขวา: ปุ่ม action ต่าง ๆ */}
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </header>
  )
}

export default Navbar