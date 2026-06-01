import { useTranslation } from 'react-i18next'

export default function CourseCard({ course, onClick }) {
  const { t } = useTranslation()
  return (
    <div className="card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="color-bar" style={{ background: course.calendar_color }} />
      <div className="media-top">
        <img src={course.image_url} alt={course.name}
          onError={(e) => { e.target.style.opacity = 0.15 }} />
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className="badge">{course.level}</span>
          {course.style && <span className="tag-dim">{course.style}</span>}
        </div>
        <h3>{course.name}</h3>
        <p className="tag-dim" style={{ minHeight: '3em' }}>
          {(course.description || '').slice(0, 90)}…
        </p>
        <div className="price-row">
          <span className="price-big">{Number(course.price)}€<span className="tag-dim" style={{ fontSize: '0.8rem' }}>{t('common.perMonth')}</span></span>
          <span className="tag-dim">{t('common.trial')}: {Number(course.trial_price)}€</span>
        </div>
      </div>
    </div>
  )
}
