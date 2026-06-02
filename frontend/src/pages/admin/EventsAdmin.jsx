import CrudTable from './CrudTable'
import AiImageButton from './AiImageButton'
import { generateEventImage } from '../../api/client'

const statusStyle = (s) => {
  if (s === 'próximo') return { background: 'rgba(82,196,26,0.18)', color: '#52C41A' }
  return { background: 'rgba(120,120,120,0.18)', color: '#888' }
}

export default function EventsAdmin() {
  return (
    <CrudTable
      title="Eventos"
      resource="events"
      rowActions={(row, reload) => (
        <AiImageButton onGenerate={() => generateEventImage(row.id)} reload={reload} />
      )}
      empty={{ status: 'próximo' }}
      columns={[
        { key: 'name', label: 'Nombre' },
        { key: 'date', label: 'Fecha' },
        { key: 'location', label: 'Ubicación' },
        {
          key: 'computed_status',
          label: 'Estado',
          render: (r) => {
            const s = r.computed_status || r.status || ''
            return (
              <span className="badge" style={statusStyle(s)}>
                {s}
              </span>
            )
          },
        },
      ]}
      toPayload={(f) => ({ ...f, price: f.price ? Number(f.price) : null })}
      fields={[
        { name: 'slug', label: 'Slug (URL)' },
        { name: 'name', label: 'Nombre' },
        { name: 'subtitle', label: 'Subtítulo' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'is_published', label: 'Publicado en la web', type: 'checkbox' },
        { name: 'image_url',   label: 'Imagen principal', type: 'image' },
        { name: 'image_focal', label: 'Punto focal',      type: 'focal', sourceField: 'image_url' },
        { name: 'video_url',   label: 'Vídeo',            type: 'video' },
        { name: 'extra_images', label: 'Imágenes adicionales', type: 'multi-image' },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'time_range', label: 'Horario (11:00 – 23:00)' },
        { name: 'location', label: 'Ubicación' },
        { name: 'price', label: 'Precio (€)', type: 'number' },
        { name: 'artists', label: 'Artistas / DJ' },
        { name: 'styles', label: 'Estilos' },
        { name: 'activities', label: 'Actividades (una por línea)', type: 'textarea' },
        { name: 'notes', label: 'Notas', type: 'textarea' },
      ]}
    />
  )
}
