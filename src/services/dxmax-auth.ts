/**
 * 大炫Max 登录态管理
 * token 持久化到 localStorage(Tauri 也支持)
 * 提供 isLoggedIn / getToken / saveAuth / logout 等
 */

import type { LoginResponse } from './dxmax-api'

const TOKEN_KEY = 'dxmax_token'
const USER_KEY = 'dxmax_user'

export interface SavedUser {
  id?: number
  email?: string
  uuid?: string
  planName?: string
  expired?: string
  days?: number
  useTf?: string
  transfer_enable?: string
  residue?: string
  tfPercentage?: number
  balance?: number
  code?: string
  logo?: string
}

export function saveAuth(loginRes: LoginResponse) {
  if (loginRes.token) {
    localStorage.setItem(TOKEN_KEY, loginRes.token)
  }
  const user: SavedUser = {
    id: loginRes.id,
    email: loginRes.email,
    uuid: loginRes.uuid,
    planName: loginRes.planName,
    expired: loginRes.expired,
    days: loginRes.days,
    useTf: loginRes.useTf,
    transfer_enable: loginRes.transfer_enable,
    residue: loginRes.residue,
    tfPercentage: loginRes.tfPercentage,
    balance: loginRes.balance,
    code: loginRes.code,
    logo: loginRes.logo,
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): SavedUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SavedUser
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
