import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCourses, getEvents, getSocial, getVideoSettings } from '../api/client'
import { whatsappLink } from '../components/WhatsAppButton'
import Reveal from '../components/Reveal'
import SocialFeed from '../components/SocialFeed'
import CourseCard from '../components/CourseCard'
import salsaVideo from '../media/bailandoSalsa.optimize.mp4'

export default function Home() {
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [events, setEvents] = useState([])
  const [social, setSocial] = useState([])
  const [videoSettings, setVideoSettings] = useState({ overlay: 0.05, speed: 1.0 })
  const videoRef = useRef(null)

  useEffect(() => {
    getCourses().then((c) => {
      setAllCourses(c)
      setCourses(c.filter((x) => x.featured).slice(0, 3))
    }).catch(() => {})
    getEvents().then((e) => setEvents(e.filter((x) => x.computed_status === 'próximo').slice(0, 2))).catch(() => {})
    getSocial().then((s) => setSocial(s.slice(0, 4))).catch(() => {})
    getVideoSettings().then(setVideoSettings).catch(() => {})
  }, [])

  // Carga diferida del vídeo: la página pinta primero, el vídeo llega después
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const load = () => {
      video.src = salsaVideo
      video.load()
      video.play().catch(() => {})
    }
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 2000 })
    } else {
      setTimeout(load, 200)
    }
  }, [])

  // Aplica velocidad cuando el vídeo ya tiene src
  useEffect(() => {
    const video = videoRef.current
    if (video) video.playbackRate = videoSettings.speed
  }, [videoSettings.speed])

  const proximaApertura = allCourses.filter((c) => c.status === 'próxima apertura')

  return (
    <>
      {/* Hero con vídeo de fondo */}
      <section className="hero">
        {/* Sin src inicial — se asigna en useEffect para no bloquear el LCP */}
        <video ref={videoRef} className="hero-video" muted loop playsInline
          onError={(e) => { e.target.style.display = 'none' }} />
        <div className="hero-fallback" />
        <div className="hero-dim" style={{ opacity: videoSettings.overlay }} />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="badge pill-tag">🌴 {t('common.noPartner')}</span>
          <h1>{t('home.heroTitle').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="accent">{t('home.heroTitle').split(' ').slice(-1)}</span></h1>
          <p>{t('home.heroSubtitle')}</p>
          <div className="hero-ctas">
            <Link to="/contacto" className="btn btn-primary">{t('home.ctaTrial')}</Link>
          </div>
        </div>
      </section>

      {/* Próxima apertura */}
      {proximaApertura.length > 0 && (
        <section className="section container">
          <Reveal>
            <h2 className="section-title">
              {(() => {
                const words = 'Próximamente'.split(' ')
                if (words.length === 1) return <span className="accent">{words[0]}</span>
                return (
                  <>
                    {words.slice(0, -1).join(' ')}{' '}
                    <span className="accent">{words[words.length - 1]}</span>
                  </>
                )
              })()}
            </h2>
          </Reveal>
          <div className="grid grid-3">
            {proximaApertura.map((c) => (
              <Reveal key={c.id}>
                <div className="card">
                  {c.image_url && (
                    <div className="media-top">
                      <img src={c.image_url} alt={c.name} onError={(e) => { e.target.style.opacity = 0.15 }} />
                    </div>
                  )}
                  <div className="card-body">
                    <span className="badge" style={{ background: 'rgba(245,158,11,0.18)', color: '#F59E0B', marginBottom: '0.5rem', display: 'inline-block' }}>
                      Próxima apertura
                    </span>
                    <h3 style={{ margin: '0.25rem 0' }}>{c.name}</h3>
                    {c.level && <p className="tag-dim">{c.level}</p>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

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
        <div style={{ marginTop: '1rem' }}>
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
                    <img src={e.image_url} alt={e.name}
                      style={{ objectPosition: e.image_focal || '50% 50%' }}
                      onError={(ev) => { ev.target.style.opacity = 0.15 }} />
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
          <div className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
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
