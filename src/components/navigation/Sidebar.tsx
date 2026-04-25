import {sidebarSections} from '../../app/sidebarConfig'
import {SidebarSection} from './SidebarSection'

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
}

export function Sidebar({isOpen, isCollapsed, onClose}: SidebarProps) {
  return (
    <>
      <aside
        className={`sidebar${isOpen ? ' sidebar--open' : ''}${isCollapsed ? ' sidebar--collapsed' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar__brand">
          <div className="sidebar__mark" aria-hidden="true">
            API
          </div>
          <div className="sidebar__brand-copy">
            <p className="sidebar__product">Wire Console</p>
            <p className="sidebar__tenant">Platform tools</p>
          </div>
        </div>
        <nav className="sidebar__nav" aria-label="Console sections">
          {sidebarSections.map((section) => (
            <SidebarSection key={section.title} section={section} collapsed={isCollapsed} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
      {isOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={onClose} />}
    </>
  )
}
