/**
 * 启动/登录弹窗 — 跟 web 端同步,读 /api/v1/app/config 的 alert 字段
 * - alert.show==1 才弹
 * - 同一份内容只弹一次(按 title+msg+img 签名做 dismiss)
 */

import { useEffect, useState } from 'react'

import { getAppConfig } from '@/services/dxmax-api'

const ACCENT = '#3B82F6'
const ACCENT_HOVER = '#2563EB'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'

const DISMISS_KEY = 'dxmax_alert_dismissed_signature'

interface AlertData {
  title: string
  msg: string
  img: string
}

function signature(a: AlertData): string {
  return `${a.title}::${a.msg}::${a.img}`
}

export default function DxmaxAlertModal() {
  const [data, setData] = useState<AlertData | null>(null)

  useEffect(() => {
    let cancelled = false
    getAppConfig()
      .then((res) => {
        if (cancelled) return
        const a = res.data?.alert
        if (!a || a.show !== 1) return
        const next: AlertData = {
          title: a.title ?? '',
          msg: a.msg ?? '',
          img: a.img ?? '',
        }
        if (!next.title && !next.msg && !next.img) return
        const dismissed = localStorage.getItem(DISMISS_KEY)
        if (dismissed === signature(next)) return
        setData(next)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!data) return null

  const close = () => {
    localStorage.setItem(DISMISS_KEY, signature(data))
    setData(null)
  }

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,24,39,0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 9100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'dxmax-alert-fade 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes dxmax-alert-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dxmax-alert-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.96) }
          to { opacity: 1; transform: none }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: '88%',
          maxHeight: '85vh',
          background: SURFACE,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'dxmax-alert-pop 0.24s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: 700,
              color: TEXT,
            }}
          >
            {data.title || '公告'}
          </div>
          <button
            onClick={close}
            aria-label="关闭"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: MUTED,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
          }}
        >
          {data.img && (
            <img
              src={data.img}
              alt=""
              style={{
                width: '100%',
                borderRadius: 10,
                marginBottom: 14,
                display: 'block',
              }}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          {data.msg && (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: TEXT,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {data.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px 18px',
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <button
            onClick={close}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 10,
              border: 'none',
              background: ACCENT,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59,130,246,0.18)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = ACCENT_HOVER)
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}
