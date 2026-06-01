import { useEffect, useState, useCallback } from 'react'
import Modal from '../../components/Modal'

const API = '/api/admin'
const token = () => localStorage.getItem('token')
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })

const STATUS_COLORS = {
  inscrito: '#16a34a',
  interesado: '#d97706',
  graduado: '#2563eb',
  baja: '#6b7280',
}

const STATUSES = ['inscrito', 'interesado', 'graduado', 'baja']
const SOURCES = ['web', 'whatsapp', 'redes', 'escuela', 'contactos']

function StatusBadge({ status }) {
  return (
    <span
      className="badge"
      style={{
        background: STATUS_COLORS[status] ?? '#6b7280',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.78rem',
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  )
}

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  postal_code: '',
  current_level: '',
  status: 'inscrito',
  lead_source: 'web',
  enroll_date: '',
  contact_date: '',
  notes: '',
  guardian_name: '',
  guardian_contact: '',
}

export default function StudentsAdmin() {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal state: null | { mode: 'create'|'edit', student: obj|null }
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Enrollments panel: studentId that has the panel expanded
  const [enrollOpen, setEnrollOpen] = useState(null)
  const [enrollments, setEnrollments] = useState({}) // { [studentId]: [...] }
  const [addingCourse, setAddingCourse] = useState(null) // studentId being enrolled
  const [selectedCourseId, setSelectedCourseId] = useState('')

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/students`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setStudents(await res.json())
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
    loadStudents()
    loadCourses()
  }, [loadStudents, loadCourses])

  const loadEnrollments = async (studentId) => {
    try {
      const res = await fetch(`${API}/students/${studentId}`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setEnrollments((prev) => ({ ...prev, [studentId]: data.enrollments ?? [] }))
    } catch {}
  }

  const toggleEnroll = async (studentId) => {
    if (enrollOpen === studentId) {
      setEnrollOpen(null)
      return
    }
    setEnrollOpen(studentId)
    await loadEnrollments(studentId)
  }

  const unenroll = async (studentId, enrollmentId) => {
    if (!confirm('¿Dar de baja de este curso?')) return
    try {
      const res = await fetch(`${API}/students/${studentId}/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      await loadEnrollments(studentId)
      loadStudents()
    } catch (e) {
      alert(`Error al dar de baja: ${e.message}`)
    }
  }

  const addEnrollment = async (studentId) => {
    if (!selectedCourseId) return
    try {
      const res = await fetch(`${API}/students/${studentId}/enrollments?course_id=${selectedCourseId}`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `Error ${res.status}`)
      }
      setAddingCourse(null)
      setSelectedCourseId('')
      await loadEnrollments(studentId)
      loadStudents()
    } catch (e) {
      alert(`Error al inscribir: ${e.message}`)
    }
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ mode: 'create', student: null })
  }

  const openEdit = (student) => {
    setForm({
      first_name: student.first_name ?? '',
      last_name: student.last_name ?? '',
      email: student.email ?? '',
      phone: student.phone ?? '',
      city: student.city ?? '',
      postal_code: student.postal_code ?? '',
      current_level: student.current_level ?? '',
      status: student.status ?? 'inscrito',
      lead_source: student.lead_source ?? 'web',
      enroll_date: student.enroll_date ?? '',
      contact_date: student.contact_date ?? '',
      notes: student.notes ?? '',
      guardian_name: student.guardian_name ?? '',
      guardian_contact: student.guardian_contact ?? '',
    })
    setFormError(null)
    setModal({ mode: 'edit', student })
  }

  const onChange = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = { ...form }
      if (!payload.enroll_date) delete payload.enroll_date
      if (!payload.contact_date) delete payload.contact_date

      let res
      if (modal.mode === 'edit') {
        res = await fetch(`${API}/students/${modal.student.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`${API}/students`, {
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
      loadStudents()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (student) => {
    if (!confirm(`¿Eliminar a ${student.first_name} ${student.last_name}?`)) return
    try {
      const res = await fetch(`${API}/students/${student.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      loadStudents()
    } catch (e) {
      alert(`Error al eliminar: ${e.message}`)
    }
  }

  return (
    <div>
      <div className="admin-head">
        <h2 className="section-title">Estudiantes</h2>
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
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Origen</th>
                <th>Inscripciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <>
                  <tr key={s.id}>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>{s.lead_source}</td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                        onClick={() => toggleEnroll(s.id)}
                      >
                        {s.enrollments_count ?? s.enrollments?.length ?? 0} inscripciones {enrollOpen === s.id ? '▲' : '▼'}
                      </button>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="link-btn" onClick={() => openEdit(s)}>✏️</button>
                      <button className="link-btn" onClick={() => remove(s)}>🗑️</button>
                    </td>
                  </tr>

                  {enrollOpen === s.id && (
                    <tr key={`${s.id}-enroll`}>
                      <td colSpan={7} style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1.5rem' }}>
                        <strong style={{ fontSize: '0.85rem' }}>Inscripciones de {s.first_name}</strong>
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {(enrollments[s.id] ?? []).length === 0 && (
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Sin inscripciones activas.</span>
                          )}
                          {(enrollments[s.id] ?? []).map((en) => (
                            <div key={en.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.9rem' }}>{en.course_name ?? en.course?.name}</span>
                              <span className="badge" style={{
                                background: en.status === 'activo' ? '#16a34a' : '#6b7280',
                                color: '#fff', padding: '1px 6px', borderRadius: 3, fontSize: '0.75rem',
                              }}>{en.status}</span>
                              <button
                                className="btn btn-ghost"
                                style={{ fontSize: '0.75rem', padding: '2px 6px', color: '#dc2626' }}
                                onClick={() => unenroll(s.id, en.id)}
                              >
                                Dar de baja
                              </button>
                            </div>
                          ))}
                        </div>

                        {addingCourse === s.id ? (
                          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select
                              value={selectedCourseId}
                              onChange={(e) => setSelectedCourseId(e.target.value)}
                              style={{ fontSize: '0.85rem' }}
                            >
                              <option value="">— Seleccionar curso —</option>
                              {courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                              onClick={() => addEnrollment(s.id)}>
                              Confirmar
                            </button>
                            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                              onClick={() => { setAddingCourse(null); setSelectedCourseId('') }}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-ghost"
                            style={{ marginTop: '0.75rem', fontSize: '0.82rem', padding: '4px 10px' }}
                            onClick={() => { setAddingCourse(s.id); setSelectedCourseId('') }}
                          >
                            ➕ Añadir inscripción
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <p className="tag-dim" style={{ padding: '1rem' }}>Sin registros.</p>}
        </div>
      )}

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <form className="modal-content" onSubmit={save}>
            <h3 style={{ marginBottom: '1rem' }}>{modal.mode === 'edit' ? 'Editar estudiante' : 'Nuevo estudiante'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              {[
                { name: 'first_name', label: 'Nombre' },
                { name: 'last_name', label: 'Apellidos' },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'phone', label: 'Teléfono' },
                { name: 'city', label: 'Ciudad' },
                { name: 'postal_code', label: 'Código postal' },
                { name: 'current_level', label: 'Nivel actual' },
              ].map((f) => (
                <div className="field" key={f.name}>
                  <label>{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    value={form[f.name] ?? ''}
                    onChange={(e) => onChange(f.name, e.target.value)}
                  />
                </div>
              ))}

              <div className="field">
                <label>Estado</label>
                <select value={form.status} onChange={(e) => onChange('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Origen</label>
                <select value={form.lead_source} onChange={(e) => onChange('lead_source', e.target.value)}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Fecha inscripción</label>
                <input type="date" value={form.enroll_date ?? ''} onChange={(e) => onChange('enroll_date', e.target.value)} />
              </div>

              <div className="field">
                <label>Fecha contacto</label>
                <input type="date" value={form.contact_date ?? ''} onChange={(e) => onChange('contact_date', e.target.value)} />
              </div>

              <div className="field">
                <label>Tutor legal (menores)</label>
                <input type="text" value={form.guardian_name ?? ''} onChange={(e) => onChange('guardian_name', e.target.value)} />
              </div>

              <div className="field">
                <label>Contacto tutor</label>
                <input type="text" value={form.guardian_contact ?? ''} onChange={(e) => onChange('guardian_contact', e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Notas</label>
              <textarea rows="3" value={form.notes ?? ''} onChange={(e) => onChange('notes', e.target.value)} />
            </div>

            {formError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{formError}</p>
            )}

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
