import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getCourses, submitContact } from '../api/client'
import Reveal from '../components/Reveal'
import { whatsappLink } from '../components/WhatsAppButton'

const LEVELS = ['N1', 'N2', 'Único', 'Abierto']

export default function Contact() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({
    name: '', email: '', phone: '', message: '',
    level: '', course_interest_id: '', consent: false,
  })
  const [status, setStatus] = useState(null) // sending | ok | error

  useEffect(() => { getCourses().then(setCourses).catch(() => {}) }, [])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.consent) return
    setStatus('sending')
    try {
      await submitContact({
        ...form,
        course_interest_id: form.course_interest_id ? Number(form.course_interest_id) : null,
        source: 'web',
        preferred_channel: 'whatsapp',
      })
      setStatus('ok')
      setForm({ name: '', email: '', phone: '', message: '', level: '', course_interest_id: '', consent: false })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="container section">
      <Reveal>
        <h2 className="section-title">{t('contact.title')}</h2>
        <p className="section-sub">{t('contact.subtitle')}</p>
      </Reveal>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* WhatsApp destacado como canal preferente */}
        <Reveal>
          <div className="card" style={{ padding: '2rem' }}>
            <h3>{t('contact.preferWhatsapp')}</h3>
            <a className="btn btn-primary" style={{ margin: '1.25rem 0' }}
              href={whatsappLink()} target="_blank" rel="noreferrer">
              💬 {t('common.writeUs')} +34 672 895 239
            </a>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />
            <h4>{t('contact.ourContact')}</h4>
            <p className="tag-dim">📍 {t('contact.location')}</p>
            <p className="tag-dim">📞 +34 672 895 239</p>
            <iframe
              title="Mapa Castelldefels"
              className="modal-img"
              style={{ marginTop: '1rem', border: 0, height: 240 }}
              src="https://www.openstreetmap.org/export/embed.html?bbox=1.95%2C41.26%2C2.02%2C41.30&layer=mapnik&marker=41.28%2C1.98"
              loading="lazy"
            />
          </div>
        </Reveal>

        {/* Formulario → Lead */}
        <Reveal>
          <form className="card" style={{ padding: '2rem' }} onSubmit={onSubmit}>
            <div className="field">
              <label>{t('contact.name')} *</label>
              <input name="name" required value={form.name} onChange={onChange} />
            </div>
            <div className="field">
              <label>{t('contact.email')}</label>
              <input type="email" name="email" value={form.email} onChange={onChange} />
            </div>
            <div className="field">
              <label>{t('contact.phone')}</label>
              <input name="phone" value={form.phone} onChange={onChange} />
            </div>
            <div className="field">
              <label>{t('contact.interestLevel')}</label>
              <select name="level" value={form.level} onChange={onChange}>
                <option value="">{t('contact.selectLevel')}</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('contact.interestCourse')}</label>
              <select name="course_interest_id" value={form.course_interest_id} onChange={onChange}>
                <option value="">{t('contact.selectCourse')}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name} {c.level}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('contact.message')}</label>
              <textarea name="message" rows="4" value={form.message} onChange={onChange} />
            </div>
            <div className="field" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input type="checkbox" name="consent" checked={form.consent} onChange={onChange}
                style={{ width: 'auto', marginTop: '0.3rem' }} required />
              <label style={{ margin: 0 }}>
                {t('contact.consent')} <Link to="/legal/privacidad" className="accent">↗</Link>
              </label>
            </div>
            <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? t('contact.sending') : t('contact.send')}
            </button>
            {status === 'ok' && <p className="accent" style={{ marginTop: '1rem' }}>{t('contact.success')}</p>}
            {status === 'error' && <p style={{ color: 'var(--amber)', marginTop: '1rem' }}>{t('contact.error')}</p>}
          </form>
        </Reveal>
      </div>
    </div>
  )
}
