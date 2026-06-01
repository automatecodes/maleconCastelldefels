import CrudTable from './CrudTable'

const STATUSES = ['lead', 'prueba', 'activo', 'baja', 'lista de espera']
const SOURCES = ['whatsapp', 'web', 'redes', 'recomendacion', 'evento']

export default function StudentsAdmin() {
  return (
    <CrudTable
      title="Estudiantes"
      resource="students"
      empty={{ status: 'lead' }}
      columns={[
        { key: 'first_name', label: 'Nombre', render: (r) => `${r.first_name} ${r.last_name || ''}` },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'current_level', label: 'Nivel' },
        { key: 'status', label: 'Estado', render: (r) => <span className="badge">{r.status}</span> },
        { key: 'lead_source', label: 'Origen' },
      ]}
      fields={[
        { name: 'first_name', label: 'Nombre' },
        { name: 'last_name', label: 'Apellidos' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'city', label: 'Ciudad' },
        { name: 'postal_code', label: 'Código postal' },
        { name: 'current_level', label: 'Nivel' },
        { name: 'status', label: 'Estado', type: 'select', options: STATUSES.map((s) => ({ value: s, label: s })) },
        { name: 'lead_source', label: 'Origen', type: 'select', options: SOURCES.map((s) => ({ value: s, label: s })) },
        { name: 'notes', label: 'Notas', type: 'textarea' },
        { name: 'guardian_name', label: 'Tutor legal (menores)' },
        { name: 'guardian_contact', label: 'Contacto tutor' },
      ]}
    />
  )
}
