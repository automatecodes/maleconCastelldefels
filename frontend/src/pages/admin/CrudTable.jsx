import { useEffect, useState } from 'react'
import { adminGet, adminPost, adminPut, adminDelete } from '../../api/client'
import Modal from '../../components/Modal'
import MediaPicker from './MediaPicker'

/**
 * Tabla CRUD genérica para el admin.
 * props:
 *  - title
 *  - resource: ruta base (p.ej. "students")
 *  - columns: [{ key, label, render? }]
 *  - fields: [{ name, label, type, options? }]  (formulario crear/editar)
 *  - toPayload(form): transforma el formulario antes de enviar
 *  - fromRow(row): rellena el formulario al editar
 */
export default function CrudTable({ title, resource, columns, fields, toPayload, fromRow, empty, rowActions }) {
  const [rows, setRows] = useState([])
  const [editing, setEditing] = useState(null) // objeto en edición o {} para nuevo
  const [form, setForm] = useState({})

  const load = () => adminGet(resource).then(setRows).catch(() => {})
  useEffect(() => { load() }, [resource])

  const openNew = () => { setForm(empty || {}); setEditing({}) }
  const openEdit = (row) => { setForm(fromRow ? fromRow(row) : row); setEditing(row) }

  const onChange = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const save = async (e) => {
    e.preventDefault()
    const payload = toPayload ? toPayload(form) : form
    if (editing && editing.id) await adminPut(`${resource}/${editing.id}`, payload)
    else await adminPost(resource, payload)
    setEditing(null)
    load()
  }

  const remove = async (row) => {
    if (!confirm('¿Eliminar este registro?')) return
    await adminDelete(`${resource}/${row.id}`)
    load()
  }

  return (
    <div>
      <div className="admin-head">
        <h2 className="section-title">{title}</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo</button>
      </div>

      <div className="card" style={{ padding: '0.5rem 1rem', overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
                <td style={{ whiteSpace: 'nowrap' }}>
                  {rowActions && rowActions(row, load)}
                  <button className="link-btn" onClick={() => openEdit(row)}>✏️</button>
                  <button className="link-btn" onClick={() => remove(row)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="tag-dim" style={{ padding: '1rem' }}>Sin registros.</p>}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <form className="modal-content" onSubmit={save}>
            <h3 style={{ marginBottom: '1rem' }}>{editing.id ? 'Editar' : 'Nuevo'}</h3>
            {fields.map((f) => (
              <div className="field" key={f.name}>
                <label>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={form[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)}>
                    <option value="">—</option>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea rows="3" value={form[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)} />
                ) : f.type === 'media' || f.type === 'image' || f.type === 'video' ? (
                  <MediaPicker
                    value={form[f.name] ?? ''}
                    onChange={(url) => onChange(f.name, url)}
                    accept={f.type === 'image' ? 'image' : f.type === 'video' ? 'video' : 'any'}
                  />
                ) : (
                  <input type={f.type || 'text'} value={form[f.name] ?? ''}
                    onChange={(e) => onChange(f.name, e.target.value)} />
                )}
              </div>
            ))}
            <button className="btn btn-primary" type="submit">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
