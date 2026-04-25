/**
 * 大炫Max API 域名容灾
 * 启动时拉 host.json -> 顺序探测 -> 选第一个可达的作为 API_BASE
 * 一 session 内只跑一次,失败 fallback 到写死的默认域名
 */

const HOST_JSON_URL = 'https://dxmax.oss-cn-beijing.aliyuncs.com/host.json'
const DEFAULT_API_BASE = 'https://api.dxmax.cn'
const FETCH_TIMEOUT_MS = 4000

let resolvedBase: Promise<string> | null = null

async function probe(base: string): Promise<boolean> {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(`${base}/api/v1/app/config`, {
      method: 'GET',
      signal: ctl.signal,
    })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

async function doResolve(): Promise<string> {
  let candidates: string[] = []
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(HOST_JSON_URL, { signal: ctl.signal })
    clearTimeout(timer)
    if (res.ok) {
      const data = (await res.json()) as { url?: string[] }
      if (Array.isArray(data.url)) {
        candidates = data.url
          .filter((u) => typeof u === 'string' && u.startsWith('http'))
          .map((u) => u.replace(/\/$/, ''))
      }
    }
  } catch (e) {
    console.warn('[DxmaxHost] host.json 拉取失败', e)
  }

  if (candidates.length === 0) candidates = [DEFAULT_API_BASE]

  for (const base of candidates) {
    if (await probe(base)) return base
  }

  console.warn('[DxmaxHost] 所有候选都不可达,回退默认域名', candidates)
  return candidates[0] ?? DEFAULT_API_BASE
}

export function resolveApiBase(): Promise<string> {
  if (!resolvedBase) {
    resolvedBase = doResolve()
  }
  return resolvedBase
}

/** 调试用:强制重新探测 */
export function refreshApiBase(): Promise<string> {
  resolvedBase = null
  return resolveApiBase()
}
