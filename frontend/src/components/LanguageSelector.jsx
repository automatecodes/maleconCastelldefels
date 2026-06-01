import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'es', label: 'ES' },
  { code: 'ca', label: 'CA' },
  { code: 'en', label: 'EN' },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const change = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    document.documentElement.lang = code
  }
  return (
    <div className="lang-selector">
      {LANGS.map((l) => (
        <button
          key={l.code}
          className={i18n.language === l.code ? 'lang active' : 'lang'}
          onClick={() => change(l.code)}
          aria-label={`Idioma ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
