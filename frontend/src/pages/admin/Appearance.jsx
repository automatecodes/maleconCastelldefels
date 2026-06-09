import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminGetThemes, adminSetTheme, adminGetVideoSettings, adminSetVideoSettings } from '../../api/client'

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

  // Vídeo hero
  const [videoSt, setVideoSt] = useState({ overlay: 0.05, speed: 1.0 })
  const [videoMsg, setVideoMsg] = useState('')
  const [videoSaving, setVideoSaving] = useState(false)

  // Template variables
  const [vars, setVars] = useState({})
  const [varsLoading, setVarsLoading] = useState(false)
  const [varsSaving, setVarsSaving] = useState(false)
  const [varsMsg, setVarsMsg] = useState('')

  // Import
  const importRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')

  // URL → tema
  const [urlInput, setUrlInput] = useState('')
  const [urlName, setUrlName] = useState('')
  const [urlApply, setUrlApply] = useState(true)
  const [urlGenerating, setUrlGenerating] = useState(false)
  const [urlMsg, setUrlMsg] = useState('')
  const [urlPreview, setUrlPreview] = useState('')

  // Tema completo (HTML + scripts + logo filter)
  const [themeEditMode, setThemeEditMode] = useState(null) // null | 'edit' | 'create'
  const [themeEditName, setThemeEditName] = useState('')
  const [themeEditLoading, setThemeEditLoading] = useState(false)
  const [themeEditSaving, setThemeEditSaving] = useState(false)
  const [themeEditMsg, setThemeEditMsg] = useState('')
  const [themeEditData, setThemeEditData] = useState({
    css_variables: {},
    html_sections: {},
    scripts: '',
    logo_filter: {
      hue_rotation: 0,
      saturation: 1.0,
      brightness: 1.0,
      drop_shadow_color: '#2FE56B',
      drop_shadow_blur: 8,
    },
  })

  const refreshThemes = () =>
    adminGetThemes().then((d) => { setThemes(d.themes); setActive(d.active) }).catch(() => {})

  // Cargar configuración completa de un tema
  const loadThemeConfig = async (themeName) => {
    setThemeEditLoading(true)
    setThemeEditMsg('')
    try {
      const res = await fetch(`/api/admin/themes/config/${themeName}`, { headers: AUTH() })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setThemeEditData(data)
      setThemeEditName(themeName)
      setThemeEditMode('edit')
    } catch {
      setThemeEditMsg('Error cargando configuración del tema')
    } finally {
      setThemeEditLoading(false)
    }
  }

  // Guardar configuración completa de un tema
  const saveThemeConfig = async () => {
    if (!themeEditName.trim()) return
    setThemeEditSaving(true)
    setThemeEditMsg('')
    try {
      const res = await fetch(`/api/admin/themes/config/${themeEditName}`, {
        method: 'PUT',
        headers: { ...AUTH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: themeEditName,
          ...themeEditData,
        }),
      })
      if (!res.ok) throw new Error()
      setThemeEditMsg('✅ Configuración guardada')
      // Recargar tema si está activo
      if (active === themeEditName) {
        reloadActiveTheme()
      }
    } catch {
      setThemeEditMsg('❌ Error guardando tema')
    } finally {
      setThemeEditSaving(false)
    }
  }

  const generateFromUrl = async () => {
    if (!urlInput.trim()) return
    setUrlGenerating(true)
    setUrlMsg('')
    setUrlPreview('')
    try {
      const res = await fetch('/api/admin/themes/from-url', {
        method: 'POST',
        headers: { ...AUTH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), name: urlName.trim() || 'tema-generado', apply: urlApply }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error desconocido')
      setUrlMsg(`✅ Tema "${data.filename}" generado${data.applied ? ' y aplicado' : ''}`)
      setUrlPreview(data.css_preview)
      await refreshThemes()
      if (data.applied) { setActive(data.filename); reloadActiveTheme() }
    } catch (e) {
      setUrlMsg(`❌ ${e.message}`)
    } finally {
      setUrlGenerating(false)
    }
  }

  useEffect(() => {
    adminGetVideoSettings().then(setVideoSt).catch(() => {})
  }, [])

  const saveVideo = async () => {
    setVideoSaving(true)
    setVideoMsg('')
    try {
      await adminSetVideoSettings(videoSt)
      setVideoMsg('Guardado correctamente')
    } catch {
      setVideoMsg('Error al guardar')
    } finally {
      setVideoSaving(false)
    }
  }

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

      {/* Vídeo Hero */}
      <div className="card card-body" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>🎬 Vídeo Hero</h3>

        <div className="field">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Capa de atenuación</span>
            <strong style={{ color: 'var(--green)' }}>{Math.round(videoSt.overlay * 100)}%</strong>
          </label>
          <input type="range" min="0" max="1" step="0.01"
            value={videoSt.overlay}
            onChange={(e) => setVideoSt((s) => ({ ...s, overlay: parseFloat(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--green)' }}
          />
          <p className="tag-dim" style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
            Capa negra semitransparente sobre el vídeo (0 = sin atenuación, 100 = negro total)
          </p>
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Velocidad de reproducción</span>
            <strong style={{ color: 'var(--green)' }}>{videoSt.speed.toFixed(2)}×</strong>
          </label>
          <input type="range" min="0.25" max="2" step="0.05"
            value={videoSt.speed}
            onChange={(e) => setVideoSt((s) => ({ ...s, speed: parseFloat(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--green)' }}
          />
          <p className="tag-dim" style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
            0.25× (muy lento) → 1× (normal) → 2× (rápido)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1.25rem' }}>
          <button className="btn btn-primary" onClick={saveVideo} disabled={videoSaving}>
            {videoSaving ? 'Guardando…' : 'Guardar configuración de vídeo'}
          </button>
          {videoMsg && <span className="tag-dim">{videoMsg}</span>}
        </div>
      </div>

      {/* Generar tema desde URL */}
      <div className="card card-body" style={{ maxWidth: 560, marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.35rem' }}>✨ Generar tema desde URL</h3>
        <p className="tag-dim" style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}>
          Claude analiza los estilos, colores y tipografía del sitio indicado y crea un nuevo tema adaptado a elMalecón.
        </p>

        <div className="field">
          <label>URL del sitio a inspeccionar</label>
          <input
            type="url"
            placeholder="https://ejemplo.com"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={urlGenerating}
          />
        </div>

        <div className="field">
          <label>Nombre del nuevo tema</label>
          <input
            type="text"
            placeholder="mi-tema-nuevo"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            disabled={urlGenerating}
          />
          <p className="tag-dim" style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
            Se guardará como <code>{(urlName.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-') || 'tema-generado')}.css</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="checkbox"
            id="url-apply"
            checked={urlApply}
            onChange={(e) => setUrlApply(e.target.checked)}
            style={{ width: 'auto', accentColor: 'var(--green)' }}
          />
          <label htmlFor="url-apply" style={{ margin: 0, cursor: 'pointer' }}>
            Aplicar automáticamente al terminar
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={generateFromUrl}
            disabled={urlGenerating || !urlInput.trim()}
          >
            {urlGenerating
              ? <><span style={{ display: 'inline-block', marginRight: '0.5rem' }}>⟳</span> Analizando…</>
              : '✨ Generar tema'}
          </button>
          {urlMsg && (
            <span style={{ fontSize: '0.88rem', color: urlMsg.startsWith('✅') ? 'var(--green)' : '#ef4444' }}>
              {urlMsg}
            </span>
          )}
        </div>

        {urlGenerating && (
          <p className="tag-dim" style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
            Claude está inspeccionando el sitio y generando el CSS… esto puede tardar 20-30 segundos.
          </p>
        )}

        {urlPreview && (
          <div style={{ marginTop: '1rem' }}>
            <p className="tag-dim" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>Vista previa del CSS generado:</p>
            <pre style={{
              background: 'var(--surface-2)', padding: '0.75rem', borderRadius: 8,
              fontSize: '0.72rem', overflow: 'auto', maxHeight: 160,
              border: '1px solid var(--border)', color: 'var(--text-dim)',
            }}>{urlPreview}…</pre>
          </div>
        )}
      </div>

      {/* Edición de Tema Completo (HTML + Scripts + Logo Filter) */}
      <div className="card card-body" style={{ maxWidth: 900, marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🎨 Editar tema completo (HTML + Scripts + Logo)</h3>
        
        {themeEditMode === null ? (
          <div>
            <p className="tag-dim" style={{ marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              Selecciona un tema para editar su configuración completa: HTML personalizado, scripts, y filtro del logo.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {themes.map((name) => (
                <button
                  key={name}
                  className="btn btn-ghost"
                  onClick={() => loadThemeConfig(name)}
                  disabled={themeEditLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Tema: <strong>{themeEditName}</strong></h4>
              <button className="btn btn-sm btn-ghost" onClick={() => { setThemeEditMode(null); setThemeEditMsg('') }}>
                ✕ Cerrar
              </button>
            </div>

            {/* Logo Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ marginBottom: '1rem', color: 'var(--green)' }}>🔸 Filtro del Logo</h5>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
              }}>
                <div className="field">
                  <label>Rotación de tonalidad (grados)</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={themeEditData.logo_filter?.hue_rotation || 0}
                    onChange={(e) => setThemeEditData((prev) => ({
                      ...prev,
                      logo_filter: { ...prev.logo_filter, hue_rotation: parseInt(e.target.value) }
                    }))}
                    style={{ width: '100%', accentColor: 'var(--green)' }}
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-dim)' }}>
                    {themeEditData.logo_filter?.hue_rotation || 0}°
                  </small>
                </div>

                <div className="field">
                  <label>Saturación</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={themeEditData.logo_filter?.saturation || 1}
                    onChange={(e) => setThemeEditData((prev) => ({
                      ...prev,
                      logo_filter: { ...prev.logo_filter, saturation: parseFloat(e.target.value) }
                    }))}
                    style={{ width: '100%', accentColor: 'var(--green)' }}
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-dim)' }}>
                    {(themeEditData.logo_filter?.saturation || 1).toFixed(1)}×
                  </small>
                </div>

                <div className="field">
                  <label>Brillo</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={themeEditData.logo_filter?.brightness || 1}
                    onChange={(e) => setThemeEditData((prev) => ({
                      ...prev,
                      logo_filter: { ...prev.logo_filter, brightness: parseFloat(e.target.value) }
                    }))}
                    style={{ width: '100%', accentColor: 'var(--green)' }}
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-dim)' }}>
                    {(themeEditData.logo_filter?.brightness || 1).toFixed(1)}×
                  </small>
                </div>

                <div className="field">
                  <label>Color sombra del logo</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={themeEditData.logo_filter?.drop_shadow_color || '#2FE56B'}
                      onChange={(e) => setThemeEditData((prev) => ({
                        ...prev,
                        logo_filter: { ...prev.logo_filter, drop_shadow_color: e.target.value }
                      }))}
                      style={{ width: 42, height: 34, padding: 2, cursor: 'pointer', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                    <input
                      type="text"
                      value={themeEditData.logo_filter?.drop_shadow_color || '#2FE56B'}
                      onChange={(e) => setThemeEditData((prev) => ({
                        ...prev,
                        logo_filter: { ...prev.logo_filter, drop_shadow_color: e.target.value }
                      }))}
                      style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Blur de sombra (px)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={themeEditData.logo_filter?.drop_shadow_blur || 8}
                    onChange={(e) => setThemeEditData((prev) => ({
                      ...prev,
                      logo_filter: { ...prev.logo_filter, drop_shadow_blur: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <small style={{ display: 'block', color: 'var(--text-dim)' }}>
                  Vista previa del filtro CSS:
                </small>
                <code style={{ fontSize: '0.75rem', color: 'var(--green)', fontFamily: 'monospace', display: 'block', marginTop: '0.35rem' }}>
                  filter: hue-rotate({themeEditData.logo_filter?.hue_rotation || 0}deg) saturate({(themeEditData.logo_filter?.saturation || 1).toFixed(1)}) brightness({(themeEditData.logo_filter?.brightness || 1).toFixed(1)})
                </code>
              </div>
            </div>

            {/* Scripts */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ marginBottom: '1rem', color: 'var(--green)' }}>⚙️ Scripts personalizados</h5>
              <textarea
                value={themeEditData.scripts || ''}
                onChange={(e) => setThemeEditData((prev) => ({ ...prev, scripts: e.target.value }))}
                placeholder="// JavaScript personalizado que se inyectará en la página (ej: inicializadores, listeners)"
                style={{
                  width: '100%',
                  minHeight: 200,
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--surface-2)',
                }}
              />
            </div>

            {/* HTML Sections */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ marginBottom: '1rem', color: 'var(--green)' }}>🏗️ Secciones HTML</h5>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {['header', 'footer', 'hero', 'sections'].map((section) => (
                  <div key={section} className="field">
                    <label htmlFor={`html-${section}`}>{section.charAt(0).toUpperCase() + section.slice(1)}</label>
                    <textarea
                      id={`html-${section}`}
                      value={themeEditData.html_sections?.[section] || ''}
                      onChange={(e) => setThemeEditData((prev) => ({
                        ...prev,
                        html_sections: { ...prev.html_sections, [section]: e.target.value }
                      }))}
                      placeholder={`HTML personalizado para la sección ${section}`}
                      style={{
                        width: '100%',
                        minHeight: 120,
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        padding: '0.75rem',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        background: 'var(--surface-2)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de guardar */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-primary"
                onClick={saveThemeConfig}
                disabled={themeEditSaving}
              >
                {themeEditSaving ? 'Guardando…' : '✅ Guardar configuración'}
              </button>
              {themeEditMsg && (
                <span style={{ fontSize: '0.88rem', color: themeEditMsg.startsWith('✅') ? 'var(--green)' : '#ef4444' }}>
                  {themeEditMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
