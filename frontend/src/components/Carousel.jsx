import { useState, useEffect } from 'react'

// Carrusel en recuadro fijo con autoplay suave + clic para lightbox (§3.2).
export default function Carousel({ images = [], onImageClick, interval = 4000 }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setI((p) => (p + 1) % images.length), interval)
    return () => clearInterval(id)
  }, [images.length, interval])

  if (!images.length) return null
  return (
    <div className="carousel">
      <div className="carousel-frame">
        {images.map((src, idx) => (
          <img key={idx} src={src} alt={`Instalación ${idx + 1}`}
            className={idx === i ? 'carousel-img active' : 'carousel-img'}
            onClick={() => onImageClick && onImageClick(src)}
            onError={(e) => { e.target.style.opacity = 0.15 }} />
        ))}
      </div>
      <div className="carousel-dots">
        {images.map((_, idx) => (
          <button key={idx} className={idx === i ? 'dot active' : 'dot'}
            onClick={() => setI(idx)} aria-label={`Imagen ${idx + 1}`} />
        ))}
      </div>
    </div>
  )
}
