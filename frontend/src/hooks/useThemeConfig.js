import { useEffect } from 'react'

/**
 * Hook que carga la configuración del tema activo y aplica el filtro del logo dinámicamente.
 */
export function useThemeConfig() {
  useEffect(() => {
    const fetchAndApplyThemeConfig = async () => {
      try {
        const res = await fetch('/api/public/theme-config')
        if (!res.ok) return
        
        const config = await res.json()
        if (!config.logo_filter) return

        const { hue_rotation, saturation, brightness, drop_shadow_color, drop_shadow_blur } = config.logo_filter

        // Aplicar filtro al logo
        const logoImg = document.querySelector('.brand-logo')
        if (logoImg) {
          const filter = `
            hue-rotate(${hue_rotation}deg)
            saturate(${saturation})
            brightness(${brightness})
            drop-shadow(0 0 ${drop_shadow_blur}px ${drop_shadow_color})
          `.replace(/\s+/g, ' ').trim()
          
          logoImg.style.filter = filter
        }

        // Scripts personalizados — sandbox que bloquea acceso a storage, red y cookies
        if (config.scripts && config.scripts.trim()) {
          try {
            const safeDocument = {
              getElementById:     document.getElementById.bind(document),
              querySelector:      document.querySelector.bind(document),
              querySelectorAll:   document.querySelectorAll.bind(document),
              createElement:      document.createElement.bind(document),
              body:               document.body,
              head:               document.head,
            }
            const safeWindow = {
              innerWidth:              window.innerWidth,
              innerHeight:             window.innerHeight,
              devicePixelRatio:        window.devicePixelRatio,
              requestAnimationFrame:   window.requestAnimationFrame.bind(window),
              cancelAnimationFrame:    window.cancelAnimationFrame.bind(window),
              setTimeout:              window.setTimeout.bind(window),
              clearTimeout:            window.clearTimeout.bind(window),
              setInterval:             window.setInterval.bind(window),
              clearInterval:           window.clearInterval.bind(window),
              console:                 window.console,
            }
            // Los parámetros nombrados enmascaran los globals peligrosos (reciben null)
            const sandboxed = new Function(
              'document', 'window',
              'localStorage', 'sessionStorage',
              'fetch', 'XMLHttpRequest', 'WebSocket', 'navigator', 'location',
              '"use strict";\n' + config.scripts
            )
            sandboxed(
              safeDocument, safeWindow,
              null, null,
              null, null, null, null, null
            )
          } catch (err) {
            console.warn('Error ejecutando scripts del tema:', err)
          }
        }

        // Si hay HTML sections, podrían ser inyectadas aquí si fuera necesario
        // Por ahora solo se aplican los filtros CSS
      } catch (err) {
        console.warn('Error cargando configuración del tema:', err)
      }
    }

    fetchAndApplyThemeConfig()

    // Polling agresivo solo en el panel admin (previsualización en vivo).
    // En páginas públicas, 10 minutos es más que suficiente.
    const isAdmin = window.location.pathname.startsWith('/gurutiadmin')
    const interval = setInterval(fetchAndApplyThemeConfig, isAdmin ? 5_000 : 600_000)

    return () => clearInterval(interval)
  }, [])
}
