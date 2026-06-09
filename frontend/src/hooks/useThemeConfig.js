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

        // Si hay scripts personalizados, inyectarlos
        if (config.scripts && config.scripts.trim()) {
          try {
            // eslint-disable-next-line no-eval
            eval(config.scripts)
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

    // Cargar config al montar y cada vez que cambia el tema
    fetchAndApplyThemeConfig()

    // Recargar config cada 5 segundos (por si el admin cambia el tema activo)
    const interval = setInterval(fetchAndApplyThemeConfig, 5000)

    return () => clearInterval(interval)
  }, [])
}
