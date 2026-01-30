import { ref, onMounted, onUnmounted } from 'vue'

export function useXTheme() {
  const theme = ref<'light' | 'dark'>('light')

  const detectTheme = () => {
    const html = document.documentElement
    const xTheme = html.getAttribute('data-theme')
    
    if (xTheme) {
      theme.value = xTheme === 'dark' ? 'dark' : 'light'
    } else {
      // Fallback to media query
      theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  }

  let observer: MutationObserver | null = null

  onMounted(() => {
    detectTheme()
    
    // Watch for theme changes
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          detectTheme()
        }
      })
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return {
    theme
  }
}