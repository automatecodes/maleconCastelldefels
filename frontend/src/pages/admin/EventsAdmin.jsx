import CrudTable from './CrudTable'
import AiImageButton from './AiImageButton'
import { generateEventImage } from '../../api/client'

const STATUSES = ['proximo', 'publicado', 'pasado']

export default function EventsAdmin() {
  return (
    <CrudTable
      title="Eventos"
      resource="events"
      rowActions={(row, reload) => (
        <AiImageButton onGenerate={() => generateEventImage(row.id)} reload={reload} />
      )}
      empty={{ status: 'proximo' }}
      columns={[
        { key: 'name', label: 'Nombre' },
        { key: 'date', label: 'Fecha' },
        { key: 'location', label: 'Ubicación' },
        { key: 'status', label: 'Estado', render: (r) => <span className="badge">{r.status}</span> },
      ]}
      toPayload={(f) => ({ ...f, price: f.price ? Number(f.price) : null })}
      fields={[
        { name: 'slug', label: 'Slug (URL)' },
        { name: 'name', label: 'Nombre' },
        { name: 'subtitle', label: 'Subtítulo' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'image_url', label: 'URL imagen' },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'time_range', label: 'Horario (11:00 – 23:00)' },
        { name: 'location', label: 'Ubicación' },
        { name: 'price', label: 'Precio (€)', type: 'number' },
        { name: 'artists', label: 'Artistas / DJ' },
        { name: 'styles', label: 'Estilos' },
        { name: 'activities', label: 'Actividades (una por línea)', type: 'textarea' },
        { name: 'notes', label: 'Notas', type: 'textarea' },
        { name: 'status', label: 'Estado', type: 'select', options: STATUSES.map((s) => ({ value: s, label: s })) },
      ]}
    />
  )
}
