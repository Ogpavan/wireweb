import {Text} from '@primer/react'
import {SidebarItem} from './SidebarItem'
import type {NavSection} from '../../types/navigation'

interface SidebarSectionProps {
  section: NavSection
  collapsed?: boolean
  onNavigate?: () => void
}

export function SidebarSection({section, collapsed = false, onNavigate}: SidebarSectionProps) {
  return (
    <div className="sidebar-section">
      {!collapsed && (
        <Text as="p" className="sidebar-section__title">
          {section.title}
        </Text>
      )}
      <div className="sidebar-section__items">
        {section.items.map((item) => (
          <SidebarItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}
