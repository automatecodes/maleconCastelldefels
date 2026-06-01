import { useTranslation } from 'react-i18next'

const ICON = { instagram: '📷', facebook: '👍', youtube: '▶️', tiktok: '🎵' }

// Feed visual unificado de redes (§3.5 / §3.1).
export default function SocialFeed({ posts = [] }) {
  const { t } = useTranslation()
  if (!posts.length) return null
  return (
    <div className="grid grid-4">
      {posts.map((p) => (
        <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" className="card social-card">
          <div className="social-thumb">
            {p.thumbnail_url
              ? <img src={p.thumbnail_url} alt={p.platform}
                     onError={(e) => { e.target.style.display = 'none' }} />
              : <div className="social-thumb-empty" />}
            <span className="social-platform">{ICON[p.platform] || '🔗'} {p.platform}</span>
          </div>
          <div className="card-body">
            <p className="social-text">{p.text}</p>
            <span className="accent tag-dim">{t('events.viewPost')} →</span>
          </div>
        </a>
      ))}
    </div>
  )
}
