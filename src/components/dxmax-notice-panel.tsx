/**
 * 公告面板:铃铛点击弹层
 * 数据源:GET /api/v1/app/appnotice
 * HTML content 用 iframe + sandbox 隔离样式与脚本
 */

import { useEffect, useState } from 'react'

import { fetchNotices, type NoticeItem } from '@/services/dxmax-api'
import { getToken } from '@/services/dxmax-auth'
import { setMaxReadNoticeId } from '@/utils/dxmax-notice-read'

const ACCENT = '#3B82F6'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SUBTLE = '#9CA3AF'
const BG = '#F9FAFB'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'

function formatDate(ts: number): string {
  const d = new Date(ts * 1000)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

interface Props {
  open: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

export default function DxmaxNoticePanel({
  open,
  onClose,
  onUnreadChange,
}: Props) {
  // null=未加载/加载中,数组=加载完成
  const [list, setList] = useState<NoticeItem[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [active, setActive] = useState<NoticeItem | null>(null)

  useEffect(() => {
    if (!open) return
    const token = getToken()
    if (!token) return
    let cancelled = false
    fetchNotices(token)
      .then((res) => {
        if (cancelled) return
        const items = (res.data ?? []).filter((n) => n.show === 1)
        setList(items)
        setErr(null)
        const maxId = items.reduce((m, n) => (n.id > m ? n.id : m), 0)
        if (maxId > 0) setMaxReadNoticeId(maxId)
        onUnreadChange?.(0)
      })
      .catch((e) => {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [open, onUnreadChange])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (active) setActive(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, active, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,24,39,0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'dxmax-notice-fade 0.18s ease-out',
      }}
    >
      <style>{`
        @keyframes dxmax-notice-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes dxmax-notice-slide {
          from { opacity: 0; transform: translateY(8px) scale(0.98) }
          to { opacity: 1; transform: none }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '92%',
          height: 520,
          background: SURFACE,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'dxmax-notice-slide 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: `1px solid ${BORDER}`,
            background: SURFACE,
          }}
        >
          {active ? (
            <button
              onClick={() => setActive(null)}
              style={iconBtnStyle}
              aria-label="返回列表"
            >
              <ArrowLeft />
            </button>
          ) : (
            <div style={{ width: 32 }} />
          )}
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: TEXT,
            }}
          >
            {active ? active.title : '公告中心'}
          </div>
          <button onClick={onClose} style={iconBtnStyle} aria-label="关闭">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: active ? SURFACE : BG,
          }}
        >
          {list === null && !err && <Center>加载中...</Center>}
          {err && <Center color="#EF4444">加载失败:{err}</Center>}
          {list !== null && !err && !active && list.length === 0 && (
            <Center color={MUTED}>暂无公告</Center>
          )}

          {list !== null && !err && !active && list.length > 0 && (
            <div
              style={{
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {list.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActive(n)}
                  style={{
                    textAlign: 'left',
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = ACCENT
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(59,130,246,0.10)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = BORDER
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: TEXT,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {n.title}
                    {n.tags?.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#DBEAFE',
                          color: ACCENT,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: SUBTLE }}>
                    {formatDate(n.created_at)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {active && (
            <iframe
              key={active.id}
              title={active.title}
              srcDoc={active.content}
              sandbox=""
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: SURFACE,
              }}
            />
          )}
        </div>
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: MUTED,
}

function Center({
  children,
  color = MUTED,
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontSize: 14,
      }}
    >
      {children}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function ArrowLeft() {
  return (
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
  )
}
