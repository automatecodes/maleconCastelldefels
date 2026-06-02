import { useEffect, useState, useCallback } from 'react'
import Modal from '../../components/Modal'
import AiImageButton from './AiImageButton'
import { generateCourseImage } from '../../api/client'

const API = '/api/admin'
const token = () => localStorage.getItem('token')
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })

// Paleta pastel para calendarios (20 colores, texto oscuro sobre fondo pastel)
const COURSE_PALETTE = [
  '#A8E8C8', // menta
  '#A8D0F8', // azul cielo
  '#F8B8C8', // rosa chicle
  '#C8B0F8', // violeta
  '#FFD0A8', // melocotón
  '#F0F8A0', // lima-amarillo
  '#A0D8F0', // aqua
  '#F8C8A0', // albaricoque
  '#B8F0E0', // turquesa
  '#F0A8D8', // lila
  '#A8C0F8', // azul lavanda
  '#F8E8A0', // mantequilla
  '#C0F0C8', // verde pálido
  '#F0B8A8', // salmón
  '#B0C8F8', // periwinkle
  '#F8D0C0', // coral pálido
  '#A0F0D8', // jade
  '#E8C8F8', // malva
  '#F8F0A8', // limón
  '#C8E8A0', // verde lima
]

const LEVELS = ['Inicio', 'Intermedio', 'Avanzado']
const STATUSES = ['abierto', 'próxima apertura', 'cerrado']

const EMPTY_FORM = {
  slug: '',
  name: '',
  level: 'Inicio',
  style: '',
  description: '',
  image_url: '',
  video_url: '',
  calendar_color: '#71e628',
  room: '',
  capacity: 20,
  duration: '',
  price: 33,
  trial_price: 12.5,
  status: 'abierto',
  featured: false,
  teacher_ids: [],
}

