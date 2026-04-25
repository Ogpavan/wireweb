import {BellIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, ThreeBarsIcon} from '@primer/octicons-react'
import {Button, Label, Text} from '@primer/react'
import {useAuth} from '../../app/AuthProvider'

interface TopbarProps {
  onMenuClick: () => void
  onToggleSidebar: () => void
  isSidebarCollapsed: boolean
}

export function Topbar({onMenuClick, onToggleSidebar, isSidebarCollapsed}: TopbarProps) {
  const {logout, user} = useAuth()
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'PA'

  return (
    <header className="topbar">
      <div className="topbar__project">
        <Button className="topbar__menu" aria-label="Open navigation" onClick={onMenuClick}>
          <ThreeBarsIcon aria-hidden="true" size={16} />
        </Button>
        <Button
          className="topbar__icon-button topbar__collapse"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
        >
          {isSidebarCollapsed ? (
            <ChevronRightIcon aria-hidden="true" size={16} />
          ) : (
            <ChevronLeftIcon aria-hidden="true" size={16} />
          )}
        </Button>
        <div>
          <Text as="p" className="topbar__eyebrow">
            Workspace
          </Text>
          <Text as="p" className="topbar__title">
            API Platform
          </Text>
        </div>
        <Label className="environment-badge">Test</Label>
      </div>
      <div className="topbar__search" role="search" aria-label="Console search">
        <SearchIcon aria-hidden="true" size={16} />
        <span>Search resources, request IDs, keys</span>
      </div>
      <div className="topbar__actions">
        <Button className="topbar__icon-button" aria-label="Notifications">
          <BellIcon aria-hidden="true" size={16} />
        </Button>
        <div className="topbar__identity">
          <Text as="span" className="topbar__email">
            {user?.email}
          </Text>
          <div className="topbar__avatar" aria-label={`Signed in as ${user?.email ?? 'platform admin'}`} role="img">
            {initials}
          </div>
        </div>
        <Button className="secondary-button topbar__signout" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
