import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand-fallback footer-brand">el<span className="accent">Malecón</span></div>
          <p className="tag-dim">{t('footer.tagline')}</p>
          <p className="tag-dim">WhatsApp +34 672 895 239</p>
        </div>
        <div>
          <h4>{t('footer.follow')}</h4>
          <div className="footer-social">
            <a href="https://instagram.com/elmaleconcastelldefels" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://facebook.com/elmaleconcastelldefels" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://youtube.com/@elmaleconcastelldefels" target="_blank" rel="noreferrer">YouTube</a>
            <a href="https://tiktok.com/@elmaleconcastelldefels" target="_blank" rel="noreferrer">TikTok</a>
          </div>
        </div>
        <div>
          <h4>Legal</h4>
          <div className="footer-links">
            <Link to="/legal/aviso-legal">{t('footer.legal')}</Link>
            <Link to="/legal/privacidad">{t('footer.privacy')}</Link>
            <Link to="/legal/cookies">{t('footer.cookies')}</Link>
            <Link to="/admin">{t('common.admin')}</Link>
          </div>
        </div>
      </div>
      <div className="container footer-bottom tag-dim">
        © {new Date().getFullYear()} El Malecón de la Salsa · {t('footer.rights')}
      </div>
    </footer>
  )
}
