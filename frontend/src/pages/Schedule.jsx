import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCourses, getSchedule, getEvents } from '../api/client'
import Reveal from '../components/Reveal'
import Modal from '../components/Modal'
import { whatsappLink } from '../components/WhatsAppButton'

const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function startOfWeek(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - (d.getDay() + 6) % 7)
  d.setHours(0, 0, 0, 0)
  return d
}
function toYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function fmtShort(date) {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ── Celdas ────────────────────────────────────────────────────────────────────

function SessionCell({ session, course, onClick }) {
  const teacher = course.teachers?.[0]
  const thumb = teacher?.photo_url || course.image_url
  return (
    <div className="sch-cell sch-cell--course" style={{ '--cell-color': course.calendar_color }} onClick={onClick}>
      <div className="sch-cell-time">{session.start_time}–{session.end_time}</div>
      <div className="sch-cell-body">
        {thumb && (
          <img className="sch-cell-thumb" src={thumb} alt={teacher?.full_name || course.name}
            onError={(e) => { e.target.style.display = 'none' }} />
        )}
        <span className="sch-cell-name">{course.name}</span>
      </div>
    </div>
  )
}

function EventCell({ event, compact = false, onClick }) {
  return (
    <div className={`sch-cell sch-cell--event${compact ? ' sch-cell--compact' : ''}`} onClick={onClick}>
      {!compact && <div className="sch-cell-event-label">🎉 Evento</div>}
      <div className="sch-cell-body">
        {event.image_url && (
          <img className="sch-cell-thumb sch-cell-thumb--event" src={event.image_url} alt={event.name}
            onError={(e) => { e.target.style.display = 'none' }} />
        )}
        <span className="sch-cell-name">{event.name}</span>
      </div>
      {!compact && event.time_range && (
        <div className="sch-cell-time" style={{ marginTop: '0.2rem' }}>{event.time_range}</div>
      )}
    </div>
  )
}

// ── Modal de detalle ───────────────────────────────────────────────────────────

function CourseModal({ session, course, onClose }) {
  const { t } = useTranslation()
  return (
    <Modal onClose={onClose} large>
      <div className="modal-content">
        <div style={{ height: 4, background: course.calendar_color, borderRadius: 4, marginBottom: '1.25rem' }} />
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {course.image_url && (
            <img src={course.image_url} alt={course.name}
              style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
              onError={(e) => { e.target.style.opacity = 0.2 }} />
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ marginBottom: '0.25rem' }}>{course.name}</h3>
            <span className="badge" style={{ background: course.calendar_color + '33', color: course.calendar_color }}>
              {course.level}
            </span>
            <p className="tag-dim" style={{ marginTop: '0.75rem', lineHeight: 1.5 }}>{course.description}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '1.25rem' }}>
          <div className="sch-info-item">
            <span className="sch-info-label">📅 Día</span>
            <span>{WEEKDAY_NAMES[session.weekday]}</span>
          </div>
          <div className="sch-info-item">
            <span className="sch-info-label">🕐 Horario</span>
            <span>{session.start_time}–{session.end_time}</span>
          </div>
          <div className="sch-info-item">
            <span className="sch-info-label">📍 Sala</span>
            <span>{session.room || course.room || '—'}</span>
          </div>
          <div className="sch-info-item">
            <span className="sch-info-label">💶 Precio</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{Number(course.price)}€/mes</span>
          </div>
        </div>

        {course.teachers?.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p className="sch-info-label" style={{ marginBottom: '0.5rem' }}>👤 Profesores</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {course.teachers.map((tc) => (
                <div key={tc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {tc.photo_url && (
                    <img src={tc.photo_url} alt={tc.full_name}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                      onError={(e) => { e.target.style.display = 'none' }} />
                  )}
                  <span style={{ fontSize: '0.9rem' }}>{tc.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <a className="btn btn-primary"
            href={whatsappLink(`Hola! Me interesa el curso ${course.name} (${WEEKDAY_NAMES[session.weekday]} ${session.start_time}).`)}
            target="_blank" rel="noreferrer">
            💬 Apuntarme por WhatsApp
          </a>
          <Link to="/contacto" className="btn btn-ghost" onClick={onClose}>
            Formulario de contacto
          </Link>
        </div>
      </div>
    </Modal>
  )
}

function EventModal({ event, onClose }) {
  return (
    <Modal onClose={onClose} large>
      <div className="modal-content">
        {event.image_url && (
          <img src={event.image_url} alt={event.name} className="modal-img"
            style={{ borderRadius: 10, marginBottom: '1.25rem' }}
            onError={(e) => { e.target.style.display = 'none' }} />
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🎉</span>
          <h3 style={{ margin: 0 }}>{event.name}</h3>
        </div>
        {event.subtitle && <p className="tag-dim" style={{ marginBottom: '0.75rem' }}>{event.subtitle}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
          {event.date && (
            <div className="sch-info-item">
              <span className="sch-info-label">📅 Fecha</span>
              <span>{event.date}</span>
            </div>
          )}
          {event.time_range && (
            <div className="sch-info-item">
              <span className="sch-info-label">🕐 Horario</span>
              <span>{event.time_range}</span>
            </div>
          )}
          {event.location && (
            <div className="sch-info-item" style={{ gridColumn: '1 / -1' }}>
              <span className="sch-info-label">📍 Lugar</span>
              <span>{event.location}</span>
            </div>
          )}
          {event.artists && (
            <div className="sch-info-item" style={{ gridColumn: '1 / -1' }}>
              <span className="sch-info-label">🎵 Artistas</span>
              <span>{event.artists}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1rem' }}>{event.description}</p>
        )}

        {event.activities && (
          <div style={{ marginBottom: '1rem' }}>
            <p className="sch-info-label" style={{ marginBottom: '0.4rem' }}>📋 Programa</p>
            {event.activities.split('\n').filter(Boolean).map((a, i) => (
              <p key={i} className="tag-dim" style={{ margin: '0.2rem 0' }}>· {a}</p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <a className="btn btn-primary"
            href={whatsappLink(`Hola! Quiero información sobre el evento: ${event.name} (${event.date})`)}
            target="_blank" rel="noreferrer">
            💬 Más info por WhatsApp
          </a>
          <Link to="/eventos" className="btn btn-ghost" onClick={onClose}>
            Ver todos los eventos
          </Link>
        </div>
      </div>
    </Modal>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Schedule() {
  const { t } = useTranslation()
  const [view, setView] = useState('semanal')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [monthOffset, setMonthOffset] = useState(0)
  const [courses, setCourses] = useState([])
  const [sessions, setSessions] = useState([])
  const [events, setEvents] = useState([])
  const [filterCourse, setFilterCourse] = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterType, setFilterType] = useState('all')  // 'all' | 'courses' | 'events'
  const [selected, setSelected] = useState(null) // { type: 'course'|'event', ... }

  useEffect(() => {
    getCourses().then(setCourses).catch(() => {})
    getSchedule().then(setSessions).catch(() => {})
    getEvents().then((evs) => setEvents(evs.filter((e) => e.date))).catch(() => {})
  }, [])

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  const teacherMap = useMemo(() => {
    const m = {}
    courses.forEach((c) => c.teachers?.forEach((tc) => { m[tc.id] = tc }))
    return m
  }, [courses])

  // Mapa de eventos por fecha YMD
  const eventsByDate = useMemo(() => {
    const m = {}
    events.forEach((e) => {
      const key = e.date // ya viene como "YYYY-MM-DD"
      if (!m[key]) m[key] = []
      m[key].push(e)
    })
    return m
  }, [events])

  const visibleSessions = filterType === 'events' ? [] : sessions.filter((s) => {
    const c = courseById[s.course_id]
    if (!c) return false
    if (filterCourse && String(c.id) !== filterCourse) return false
    if (filterTeacher && !c.teachers?.some((tc) => String(tc.id) === filterTeacher)) return false
    return true
  })

  // Cuando el filtro es 'courses', no mostrar eventos en el calendario
  const visibleEventsByDate = useMemo(() => {
    if (filterType === 'courses') return {}
    return eventsByDate
  }, [filterType, eventsByDate])

  const openCourse = (session) => setSelected({ type: 'course', session, course: courseById[session.course_id] })
  const openEvent = (event) => setSelected({ type: 'event', event })

  // ── Vista semanal ────────────────────────────────────────────────────────────
  function WeekView() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    return (
      <>
        <div className="sch-nav">
          <button className="btn btn-ghost sch-nav-btn" onClick={() => setWeekStart(addDays(weekStart, -7))}>‹ Anterior</button>
          <span className="tag-dim sch-nav-label">{fmtShort(weekStart)} – {fmtShort(addDays(weekStart, 6))}</span>
          <button className="btn btn-ghost sch-nav-btn" onClick={() => setWeekStart(addDays(weekStart, 7))}>Siguiente ›</button>
          <button className="btn btn-ghost sch-nav-btn sch-nav-today"
            onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoy</button>
        </div>
        <div className="week-grid">
          {days.map((day, idx) => {
            const ymd = toYMD(day)
            const dayEvents = visibleEventsByDate[ymd] || []
            const daySessions = visibleSessions.filter((s) => s.weekday === idx)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
            const isToday = ymd === toYMD(new Date())
            return (
              <div key={idx} className={`week-col${isToday ? ' week-col--today' : ''}`}>
                <div className={`week-day${isToday ? ' week-day--today' : ''}`}>
                  {WEEKDAY_NAMES[idx].slice(0, 3)} <strong>{day.getDate()}</strong>
                </div>
                {dayEvents.map((ev) => (
                  <EventCell key={`ev-${ev.id}`} event={ev} onClick={() => openEvent(ev)} />
                ))}
                {daySessions.map((s) => (
                  <SessionCell key={s.id} session={s} course={courseById[s.course_id]} onClick={() => openCourse(s)} />
                ))}
                {dayEvents.length === 0 && daySessions.length === 0 && (
                  <div className="week-empty" />
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  // ── Vista mensual ────────────────────────────────────────────────────────────
  function MonthView() {
    const base = new Date()
    const year = base.getFullYear()
    const month = base.getMonth() + monthOffset
    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    const label = new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    const todayYMD = toYMD(new Date())

    return (
      <>
        <div className="sch-nav">
          <button className="btn btn-ghost sch-nav-btn" onClick={() => setMonthOffset(monthOffset - 1)}>‹</button>
          <span className="tag-dim sch-nav-label" style={{ textTransform: 'capitalize' }}>{label}</span>
          <button className="btn btn-ghost sch-nav-btn" onClick={() => setMonthOffset(monthOffset + 1)}>›</button>
          <button className="btn btn-ghost sch-nav-btn sch-nav-today" onClick={() => setMonthOffset(0)}>Hoy</button>
        </div>
        <div className="month-grid" style={{ marginBottom: '0.4rem' }}>
          {WEEKDAY_NAMES.map((d) => <div key={d} className="week-day">{d.slice(0, 3)}</div>)}
        </div>
        <div className="month-grid">
          {cells.map((d, idx) => {
            if (d === null) return <div key={idx} />
            const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const weekday = (new Date(year, month, d).getDay() + 6) % 7
            const daySessions = visibleSessions.filter((s) => s.weekday === weekday)
            const dayEvents = visibleEventsByDate[ymd] || []
            const isToday = ymd === todayYMD
            return (
              <div key={idx} className={`month-cell${isToday ? ' month-cell--today' : ''}`}>
                <div className={`month-num${isToday ? ' month-num--today' : ''}`}>{d}</div>
                {dayEvents.map((ev) => (
                  <div key={`ev-${ev.id}`} className="month-dot month-dot--event"
                    onClick={() => openEvent(ev)} title={ev.name}>
                    <div className="month-dot-inner">
                      {ev.image_url
                        ? <img src={ev.image_url} alt="" className="month-dot-thumb"
                            onError={(e) => { e.target.style.display = 'none' }} />
                        : <span style={{ fontSize: '0.65rem' }}>🎉</span>
                      }
                      <span>{ev.name}</span>
                    </div>
                  </div>
                ))}
                {daySessions.map((s) => {
                  const c = courseById[s.course_id]
                  const teacher = c.teachers?.[0]
                  const thumb = teacher?.photo_url || c.image_url
                  return (
                    <div key={s.id} className="month-dot"
                      style={{ background: c.calendar_color }}
                      onClick={() => openCourse(s)} title={c.name}>
                      <div className="month-dot-inner">
                        {thumb
                          ? <img src={thumb} alt="" className="month-dot-thumb month-dot-thumb--round"
                              onError={(e) => { e.target.style.display = 'none' }} />
                          : <span style={{ width: 14 }} />
                        }
                        <span>{c.name}</span>
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

      {/* Tabs de vista */}
      <div className="cal-tabs">
        <button className={view === 'semanal' ? 'cal-tab active' : 'cal-tab'} onClick={() => setView('semanal')}>
          Semana
        </button>
        <button className={view === 'monthly' ? 'cal-tab active' : 'cal-tab'} onClick={() => setView('monthly')}>
          Mes
        </button>
      </div>

      {/* Filtro de tipo */}
      <div className="sch-type-filter">
        {[
          { v: 'all',     label: 'Todo',          icon: '◉' },
          { v: 'courses', label: 'Solo clases',    icon: '●' },
          { v: 'events',  label: 'Solo eventos',   icon: '🎉' },
        ].map(({ v, label, icon }) => (
          <button key={v}
            className={`sch-type-btn${filterType === v ? ' active' : ''}`}
            onClick={() => {
              setFilterType(v)
              if (v === 'events') { setFilterCourse(''); setFilterTeacher('') }
            }}>
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Filtros de curso/profesor — ocultos en modo solo eventos */}
      {filterType !== 'events' && (
        <div className="cal-filters">
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="">Todos los cursos</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
            <option value="">Todos los profesores</option>
            {allTeachers.map((tc) => <option key={tc.id} value={tc.id}>{tc.full_name}</option>)}
          </select>
        </div>
      )}

      {view === 'semanal' && <WeekView />}
      {view === 'monthly' && <MonthView />}

      {/* Tabla de precios */}
      <Reveal>
        <div className="sch-prices">
          <h3>{t('schedule.prices')}</h3>
          <div className="price-table">
            <table>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Profesores</th>
                  <th>{t('schedule.monthlyFee')}</th>
                  <th>Prueba</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ color: c.calendar_color, marginRight: '0.4rem' }}>●</span>
                      <strong>{c.name}</strong>
                      <span className="tag-dim" style={{ marginLeft: '0.4rem', fontSize: '0.85rem' }}>{c.level}</span>
                    </td>
                    <td className="tag-dim" style={{ fontSize: '0.85rem' }}>
                      {c.teachers?.map((tc) => tc.full_name).join(', ') || '—'}
                    </td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>
                      {Number(c.price)}€<span className="tag-dim">/mes</span>
                    </td>
                    <td className="tag-dim">
                      {Number(c.trial_price) > 0 ? `${Number(c.trial_price)}€` : 'Gratis'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* Modales */}
      {selected?.type === 'course' && (
        <CourseModal session={selected.session} course={selected.course} onClose={() => setSelected(null)} />
      )}
      {selected?.type === 'event' && (
        <EventModal event={selected.event} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
