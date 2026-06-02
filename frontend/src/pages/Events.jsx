import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getEvents, getSocial } from '../api/client'
import Reveal from '../components/Reveal'
import Modal from '../components/Modal'
import SocialFeed from '../components/SocialFeed'
import { whatsappLink } from '../components/WhatsAppButton'

export default function Events() {
  const { t } = useTranslation()
  const [events, setEvents] = useState([])
  const [social, setSocial] = useState([])
  const [selected, setSelected] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    getEvents().then(setEvents).catch(() => {})
    getSocial().then(setSocial).catch(() => {})
  }, [])

  const upcoming = events.filter((e) => e.computed_status === 'próximo')
  const past = events.filter((e) => e.computed_status === 'histórico')
  const galleryPhotos = past.flatMap((e) => e.photos).concat(
    upcoming.flatMap((e) => e.photos) // muestra galerías de ediciones anteriores también
  )

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('events.title')}</h2>
        <p className="section-sub">{t('events.subtitle')}</p>
      </Reveal>

      {/* Próximos eventos */}
      <Reveal>
        <h3 style={{ marginBottom: '1rem' }}>{t('events.upcoming')}</h3>
        <div className="grid grid-2">
          {upcoming.map((e) => (
            <div key={e.id} className="card" onClick={() => setSelected(e)} style={{ cursor: 'pointer' }}>
              <div className="media-top">
                <img src={e.image_url} alt={e.name} onError={(ev) => { ev.target.style.opacity = 0.15 }} />
              </div>
              <div className="card-body">
                <span className="badge">{e.date} · {e.time_range}</span>
                <h3 style={{ margin: '0.5rem 0' }}>{e.name}</h3>
                <p className="tag-dim">{e.subtitle}</p>
                <p className="tag-dim">📍 {e.location}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Galería histórica */}
      {galleryPhotos.length > 0 && (
        <Reveal className="section">
          <h3 style={{ marginBottom: '1rem' }}>{t('events.gallery')}</h3>
          <div className="collage">
            {galleryPhotos.map((p) => (
              <img key={p.id} src={p.url} alt={p.caption || ''} onClick={() => setLightbox(p.url)}
                onError={(e) => { e.target.style.opacity = 0.2 }} />
            ))}
          </div>
        </Reveal>
      )}

      {/* Noticias: feed de redes */}
      {social.length > 0 && (
        <Reveal className="section">
          <h3 style={{ marginBottom: '0.5rem' }}>{t('events.news')}</h3>
          <p className="section-sub">{t('events.newsSub')}</p>
          <SocialFeed posts={social} />
        </Reveal>
      )}

      {selected && (
        <Modal onClose={() => setSelected(null)} large>
          <div className="modal-content">
            <img className="modal-img" src={selected.image_url} alt={selected.name}
              onError={(e) => { e.target.style.opacity = 0.15 }} />
            <span className="badge">{selected.date} · {selected.time_range}</span>
            <h3 style={{ margin: '0.5rem 0' }}>{selected.name}</h3>
            <p className="accent">{selected.subtitle}</p>
            <p className="tag-dim" style={{ margin: '0.75rem 0' }}>{selected.description}</p>
            <p className="tag-dim"><strong>{t('events.where')}:</strong> {selected.location}</p>
            {selected.price && <p className="tag-dim"><strong>{t('common.price')}:</strong> {Number(selected.price)}€</p>}
            {selected.artists && <p className="tag-dim"><strong>DJ / Artistas:</strong> {selected.artists}</p>}
            {selected.activities && (
              <>
                <p style={{ marginTop: '0.75rem' }}><strong>{t('events.activities')}:</strong></p>
                <ul className="tag-dim" style={{ paddingLeft: '1.25rem' }}>
                  {selected.activities.split('\n').map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </>
            )}
            <a className="btn btn-primary" style={{ marginTop: '1.25rem' }}
              href={whatsappLink(`Hola, quiero info sobre ${selected.name}`)}
              target="_blank" rel="noreferrer">{t('common.writeUs')}</a>
          </div>
        </Modal>
      )}

      {lightbox && (
        <Modal onClose={() => setLightbox(null)} large>
          <div className="modal-content"><img className="modal-img" src={lightbox} alt="" /></div>
        </Modal>
      )}
    </div>
  )
}
