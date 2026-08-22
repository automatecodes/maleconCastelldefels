import { useEffect, useState, useCallback } from 'react'
import { adminPatch, adminPost } from '../../api/client'

const STATES = ['nuevo', 'contactado', 'convertido', 'descartado']
const PAGE_SIZE = 20

export default function LeadsAdmin() {
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')

  const load = useCallback(async (p = page) => {
    const skip = p * PAGE_SIZE
    const params = new URLSearchParams({ skip, limit: PAGE_SIZE })
    if (filter) params.set('status', filter)
    const res = await fetch(`/api/admin/leads?${params}`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    setLeads(data.items)
    setTotal(data.total)
  }, [filter, page])

  useEffect(() => { setPage(0); load(0) }, [filter])
  useEffect(() => { load(page) }, [page])

  const setStatus = async (lead, status) => {
    await adminPatch(`leads/${lead.id}`, { status })
    load(page)
  }
  const convert = async (lead) => {
    if (!confirm(`¿Convertir "${lead.name}" en estudiante?`)) return
    await adminPost(`leads/${lead.id}/convert`, {})
    load(page)
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
        {total > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0.5rem', justifyContent: 'flex-end' }}>
            <span className="tag-dim" style={{ fontSize: '0.85rem' }}>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </span>
            <button className="btn btn-ghost" disabled={page === 0}
              onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <button className="btn btn-ghost" disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}>Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  )
}
