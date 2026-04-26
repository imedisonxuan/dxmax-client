/**
 * 大炫Max v2board AppVPN 接口封装
 * 后端补丁:wyx2685/sky 适配版
 * 接口前缀:/api/v1/app/
 */

import { resolveApiBase } from './dxmax-host'

const SUB_BASE = 'https://sub.dxmax.cn'

/** 拼标准 v2board 订阅 URL(applogin 返回的 token 就是订阅 token)
 * 必须带 flag=clash.meta:不带 flag 时 v2board 默认返回 base64 通用订阅(v2ray 格式),
 * mihomo 不会自动转 clash 配置,导致加载后 0 个 proxy。
 * 验证(2026-04-26):
 *   不带 flag → 返回 ss://...127.0.0.1:7890#剩余流量... 这种 base64 通用订阅
 *   带 flag=clash 或 flag=clash.meta → 返回 mixed-port/proxies/proxy-groups 完整 clash YAML
 */
export function buildSubscribeUrl(token: string) {
  return `${SUB_BASE}/api/v1/client/subscribe?token=${encodeURIComponent(token)}&flag=clash.meta`
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

/** 解码 + 修补 wyx2685 后端的 clash YAML
 *
 * wyx2685 后端模板有个 bug:proxy-groups 里的 AutoSelect / 故障转移 等组的 proxies
 * 是空的 {},导致 SELECT → AutoSelect → (空) 套娃,用户没节点可选。
 *
 * 修补策略:
 *   1. 收集所有真实节点名(过滤掉名字含"看公告"/"剩余流量"/"套餐到期"/"127.0.0.1"的占位)
 *   2. 把节点列表填到 proxy-groups 里所有 proxies 为空的组(自动选/故障转移/Select 等)
 *   3. 再确保至少一个 select 类型的组里能直接选到所有节点(便于客户端 UI 切换节点)
 */
const PLACEHOLDER_KEYWORDS = [
  '看公告',
  '剩余流量',
  '套餐到期',
  '到期',
  '客服',
  '官网',
  '更新订阅',
] as const

function isPlaceholderProxy(p: { name?: string; server?: string }): boolean {
  if (p.server === '127.0.0.1') return true
  if (!p.name) return false
  return PLACEHOLDER_KEYWORDS.some((kw) => p.name!.includes(kw))
}

export async function loadAndPatchClashYaml(cipher: string): Promise<string> {
  const yaml = await decodeClashConfig(cipher)
  if (!yaml) throw new Error('clash 配置为空')

  // 动态 import 避开 SSR 顾虑
  const yamlMod = await import('js-yaml')
  const obj = yamlMod.load(yaml) as Record<string, unknown>

  if (!obj || typeof obj !== 'object') {
    throw new Error('clash 配置解析失败')
  }

  type Proxy = { name?: string; server?: string; type?: string }
  type Group = {
    name?: string
    type?: string
    proxies?: string[] | Record<string, unknown>
  }

  const proxies = (obj.proxies as Proxy[] | undefined) ?? []
  const groups = (obj['proxy-groups'] as Group[] | undefined) ?? []

  // 真节点名(过滤占位)
  const realNames = proxies
    .filter((p) => !isPlaceholderProxy(p))
    .map((p) => p.name)
    .filter((n): n is string => !!n)

  // 修补每个 group 的 proxies:空的填全节点;非空保留
  for (const g of groups) {
    const cur = g.proxies
    const isEmpty =
      !cur ||
      (Array.isArray(cur) && cur.length === 0) ||
      (typeof cur === 'object' &&
        !Array.isArray(cur) &&
        Object.keys(cur).length === 0)
    if (isEmpty && realNames.length > 0) {
      g.proxies = [...realNames]
    }
  }

  // 找 select 组,确保它能直接选到所有节点(把已有的 group 名 + 全部真节点合并)
  const selectGroup = groups.find(
    (g) => g.type === 'select' || (g.name && /select|选择|手选/i.test(g.name)),
  )
  if (selectGroup && Array.isArray(selectGroup.proxies)) {
    const groupNames = groups.map((g) => g.name).filter((n): n is string => !!n)
    const set = new Set([...selectGroup.proxies, ...groupNames, ...realNames])
    selectGroup.proxies = [...set].filter((n) => n !== selectGroup.name)
  }

  obj.proxies = proxies
  obj['proxy-groups'] = groups

  return yamlMod.dump(obj, { noRefs: true, lineWidth: 1000 })
}
