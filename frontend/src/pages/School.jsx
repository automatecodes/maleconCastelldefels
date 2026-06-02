import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTeachers } from '../api/client'
import Reveal from '../components/Reveal'
import Carousel from '../components/Carousel'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'

const FACILITY_IMAGES = [
  '/media/escuela/instalacion1.jpg',
  '/media/escuela/instalacion2.jpg',
  '/media/escuela/instalacion3.jpg',
]

export default function School() {
  const { t } = useTranslation()
  const [teachers, setTeachers] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => { getTeachers().then(setTeachers).catch(() => {}) }, [])

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('school.title')}</h2>
        <p className="section-sub">{t('school.subtitle')}</p>
      </Reveal>

      {/* Historia y filosofía */}
      <Reveal>
        <div className="grid grid-2" style={{ alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>{t('school.history')}</h3>
            <p className="tag-dim">{t('school.historyText')}</p>
          </div>
          <video className="modal-img" controls poster="/media/escuela/institucional-poster.jpg"
            onError={(e) => { e.target.style.display = 'none' }}>
            <source src="/media/escuela/institucional.mp4" type="video/mp4" />
          </video>
        </div>
      </Reveal>

      {/* Profesores: fichas */}
      <Reveal className="subsection">
        <h3 style={{ marginBottom: '0.5rem' }}>{t('school.teachers')}</h3>
        <p className="section-sub">{t('school.teachersSub')}</p>

        <div className="grid grid-4">
          {teachers.map((tch) => (
            <div key={tch.id} className="card teacher-card" onClick={() => setSelected(tch)}
              style={{ cursor: 'pointer' }}>
              <img className="teacher-photo" src={tch.photo_url} alt={tch.full_name}
                style={{ objectPosition: tch.photo_focal || '50% 50%' }}
                onError={(e) => { e.target.style.opacity = 0.2 }} />
              <div className="card-body">
                <h4>{tch.full_name}</h4>
                <p className="tag-dim">{tch.specialties}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Instalaciones */}
      <Reveal>
        <h3 style={{ marginBottom: '0.5rem' }}>{t('school.facilities')}</h3>
        <p className="section-sub">{t('school.facilitiesSub')}</p>
        <Carousel images={FACILITY_IMAGES} onImageClick={setLightbox} />
      </Reveal>

      {lightbox && (
        <Modal onClose={() => setLightbox(null)} large>
          <div className="modal-content"><img className="modal-img" src={lightbox} alt="" /></div>
        </Modal>
      )}

      {selected && (
        <DetailModal
          onClose={() => setSelected(null)}
          mainImage={selected.photo_url}
          mainImageFocal={selected.photo_focal}
          videoUrl={selected.video_url}
          extraImages={selected.extra_images}
        >
          <h3 style={{ marginBottom: '0.25rem' }}>{selected.full_name}</h3>
          {selected.specialties && (
            <p className="badge" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>{selected.specialties}</p>
          )}
          {selected.bio && <p className="tag-dim" style={{ lineHeight: 1.6 }}>{selected.bio}</p>}
          {selected.cv_pdf_url && (
            <a className="btn btn-ghost" style={{ marginTop: '1rem', display: 'inline-flex' }}
              href={selected.cv_pdf_url} target="_blank" rel="noreferrer">
              {t('common.viewCv')}
            </a>
          )}
        </DetailModal>
      )}
    </div>
  )
}
