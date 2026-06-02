/**
 * MultiMediaPicker — selector de múltiples imágenes/vídeos extra.
 * Guarda como JSON string: '["url1","url2",...]'
 *
 * Props:
 *   value     string   JSON string con array de URLs (o '' / null)
 *   onChange  fn       callback con el nuevo JSON string
 *   accept    string   'image' | 'video' | 'any'
 *   label     string
 */
import { useState } from 'react'
import MediaPicker from './MediaPicker'

function parse(v) {
  if (!v) return []
  try { return JSON.parse(v) } catch { return [] }
}

export default function MultiMediaPicker({ value, onChange, accept = 'image', label }) {
  const urls = parse(value)
  const [adding, setAdding] = useState(false)

  const update = (arr) => onChange(arr.length ? JSON.stringify(arr) : '')

  const add = (url) => { if (url) update([...urls, url]); setAdding(false) }
  const remove = (i) => update(urls.filter((_, idx) => idx !== i))
  const move = (from, to) => {
    const arr = [...urls]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    update(arr)
  }

  const isImg = (u) => /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(u)
  const isVid = (u) => /\.(mp4|webm|mov)$/i.test(u)

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
          {label}
        </label>
      )}

      {/* Grid de miniaturas actuales */}
      {urls.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {urls.map((url, i) => (
            <div key={i} style={{
              position: 'relative', width: 72, height: 72,
              borderRadius: 8, overflow: 'hidden',
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              flexShrink: 0,
            }}>
              {isImg(url) ? (
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.opacity = 0.2 }} />
              ) : isVid(url) ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>🎬</span>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                </div>
              )}
              {/* Botón eliminar */}
              <button type="button" onClick={() => remove(i)}
                style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                  borderRadius: '50%', width: 18, height: 18, cursor: 'pointer',
                  fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Quitar">✕</button>
              {/* Botones mover */}
              {i > 0 && (
                <button type="button" onClick={() => move(i, i - 1)}
                  style={{
                    position: 'absolute', bottom: 2, left: 2,
                    background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                    borderRadius: 4, padding: '1px 4px', cursor: 'pointer', fontSize: '0.65rem',
                  }}
                  title="Mover izquierda">←</button>
              )}
              {i < urls.length - 1 && (
                <button type="button" onClick={() => move(i, i + 1)}
                  style={{
                    position: 'absolute', bottom: 2, right: 2,
                    background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
                    borderRadius: 4, padding: '1px 4px', cursor: 'pointer', fontSize: '0.65rem',
                  }}
                  title="Mover derecha">→</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Añadir nueva imagen */}
      {adding ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', background: 'var(--surface-2)' }}>
          <MediaPicker value="" onChange={add} accept={accept} label="Selecciona o sube un archivo" />
          <button type="button" className="btn btn-ghost"
            style={{ marginTop: '0.5rem', padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setAdding(false)}>Cancelar</button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost"
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.82rem' }}
          onClick={() => setAdding(true)}>
          + Añadir {accept === 'video' ? 'vídeo' : 'imagen'}
        </button>
      )}
    </div>
  )
}
