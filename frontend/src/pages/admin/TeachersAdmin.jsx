import { useEffect, useState, useCallback } from 'react'
import Modal from '../../components/Modal'
import MediaPicker from './MediaPicker'

const API = '/api/admin'
const token = () => localStorage.getItem('token')
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })

const EMPTY_FORM = {
  slug: '',
  full_name: '',
  specialties: '',
  email: '',
  phone: '',
  bio: '',
  photo_url: '',
  cv_pdf_url: '',
  video_url: '',
  availability: '',
  internal_notes: '',
  is_active: true,
}

export default function TeachersAdmin() {
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create / edit modal
  const [modal, setModal] = useState(null) // null | { mode, teacher }
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Course assignment modal
  const [assignModal, setAssignModal] = useState(null) // null | { teacher }
  const [selectedCourseIds, setSelectedCourseIds] = useState([])
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState(null)

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/teachers`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setTeachers(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch(`${API}/courses`, { headers: authHeaders() })
      if (res.ok) setCourses(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    loadTeachers()
    loadCourses()
  }, [loadTeachers, loadCourses])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ mode: 'create', teacher: null })
  }

  const openEdit = (teacher) => {
    setForm({
      slug: teacher.slug ?? '',
      full_name: teacher.full_name ?? '',
      specialties: teacher.specialties ?? '',
      email: teacher.email ?? '',
      phone: teacher.phone ?? '',
      bio: teacher.bio ?? '',
      photo_url: teacher.photo_url ?? '',
      cv_pdf_url: teacher.cv_pdf_url ?? '',
      video_url: teacher.video_url ?? '',
      availability: teacher.availability ?? '',
      internal_notes: teacher.internal_notes ?? '',
      is_active: teacher.is_active ?? true,
    })
    setFormError(null)
    setModal({ mode: 'edit', teacher })
  }

  const onChange = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        ...form,
        is_active: form.is_active === 'false' ? false : Boolean(form.is_active),
      }

      let res
      if (modal.mode === 'edit') {
        res = await fetch(`${API}/teachers/${modal.teacher.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`${API}/teachers`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        // Surface deactivation error (400 when teacher has courses)
        throw new Error(err.detail ?? `Error ${res.status}`)
      }

      setModal(null)
      loadTeachers()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (teacher) => {
    if (!confirm(`¿Eliminar al profesor "${teacher.full_name}"?`)) return
    try {
      const res = await fetch(`${API}/teachers/${teacher.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `Error ${res.status}`)
      }
      loadTeachers()
    } catch (e) {
      alert(`Error al eliminar: ${e.message}`)
    }
  }

  const openAssign = (teacher) => {
    setSelectedCourseIds((teacher.courses ?? []).map((c) => c.id))
    setAssignError(null)
    setAssignModal({ teacher })
  }

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    )
  }

  const saveAssign = async () => {
    if (!assignModal) return
    setAssignSaving(true)
    setAssignError(null)
    try {
      const res = await fetch(`${API}/teachers/${assignModal.teacher.id}/courses`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ course_ids: selectedCourseIds }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `Error ${res.status}`)
      }
      setAssignModal(null)
      loadTeachers()
    } catch (e) {
      setAssignError(e.message)
    } finally {
      setAssignSaving(false)
    }
  }

  return (
    <div>
      <div className="admin-head">
        <h2 className="section-title">Profesores</h2>
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
                <th>Cursos</th>
                <th>Email</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td>{t.full_name}</td>
                  <td style={{ fontSize: '0.85rem', maxWidth: 260 }}>
                    {(t.courses ?? []).length === 0
                      ? <span style={{ color: '#9ca3af' }}>—</span>
                      : (t.courses ?? []).map((c) => c.name).join(', ')
                    }
                  </td>
                  <td>{t.email}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: t.is_active ? '#16a34a' : '#6b7280',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {t.is_active ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.78rem', padding: '2px 8px', marginRight: 4 }}
                      onClick={() => openAssign(t)}
                    >
                      Asignar cursos
                    </button>
                    <button className="link-btn" onClick={() => openEdit(t)}>✏️</button>
                    <button className="link-btn" onClick={() => remove(t)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teachers.length === 0 && <p className="tag-dim" style={{ padding: '1rem' }}>Sin registros.</p>}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <form className="modal-content" onSubmit={save}>
            <h3 style={{ marginBottom: '1rem' }}>
              {modal.mode === 'edit' ? 'Editar profesor' : 'Nuevo profesor'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="field">
                <label>Slug (URL)</label>
                <input type="text" value={form.slug} onChange={(e) => onChange('slug', e.target.value)} />
              </div>
              <div className="field">
                <label>Nombre completo</label>
                <input type="text" value={form.full_name} onChange={(e) => onChange('full_name', e.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input type="text" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <MediaPicker label="Foto del profesor" accept="image"
                  value={form.photo_url} onChange={(url) => onChange('photo_url', url)} />
              </div>
              <div className="field">
                <MediaPicker label="CV (PDF)" accept="pdf"
                  value={form.cv_pdf_url} onChange={(url) => onChange('cv_pdf_url', url)} />
              </div>
              <div className="field">
                <MediaPicker label="Vídeo" accept="video"
                  value={form.video_url} onChange={(url) => onChange('video_url', url)} />
              </div>
              <div className="field">
                <label>Disponibilidad</label>
                <input type="text" value={form.availability} onChange={(e) => onChange('availability', e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Notas/Especialidades</label>
                <input type="text" value={form.specialties} onChange={(e) => onChange('specialties', e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Biografía</label>
              <textarea rows="3" value={form.bio} onChange={(e) => onChange('bio', e.target.value)} />
            </div>

            <div className="field">
              <label>Notas internas</label>
              <textarea rows="2" value={form.internal_notes} onChange={(e) => onChange('internal_notes', e.target.value)} />
            </div>

            <div className="field">
              <label>Activo</label>
              <select value={String(form.is_active)} onChange={(e) => onChange('is_active', e.target.value)}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>

            {formError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                {formError}
              </p>
            )}

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}

      {/* Course assignment modal */}
      {assignModal && (
        <Modal onClose={() => setAssignModal(null)}>
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem' }}>
              Cursos de {assignModal.teacher.full_name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              Marca los cursos en los que este profesor imparte clase.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
              {courses.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Sin cursos disponibles.</p>}
              {courses.map((c) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={() => toggleCourse(c.id)}
                  />
                  <span style={{ color: c.calendar_color, marginRight: 2 }}>●</span>
                  {c.name}
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>({c.level})</span>
                </label>
              ))}
            </div>

            {assignError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0.75rem 0 0' }}>{assignError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={saveAssign} disabled={assignSaving}>
                {assignSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn btn-ghost" onClick={() => setAssignModal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
