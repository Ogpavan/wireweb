import '@primer/primitives/dist/css/functional/themes/light.css'
import '@primer/primitives/dist/css/functional/themes/dark.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import {BaseStyles, ThemeProvider} from '@primer/react'
import {AuthProvider} from './app/AuthProvider'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider colorMode="day" dayScheme="light" nightScheme="dark">
      <BaseStyles>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BaseStyles>
    </ThemeProvider>
  </React.StrictMode>,
)
