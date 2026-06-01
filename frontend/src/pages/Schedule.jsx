import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCourses, getSchedule } from '../api/client'
import Reveal from '../components/Reveal'
import Modal from '../components/Modal'
import { whatsappLink } from '../components/WhatsAppButton'

const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function startOfWeek(date) {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7 // 0=Mon
  d.setDate(d.getDate() - dow); d.setHours(0, 0, 0, 0); return d
}
function fmt(date) {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function Schedule() {
  const { t } = useTranslation()
  const [view, setView] = useState('semanal')   // semanal | 30 | 60
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [monthOffset, setMonthOffset] = useState(0)
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [filters, setFilters] = useState({ course: '', teacher: '' })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getCourses().then(setCourses).catch(() => {})
    getSchedule().then(setSessions).catch(() => {})
  }, [])

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  const teacherMap = useMemo(() => {
    const m = {}
    courses.forEach((c) => c.teachers?.forEach((tc) => { m[tc.id] = tc }))
    return m
  }, [courses])

  const visibleSessions = sessions.filter((s) => {
    const c = courseById[s.course_id]
    if (!c) return false
    if (filters.course && String(c.id) !== filters.course) return false
    if (filters.teacher && !c.teachers?.some((tc) => String(tc.id) === filters.teacher)) return false
    return true
  })

  const openDetail = (session) => setSelected({ session, course: courseById[session.course_id] })

  // ── Celda con miniatura del profesor ───────────────────────────────────────
  function SessionCell({ session, course }) {
    const teacher = course.teachers?.[0]
    return (
      <div className="cal-cell" style={{ background: course.calendar_color }}
        onClick={() => openDetail(session)}>
        <div className="cell-time">{session.start_time}–{session.end_time}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
          {teacher?.photo_url && (
            <img src={teacher.photo_url} alt={teacher.full_name}
              style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.4)' }}
              onError={(e) => { e.target.style.display = 'none' }} />
          )}
          <span style={{ fontSize: '0.72rem', lineHeight: 1.2 }}>{course.name}</span>
        </div>
      </div>
    )
  }

  // ── Vista semanal ──────────────────────────────────────────────────────────
  function WeekView() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem' }}
            onClick={() => setWeekStart(addDays(weekStart, -7))}>‹ Ant.</button>
          <span className="tag-dim" style={{ flex: 1, textAlign: 'center' }}>
            {fmt(weekStart)} – {fmt(addDays(weekStart, 6))}
          </span>
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem' }}
            onClick={() => setWeekStart(addDays(weekStart, 7))}>Sig. ›</button>
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoy</button>
        </div>
        <div className="week-grid">
          {days.map((day, idx) => (
            <div key={idx} className="week-col">
              <div className="week-day">{WEEKDAY_NAMES[idx].slice(0, 3)} {day.getDate()}</div>
              {visibleSessions.filter((s) => s.weekday === idx)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((s) => <SessionCell key={s.id} session={s} course={courseById[s.course_id]} />)}
            </div>
          ))}
        </div>
      </>
    )
  }

  // ── Vista de N días (30 / 60) ─────────────────────────────────────────────
  function DaysView({ days }) {
    const start = startOfWeek(new Date())
    const cells = Array.from({ length: days }, (_, i) => {
      const d = addDays(start, i)
      const weekday = (d.getDay() + 6) % 7
      const daySessions = visibleSessions.filter((s) => s.weekday === weekday)
      return { date: d, weekday, sessions: daySessions }
    })
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
        {cells.map(({ date, sessions: daySess }, i) => (
          <div key={i} className="month-cell">
            <div className="month-num">{WEEKDAY_NAMES[(date.getDay() + 6) % 7].slice(0, 3)} {date.getDate()}</div>
            {daySess.map((s) => {
              const c = courseById[s.course_id]
              const teacher = c.teachers?.[0]
              return (
                <div key={s.id} className="month-dot" style={{ background: c.calendar_color }}
                  onClick={() => openDetail(s)} title={c.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {teacher?.photo_url && (
                      <img src={teacher.photo_url} alt=""
                        style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none' }} />
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // ── Vista mensual ──────────────────────────────────────────────────────────
  function MonthView() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + monthOffset
    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    const label = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem' }}
            onClick={() => setMonthOffset(monthOffset - 1)}>‹</button>
          <span className="tag-dim" style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>{label}</span>
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem' }}
            onClick={() => setMonthOffset(monthOffset + 1)}>›</button>
          <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setMonthOffset(0)}>Hoy</button>
        </div>
        <div className="month-grid" style={{ marginBottom: '0.4rem' }}>
          {WEEKDAY_NAMES.map((d) => <div key={d} className="week-day">{d.slice(0, 3)}</div>)}
        </div>
        <div className="month-grid">
          {cells.map((d, idx) => {
            if (d === null) return <div key={idx} />
            const weekday = (new Date(year, month, d).getDay() + 6) % 7
            const daySessions = visibleSessions.filter((s) => s.weekday === weekday)
            return (
              <div key={idx} className="month-cell">
                <div className="month-num">{d}</div>
                {daySessions.map((s) => {
                  const c = courseById[s.course_id]
                  const teacher = c.teachers?.[0]
                  return (
                    <div key={s.id} className="month-dot" style={{ background: c.calendar_color }}
                      onClick={() => openDetail(s)} title={c.name}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {teacher?.photo_url && (
                          <img src={teacher.photo_url} alt=""
                            style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none' }} />
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  const allTeachers = Object.values(teacherMap)

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('schedule.title')}</h2>
        <p className="section-sub">{t('schedule.subtitle')}</p>
      </Reveal>

      <div className="cal-tabs">
        {[['semanal', 'Semana'], ['30', '30 días'], ['60', '60 días'], ['monthly', 'Mes']].map(([v, label]) => (
          <button key={v} className={view === v ? 'cal-tab active' : 'cal-tab'} onClick={() => setView(v)}>{label}</button>
        ))}
      </div>

      {/* Filtros: solo curso y profesor, sin nivel */}
      <div className="cal-filters">
        <select value={filters.course} onChange={(e) => setFilters({ ...filters, course: e.target.value })}>
          <option value="">Todos los cursos</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.teacher} onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}>
          <option value="">Todos los profesores</option>
          {allTeachers.map((tc) => <option key={tc.id} value={tc.id}>{tc.full_name}</option>)}
        </select>
      </div>

      {view === 'semanal' && <WeekView />}
      {view === '30' && <DaysView days={30} />}
      {view === '60' && <DaysView days={60} />}
      {view === 'monthly' && <MonthView />}

      {/* Tabla de precios */}
      <Reveal className="section">
        <h3 style={{ marginTop: '2rem' }}>{t('schedule.prices')}</h3>
        <div className="price-table">
          <table>
            <thead>
              <tr><th>Curso</th><th>{t('schedule.monthlyFee')}</th><th>{t('schedule.trialClass')}</th></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><span style={{ color: c.calendar_color }}>●</span> {c.name} · <span className="tag-dim">{c.level}</span></td>
                  <td>{Number(c.price)}€{t('common.perMonth')}</td>
                  <td>{Number(c.trial_price) > 0 ? `${Number(c.trial_price)}€` : '—'}</td>
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
              {selected.course.teachers?.length > 0 && (
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <strong>{t('common.teachers')}:</strong>
                  {selected.course.teachers.map((tc) => (
                    <span key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {tc.photo_url && (
                        <img src={tc.photo_url} alt={tc.full_name}
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none' }} />
                      )}
                      {tc.full_name}
                    </span>
                  ))}
                </li>
              )}
              <li><strong>{WEEKDAY_NAMES[selected.session.weekday]}:</strong> {selected.session.start_time}–{selected.session.end_time}</li>
              <li><strong>{t('common.room')}:</strong> {selected.session.room || selected.course.room}</li>
              <li><strong>{t('common.duration')}:</strong> {selected.course.duration}</li>
              <li><strong>{t('common.price')}:</strong> {Number(selected.course.price)}€{t('common.perMonth')}</li>
            </ul>
            <a className="btn btn-primary" style={{ marginTop: '1rem' }}
              href={whatsappLink(`Hola, quiero apuntarme a ${selected.course.name}`)}
              target="_blank" rel="noreferrer">{t('common.writeUs')}</a>
          </div>
        </Modal>
      )}
    </div>
  )
}
