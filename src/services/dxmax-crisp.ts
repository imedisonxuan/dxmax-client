/**
 * 大炫Max Crisp 在线客服集成
 * 全局只加载一次,后续 openChat 直接调 $crisp.push
 */

const CRISP_WEBSITE_ID = 'b17a2af5-4e26-44b5-aa31-d715db03006d'

declare global {
  interface Window {
    $crisp?: unknown[]
    CRISP_WEBSITE_ID?: string
    CRISP_RUNTIME_CONFIG?: Record<string, unknown>
  }
}

let loadingPromise: Promise<void> | null = null

export function loadCrisp(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (
    window.$crisp &&
    Array.isArray(window.$crisp) &&
    window.CRISP_WEBSITE_ID
  ) {
    return Promise.resolve()
  }
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise<void>((resolve, reject) => {
    window.$crisp = []
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-dxmax-crisp]',
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Crisp script load failed')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    script.dataset.dxmaxCrisp = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Crisp script load failed'))
    document.head.appendChild(script)
  })

  return loadingPromise
}

export function openCrispChat() {
  loadCrisp()
    .then(() => {
      window.$crisp?.push(['do', 'chat:open'])
      window.$crisp?.push(['do', 'chat:show'])
    })
    .catch((e) => {
      console.warn('[Crisp] 加载失败', e)
    })
}

export function setCrispUser(email?: string, nickname?: string) {
  loadCrisp()
    .then(() => {
      if (email) window.$crisp?.push(['set', 'user:email', email])
      if (nickname) window.$crisp?.push(['set', 'user:nickname', nickname])
    })
    .catch(() => {})
}
