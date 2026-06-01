import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMe } from '../../api/client'

export default function AdminLayout({ adminBase = '/gurutiadmin' }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) { nav(adminBase); return }
    getMe().then(() => setOk(true)).catch(() => {
      localStorage.removeItem('token')
      nav(adminBase)
    })
  }, [nav, adminBase])

  const logout = () => { localStorage.removeItem('token'); nav(adminBase) }

  if (!ok) return <div className="admin-login">{t('common.loading')}</div>

  const links = [
    { to: `${adminBase}/dashboard`, key: 'dashboard' },
    { to: `${adminBase}/estudiantes`, key: 'students' },
    { to: `${adminBase}/profesores`, key: 'teachers' },
    { to: `${adminBase}/cursos`, key: 'courses' },
    { to: `${adminBase}/eventos`, key: 'events' },
    { to: `${adminBase}/leads`, key: 'leads' },
    { to: `${adminBase}/media`, key: 'media' },
    { to: `${adminBase}/apariencia`, key: 'appearance' },
  ]

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand-link">
          <img src="/logo.png" alt="elMalecón" className="admin-logo"
            onError={(e) => { e.target.style.display = 'none' }} />
          <span className="brand-fallback admin-brand">el<span className="accent">Malecón</span></span>
        </Link>
        <span className="tag-dim" style={{ fontSize: '0.75rem' }}>{t('common.admin')}</span>
        <nav className="admin-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => (isActive ? 'admin-link active' : 'admin-link')}>
              {t(`admin.${l.key}`)}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn-ghost admin-logout" onClick={logout}>{t('admin.logout')}</button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
