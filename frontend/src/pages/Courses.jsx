import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCourses, submitContact } from '../api/client'
import Reveal from '../components/Reveal'
import CourseCard from '../components/CourseCard'
import DetailModal from '../components/DetailModal'
import { whatsappLink } from '../components/WhatsAppButton'

const EMPTY_ENROLL = { name: '', phone: '', email: '', consent: false }

export default function Courses() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState(null)
  const [showEnroll, setShowEnroll] = useState(false)
  const [form, setForm] = useState(EMPTY_ENROLL)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => { getCourses().then(setCourses).catch(() => {}) }, [])

  const openEnroll = () => { setShowEnroll(true); setSubmitted(false); setSubmitError(null); setForm(EMPTY_ENROLL) }
  const closeEnroll = () => setShowEnroll(false)

  const handleEnroll = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitContact({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        course_interest_id: selected?.id,
        message: `Quiero apuntarme al curso: ${selected?.name}`,
        preferred_channel: 'whatsapp',
        source: 'web',
        consent: form.consent,
      })
      setSubmitted(true)
    } catch {
      setSubmitError('No se pudo enviar. Por favor, inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const closeAll = () => { setSelected(null); setShowEnroll(false) }

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('courses.title')}</h2>
        <p className="section-sub">{t('courses.subtitle')} · {t('courses.noPartnerNote')}</p>
      </Reveal>
      <div className="grid grid-3">
        {courses.map((c) => (
          <Reveal key={c.id}><CourseCard course={c} onClick={() => { setSelected(c); setShowEnroll(false) }} /></Reveal>
        ))}
      </div>

      {selected && (
        <DetailModal
          onClose={closeAll}
          mainImage={selected.image_url}
          accentColor={selected.calendar_color}
          videoUrl={selected.video_url}
          extraImages={selected.extra_images}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span className="badge">{selected.level}</span>
            {selected.style && <span className="tag-dim">{selected.style}</span>}
            {selected.room  && <span className="tag-dim">📍 {selected.room}</span>}
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>{selected.name}</h3>
          <p className="tag-dim" style={{ lineHeight: 1.55, marginBottom: '0.75rem' }}>{selected.description}</p>
          {selected.teachers?.length > 0 && (
            <p className="tag-dim"><strong>{t('common.teachers')}:</strong> {selected.teachers.map((x) => x.full_name).join(', ')}</p>
          )}
          {selected.duration && (
            <p className="tag-dim"><strong>{t('common.duration')}:</strong> {selected.duration}</p>
          )}
          <div className="price-row" style={{ marginTop: '0.75rem' }}>
            <span className="price-big">{Number(selected.price)}€{t('common.perMonth')}</span>
            <span className="tag-dim">{t('common.trial')}: {Number(selected.trial_price)}€</span>
          </div>

          {!showEnroll ? (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={openEnroll}>
                ✍️ Quiero apuntarme
              </button>
              <a className="btn btn-ghost"
                href={whatsappLink(`Hola, me interesa el curso ${selected.name} ${selected.level}`)}
                target="_blank" rel="noreferrer">💬 WhatsApp</a>
            </div>
          ) : submitted ? (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--green)', borderRadius: 8, color: '#000', fontWeight: 600 }}>
              ¡Listo! Te contactaremos pronto.
              <button className="btn btn-ghost" style={{ marginLeft: '1rem', padding: '2px 10px', fontSize: '0.85rem' }} onClick={closeEnroll}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleEnroll} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.95rem' }}>Pre-inscripción: {selected.name}</p>
              <input
                required
                placeholder="Nombre completo *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                required
                type="tel"
                placeholder="Teléfono *"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <input
                type="email"
                placeholder="Email (opcional)"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <input type="checkbox" required checked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} style={{ marginTop: 2 }} />
                Acepto que se traten mis datos para gestionar esta solicitud.
              </label>
              {submitError && <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{submitError}</p>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Enviando…' : 'Enviar solicitud'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={closeEnroll}>Cancelar</button>
              </div>
            </form>
          )}
        </DetailModal>
      )}
    </div>
  )
}
