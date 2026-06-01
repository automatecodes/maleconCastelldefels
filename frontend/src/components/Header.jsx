import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'

export default function Header() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/', key: 'home', end: true },
    { to: '/escuela', key: 'school' },
    { to: '/cursos', key: 'courses' },
    { to: '/horarios', key: 'schedule' },
    { to: '/eventos', key: 'events' },
    { to: '/contacto', key: 'contact' },
  ]

  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          {/* El logo lo sube el cliente: colócalo en frontend/public/logo.png */}
          <img src="/logo.png" alt="El Malecón de la Salsa" className="brand-logo"
               onError={(e) => { e.target.style.display = 'none' }} />
          <span className="brand-fallback">el<span className="accent">Malecón</span></span>
        </NavLink>

        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Menú">
          ☰
        </button>

        <nav className={open ? 'main-nav open' : 'main-nav'}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {t(`nav.${l.key}`)}
            </NavLink>
          ))}
          <LanguageSelector />
        </nav>
      </div>
    </header>
  )
}
