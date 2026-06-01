import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="var(--bg, #0A0E0B)" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.17 8.17 0 004.77 1.52V7.01a4.85 4.85 0 01-1-.32z" />
    </svg>
  )
}

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="container footer-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>

        {/* Column 1: Brand */}
        <div className="footer-brand-col">
          <div className="footer-brand">
            <img
              src="/logo.png"
              alt="elMalecón"
              style={{ height: 48, width: 'auto', marginBottom: '0.5rem' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <span className="brand-fallback" style={{ display: 'block' }}>
              el<span className="accent">Malecón</span>
            </span>
          </div>
          <p className="tag-dim" style={{ marginBottom: '0.5rem' }}>{t('footer.tagline')}</p>
          <p className="tag-dim" style={{ marginBottom: '0.25rem' }}>WhatsApp +34 672 895 239</p>
          <p className="tag-dim" style={{ marginBottom: '0.4rem', fontSize: '0.85rem' }}>{t('footer.follow')}</p>
          <div className="footer-social-icons">
            <a
              href="https://facebook.com/elmalecondelasalsa"
              target="_blank"
              rel="noreferrer"
              className="footer-social-icon"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://instagram.com/elmaleconcastelldefels"
              target="_blank"
              rel="noreferrer"
              className="footer-social-icon"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://youtube.com/@elmaleconcastelldefels"
              target="_blank"
              rel="noreferrer"
              className="footer-social-icon"
              aria-label="YouTube"
            >
              <YouTubeIcon />
            </a>
            <a
              href="https://tiktok.com/@elmaleconcastelldefels"
              target="_blank"
              rel="noreferrer"
              className="footer-social-icon"
              aria-label="TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>

        {/* Column 2: Legal */}
        <div>
          <h4>Legal</h4>
          <div className="footer-links">
            <Link to="/legal/aviso-legal">{t('footer.legal')}</Link>
            <Link to="/legal/privacidad">{t('footer.privacy')}</Link>
            <Link to="/legal/cookies">{t('footer.cookies')}</Link>
          </div>
        </div>

      </div>

      <div className="container footer-bottom tag-dim">
        © {new Date().getFullYear()} elMalecón Castelldefels · {t('footer.rights')}
      </div>
    </footer>
  )
}
