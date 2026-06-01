import { useState } from 'react'

// Botón para generar la imagen del registro con IA (o placeholder de marca).
export default function AiImageButton({ onGenerate, reload }) {
  const [loading, setLoading] = useState(false)
  const run = async () => {
    setLoading(true)
    try {
      const res = await onGenerate()
      reload && reload()
      if (res?.fallback) {
        alert('Imagen placeholder generada (sin proveedor de IA configurado en .env).')
      }
    } catch {
      alert('No se pudo generar la imagen.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <button className="link-btn" onClick={run} disabled={loading}
      title="Generar imagen con IA">
      {loading ? '⏳' : '✨'}
    </button>
  )
}
