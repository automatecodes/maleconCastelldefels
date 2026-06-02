/**
 * DetailModal — modal de detalle con layout:
 *   [Izquierda: título + info + vídeo + galería miniaturas]
 *   [Derecha: imagen principal grande]
 *
 * Props:
 *   onClose        fn
 *   mainImage      string  URL imagen principal
 *   mainImageFocal string  CSS object-position (default '50% 50%')
 *   accentColor    string  color de la barra de acento
 *   extraImages    string  JSON array de URLs adicionales
 *   videoUrl       string  URL del vídeo
 *   children       ReactNode  contenido de la columna izquierda
 */
import { useState } from 'react'
import Modal from './Modal'

function parse(v) {
  if (!v) return []
  try { return JSON.parse(v) } catch { return [] }
}

function isVideo(url = '') { return /\.(mp4|webm|mov)$/i.test(url) }
function isImage(url = '') { return /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(url) }

export default function DetailModal({
  onClose,
  mainImage,
  mainImageFocal = '50% 50%',
  accentColor,
  extraImages,
  videoUrl,
  children,
}) {
  const extras = parse(extraImages)
  const allImages = [...(mainImage ? [mainImage] : []), ...extras.filter(isImage)]
  const [lightbox, setLightbox] = useState(null)
  const [activeImg, setActiveImg] = useState(mainImage || null)

  const displayImg = activeImg || mainImage

  return (
    <>
      <Modal onClose={onClose} large>
        <div className="detail-modal">
          {/* Franja de color */}
          {accentColor && (
            <div style={{ height: 3, background: accentColor, borderRadius: '3px 3px 0 0', marginBottom: '0.1rem' }} />
          )}

          <div className="detail-modal-grid">
            {/* ── Columna izquierda: info ── */}
            <div className="detail-modal-info">
              {children}

              {/* Vídeo */}
              {videoUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>🎬 Vídeo</p>
                  <video controls style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 220 }}>
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                </div>
              )}

              {/* Miniaturas de galería */}
              {allImages.length > 1 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>📷 Galería</p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {allImages.map((url, i) => (
                      <div key={i}
                        onClick={() => { setActiveImg(url); setLightbox(url) }}
                        style={{
                          width: 56, height: 56, borderRadius: 6, overflow: 'hidden',
                          cursor: 'pointer', flexShrink: 0,
                          border: url === displayImg
                            ? `2px solid ${accentColor || 'var(--green)'}`
                            : '1px solid var(--border)',
                          transition: 'border-color 0.15s',
                        }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.opacity = 0.2 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Columna derecha: imagen principal ── */}
            {displayImg && (
              <div className="detail-modal-image" onClick={() => setLightbox(displayImg)}>
                <img
                  src={displayImg}
                  alt=""
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: mainImageFocal,
                    display: 'block', cursor: 'zoom-in',
                    borderRadius: 10,
                  }}
                  onError={(e) => { e.target.style.opacity = 0.15 }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, cursor: 'zoom-out', padding: '1rem',
          }}>
          <img src={lightbox} alt=""
            style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: '1rem', right: '1.25rem',
              background: 'none', border: 'none', color: '#fff',
              fontSize: '1.8rem', cursor: 'pointer', lineHeight: 1,
            }}>✕</button>
          {allImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: '1rem', display: 'flex', gap: '0.4rem' }}>
              {allImages.map((url, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); setLightbox(url) }}
                  style={{
                    width: 44, height: 44, borderRadius: 5, overflow: 'hidden', cursor: 'pointer',
                    border: url === lightbox ? '2px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                  }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
