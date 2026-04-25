import { ThemeProvider } from '@mui/material'
import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router'

import { useVerge } from '@/hooks/use-verge'
import { sync } from '@/services/dxmax-api'
import { getToken, isLoggedIn, saveAuth } from '@/services/dxmax-auth'

import Layout from './_dxmax-layout'
import { useCustomTheme } from './_layout/hooks/use-custom-theme'

const DXMAX_PRIMARY = '#3B82F6'

export default function ProtectedLayout() {
  const logged = isLoggedIn()
  const { verge, patchVerge } = useVerge()
  const { theme } = useCustomTheme()
  const lockedRef = useRef(false)

  // 首次启动:把 theme_mode 锁 light、primary_color 锁大炫蓝。
  // 用户后续可手动改回深色,但 verge_config.json 里只要有过这条记录就不再覆盖。
  useEffect(() => {
    if (!verge || lockedRef.current) return
    const wantsLight = verge.theme_mode !== 'light'
    const wantsBlue = verge.theme_setting?.primary_color !== DXMAX_PRIMARY
    if (!wantsLight && !wantsBlue) {
      lockedRef.current = true
      return
    }
    lockedRef.current = true
    patchVerge({
      ...(wantsLight ? { theme_mode: 'light' } : {}),
      ...(wantsBlue
        ? {
            theme_setting: {
              ...(verge.theme_setting ?? {}),
              primary_color: DXMAX_PRIMARY,
            },
          }
        : {}),
    }).catch((e) => console.warn('[DxmaxTheme] patchVerge 失败', e))
  }, [verge, patchVerge])

  useEffect(() => {
    if (!logged) return
    const token = getToken()
    if (!token) return
    sync(token)
      .then((res) => {
        if (res.status === 1) saveAuth({ ...res, token })
      })
      .catch((e) => console.warn('[DxmaxSync] 启动同步失败', e))
  }, [logged])

  if (!logged) {
    return <Navigate to="/login" replace />
  }

  return (
    <ThemeProvider theme={theme}>
      <Layout />
    </ThemeProvider>
  )
}
