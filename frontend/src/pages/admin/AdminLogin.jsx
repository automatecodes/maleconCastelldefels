import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../../api/client'

export default function AdminLogin({ adminBase = '/gurutiadmin' }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token')) nav(`${adminBase}/dashboard`)
  }, [nav, adminBase])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(false)
    try {
      const { access_token } = await login(email, password)
      localStorage.setItem('token', access_token)
      nav(`${adminBase}/dashboard`)
    } catch {
      setError(true)
    }
  }

  return (
    <div className="admin-login">
      <form className="card" style={{ padding: '2.5rem', width: '100%', maxWidth: 380 }} onSubmit={onSubmit}>
        <img src="/logo.png" alt="elMalecón" style={{ height: 48, marginBottom: '0.75rem' }}
          onError={(e) => { e.target.style.display = 'none' }} />
        <div className="brand-fallback" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          el<span className="accent">Malecón</span>
        </div>
        <h3 style={{ marginBottom: '1.5rem' }}>{t('admin.login')}</h3>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>{t('admin.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>{t('admin.signIn')}</button>
        {error && <p style={{ color: 'var(--amber)', marginTop: '1rem' }}>Email o contraseña incorrectos.</p>}
      </form>
    </div>
  )
}
