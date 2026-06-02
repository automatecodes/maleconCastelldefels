import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// ── Iconos de contacto ─────────────────────────────────────────────────────────
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 012.93-8.64A2 2 0 018.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L12.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0126 15h-3a2 2 0 00-1-.08z"/>
    </svg>
  )
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

// ── Iconos de redes sociales ───────────────────────────────────────────────────
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  )
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.17 8.17 0 004.77 1.52V7.01a4.85 4.85 0 01-1-.32z"/>
    </svg>
  )
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0A0E0B"/>
    </svg>
  )
}

const SOCIAL = [
  { href: 'https://www.instagram.com/elmalecondelasalsa/',  Icon: InstagramIcon, label: 'Instagram' },
  { href: 'https://www.facebook.com/elmalecondelasalsa/',   Icon: FacebookIcon,  label: 'Facebook'  },
  { href: 'https://www.tiktok.com/@elmalecondelasalsa',     Icon: TikTokIcon,    label: 'TikTok'    },
  { href: 'https://www.youtube.com/@elMalecondelaSalsa',    Icon: YouTubeIcon,   label: 'YouTube'   },
]

// ── Footer ─────────────────────────────────────────────────────────────────────
export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="container footer-grid">

        {/* Col 1 — Marca */}
        <div className="footer-col">
          <div className="footer-brand">
            <img src="/logo.png" alt="elMalecón" className="footer-logo"
              onError={(e) => { e.target.style.display = 'none' }} />
          </div>
          <p className="footer-tagline">
            Escuela de baile latino con alma cubana en Castelldefels.<br />
            Salsa, bachata, son, merengue y más.
          </p>
        </div>

        {/* Col 2 — Acceso rápido */}
        <div className="footer-col">
          <h4 className="footer-col-title">Acceso rápido</h4>
          <nav className="footer-links">
            <Link to="/horarios">Nuestras clases</Link>
            <Link to="/eventos">Eventos</Link>
            <Link to="/escuela">La Escuela</Link>
            <Link to="/contacto">Contacto</Link>
          </nav>
        </div>

        {/* Col 3 — Contacto */}
        <div className="footer-col">
          <h4 className="footer-col-title">Contacto</h4>
          <div className="footer-contact">
            <div className="footer-ci">
              <span className="footer-ci-icon"><PinIcon /></span>
              <span>Carrer de Tomàs Edison, 20,<br />08860 Castelldefels, Barcelona</span>
            </div>
            <div className="footer-ci">
              <span className="footer-ci-icon"><PhoneIcon /></span>
              <a href="tel:+34672895239">672 89 52 39</a>
            </div>
            <div className="footer-ci">
              <span className="footer-ci-icon"><MailIcon /></span>
              <a href="mailto:info@elmalecondelasalsa.com">info@elmalecondelasalsa.com</a>
            </div>
          </div>
        </div>

        {/* Col 4 — Horario + Redes */}
        <div className="footer-col">
          <h4 className="footer-col-title">Horario</h4>
          <div className="footer-contact">
            <div className="footer-ci">
              <span className="footer-ci-icon"><ClockIcon /></span>
              <span>Lunes a Viernes: 18:00 – 22:00</span>
            </div>
            <div className="footer-ci">
              <span className="footer-ci-icon"><ClockIcon /></span>
              <span>Sábados y Domingos: Eventos sociales</span>
            </div>
          </div>

          <div className="footer-social-row">
            <span className="footer-follow-label">Síguenos</span>
            {SOCIAL.map(({ href, Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                className="footer-soc-btn" aria-label={label}>
                <Icon />
              </a>
            ))}
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <span className="tag-dim">
          © {new Date().getFullYear()} elMalecón Castelldefels ·{' '}
          <Link to="/legal/privacidad">{t('footer.privacy')}</Link>{' '}·{' '}
          <Link to="/legal/cookies">{t('footer.cookies')}</Link>{' '}·{' '}
          {t('footer.rights')}
        </span>
      </div>
    </footer>
  )
}
