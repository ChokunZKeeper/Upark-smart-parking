import type { ReactNode } from 'react'
import { PanelLeft } from 'lucide-react'
import { useLayoutContext } from './Layout'

/* ---------- Types ---------- */

interface NavbarProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

/* ---------- Sub components ---------- */

function SidebarToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
      aria-label="Toggle sidebar"
    >
      <PanelLeft size={18} />
    </button>
  )
}

/* ---------- Main component ---------- */

function Navbar({ title, subtitle, actions }: NavbarProps) {
  const { toggleSidebar } = useLayoutContext()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-3.5 sm:px-8 sm:py-4">
      {/* ซ้าย: ปุ่มเมนู + ชื่อหน้า + subtitle */}
      <div className="flex flex-wrap items-center gap-3">
        <SidebarToggleButton onClick={toggleSidebar} />

        <h1 className="my-1 text-2xl font-normal text-[#212121] sm:my-1.5 sm:text-[30px]">{title}</h1>

        {subtitle && <div className="flex items-center gap-2.5">{subtitle}</div>}
      </div>

      {/* ขวา: ปุ่ม action ต่าง ๆ */}
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </header>
  )
}

export default Navbar