export default function CoursesAdmin() {
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create/edit modal
  const [modal, setModal] = useState(null) // null | { mode, course }
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Enrolled students modal
  const [studentsModal, setStudentsModal] = useState(null) // null | { course }
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/courses`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setCourses(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTeachers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/teachers`, { headers: authHeaders() })
      if (res.ok) setTeachers(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    loadCourses()
    loadTeachers()
  }, [loadCourses, loadTeachers])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ mode: 'create', course: null })
  }

  const openEdit = (course) => {
    setForm({
      slug: course.slug ?? '',
      name: course.name ?? '',
      level: course.level ?? 'Inicio',
      style: course.style ?? '',
      description: course.description ?? '',
      image_url: course.image_url ?? '',
      video_url: course.video_url ?? '',
      calendar_color: course.calendar_color ?? '#71e628',
      room: course.room ?? '',
      capacity: course.capacity ?? 20,
      duration: course.duration ?? '',
      price: course.price ?? 33,
      trial_price: course.trial_price ?? 12.5,
      status: course.status ?? 'abierto',
      featured: course.featured ?? false,
      teacher_ids: (course.teachers ?? []).map((t) => t.id),
    })
    setFormError(null)
    setModal({ mode: 'edit', course })
  }

  const onChange = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const toggleTeacher = (teacherId) => {
    setForm((f) => {
      const ids = f.teacher_ids ?? []
      return {
        ...f,
        teacher_ids: ids.includes(teacherId)
          ? ids.filter((id) => id !== teacherId)
          : [...ids, teacherId],
      }
    })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        trial_price: Number(form.trial_price) || 0,
        capacity: Number(form.capacity) || 0,
        featured: form.featured === 'true' || form.featured === true,
        teacher_ids: form.teacher_ids ?? [],
      }

      let res
      if (modal.mode === 'edit') {
        res = await fetch(`${API}/courses/${modal.course.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`${API}/courses`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `Error ${res.status}`)
      }
      setModal(null)
      loadCourses()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (course) => {
    if (!confirm(`¿Eliminar el curso "${course.name}"?`)) return
    try {
      const res = await fetch(`${API}/courses/${course.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      loadCourses()
    } catch (e) {
      alert(`Error al eliminar: ${e.message}`)
    }
  }

  const openStudentsModal = async (course) => {
    setStudentsModal({ course })
    setEnrolledStudents([])
    setStudentsLoading(true)
    try {
      const res = await fetch(`${API}/courses/${course.id}/students`, { headers: authHeaders() })
      if (res.ok) setEnrolledStudents(await res.json())
    } catch {}
    setStudentsLoading(false)
  }

  const unenrollStudent = async (courseId, studentId) => {
    if (!confirm('¿Dar de baja a este estudiante del curso?')) return
    try {
      const res = await fetch(`${API}/courses/${courseId}/students/${studentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId))
      loadCourses()
    } catch (e) {
      alert(`Error al dar de baja: ${e.message}`)
    }
  }

  return (
    <div>
      <div className="admin-head">
        <h2 className="section-title">Cursos</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo</button>
      </div>

      {loading && <p style={{ padding: '1rem' }}>Cargando...</p>}
      {error && <p style={{ padding: '1rem', color: '#dc2626' }}>Error: {error}</p>}

      {!loading && !error && (
        <div className="card" style={{ padding: '0.5rem 1rem', overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Nivel</th>
                <th>Estilo</th>
                <th>Profesores</th>
                <th>€/mes</th>
                <th>Plazas</th>
                <th>Inscritos</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ color: c.calendar_color, marginRight: 4 }}>●</span>
                    {c.name}
                  </td>
                  <td>{c.level}</td>
                  <td>{c.style}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {(c.teachers ?? []).map((t) => t.full_name).join(', ') || <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td>{c.price}</td>
                  <td>{c.capacity}</td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                      onClick={() => openStudentsModal(c)}
                    >
                      {c.enrolled_count ?? 0} ver
                    </button>
                  </td>
                  <td>{c.status}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <AiImageButton onGenerate={() => generateCourseImage(c.id)} reload={loadCourses} />
                    <button className="link-btn" onClick={() => openEdit(c)}>✏️</button>
                    <button className="link-btn" onClick={() => remove(c)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && <p className="tag-dim" style={{ padding: '1rem' }}>Sin registros.</p>}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <form className="modal-content" onSubmit={save}>
            <h3 style={{ marginBottom: '1rem' }}>{modal.mode === 'edit' ? 'Editar curso' : 'Nuevo curso'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="field">
                <label>Slug (URL)</label>
                <input type="text" value={form.slug} onChange={(e) => onChange('slug', e.target.value)} />
              </div>
              <div className="field">
                <label>Nombre</label>
                <input type="text" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
              </div>
              <div className="field">
                <label>Nivel</label>
                <select value={form.level} onChange={(e) => onChange('level', e.target.value)}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Estilo</label>
                <input type="text" value={form.style} onChange={(e) => onChange('style', e.target.value)} />
              </div>
              <div className="field">
                <label>URL imagen</label>
                <input type="text" value={form.image_url} onChange={(e) => onChange('image_url', e.target.value)} />
              </div>
              <div className="field">
                <label>URL vídeo</label>
                <input type="text" value={form.video_url} onChange={(e) => onChange('video_url', e.target.value)} />
              </div>
              <div className="field">
                <label>Color calendario</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {COURSE_PALETTE.map((col) => (
                    <button key={col} type="button"
                      onClick={() => onChange('calendar_color', col)}
                      title={col}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: col,
                        border: form.calendar_color === col ? '3px solid var(--green)' : '2px solid var(--border)',
                        cursor: 'pointer', flexShrink: 0, transition: 'border 0.15s',
                      }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: form.calendar_color, border: '1px solid var(--border)', flexShrink: 0 }} />
                  <input type="color" value={form.calendar_color}
                    onChange={(e) => onChange('calendar_color', e.target.value)}
                    style={{ width: 36, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                    title="Color personalizado" />
                  <span className="tag-dim" style={{ fontSize: '0.8rem' }}>{form.calendar_color}</span>
                </div>
              </div>
              <div className="field">
                <label>Sala</label>
                <input type="text" value={form.room} onChange={(e) => onChange('room', e.target.value)} />
              </div>
              <div className="field">
                <label>Capacidad</label>
                <input type="number" value={form.capacity} onChange={(e) => onChange('capacity', e.target.value)} />
              </div>
              <div className="field">
                <label>Duración</label>
                <input type="text" value={form.duration} onChange={(e) => onChange('duration', e.target.value)} />
              </div>
              <div className="field">
                <label>Precio (€/mes)</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => onChange('price', e.target.value)} />
              </div>
              <div className="field">
                <label>Precio prueba (€)</label>
                <input type="number" step="0.01" value={form.trial_price} onChange={(e) => onChange('trial_price', e.target.value)} />
              </div>
              <div className="field">
                <label>Estado</label>
                <select value={form.status} onChange={(e) => onChange('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Destacado</label>
                <select value={String(form.featured)} onChange={(e) => onChange('featured', e.target.value)}>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Descripción</label>
              <textarea rows="3" value={form.description} onChange={(e) => onChange('description', e.target.value)} />
            </div>

            {teachers.length > 0 && (
              <div className="field">
                <label>Profesores asignados</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {teachers.filter((t) => t.is_active !== false).map((t) => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(form.teacher_ids ?? []).includes(t.id)}
                        onChange={() => toggleTeacher(t.id)}
                      />
                      {t.full_name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{formError}</p>
            )}

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}

      {/* Enrolled students modal */}
      {studentsModal && (
        <Modal onClose={() => setStudentsModal(null)}>
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>
              Inscritos — {studentsModal.course.name}
            </h3>
            {studentsLoading && <p>Cargando...</p>}
            {!studentsLoading && enrolledStudents.length === 0 && (
              <p style={{ color: '#9ca3af' }}>Sin estudiantes inscritos.</p>
            )}
            {!studentsLoading && enrolledStudents.length > 0 && (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Nombre</th>
                    <th style={{ textAlign: 'left' }}>Email</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.first_name} {s.last_name}</td>
                      <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>{s.email}</td>
                      <td>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.78rem', padding: '2px 8px', color: '#dc2626' }}
                          onClick={() => unenrollStudent(studentsModal.course.id, s.id)}
                        >
                          Dar de baja
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
