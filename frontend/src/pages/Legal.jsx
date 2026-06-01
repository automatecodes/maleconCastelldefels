import { useParams } from 'react-router-dom'
import Reveal from '../components/Reveal'

// Textos legales iniciales (Anexo A). Borradores: revisar con un profesional
// y traducir a CA/EN. Los [PENDIENTE] se completan con los datos del titular.
const DOCS = {
  'aviso-legal': {
    title: 'Aviso legal',
    body: (
      <>
        <h3>Titular del sitio web</h3>
        <ul>
          <li>Denominación: [RAZÓN SOCIAL / NOMBRE DEL TITULAR — PENDIENTE]</li>
          <li>NIF/CIF: [PENDIENTE]</li>
          <li>Domicilio: Castelldefels (Barcelona) — [DIRECCIÓN COMPLETA PENDIENTE]</li>
          <li>Contacto: WhatsApp +34 672 895 239 · Email: [PENDIENTE]</li>
          <li>Sitio web: https://elmaleconcastelldefels.com</li>
        </ul>
        <h3>Objeto</h3>
        <p>El presente aviso regula el uso del sitio web de la escuela de baile "El Malecón de la Salsa". El acceso al sitio implica la aceptación de estas condiciones.</p>
        <h3>Propiedad intelectual e industrial</h3>
        <p>Los contenidos (textos, imágenes, vídeos, logotipo, diseño) son titularidad del Titular o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.</p>
        <h3>Responsabilidad</h3>
        <p>El Titular no se responsabiliza del mal uso del sitio ni de los daños derivados de su utilización. Los enlaces a sitios de terceros (redes sociales, mapas) se ofrecen a título informativo; el Titular no controla ni se responsabiliza de sus contenidos.</p>
        <h3>Legislación aplicable</h3>
        <p>Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa vigente.</p>
      </>
    ),
  },
  'privacidad': {
    title: 'Política de privacidad',
    body: (
      <>
        <p><strong>Responsable del tratamiento:</strong> [RAZÓN SOCIAL — PENDIENTE], NIF [PENDIENTE], domicilio en Castelldefels (Barcelona). Contacto: [EMAIL PENDIENTE] · WhatsApp +34 672 895 239.</p>
        <h3>¿Qué datos tratamos y con qué finalidad?</h3>
        <ul>
          <li><strong>Formulario de contacto:</strong> nombre, email, teléfono, nivel y curso de interés, y el mensaje. Finalidad: atender la solicitud e informar sobre cursos y actividades.</li>
          <li><strong>Gestión interna (CRM) de estudiantes:</strong> datos identificativos y de contacto, nivel, cursos asignados y seguimiento académico. Finalidad: gestionar la relación con el alumnado.</li>
        </ul>
        <h3>Base jurídica</h3>
        <p>El consentimiento del interesado (formularios) y la ejecución de la relación de servicios (gestión del alumnado). El consentimiento puede retirarse en cualquier momento.</p>
        <h3>Conservación</h3>
        <p>Los datos se conservan mientras dure la relación y, después, durante los plazos legalmente exigibles; los datos de meros contactos, hasta que se solicite su supresión o dejen de ser necesarios.</p>
        <h3>Destinatarios</h3>
        <p>No se ceden datos a terceros salvo obligación legal o a proveedores que prestan servicios al Titular (alojamiento, email, analítica) como encargados del tratamiento. La comunicación vía WhatsApp implica el tratamiento por parte de su proveedor conforme a sus propias políticas.</p>
        <h3>Derechos</h3>
        <p>Puede ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a [EMAIL PENDIENTE], acreditando su identidad. Tiene derecho a reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>
      </>
    ),
  },
  'cookies': {
    title: 'Política de cookies',
    body: (
      <>
        <p>Este sitio utiliza cookies para su funcionamiento y para mejorar la experiencia de uso.</p>
        <h3>Cookies técnicas (necesarias)</h3>
        <p>Imprescindibles para el funcionamiento del sitio (idioma, sesión, seguridad). No requieren consentimiento.</p>
        <h3>Cookies analíticas</h3>
        <p>Permiten medir el uso del sitio (p. ej. Google Analytics). Solo se activan con su consentimiento.</p>
        <h3>Cookies de marketing / terceros</h3>
        <p>Asociadas a contenidos incrustados de redes sociales (Instagram, Facebook, YouTube, TikTok) y a campañas. Solo con su consentimiento.</p>
        <h3>Gestión del consentimiento</h3>
        <p>Al acceder se muestra un banner que permite aceptar, rechazar o configurar las cookies. Puede cambiar su elección en cualquier momento borrándolas desde su navegador.</p>
      </>
    ),
  },
}

export default function Legal() {
  const { doc } = useParams()
  const content = DOCS[doc] || DOCS['aviso-legal']
  return (
    <div className="container section">
      <Reveal>
        <div className="legal-content">
          <h2 className="section-title">{content.title}</h2>
          <p className="tag-dim" style={{ marginBottom: '1.5rem' }}>
            Borrador inicial · pendiente de revisión jurídica y traducción a CA/EN.
          </p>
          {content.body}
        </div>
      </Reveal>
    </div>
  )
}
