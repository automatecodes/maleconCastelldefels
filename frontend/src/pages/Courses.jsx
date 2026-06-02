import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCourses } from '../api/client'
import Reveal from '../components/Reveal'
import CourseCard from '../components/CourseCard'
import DetailModal from '../components/DetailModal'
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
        <DetailModal
          onClose={() => setSelected(null)}
          mainImage={selected.image_url}
          accentColor={selected.calendar_color}
          videoUrl={selected.video_url}
          extraImages={selected.extra_images}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span className="badge">{selected.level}</span>
            {selected.style && <span className="tag-dim">{selected.style}</span>}
            {selected.room  && <span className="tag-dim">📍 {selected.room}</span>}
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>{selected.name}</h3>
          <p className="tag-dim" style={{ lineHeight: 1.55, marginBottom: '0.75rem' }}>{selected.description}</p>
          {selected.teachers?.length > 0 && (
            <p className="tag-dim"><strong>{t('common.teachers')}:</strong> {selected.teachers.map((x) => x.full_name).join(', ')}</p>
          )}
          {selected.duration && (
            <p className="tag-dim"><strong>{t('common.duration')}:</strong> {selected.duration}</p>
          )}
          <div className="price-row" style={{ marginTop: '0.75rem' }}>
            <span className="price-big">{Number(selected.price)}€{t('common.perMonth')}</span>
            <span className="tag-dim">{t('common.trial')}: {Number(selected.trial_price)}€</span>
          </div>
          <a className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}
            href={whatsappLink(`Hola, me interesa el curso ${selected.name} ${selected.level}`)}
            target="_blank" rel="noreferrer">{t('common.writeUs')}</a>
        </DetailModal>
      )}
    </div>
  )
}
