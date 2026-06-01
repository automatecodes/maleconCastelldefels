import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminGetThemes, adminSetTheme } from '../../api/client'

const TOKEN = () => localStorage.getItem('token')
const AUTH = () => ({ Authorization: `Bearer ${TOKEN()}` })

/** Refresca el <link> del tema activo para previsualizar el cambio al instante. */
function reloadActiveTheme() {
  const link = document.getElementById('active-theme')
  if (link) link.href = `/api/public/theme.css?v=${Date.now()}`
}

function isColorValue(v) {
  return typeof v === 'string' && v.trim().startsWith('#')
}

export default function Appearance() {
  const { t } = useTranslation()
  const [themes, setThemes] = useState([])
  const [active, setActive] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Template variables
  const [vars, setVars] = useState({})
  const [varsLoading, setVarsLoading] = useState(false)
  const [varsSaving, setVarsSaving] = useState(false)
  const [varsMsg, setVarsMsg] = useState('')

  // Import
  const importRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')

  useEffect(() => {
    adminGetThemes()
      .then((d) => { setThemes(d.themes); setActive(d.active) })
      .catch(() => setMsg(t('appearance.error')))
  }, [t])

  useEffect(() => {
    setVarsLoading(true)
    fetch('/api/admin/themes/variables', { headers: AUTH() })
      .then((r) => r.json())
      .then((d) => setVars(d.vars || {}))
      .catch(() => setVarsMsg('Error cargando variables'))
      .finally(() => setVarsLoading(false))
  }, [])

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

  const saveVars = async () => {
    setVarsSaving(true)
    setVarsMsg('')
    try {
      const res = await fetch('/api/admin/themes/variables', {
        method: 'PUT',
        headers: { ...AUTH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ vars }),
      })
      if (!res.ok) throw new Error()
      reloadActiveTheme()
      setVarsMsg('Variables guardadas')
    } catch {
      setVarsMsg('Error guardando variables')
    } finally {
      setVarsSaving(false)
    }
  }

  const exportTheme = async () => {
    try {
      const res = await fetch('/api/admin/themes/export', { headers: AUTH() })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tema-malecon.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setVarsMsg('Error exportando tema')
    }
  }

  const importTheme = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.vars) throw new Error('Formato inválido: falta "vars"')
      const res = await fetch('/api/admin/themes/import', {
        method: 'POST',
        headers: { ...AUTH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ vars: data.vars }),
      })
      if (!res.ok) throw new Error()
      setVars(data.vars)
      reloadActiveTheme()
      setImportMsg('Tema importado correctamente')
    } catch (err) {
      setImportMsg(err.message || 'Error importando tema')
    } finally {
      if (importRef.current) importRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="admin-head">
        <h2>{t('appearance.title')}</h2>
      </div>

      {/* Selector de tema */}
      <div className="card card-body" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
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

      {/* Variables del tema */}
      <div className="card card-body" style={{ maxWidth: 760, marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Variables del tema</h3>
        {varsLoading ? (
          <p className="tag-dim">Cargando variables…</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}>
            {Object.entries(vars).map(([key, val]) => (
              <div className="field" key={key} style={{ marginBottom: 0 }}>
                <label style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>--{key}</label>
                {isColorValue(val) ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={val}
                      onChange={(e) => setVars((prev) => ({ ...prev, [key]: e.target.value }))}
                      style={{ width: 42, height: 34, padding: 2, cursor: 'pointer', borderRadius: 6, border: '1px solid var(--border)', background: 'none' }}
                    />
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setVars((prev) => ({ ...prev, [key]: e.target.value }))}
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.82rem' }}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setVars((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={saveVars} disabled={varsSaving}>
            {varsSaving ? 'Guardando…' : 'Guardar variables'}
          </button>
          {varsMsg && <span className="tag-dim">{varsMsg}</span>}
        </div>
      </div>

      {/* Export / Import */}
      <div className="card card-body" style={{ maxWidth: 560 }}>
        <h3 style={{ marginBottom: '1rem' }}>Exportar / Importar tema</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={exportTheme}>
            Exportar tema (JSON)
          </button>
          <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
            Importar tema (JSON)
            <input
              ref={importRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={importTheme}
            />
          </label>
        </div>
        {importMsg && (
          <p className="tag-dim" style={{ marginTop: '0.75rem' }}>{importMsg}</p>
        )}
      </div>
    </div>
  )
}
