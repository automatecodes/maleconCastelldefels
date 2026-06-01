import CrudTable from './CrudTable'
import AiImageButton from './AiImageButton'
import { generateCourseImage } from '../../api/client'

const STATUSES = ['abierto', 'cerrado', 'lista de espera']

export default function CoursesAdmin() {
  return (
    <CrudTable
      title="Cursos"
      resource="courses"
      rowActions={(row, reload) => (
        <AiImageButton onGenerate={() => generateCourseImage(row.id)} reload={reload} />
      )}
      empty={{ calendar_color: '#2FE56B', status: 'abierto', price: 33, trial_price: 12.5, capacity: 20 }}
      columns={[
        { key: 'name', label: 'Nombre', render: (r) => (<><span style={{ color: r.calendar_color }}>●</span> {r.name}</>) },
        { key: 'level', label: 'Nivel' },
        { key: 'style', label: 'Estilo' },
        { key: 'price', label: '€/mes' },
        { key: 'capacity', label: 'Plazas' },
        { key: 'enrolled_count', label: 'Inscritos' },
        { key: 'status', label: 'Estado' },
      ]}
      toPayload={(f) => ({
        ...f,
        price: Number(f.price) || 0,
        trial_price: Number(f.trial_price) || 0,
        capacity: Number(f.capacity) || 0,
        featured: f.featured === 'true' || f.featured === true,
        teacher_ids: (f.teachers || []).map((t) => t.id),
      })}
      fields={[
        { name: 'slug', label: 'Slug (URL)' },
        { name: 'name', label: 'Nombre' },
        { name: 'level', label: 'Nivel' },
        { name: 'style', label: 'Estilo' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'image_url', label: 'URL imagen' },
        { name: 'video_url', label: 'URL vídeo' },
        { name: 'calendar_color', label: 'Color calendario', type: 'color' },
        { name: 'room', label: 'Sala' },
        { name: 'capacity', label: 'Capacidad', type: 'number' },
        { name: 'duration', label: 'Duración' },
        { name: 'price', label: 'Precio (€/mes)', type: 'number' },
        { name: 'trial_price', label: 'Precio prueba (€)', type: 'number' },
        { name: 'status', label: 'Estado', type: 'select', options: STATUSES.map((s) => ({ value: s, label: s })) },
        { name: 'featured', label: 'Destacado', type: 'select', options: [{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }] },
      ]}
    />
  )
}
