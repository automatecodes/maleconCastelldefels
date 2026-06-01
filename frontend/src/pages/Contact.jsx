import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getCourses, getEvents, getSocial, submitContact } from '../api/client'
import Reveal from '../components/Reveal'
import { whatsappLink } from '../components/WhatsAppButton'

const LEVELS = ['Inicio', 'Intermedio', 'Avanzado']

function PromoBlock() {
  const [event, setEvent] = useState(null)
  const [social, setSocial] = useState(null)
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    getEvents().then((evs) => {
      const next = evs.find((e) => e.computed_status === 'próximo')
      if (next) setEvent(next)
    }).catch(() => {})
    getSocial().then((posts) => { if (posts[0]) setSocial(posts[0]) }).catch(() => {})
  }, [])

  const items = [event, social].filter(Boolean)

  useEffect(() => {
    if (items.length < 2) return
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % items.length), 4000)
    return () => clearInterval(timerRef.current)
  }, [items.length])

  if (!items.length) return null

  const item = items[idx % items.length]
  const isEvent = item === event

  return (
    <div className="card" style={{ padding: '1.5rem', overflow: 'hidden', position: 'relative' }}>
      {isEvent && item.image_url && (
        <div className="media-top" style={{ borderRadius: 10, marginBottom: '1rem' }}>
          <img src={item.image_url} alt={item.name} onError={(e) => { e.target.style.opacity = 0.15 }} />
        </div>
      )}
      {!isEvent && item.thumbnail_url && (
        <div className="media-top" style={{ borderRadius: 10, marginBottom: '1rem' }}>
          <img src={item.thumbnail_url} alt="Post" onError={(e) => { e.target.style.opacity = 0.15 }} />
        </div>
      )}
      <span className="badge" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
        {isEvent ? '📅 Próximo evento' : `📱 ${item.platform}`}
      </span>
      <h4 style={{ margin: '0.25rem 0' }}>{isEvent ? item.name : ''}</h4>
      <p className="tag-dim" style={{ fontSize: '0.9rem' }}>
        {isEvent ? `${item.date} · ${item.location || ''}` : item.text?.slice(0, 120)}
      </p>
      {items.length > 1 && (
        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.75rem' }}>
          {items.map((_, i) => (
            <span key={i} onClick={() => setIdx(i)} style={{
              width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
              background: i === idx % items.length ? 'var(--green)' : 'var(--border)',
              display: 'inline-block',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Contact() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({
    name: '', email: '', phone: '', message: '',
    level: '', course_interest_id: '', consent: false,
  })
  const [status, setStatus] = useState(null) // null | sending-wa | sending-email | ok-wa | ok-email | error

  useEffect(() => { getCourses().then(setCourses).catch(() => {}) }, [])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const buildWAMessage = () => {
    const parts = [`Hola, soy ${form.name}.`]
    if (form.course_interest_id) {
      const c = courses.find((x) => String(x.id) === String(form.course_interest_id))
      if (c) parts.push(`Me interesa el curso: ${c.name}.`)
    }
    if (form.level) parts.push(`Nivel: ${form.level}.`)
    if (form.message) parts.push(form.message)
    return parts.join(' ')
  }

  const sendViaWhatsApp = async (e) => {
    e.preventDefault()
    if (!form.consent) return
    setStatus('sending-wa')
    try {
      await submitContact({
        ...form,
        course_interest_id: form.course_interest_id ? Number(form.course_interest_id) : null,
        source: 'web', preferred_channel: 'whatsapp',
      })
      setStatus('ok-wa')
      window.open(whatsappLink(buildWAMessage()), '_blank')
    } catch {
      setStatus('error')
    }
  }

  const sendViaEmail = async (e) => {
    e.preventDefault()
    if (!form.consent) return
    setStatus('sending-email')
    try {
      await submitContact({
        ...form,
        course_interest_id: form.course_interest_id ? Number(form.course_interest_id) : null,
        source: 'web', preferred_channel: 'email',
      })
      setStatus('ok-email')
      setForm({ name: '', email: '', phone: '', message: '', level: '', course_interest_id: '', consent: false })
    } catch {
      setStatus('error')
    }
  }

  const done = status === 'ok-wa' || status === 'ok-email'
  const sending = status === 'sending-wa' || status === 'sending-email'

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('contact.title')}</h2>
        <p className="section-sub">{t('contact.subtitle')}</p>
      </Reveal>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* Columna izquierda: promo block + datos */}
        <Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <PromoBlock />
            <div className="card" style={{ padding: '1.5rem' }}>
              <h4>{t('contact.ourContact')}</h4>
              <p className="tag-dim">📍 Carrer de Tomàs Edison, 20, 08860 Castelldefels</p>
              <p className="tag-dim">📞 +34 672 895 239</p>
              <iframe
                title="Mapa Castelldefels"
                className="modal-img"
                style={{ marginTop: '1rem', border: 0, height: 200, borderRadius: 10 }}
                src="https://www.openstreetmap.org/export/embed.html?bbox=1.95%2C41.26%2C2.02%2C41.30&layer=mapnik&marker=41.28%2C1.98"
                loading="lazy"
              />
            </div>
          </div>
        </Reveal>

        {/* Columna derecha: formulario obligatorio + dos opciones de envío */}
        <Reveal>
          <form className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('contact.title')}</h3>
            <div className="field">
              <label>{t('contact.name')} *</label>
              <input name="name" required value={form.name} onChange={onChange} disabled={done} />
            </div>
            <div className="field">
              <label>{t('contact.email')}</label>
              <input type="email" name="email" value={form.email} onChange={onChange} disabled={done} />
            </div>
            <div className="field">
              <label>{t('contact.phone')}</label>
              <input name="phone" value={form.phone} onChange={onChange} disabled={done} />
            </div>
            <div className="field">
              <label>{t('contact.interestLevel')}</label>
              <select name="level" value={form.level} onChange={onChange} disabled={done}>
                <option value="">{t('contact.selectLevel')}</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('contact.interestCourse')}</label>
              <select name="course_interest_id" value={form.course_interest_id} onChange={onChange} disabled={done}>
                <option value="">{t('contact.selectCourse')}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('contact.message')}</label>
              <textarea name="message" rows="3" value={form.message} onChange={onChange} disabled={done} />
            </div>
            <div className="field" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input type="checkbox" name="consent" checked={form.consent} onChange={onChange}
                style={{ width: 'auto', marginTop: '0.3rem' }} required disabled={done} />
              <label style={{ margin: 0 }}>
                {t('contact.consent')} <Link to="/legal/privacidad" className="accent">↗</Link>
              </label>
            </div>

            {!done ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={sendViaWhatsApp}
                  disabled={sending || !form.name || !form.consent}
                  style={{ flex: 1, minWidth: 160 }}>
                  {status === 'sending-wa' ? t('contact.sending') : '💬 Enviar por WhatsApp'}
                </button>
                <button className="btn btn-ghost" onClick={sendViaEmail}
                  disabled={sending || !form.name || !form.consent}
                  style={{ flex: 1, minWidth: 160 }}>
                  {status === 'sending-email' ? t('contact.sending') : '✉️ Enviar por email'}
                </button>
              </div>
            ) : (
              <p className="accent" style={{ marginTop: '1rem' }}>
                {status === 'ok-wa' ? '✅ Mensaje preparado. WhatsApp abierto.' : t('contact.success')}
              </p>
            )}
            {status === 'error' && (
              <p style={{ color: 'var(--amber)', marginTop: '1rem' }}>{t('contact.error')}</p>
            )}
          </form>
        </Reveal>
      </div>
    </div>
  )
}
