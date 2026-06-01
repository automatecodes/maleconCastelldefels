import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'ca', flag: '🏴󠁥󠁳󠁣󠁴󠁿', label: 'Català' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGS.find((l) => l.code === i18n.language) || LANGS[0]

  const change = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    document.documentElement.lang = code
    setOpen(false)
  }

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="lang-selector" ref={ref}>
      <button className="lang-trigger" onClick={() => setOpen(!open)} aria-label="Seleccionar idioma">
        <span>{current.flag}</span>
        <span className="lang-code">{current.code.toUpperCase()}</span>
        <span className={`lang-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="lang-dropdown">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={`lang-option${l.code === i18n.language ? ' active' : ''}`}
              onClick={() => change(l.code)}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
