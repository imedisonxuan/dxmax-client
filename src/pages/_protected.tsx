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

  // 大炫Max 锁死浅色模式(Phase 4):
  // 5 个自定义页面是硬编码浅色样式,深色会割裂,所以彻底锁 theme_mode='light'。
  // 设置页里的"主题模式"选项已隐藏,用户无法切换。
  // 完整暗黑模式留 Phase 5+(需改 5 页面颜色常量为 useDxmaxTheme hook)。
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
