import {createBrowserRouter} from 'react-router-dom'
import {ProtectedRoute} from '../components/auth/ProtectedRoute'
import {AppShell} from '../components/layout/AppShell'
import {AnalyticsPage} from '../pages/AnalyticsPage'
import {ApiKeysPage} from '../pages/ApiKeysPage'
import {APIExplorerPage} from '../pages/APIExplorerPage'
import {ChannelsPage} from '../pages/ChannelsPage'
import {DashboardPage} from '../pages/DashboardPage'
import {LogsPage} from '../pages/LogsPage'
import {LoginPage} from '../pages/LoginPage'
import {SessionsPage} from '../pages/SessionsPage'
import {SettingsPage} from '../pages/SettingsPage'
 
import {WebhooksPage} from '../pages/WebhooksPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {index: true, element: <DashboardPage />},
          {path: 'api-keys', element: <ApiKeysPage />},
          {path: 'sessions', element: <SessionsPage />},
          {path: 'channels', element: <ChannelsPage />},
          {path: 'webhooks', element: <WebhooksPage />},
          {path: 'logs', element: <LogsPage />},
          {path: 'analytics', element: <AnalyticsPage />},
          {path: 'api-explorer', element: <APIExplorerPage />},
          {path: 'docs', element: <APIExplorerPage />},
           
          {path: 'settings', element: <SettingsPage />},
        ],
      },
    ],
  },
])
