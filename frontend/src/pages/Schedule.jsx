import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCourses, getSchedule } from '../api/client'
import Reveal from '../components/Reveal'
import Modal from '../components/Modal'
import { whatsappLink } from '../components/WhatsAppButton'

export default function Schedule() {
  const { t } = useTranslation()
  const weekdays = t('schedule.weekdays', { returnObjects: true })
  const [view, setView] = useState('weekly')
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [filters, setFilters] = useState({ course: '', level: '', teacher: '' })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getCourses().then(setCourses).catch(() => {})
    getSchedule().then(setSessions).catch(() => {})
  }, [])

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  const levels = [...new Set(courses.map((c) => c.level).filter(Boolean))]
  const teachers = useMemo(() => {
    const map = {}
    courses.forEach((c) => c.teachers.forEach((t) => { map[t.id] = t.full_name }))
    return map
  }, [courses])

  const visibleSessions = sessions.filter((s) => {
    const c = courseById[s.course_id]
    if (!c) return false
    if (filters.course && String(c.id) !== filters.course) return false
    if (filters.level && c.level !== filters.level) return false
    if (filters.teacher && !c.teachers.some((t) => String(t.id) === filters.teacher)) return false
    return true
  })

  // Celda muestra solo nombre + nivel (§3.4)
  const cellLabel = (c) => `${c.name} · ${c.level}`

  const openDetail = (session) => {
    const c = courseById[session.course_id]
    setSelected({ session, course: c })
  }

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('schedule.title')}</h2>
        <p className="section-sub">{t('schedule.subtitle')}</p>
      </Reveal>

      <div className="cal-tabs">
        <button className={view === 'weekly' ? 'cal-tab active' : 'cal-tab'} onClick={() => setView('weekly')}>{t('schedule.weekly')}</button>
        <button className={view === 'monthly' ? 'cal-tab active' : 'cal-tab'} onClick={() => setView('monthly')}>{t('schedule.monthly')}</button>
      </div>

      {/* Filtros */}
      <div className="cal-filters">
        <select value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })}>
          <option value="">{t('schedule.byCourse')}: {t('common.all')}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name} {c.level}</option>)}
        </select>
        <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
          <option value="">{t('schedule.byLevel')}: {t('common.all')}</option>
          {levels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filters.teacher} onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}>
          <option value="">{t('schedule.byTeacher')}: {t('common.all')}</option>
          {Object.entries(teachers).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>

      {view === 'weekly' ? (
        <div className="week-grid">
          {weekdays.map((day, idx) => (
            <div key={idx} className="week-col">
              <div className="week-day">{day.slice(0, 3)}</div>
              {visibleSessions.filter((s) => s.weekday === idx)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((s) => {
                  const c = courseById[s.course_id]
                  return (
                    <div key={s.id} className="cal-cell" style={{ background: c.calendar_color }}
                      onClick={() => openDetail(s)}>
                      <div className="cell-time">{s.start_time}–{s.end_time}</div>
                      {cellLabel(c)}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      ) : (
        <MonthView sessions={visibleSessions} courseById={courseById} onSelect={openDetail} weekdays={weekdays} cellLabel={cellLabel} />
      )}

      {/* Tabla de precios y bonos */}
      <Reveal className="section">
        <h3>{t('schedule.prices')}</h3>
        <div className="price-table">
          <table>
            <thead>
              <tr><th>{t('common.level')}</th><th>{t('schedule.monthlyFee')}</th><th>{t('schedule.trialClass')}</th></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><span style={{ color: c.calendar_color }}>●</span> {c.name} {c.level}</td>
                  <td>{Number(c.price)}€{t('common.perMonth')}</td>
                  <td>{Number(c.trial_price)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {selected && (
        <Modal onClose={() => setSelected(null)} large>
          <div className="modal-content">
            <div className="color-bar" style={{ background: selected.course.calendar_color, marginBottom: '1rem' }} />
            <img className="modal-img" src={selected.course.image_url} alt={selected.course.name}
              onError={(e) => { e.target.style.opacity = 0.15 }} />
            <h3>{selected.course.name} · {selected.course.level}</h3>
            <p className="tag-dim" style={{ margin: '0.5rem 0' }}>{selected.course.description}</p>
            <ul className="tag-dim" style={{ listStyle: 'none' }}>
              <li><strong>{t('common.teacher')}:</strong> {selected.course.teachers.map((x) => x.full_name).join(', ')}</li>
              <li><strong>{weekdays[selected.session.weekday]}:</strong> {selected.session.start_time}–{selected.session.end_time}</li>
              <li><strong>{t('common.room')}:</strong> {selected.session.room || selected.course.room}</li>
              <li><strong>{t('common.duration')}:</strong> {selected.course.duration}</li>
              <li><strong>{t('common.price')}:</strong> {Number(selected.course.price)}€{t('common.perMonth')}</li>
            </ul>
            <a className="btn btn-primary" style={{ marginTop: '1rem' }}
              href={whatsappLink(`Hola, quiero apuntarme a ${selected.course.name} ${selected.course.level}`)}
              target="_blank" rel="noreferrer">{t('common.writeUs')}</a>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Vista mensual simple del mes actual con las clases recurrentes marcadas por día de semana.
function MonthView({ sessions, courseById, onSelect, weekdays, cellLabel }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // lunes=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="month-grid" style={{ marginBottom: '0.4rem' }}>
        {weekdays.map((d) => <div key={d} className="week-day">{d.slice(0, 3)}</div>)}
      </div>
      <div className="month-grid">
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} />
          const weekday = (new Date(year, month, d).getDay() + 6) % 7
          const daySessions = sessions.filter((s) => s.weekday === weekday)
          return (
            <div key={idx} className="month-cell">
              <div className="month-num">{d}</div>
              {daySessions.map((s) => {
                const c = courseById[s.course_id]
                return (
                  <div key={s.id} className="month-dot" style={{ background: c.calendar_color }}
                    onClick={() => onSelect(s)} title={cellLabel(c)}>
                    {c.name}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
