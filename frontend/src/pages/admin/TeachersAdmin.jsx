import CrudTable from './CrudTable'

export default function TeachersAdmin() {
  return (
    <CrudTable
      title="Profesores"
      resource="teachers"
      empty={{ is_active: true }}
      columns={[
        { key: 'full_name', label: 'Nombre' },
        { key: 'specialties', label: 'Especialidades' },
        { key: 'email', label: 'Email' },
        { key: 'is_active', label: 'Activo', render: (r) => (r.is_active ? 'Sí' : 'No') },
      ]}
      toPayload={(f) => ({ ...f, is_active: f.is_active === 'false' ? false : Boolean(f.is_active) })}
      fields={[
        { name: 'slug', label: 'Slug (URL)' },
        { name: 'full_name', label: 'Nombre completo' },
        { name: 'specialties', label: 'Especialidades' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'bio', label: 'Biografía', type: 'textarea' },
        { name: 'photo_url', label: 'URL foto' },
        { name: 'cv_pdf_url', label: 'URL CV (PDF)' },
        { name: 'video_url', label: 'URL vídeo' },
        { name: 'availability', label: 'Disponibilidad' },
        { name: 'internal_notes', label: 'Notas internas', type: 'textarea' },
        { name: 'is_active', label: 'Activo', type: 'select', options: [{ value: true, label: 'Sí' }, { value: false, label: 'No' }] },
      ]}
    />
  )
}
