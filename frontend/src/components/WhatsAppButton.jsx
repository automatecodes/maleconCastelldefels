import { trackWhatsapp } from '../api/client'

const NUMBER = '34672895239'

export function whatsappLink(text) {
  const msg = encodeURIComponent(text || 'Hola, me gustaría información sobre las clases.')
  return `https://wa.me/${NUMBER}?text=${msg}`
}

// Botón flotante de WhatsApp (canal preferente, §3.6).
export default function WhatsAppButton() {
  const onClick = () => trackWhatsapp()
  return (
    <a className="whatsapp-fab" href={whatsappLink()} target="_blank" rel="noreferrer"
       onClick={onClick} aria-label="WhatsApp">
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.8 5.5 2.2 7.9L.4 31.6l7.9-2.1c2.3 1.3 4.9 2 7.7 2C24.6 31.5 31.5 24.6 31.5 16S24.6.5 16 .5zm0 28.2c-2.5 0-4.9-.7-7-1.9l-.5-.3-4.7 1.2 1.3-4.6-.3-.5C3.4 20.7 2.7 18.4 2.7 16 2.7 8.6 8.6 2.7 16 2.7S29.3 8.6 29.3 16 23.4 28.7 16 28.7zm7.3-9.6c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.5-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7-.1-.2-.9-2.2-1.3-3-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.3s1.4 3.8 1.6 4.1c.2.3 2.8 4.3 6.8 6 .9.4 1.7.6 2.3.8.9.3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"/>
      </svg>
    </a>
  )
}
