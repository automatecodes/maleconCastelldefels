import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMe } from '../../api/client'

export default function AdminLayout() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) { nav('/admin'); return }
    getMe().then(() => setOk(true)).catch(() => {
      localStorage.removeItem('token')
      nav('/admin')
    })
  }, [nav])

  const logout = () => { localStorage.removeItem('token'); nav('/admin') }

  if (!ok) return <div className="admin-login">{t('common.loading')}</div>

  const links = [
    { to: '/admin/dashboard', key: 'dashboard' },
    { to: '/admin/estudiantes', key: 'students' },
    { to: '/admin/profesores', key: 'teachers' },
    { to: '/admin/cursos', key: 'courses' },
    { to: '/admin/eventos', key: 'events' },
    { to: '/admin/leads', key: 'leads' },
    { to: '/admin/apariencia', key: 'appearance' },
  ]

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-fallback admin-brand">el<span className="accent">Malecón</span></div>
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
