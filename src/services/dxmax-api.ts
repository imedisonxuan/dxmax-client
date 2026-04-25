/**
 * 大炫Max v2board AppVPN 接口封装
 * 后端补丁:wyx2685/sky 适配版
 * 接口前缀:/api/v1/app/
 */

import { resolveApiBase } from './dxmax-host'

const SUB_BASE = 'https://sub.dxmax.cn'

/** 拼标准 v2board 订阅 URL(applogin 返回的 token 就是订阅 token)
 * 不加 flag 参数,跟用户在 v2board 用户中心复制的链接保持一致;
 * mihomo 内核兼容标准 v2board clash 返回格式
 */
export function buildSubscribeUrl(token: string) {
  return `${SUB_BASE}/api/v1/client/subscribe?token=${encodeURIComponent(token)}`
}

export interface LoginResponse {
  status: number
  msg?: string
  // 用户基本信息
  id?: number
  uuid?: string
  email?: string
  token?: string
  // 套餐
  planName?: string
  expired?: string
  days?: number
  // 流量
  t?: string
  u?: string
  d?: string
  useTf?: string
  transfer_enable?: string
  residue?: string
  tfPercentage?: number
  balance?: number
  // 配置(核心)
  clash?: string // 完整 clash YAML(直接灌内核)
  configs?: string // 完整 sing-box JSON
  configsNodes?: string // 节点列表
  // 其他
  code?: string
  web?: string
  chatLink?: string
  link?: string
  logo?: string
}

export interface AppConfigResponse {
  data: {
    appName: string
    appDescription: string
    website: string
    inviteUrl: string
    tggroup: string
    crispID: string
    chatType: string
    isSupport: boolean
    isEmailVerify: number
    isInviteForce: number
    emailWhitelistSuffix: string[]
    panelType: string
    currency_symbol: string
    icon: string | null
    alert?: {
      show: number
      title?: string
      msg?: string
      img?: string
      context?: string
    }
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { form?: Record<string, string> },
): Promise<T> {
  const base = await resolveApiBase()
  const url = `${base}${path}`
  let body: BodyInit | undefined
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  }

  if (init?.form) {
    body = new URLSearchParams(init.form).toString()
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  const res = await fetch(url, { ...init, headers, body })

  if (!res.ok) {
    throw new Error(`API ${path} HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

/** GET /api/v1/app/config — 公开,拿客户端配置 */
export function getAppConfig() {
  return request<AppConfigResponse>('/api/v1/app/config')
}

/** POST /api/v1/app/applogin — 登录,核心 */
export function login(email: string, password: string) {
  return request<LoginResponse>('/api/v1/app/applogin', {
    method: 'POST',
    form: { email, password },
  })
}

/** POST /api/v1/app/appsync — 已登录用户同步数据 */
export function sync(token: string, version = '1.0.0') {
  return request<LoginResponse>('/api/v1/app/appsync', {
    method: 'POST',
    form: { token, version },
  })
}

/** POST /api/v1/app/appupdate — 检查版本更新 */
export function checkUpdate(
  system: 'macos' | 'windows' | 'android',
  version: string,
) {
  return request<{
    status: number
    msg: string
    link?: string
    update_context?: string
  }>('/api/v1/app/appupdate', {
    method: 'POST',
    form: { system, version },
  })
}

// wyx2685 后端硬编码:clash/configs/configsNodes 字段都是 base64(AES-128-CBC(yaml, key, iv))
// 参考 v2board-v1.7.5/app/Http/Controllers/V1/App/Protocols/Node.php line 15-24
const AES_KEY = 'apps_connect_key'
const AES_IV = '8c97f304422a60e0'

async function aesCbcDecrypt(b64: string): Promise<string> {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(AES_KEY),
    'AES-CBC',
    false,
    ['decrypt'],
  )
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: enc.encode(AES_IV) },
    key,
    raw,
  )
  return new TextDecoder().decode(buf)
}

/** 解码 clash 配置:base64 -> AES-128-CBC -> YAML */
export async function decodeClashConfig(cipher: string): Promise<string> {
  if (!cipher) return ''
  // 先试 AES 解密;失败就退到"已经是明文 YAML"或"纯 base64 YAML"的兼容路径
  try {
    const yaml = await aesCbcDecrypt(cipher)
    if (yaml.includes('proxies') || yaml.includes('proxy-groups')) {
      return yaml
    }
  } catch {
    // 加密格式不对,fallback
  }
  try {
    const decoded = atob(cipher)
    if (decoded.includes('proxies') || decoded.includes('proxy-groups')) {
      return decoded
    }
  } catch {
    // fallthrough
  }
  return cipher
}
