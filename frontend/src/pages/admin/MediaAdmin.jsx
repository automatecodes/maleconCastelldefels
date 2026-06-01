import { useEffect, useState, useRef } from 'react'

const TOKEN = () => localStorage.getItem('token')
const AUTH = () => ({ Authorization: `Bearer ${TOKEN()}` })

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v8.25A2.25 2.25 0 004.5 16.5h15A2.25 2.25 0 0021.75 14.25V8.25A2.25 2.25 0 0019.5 6h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(name) {
  return /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(name)
}

function MetadataModal({ item, folder, onClose }) {
  const path = folder ? `${folder}/${item.name}` : item.name
  const [meta, setMeta] = useState({ alt_text: '', link_url: '', title: '', seo_description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/admin/media/metadata?path=${encodeURIComponent(path)}`, { headers: AUTH() })
      .then((r) => r.json())
      .then((d) => setMeta({ alt_text: d.alt_text || '', link_url: d.link_url || '', title: d.title || '', seo_description: d.seo_description || '' }))
      .catch(() => setMsg('Error cargando metadatos'))
      .finally(() => setLoading(false))
  }, [path])

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/media/metadata', {
        method: 'PUT',
        headers: { ...AUTH(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, ...meta }),
      })
      if (!res.ok) throw new Error()
      setMsg('Guardado')
    } catch {
      setMsg('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" style={{ maxWidth: 520, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ marginBottom: '1rem' }}>{item.name}</h3>
        {loading ? (
          <p className="tag-dim">Cargando…</p>
        ) : (
          <>
            <div className="field">
              <label>Texto alternativo (alt)</label>
              <input type="text" value={meta.alt_text} onChange={(e) => setMeta((m) => ({ ...m, alt_text: e.target.value }))} />
            </div>
            <div className="field">
              <label>Título</label>
              <input type="text" value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} />
            </div>
            <div className="field">
              <label>URL de enlace</label>
              <input type="text" value={meta.link_url} onChange={(e) => setMeta((m) => ({ ...m, link_url: e.target.value }))} />
            </div>
            <div className="field">
              <label>Descripción SEO</label>
              <textarea
                value={meta.seo_description}
                onChange={(e) => setMeta((m) => ({ ...m, seo_description: e.target.value }))}
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar metadatos'}
              </button>
              <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
              {msg && <span className="tag-dim">{msg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function MediaAdmin() {
  const [folder, setFolder] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedMeta, setSelectedMeta] = useState(null)
  const fileRef = useRef(null)

  const load = (path) => {
    setLoading(true)
    setUploadMsg('')
    fetch(`/api/admin/media?folder=${encodeURIComponent(path)}`, { headers: AUTH() })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setUploadMsg('Error cargando archivos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(folder) }, [folder])

  const navigate = (name) => {
    setFolder((f) => f ? `${f}/${name}` : name)
  }

  const breadcrumbs = folder ? folder.split('/') : []

  const upload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    try {
      const form = new FormData()
      form.append('folder', folder)
      form.append('file', file)
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: AUTH(),
        body: form,
      })
      if (!res.ok) throw new Error()
      setUploadMsg('Archivo subido correctamente')
      if (fileRef.current) fileRef.current.value = ''
      load(folder)
    } catch {
      setUploadMsg('Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (item) => {
    const path = folder ? `${folder}/${item.name}` : item.name
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/media/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
        headers: AUTH(),
      })
      if (!res.ok) throw new Error()
      load(folder)
    } catch {
      setUploadMsg('Error al eliminar el archivo')
    }
  }

  const mediaUrl = (item) => {
    const path = folder ? `${folder}/${item.name}` : item.name
    return `/media/${path}`
  }

  return (
    <div>
      <div className="admin-head">
        <h2>Archivos multimedia</h2>
      </div>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem' }}
          onClick={() => setFolder('')}
        >
          Raíz
        </button>
        {breadcrumbs.map((part, i) => {
          const path = breadcrumbs.slice(0, i + 1).join('/')
          return (
            <span key={path} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="tag-dim">/</span>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem' }}
                onClick={() => setFolder(path)}
              >
                {part}
              </button>
            </span>
          )
        })}
      </div>

      {/* Upload */}
      <div className="card card-body" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" />
        <button className="btn btn-primary" onClick={upload} disabled={uploading}>
          {uploading ? 'Subiendo…' : 'Subir archivo'}
        </button>
        {uploadMsg && <span className="tag-dim">{uploadMsg}</span>}
      </div>

      {/* Grid */}
      {loading ? (
        <p className="tag-dim">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="tag-dim">Carpeta vacía</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem',
        }}>
          {items.map((item) => (
            <div
              key={item.name}
              className="card"
              style={{ position: 'relative', cursor: item.type === 'folder' ? 'pointer' : 'default' }}
              onClick={() => item.type === 'folder' ? navigate(item.name) : setSelectedMeta(item)}
            >
              {/* Delete button (only for files) */}
              {item.type !== 'folder' && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFile(item) }}
                  style={{
                    position: 'absolute', top: '0.4rem', right: '0.4rem', zIndex: 2,
                    background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                    borderRadius: '50%', width: 24, height: 24, cursor: 'pointer',
                    fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Eliminar"
                >
                  ✕
                </button>
              )}

              {/* Preview */}
              <div style={{
                height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--surface-2)', overflow: 'hidden',
                color: 'var(--text-dim)',
              }}>
                {item.type === 'folder' ? (
                  <FolderIcon />
                ) : isImage(item.name) ? (
                  <img
                    src={mediaUrl(item)}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <FileIcon />
                )}
              </div>

              <div style={{ padding: '0.5rem 0.6rem' }}>
                <p style={{
                  fontSize: '0.8rem', fontWeight: 600, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={item.name}>
                  {item.name}
                </p>
                {item.size != null && (
                  <p className="tag-dim" style={{ fontSize: '0.72rem', margin: '0.15rem 0 0' }}>
                    {formatSize(item.size)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metadata modal */}
      {selectedMeta && (
        <MetadataModal
          item={selectedMeta}
          folder={folder}
          onClose={() => setSelectedMeta(null)}
        />
      )}
    </div>
  )
}
