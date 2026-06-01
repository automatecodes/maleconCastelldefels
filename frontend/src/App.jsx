import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import WhatsAppButton from './components/WhatsAppButton'

import Home from './pages/Home'
import School from './pages/School'
import Courses from './pages/Courses'
import Schedule from './pages/Schedule'
import Events from './pages/Events'
import Contact from './pages/Contact'
import Legal from './pages/Legal'

import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import StudentsAdmin from './pages/admin/StudentsAdmin'
import TeachersAdmin from './pages/admin/TeachersAdmin'
import CoursesAdmin from './pages/admin/CoursesAdmin'
import EventsAdmin from './pages/admin/EventsAdmin'
import LeadsAdmin from './pages/admin/LeadsAdmin'
import Appearance from './pages/admin/Appearance'

import './styles/layout.css'
import './styles/admin.css'

function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </>
  )
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  // Inyecta la hoja de estilos activa (seleccionable desde el admin) como
  // último <link> del documento, de modo que pueda sobreescribir los estilos base.
  useEffect(() => {
    let link = document.getElementById('active-theme')
    if (!link) {
      link = document.createElement('link')
      link.id = 'active-theme'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = '/api/public/theme.css'
  }, [])

  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/escuela" element={<PublicLayout><School /></PublicLayout>} />
      <Route path="/cursos" element={<PublicLayout><Courses /></PublicLayout>} />
      <Route path="/horarios" element={<PublicLayout><Schedule /></PublicLayout>} />
      <Route path="/eventos" element={<PublicLayout><Events /></PublicLayout>} />
      <Route path="/contacto" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/legal/:doc" element={<PublicLayout><Legal /></PublicLayout>} />

      {/* Administración */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="estudiantes" element={<StudentsAdmin />} />
        <Route path="profesores" element={<TeachersAdmin />} />
        <Route path="cursos" element={<CoursesAdmin />} />
        <Route path="eventos" element={<EventsAdmin />} />
        <Route path="leads" element={<LeadsAdmin />} />
        <Route path="apariencia" element={<Appearance />} />
      </Route>
    </Routes>
  )
}
