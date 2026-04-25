import {useEffect, useState} from 'react'
import {Outlet, useLocation} from 'react-router-dom'
import {Sidebar} from '../navigation/Sidebar'
import {Topbar} from './Topbar'

export function AppShell() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return window.localStorage.getItem('wire.sidebarCollapsed') === 'true'
  })
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    window.localStorage.setItem('wire.sidebarCollapsed', String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' app-shell--collapsed' : ''}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-frame">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main className="app-main" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
