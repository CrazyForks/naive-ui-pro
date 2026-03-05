import type { ProConfigProviderProps } from 'pro-naive-ui'
import { generate } from '@ant-design/colors'
import { preferenceConfig } from '@root/preference'
import { usePreferredDark } from '@vueuse/core'
import { darkTheme } from 'naive-ui'
import { defineStore } from 'pinia'
import { computed, nextTick, reactive, toRefs, watchEffect } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const systemThemeIsDark = usePreferredDark()
  const theme = reactive({ ...preferenceConfig.theme })

  const isDark = computed(() => {
    return theme.mode === 'dark' || (theme.mode === 'auto' && systemThemeIsDark.value)
  })

  const primaryColors = computed(() => {
    return generate(theme.primaryColor, {
      theme: isDark.value ? 'dark' : 'default',
    })
  })

  const themeProps = computed<ProConfigProviderProps>(() => {
    const colors = primaryColors.value
    return {
      theme: isDark.value ? darkTheme : undefined,
      themeOverrides: {
        common: {
          borderRadius: '6px',
          primaryColor: colors[5],
          primaryColorHover: colors[6],
          primaryColorSuppl: colors[4],
          primaryColorPressed: colors[7],
        },
        Tag: {
          borderRadius: '6px',
        },
      },
    }
  })

  function toggleThemeMode() {
    theme.mode = isDark.value ? 'light' : 'dark'
  }

  function toggleThemeModeWithAnimation(event: MouseEvent) {
    if (
      !('startViewTransition' in document)
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      toggleThemeMode()
      return
    }
    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    )
    const transition = document.startViewTransition(async () => {
      toggleThemeMode()
      return nextTick()
    })
    transition.ready.then(() => {
      const clipPath = [
        `circle(0 at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: isDark.value ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 400,
          easing: 'ease-in',
          fill: 'both',
          pseudoElement: isDark.value
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)',
        },
      )
    })
  }

  watchEffect(() => {
    const grayscaleStyle = theme.grayscale ? 'grayscale(100%)' : 'grayscale(0%)'
    const colorWeaknessStyle = theme.colorWeakness ? 'invert(80%)' : 'invert(0%)'
    document.documentElement.style.filter = `${grayscaleStyle} ${colorWeaknessStyle}`
  })

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
  })

  return {
    isDark,
    themeProps,
    primaryColors,
    ...toRefs(theme),
    toggleThemeMode,
    toggleThemeModeWithAnimation,
  }
}, {
  preference: {
    pick: [Object.keys(preferenceConfig.theme), 'theme'],
  },
})
