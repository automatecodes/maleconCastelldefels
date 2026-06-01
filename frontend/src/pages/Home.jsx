import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCourses, getEvents, getSocial } from '../api/client'
import { whatsappLink } from '../components/WhatsAppButton'
import Reveal from '../components/Reveal'
import SocialFeed from '../components/SocialFeed'
import CourseCard from '../components/CourseCard'

export default function Home() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [events, setEvents] = useState([])
  const [social, setSocial] = useState([])

  useEffect(() => {
    getCourses().then((c) => setCourses(c.filter((x) => x.featured).slice(0, 3))).catch(() => {})
    getEvents().then((e) => setEvents(e.filter((x) => x.status !== 'pasado').slice(0, 2))).catch(() => {})
    getSocial().then((s) => setSocial(s.slice(0, 4))).catch(() => {})
  }, [])

  return (
    <>
      {/* Hero con vídeo de fondo */}
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline poster="/media/escuela/hero-poster.jpg"
          onError={(e) => { e.target.style.display = 'none' }}>
          <source src="/media/escuela/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-fallback" />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="badge pill-tag">🌴 {t('common.noPartner')}</span>
          <h1>{t('home.heroTitle').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="accent">{t('home.heroTitle').split(' ').slice(-1)}</span></h1>
          <p>{t('home.heroSubtitle')}</p>
          <div className="hero-ctas">
            <Link to="/contacto" className="btn btn-primary">{t('home.ctaTrial')}</Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="btn btn-ghost">
              {t('home.ctaWhatsapp')}
            </a>
          </div>
        </div>
      </section>

      {/* Cursos destacados */}
      <section className="section container">
        <Reveal>
          <h2 className="section-title">{t('home.featuredCourses').split(' ')[0]}{' '}
            <span className="accent">{t('home.featuredCourses').split(' ').slice(1).join(' ')}</span></h2>
          <p className="section-sub">{t('home.featuredCoursesSub')}</p>
        </Reveal>
        <div className="grid grid-3">
          {courses.map((c) => <Reveal key={c.id}><CourseCard course={c} /></Reveal>)}
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/cursos" className="btn btn-ghost">{t('common.viewMore')}</Link>
        </div>
      </section>

      {/* Próximos eventos */}
      {events.length > 0 && (
        <section className="section container">
          <Reveal>
            <h2 className="section-title">{t('home.upcomingEvents')}</h2>
            <p className="section-sub">{t('home.upcomingEventsSub')}</p>
          </Reveal>
          <div className="grid grid-2">
            {events.map((e) => (
              <Reveal key={e.id}>
                <Link to="/eventos" className="card">
                  <div className="media-top">
                    <img src={e.image_url} alt={e.name} onError={(ev) => { ev.target.style.opacity = 0.15 }} />
                  </div>
                  <div className="card-body">
                    <span className="badge">{e.date}</span>
                    <h3 style={{ margin: '0.5rem 0' }}>{e.name}</h3>
                    <p className="tag-dim">{e.subtitle}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Club social */}
      <section className="section container">
        <Reveal>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <h2 className="section-title">{t('home.clubTitle')}</h2>
            <p className="section-sub" style={{ margin: '1rem auto 0' }}>{t('home.clubText')}</p>
          </div>
        </Reveal>
      </section>

      {/* Feed de redes */}
      {social.length > 0 && (
        <section className="section container">
          <Reveal>
            <h2 className="section-title">{t('home.social')}</h2>
            <p className="section-sub">{t('home.socialSub')}</p>
          </Reveal>
          <SocialFeed posts={social} />
        </section>
      )}
    </>
  )
}
