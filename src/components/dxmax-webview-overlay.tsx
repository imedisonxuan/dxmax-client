/**
 * 内嵌 web 页面的全屏 overlay(iframe + header)
 * 用于在 app 内打开 dxmax.net 的页面(在线商店/订单/邀请等),不跳浏览器
 *
 * dxmax.net 已确认无 X-Frame-Options / CSP frame-ancestors,可直接 iframe
 * Token 自动登录:URL 拼 ?token= 由 web 端自行解析(若 web 端不支持则用户在 iframe 内手动登录)
 */

import { useEffect, useState } from 'react'

const ACCENT = '#3B82F6'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'

interface Props {
  open: boolean
  url: string
  title: string
  onClose: () => void
}

export default function DxmaxWebViewOverlay({
  open,
  url,
  title,
  onClose,
}: Props) {
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    // 每次打开/换 URL 时,先重置 loading + 强制 iframe 重建以触发 onLoad
    // 用 microtask 避开 set-state-in-effect 警告
    queueMicrotask(() => {
      setLoading(true)
      setReloadKey((k) => k + 1)
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, url, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: SURFACE,
        zIndex: 9300,
        display: 'flex',
        flexDirection: 'column',
        animation: 'dxmax-webview-slide 0.22s ease-out',
      }}
    >
      <style>{`
        @keyframes dxmax-webview-slide {
          from { opacity: 0; transform: translateY(8px) }
          to { opacity: 1; transform: none }
        }
        @keyframes dxmax-webview-spin { to { transform: rotate(360deg) } }
      `}</style>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: `1px solid ${BORDER}`,
          background: SURFACE,
          flexShrink: 0,
        }}
      >
        <button onClick={onClose} aria-label="返回" style={iconBtnStyle}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: TEXT,
          }}
        >
          {title}
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          aria-label="刷新"
          style={iconBtnStyle}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* iframe */}
      <div style={{ flex: 1, position: 'relative', background: '#F9FAFB' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: MUTED,
              fontSize: 14,
              gap: 10,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2.5px solid ${BORDER}`,
                borderTopColor: ACCENT,
                animation: 'dxmax-webview-spin 0.8s linear infinite',
              }}
            />
            加载中...
          </div>
        )}
        <iframe
          key={reloadKey}
          title={title}
          src={url}
          onLoad={() => setLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: MUTED,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
