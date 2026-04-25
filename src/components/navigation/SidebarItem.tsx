import {NavLink} from 'react-router-dom'
import type {NavItem} from '../../types/navigation'

interface SidebarItemProps {
  item: NavItem
  collapsed?: boolean
  onNavigate?: () => void
}

export function SidebarItem({item, collapsed = false, onNavigate}: SidebarItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({isActive}) => `sidebar-item${isActive ? ' sidebar-item--active' : ''}`}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
    >
      <Icon aria-hidden="true" size={16} />
      {!collapsed && <span>{item.title}</span>}
    </NavLink>
  )
}
