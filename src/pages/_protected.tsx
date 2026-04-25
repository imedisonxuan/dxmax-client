import { useEffect } from 'react'
import { Navigate } from 'react-router'

import { sync } from '@/services/dxmax-api'
import { getToken, isLoggedIn, saveAuth } from '@/services/dxmax-auth'

import Layout from './_dxmax-layout'

export default function ProtectedLayout() {
  const logged = isLoggedIn()
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
  return <Layout />
}
