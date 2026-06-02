/**
 * MediaPicker — selector de archivos de la mediateca.
 * Muestra preview + input de URL + botón "Explorar" que abre el explorador.
 *
 * Props:
 *   value      string          URL actual
 *   onChange   (url) => void   callback al seleccionar
 *   accept     'image'|'video'|'any'   filtra qué tipos se muestran (default 'any')
 *   label      string          etiqueta (opcional, para usarlo standalone)
 */
import { useEffect, useRef, useState } from 'react'

const TOKEN = () => localStorage.getItem('token')
const AUTH  = () => ({ Authorization: `Bearer ${TOKEN()}` })

function isImage(name = '') { return /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(name) }
function isVideo(name = '') { return /\.(mp4|webm|mov)$/i.test(name) }
function isPdf(name = '')   { return /\.pdf$/i.test(name) }

function fileType(name = '') {
  if (isImage(name)) return 'image'
  if (isVideo(name)) return 'video'
  if (isPdf(name))   return 'pdf'
  return 'other'
}

function matchAccept(name, accept) {
  if (!accept || accept === 'any') return true
  const t = fileType(name)
  if (accept === 'image') return t === 'image'
  if (accept === 'video') return t === 'video'
  if (accept === 'pdf')   return t === 'pdf'
  return true
}

// ── Mini explorador de media ──────────────────────────────────────────────────
function MediaBrowser({ accept, onSelect, onClose }) {
  const [folder, setFolder]   = useState('')
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef(null)

  const load = (path) => {
    setLoading(true)
    setUploadMsg('')
    fetch(`/api/admin/media/list?folder=${encodeURIComponent(path)}`, { headers: AUTH() })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(folder) }, [folder])

  const navigate = (name) => setFolder((f) => f ? `${f}/${name}` : name)
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
        method: 'POST', headers: AUTH(), body: form,
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (fileRef.current) fileRef.current.value = ''
      load(folder)
      // auto-seleccionar el archivo recién subido
      if (data.url && matchAccept(data.url, accept)) onSelect(data.url)
      else setUploadMsg('Subido. Selecciónalo en la lista.')
    } catch {
      setUploadMsg('Error al subir')
    } finally {
      setUploading(false)
    }
  }

  const visibleItems = items.filter((item) =>
    item.type === 'folder' || matchAccept(item.name, accept)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button className="btn btn-ghost" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
          onClick={() => setFolder('')}>Raíz</button>
        {breadcrumbs.map((part, i) => {
          const path = breadcrumbs.slice(0, i + 1).join('/')
          return (
            <span key={path} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="tag-dim">/</span>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => setFolder(path)}>{part}</button>
            </span>
          )
        })}
      </div>

      {/* Upload */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" style={{ fontSize: '0.82rem', flex: 1, minWidth: 0 }} />
        <button className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          onClick={upload} disabled={uploading}>
          {uploading ? 'Subiendo…' : '↑ Subir'}
        </button>
        {uploadMsg && <span className="tag-dim" style={{ fontSize: '0.8rem' }}>{uploadMsg}</span>}
      </div>

      {/* Grid de archivos */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <p className="tag-dim" style={{ padding: '0.5rem' }}>Cargando…</p>
        ) : visibleItems.length === 0 ? (
          <p className="tag-dim" style={{ padding: '0.5rem' }}>Carpeta vacía</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
            {visibleItems.map((item) => (
              <div key={item.name}
                onClick={() => item.type === 'folder' ? navigate(item.name) : onSelect(item.url)}
                style={{
                  cursor: 'pointer', borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface)', overflow: 'hidden' }}>
                  {item.type === 'folder' ? (
                    <span style={{ fontSize: '2rem' }}>📁</span>
                  ) : isImage(item.name) ? (
                    <img src={item.url} alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none' }} />
                  ) : isVideo(item.name) ? (
                    <span style={{ fontSize: '2rem' }}>🎬</span>
                  ) : (
                    <span style={{ fontSize: '2rem' }}>📄</span>
                  )}
                </div>
                <div style={{ padding: '0.25rem 0.35rem' }}>
                  <p style={{ fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', margin: 0 }} title={item.name}>
                    {item.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── MediaPicker principal ─────────────────────────────────────────────────────
export default function MediaPicker({ value = '', onChange, accept = 'any', label }) {
  const [open, setOpen] = useState(false)

  const handleSelect = (url) => {
    onChange(url)
    setOpen(false)
  }

  const isImg = isImage(value)
  const isVid = isVideo(value)

  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>{label}</label>}

      {/* Preview */}
      {value && (
        <div style={{ marginBottom: '0.4rem', borderRadius: 8, overflow: 'hidden',
          border: '1px solid var(--border)', background: 'var(--surface-2)',
          maxHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isImg ? (
            <img src={value} alt="" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none' }} />
          ) : isVid ? (
            <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎬</span>
              <span className="tag-dim" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{value.split('/').pop()}</span>
            </div>
          ) : (
            <div style={{ padding: '0.5rem' }}>
              <span className="tag-dim" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{value}</span>
            </div>
          )}
        </div>
      )}

      {/* Input URL + botones */}
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/media/…"
          style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.7rem' }}
        />
        <button type="button" className="btn btn-ghost"
          style={{ padding: '0.4rem 0.7rem', fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={() => setOpen(true)}>
          🗂 Explorar
        </button>
        {value && (
          <button type="button" className="btn btn-ghost"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem', flexShrink: 0, color: '#ef4444', borderColor: '#ef4444' }}
            onClick={() => onChange('')} title="Quitar">
            ✕
          </button>
        )}
      </div>

      {/* Modal explorador */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal modal-lg" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem 0.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>🗂 Explorador de media</h3>
              <button className="btn btn-ghost" style={{ padding: '0.3rem 0.7rem' }}
                onClick={() => setOpen(false)}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              <MediaBrowser accept={accept} onSelect={handleSelect} onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
