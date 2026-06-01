import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminGetThemes, adminSetTheme } from '../../api/client'

/** Refresca el <link> del tema activo para previsualizar el cambio al instante. */
function reloadActiveTheme() {
  const link = document.getElementById('active-theme')
  if (link) link.href = `/api/public/theme.css?v=${Date.now()}`
}

export default function Appearance() {
  const { t } = useTranslation()
  const [themes, setThemes] = useState([])
  const [active, setActive] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    adminGetThemes()
      .then((d) => { setThemes(d.themes); setActive(d.active) })
      .catch(() => setMsg(t('appearance.error')))
  }, [t])

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      await adminSetTheme(active)
      reloadActiveTheme()
      setMsg(t('appearance.saved'))
    } catch {
      setMsg(t('appearance.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="admin-head">
        <h2>{t('appearance.title')}</h2>
      </div>

      <div className="card card-body" style={{ maxWidth: 560 }}>
        <p className="tag-dim" style={{ marginBottom: '1.25rem' }}>{t('appearance.help')}</p>

        <div className="field">
          <label>{t('appearance.stylesheet')}</label>
          <select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">{t('appearance.none')}</option>
            {themes.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {themes.length === 0 && (
          <p className="tag-dim" style={{ marginBottom: '1rem' }}>{t('appearance.empty')}</p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? t('common.loading') : t('appearance.apply')}
          </button>
          {msg && <span className="tag-dim">{msg}</span>}
        </div>
      </div>
    </div>
  )
}
