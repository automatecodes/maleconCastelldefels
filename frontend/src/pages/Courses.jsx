import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCourses } from '../api/client'
import Reveal from '../components/Reveal'
import CourseCard from '../components/CourseCard'
import Modal from '../components/Modal'
import { whatsappLink } from '../components/WhatsAppButton'

export default function Courses() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => { getCourses().then(setCourses).catch(() => {}) }, [])

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('courses.title')}</h2>
        <p className="section-sub">{t('courses.subtitle')} · {t('courses.noPartnerNote')}</p>
      </Reveal>
      <div className="grid grid-3">
        {courses.map((c) => (
          <Reveal key={c.id}><CourseCard course={c} onClick={() => setSelected(c)} /></Reveal>
        ))}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} large>
          <div className="modal-content">
            <div className="color-bar" style={{ background: selected.calendar_color, marginBottom: '1rem' }} />
            <img className="modal-img" src={selected.image_url} alt={selected.name}
              onError={(e) => { e.target.style.opacity = 0.15 }} />
            <div className="card-meta">
              <span className="badge">{selected.level}</span>
              <span className="tag-dim">{selected.style}</span>
              <span className="tag-dim">{selected.room}</span>
            </div>
            <h3>{selected.name}</h3>
            <p className="tag-dim" style={{ margin: '0.75rem 0' }}>{selected.description}</p>
            {selected.video_url && (
              <video className="modal-img" controls>
                <source src={selected.video_url} type="video/mp4" />
              </video>
            )}
            <p className="tag-dim"><strong>{t('common.teachers')}:</strong> {selected.teachers.map((x) => x.full_name).join(', ')}</p>
            <p className="tag-dim"><strong>{t('common.duration')}:</strong> {selected.duration}</p>
            <div className="price-row">
              <span className="price-big">{Number(selected.price)}€{t('common.perMonth')}</span>
              <span className="tag-dim">{t('common.trial')}: {Number(selected.trial_price)}€</span>
            </div>
            <a className="btn btn-primary" style={{ marginTop: '1.25rem' }}
              href={whatsappLink(`Hola, me interesa el curso ${selected.name} ${selected.level}`)}
              target="_blank" rel="noreferrer">{t('common.writeUs')}</a>
          </div>
        </Modal>
      )}
    </div>
  )
}
