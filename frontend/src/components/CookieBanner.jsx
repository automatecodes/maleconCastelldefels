import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function CookieBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) setVisible(true)
  }, [])

  const choose = (value) => {
    localStorage.setItem('cookie-consent', value)
    setVisible(false)
  }

  if (!visible) return null
  return (
    <div className="cookie-banner">
      <p>
        {t('cookies.text')}{' '}
        <Link to="/legal/cookies" className="accent">{t('cookies.policy')}</Link>
      </p>
      <div className="cookie-actions">
        <button className="btn btn-ghost" onClick={() => choose('rejected')}>{t('cookies.reject')}</button>
        <button className="btn btn-primary" onClick={() => choose('accepted')}>{t('cookies.accept')}</button>
      </div>
    </div>
  )
}
