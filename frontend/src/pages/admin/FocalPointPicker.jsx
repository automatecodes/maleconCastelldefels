/**
 * FocalPointPicker — selecciona el punto focal de una imagen para object-position.
 *
 * Props:
 *   imageSrc  string          URL de la imagen a mostrar
 *   value     string          CSS object-position, ej "40% 30%" (default "50% 50%")
 *   onChange  (str) => void   callback con el nuevo valor CSS
 */
import { useRef } from 'react'

function parse(v = '50% 50%') {
  const parts = (v || '50% 50%').trim().split(/\s+/)
  const x = parseFloat(parts[0]) || 50
  const y = parseFloat(parts[1] ?? parts[0]) || 50
  return { x, y }
}

export default function FocalPointPicker({ imageSrc, value = '50% 50%', onChange }) {
  const containerRef = useRef(null)
  const { x, y } = parse(value)

  const handleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const nx = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const ny = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    onChange(`${nx}% ${ny}%`)
  }

  // También permite arrastrar
  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return
    handleClick(e)
  }

  if (!imageSrc) return null

  return (
    <div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
        📍 Punto focal — haz clic en la imagen para indicar el centro de atención
      </p>

      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          overflow: 'hidden',
          borderRadius: 8,
          border: '1px solid var(--border)',
          cursor: 'crosshair',
          userSelect: 'none',
          background: 'var(--surface-2)',
        }}
      >
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: value || '50% 50%',
            pointerEvents: 'none',
            display: 'block',
          }}
          onError={(e) => { e.target.style.opacity = 0.2 }}
        />

        {/* Marcador del punto focal */}
        <div
          style={{
            position: 'absolute',
            left: `${x}%`,
            top:  `${y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            width: 24, height: 24,
            borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.4)',
            background: 'rgba(255,255,255,0.25)',
          }}
        />

        {/* Cruz en el marcador */}
        <div style={{
          position: 'absolute',
          left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          width: 2, height: 14,
          background: '#fff',
          boxShadow: '0 0 3px rgba(0,0,0,0.8)',
          marginLeft: -1,
        }} />
        <div style={{
          position: 'absolute',
          left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          width: 14, height: 2,
          background: '#fff',
          boxShadow: '0 0 3px rgba(0,0,0,0.8)',
          marginTop: -1,
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
        <span className="tag-dim" style={{ fontSize: '0.78rem' }}>
          {value || '50% 50%'}
        </span>
        <button type="button" className="btn btn-ghost"
          style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}
          onClick={() => onChange('50% 50%')}>
          Centrar
        </button>
        <button type="button" className="btn btn-ghost"
          style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}
          onClick={() => onChange('50% 20%')}>
          Arriba
        </button>
        <button type="button" className="btn btn-ghost"
          style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}
          onClick={() => onChange('50% 80%')}>
          Abajo
        </button>
      </div>
    </div>
  )
}
