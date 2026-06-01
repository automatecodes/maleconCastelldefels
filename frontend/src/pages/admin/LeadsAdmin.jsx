import { useEffect, useState } from 'react'
import { adminGet, adminPatch, adminPost } from '../../api/client'

const STATES = ['nuevo', 'contactado', 'convertido', 'descartado']

export default function LeadsAdmin() {
  const [leads, setLeads] = useState([])
  const [filter, setFilter] = useState('')

  const load = () => adminGet('leads' + (filter ? `?status=${filter}` : '')).then(setLeads).catch(() => {})
  useEffect(() => { load() }, [filter])

  const setStatus = async (lead, status) => {
    await adminPatch(`leads/${lead.id}`, { status })
    load()
  }
  const convert = async (lead) => {
    if (!confirm(`¿Convertir "${lead.name}" en estudiante?`)) return
    await adminPost(`leads/${lead.id}/convert`, {})
    load()
  }

  return (
    <div>
      <div className="admin-head">
        <h2 className="section-title">Bandeja de Leads</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Todos los estados</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: '0.5rem 1rem', overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Contacto</th><th>Nivel</th><th>Canal</th>
              <th>Origen</th><th>Estado</th><th>Mensaje</th><th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.email}<br /><span className="tag-dim">{l.phone}</span></td>
                <td>{l.level}</td>
                <td>{l.preferred_channel}</td>
                <td>{l.source}</td>
                <td>
                  <select value={l.status} onChange={(e) => setStatus(l, e.target.value)} style={{ width: 'auto' }}>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="tag-dim" style={{ maxWidth: 220 }}>{l.message}</td>
                <td>
                  {l.status !== 'convertido' && (
                    <button className="link-btn" onClick={() => convert(l)} title="Convertir a estudiante">➕👤</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <p className="tag-dim" style={{ padding: '1rem' }}>Sin leads.</p>}
      </div>
    </div>
  )
}
