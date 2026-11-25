<<<<<<< HEAD
﻿import { StrictMode } from 'react'
=======
import { StrictMode } from 'react'
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
<<<<<<< HEAD
import { I18nProvider } from '@/i18n'

document.documentElement.dataset.theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)

=======

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd
