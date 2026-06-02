import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { adminGet } from '../../api/client'

const COLORS = ['#52C41A', '#F59E0B', '#2F9EE5', '#B62FE5', '#E5482F', '#45A616']

function Kpi({ label, value, suffix }) {
  return (
    <div className="card kpi">
      <div className="kpi-value">{value}{suffix}</div>
      <div className="tag-dim">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [s, setS] = useState(null)

  useEffect(() => { adminGet('stats/overview').then(setS).catch(() => {}) }, [])
  if (!s) return <p>{t('common.loading')}</p>

  const levelData = Object.entries(s.distribucion_por_nivel).map(([k, v]) => ({ name: k, value: v }))
  const sourceData = Object.entries(s.captacion.por_origen).map(([k, v]) => ({ name: k, value: v }))

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>{t('admin.stats')}</h2>

      <div className="grid grid-4">
        <Kpi label="Alumnos activos" value={s.alumnado.activos} />
        <Kpi label="Retención" value={s.alumnado.retencion_pct} suffix="%" />
        <Kpi label="Abandono" value={s.alumnado.abandono_pct} suffix="%" />
        <Kpi label="Leads totales" value={s.captacion.total_leads} />
        <Kpi label="Conversión lead→alumno" value={s.captacion.tasa_conversion_pct} suffix="%" />
        <Kpi label="Clics WhatsApp" value={s.captacion.clics_whatsapp} />
        <Kpi label="Bajas" value={s.alumnado.bajas} />
        <Kpi label="Eventos próximos" value={s.eventos_proximos.length} />
      </div>

      <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card chart-card">
          <h4>Estudiantes por curso</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={s.estudiantes_por_curso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2622" />
              <XAxis dataKey="course" stroke="#9AA39C" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#9AA39C" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#121814', border: '1px solid #1E2622' }} />
              <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                {s.estudiantes_por_curso.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h4>Distribución por nivel</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={levelData} dataKey="value" nameKey="name" outerRadius={90} label>
                {levelData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#121814', border: '1px solid #1E2622' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h4>Leads por origen</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90} label>
                {sourceData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#121814', border: '1px solid #1E2622' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h4>Altas por mes</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={s.series.altas_por_mes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2622" />
              <XAxis dataKey="month" stroke="#9AA39C" fontSize={11} />
              <YAxis stroke="#9AA39C" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#121814', border: '1px solid #1E2622' }} />
              <Line type="monotone" dataKey="count" stroke="#52C41A" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ocupación por curso */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Ocupación por curso (% capacidad)</h4>
        <table>
          <thead><tr><th>Curso</th><th>Nivel</th><th>Inscritos</th><th>Capacidad</th><th>Ocupación</th></tr></thead>
          <tbody>
            {s.ocupacion_por_curso.map((o, i) => (
              <tr key={i}>
                <td><span style={{ color: o.color }}>●</span> {o.course}</td>
                <td>{o.level}</td><td>{o.enrolled}</td><td>{o.capacity}</td>
                <td>{o.occupancy_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Carga profesorado */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Carga de profesorado</h4>
        <table>
          <thead><tr><th>Profesor</th><th>Cursos</th><th>Alumnos</th></tr></thead>
          <tbody>
            {s.carga_profesorado.map((c, i) => (
              <tr key={i}><td>{c.teacher}</td><td>{c.courses}</td><td>{c.students}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ingresos: placeholder hasta fase de pagos (§11) */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem', opacity: 0.7 }}>
        <h4>💶 Ingresos</h4>
        <p className="tag-dim">{s.ingresos.nota}</p>
      </div>
    </div>
  )
}
