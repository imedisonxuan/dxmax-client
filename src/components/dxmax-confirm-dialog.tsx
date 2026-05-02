/**
 * 通用确认/提示弹窗 — 替换 alert()/confirm()
 * - 单按钮:只传 onOk
 * - 双按钮:同时传 cancelText + onCancel
 */

import { useEffect, type ReactNode } from 'react'

const ACCENT = '#3B82F6'
const ACCENT_HOVER = '#2563EB'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'

interface Props {
  open: boolean
  title: string
  body: ReactNode
  okText?: string
  cancelText?: string
  onOk: () => void
  onCancel?: () => void
  danger?: boolean
}

export default function DxmaxConfirmDialog({
  open,
  title,
  body,
  okText = '确定',
  cancelText,
  onOk,
  onCancel,
  danger = false,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (onCancel ?? onOk)()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOk, onCancel])

  if (!open) return null

  const okBg = danger ? '#EF4444' : ACCENT
  const okHover = danger ? '#DC2626' : ACCENT_HOVER

  return (
    <div
      onClick={onCancel ?? onOk}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,24,39,0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 9200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'dxmax-confirm-fade 0.18s ease-out',
      }}
    >
      <style>{`
        @keyframes dxmax-confirm-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dxmax-confirm-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.96) }
          to { opacity: 1; transform: none }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400,
          maxWidth: '88%',
          maxHeight: '85vh',
          background: SURFACE,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'dxmax-confirm-pop 0.22s ease-out',
        }}
      >
        <div style={{ padding: '20px 22px 8px' }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: TEXT,
              marginBottom: 12,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: MUTED,
              maxHeight: '50vh',
              overflowY: 'auto',
            }}
          >
            {body}
          </div>
        </div>
        <div
          style={{
            padding: '14px 22px 18px',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            borderTop: `1px solid ${BORDER}`,
            background: SURFACE,
          }}
        >
          {cancelText && (
            <button
              onClick={onCancel}
              style={{
                minWidth: 88,
                height: 38,
                padding: '0 18px',
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: SURFACE,
                color: TEXT,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = '#F3F4F6')
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onOk}
            style={{
              minWidth: 88,
              height: 38,
              padding: '0 20px',
              borderRadius: 10,
              border: 'none',
              background: okBg,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: danger
                ? '0 4px 12px rgba(239,68,68,0.22)'
                : '0 4px 12px rgba(59,130,246,0.18)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = okHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = okBg)}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  )
}
