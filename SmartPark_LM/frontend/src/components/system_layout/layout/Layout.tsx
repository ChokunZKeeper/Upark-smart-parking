import { useCallback, useState } from 'react'
import { Outlet, useOutletContext } from 'react-router-dom'
import Sidebar from '@/components/system_layout/layout/Sidebar'

/* ---------- Types ---------- */

export interface LayoutContext {
  toggleSidebar: () => void
}

/* ---------- Constants ---------- */

const DESKTOP_QUERY = '(min-width: 1024px)'

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches

/* ---------- Hook สำหรับหน้าลูก (ใช้แทน useOutletContext โดยตรง) ---------- */

export function useLayoutContext() {
  return useOutletContext<LayoutContext>()
}

/* ---------- Component ---------- */

function Layout() {
  const [collapsed, setCollapsed] = useState(false) 
  const [mobileOpen, setMobileOpen] = useState(false) 

  const toggleSidebar = useCallback(() => {
    if (isDesktop()) {
      setCollapsed((prev) => !prev)
    } else {
      setMobileOpen((prev) => !prev)
    }
  }, [])

  const closeMobileSidebar = () => setMobileOpen(false)

  return (
    <div className="flex h-full overflow-hidden bg-sidebar">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={closeMobileSidebar} />

<<<<<<< HEAD
      <div className="card mt-4.25 flex min-w-0 flex-1 flex-col overflow-hidden rounded-b-none rounded-r-none rounded-tl-[21px]">
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-surface py-1">
          <Outlet context={{ toggleSidebar } satisfies LayoutContext} />
        </main>
      </div>
=======
      <main className="mt-4.25 flex min-w-0 flex-1 flex-col overflow-y-auto rounded-tl-[21px] border-l border-t border-line bg-white py-1">
        <Outlet context={{ toggleSidebar } satisfies LayoutContext} />
      </main>
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
    </div>
  )
}

export default Layout