import {
  DeviceMobileIcon,
  GearIcon,
  GraphIcon,
  HomeIcon,
  KeyIcon,
  ListUnorderedIcon,
  SearchIcon,
  WebhookIcon,
} from '@primer/octicons-react'
import type {NavSection} from '../types/navigation'

export const sidebarSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      {title: 'Dashboard', path: '/', icon: HomeIcon},
      {title: 'API Keys', path: '/api-keys', icon: KeyIcon},
      {title: 'Sessions', path: '/sessions', icon: DeviceMobileIcon},
      {title: 'Webhooks', path: '/webhooks', icon: WebhookIcon},
      {title: 'Logs', path: '/logs', icon: ListUnorderedIcon},
      {title: 'Rate Limits', path: '/analytics', icon: GraphIcon},
    ],
  },
  {
    title: 'Resources',
    items: [{title: 'API Explorer', path: '/api-explorer', icon: SearchIcon}],
  },
  {
    title: 'Administration',
    items: [{title: 'Settings', path: '/settings', icon: GearIcon}],
  },
]
