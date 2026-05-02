/**
 * 大炫Max 「我的」页 (Phase 4 设计稿对齐版)
 * 设计稿源:~/Desktop/大炫max-design/project/components/MePage.jsx
 *
 * 数据来源:localStorage 里的 SavedUser + 进页时静默 sync 一次
 * 菜单项跳浏览器到 dxmax.net 对应路径(应用内购买等 Phase 5+ 再做)
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import DxmaxWebViewOverlay from '@/components/dxmax-webview-overlay'
import { deleteProfile, getProfiles } from '@/services/cmds'
import { sync } from '@/services/dxmax-api'
import {
  getToken,
  getUser,
  logout,
  saveAuth,
  type SavedUser,
} from '@/services/dxmax-auth'

const ACCENT = '#3B82F6'
const ACCENT_BORDER = '#BFDBFE'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SUBTLE = '#9CA3AF'
const BG = '#F9FAFB'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'
const DIVIDER = '#F3F4F6'
const PILL = '#F3F4F6'
const SUCCESS = '#10B981'
const WARN = '#F59E0B'
const DANGER = '#EF4444'
const SHADOW = '0 1px 3px rgba(0,0,0,0.04)'

const WEBSITE = 'https://dxmax.net'

const MENU = [
  {
    label: '在线商店',
    href: `${WEBSITE}/#/plan`,
    d: 'M3 9h18l-2 11H5L3 9z M8 9V5a4 4 0 0 1 8 0v4',
  },
  {
    label: '我的订单',
    href: `${WEBSITE}/#/order`,
    d: 'M9 11l3 3 8-8 M3 12l3 3 L14 6',
  },
  {
    label: '邀请好友',
    href: `${WEBSITE}/#/invite`,
    d: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  },
] as const

export default function DxmaxAccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<SavedUser | null>(() => getUser())
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 内嵌 webview overlay(在线商店/订单/邀请)
  const [embed, setEmbed] = useState<{ url: string; title: string } | null>(
    null,
  )
  const openEmbed = (fullUrl: string, title: string) => {
    const token = getToken()
    // hash router 的 token 拼在 hash 之后,且 v2board web 端要支持解析才能自动登录;
    // 这里带上无害,不支持时用户在 iframe 里手动登录一次即可
    const sep = fullUrl.includes('?') ? '&' : '?'
    const url = token
      ? `${fullUrl}${sep}token=${encodeURIComponent(token)}`
      : fullUrl
    setEmbed({ url, title })
  }

  const refresh = async (silent = false) => {
    const token = getToken()
    if (!token) return
    if (!silent) setSyncing(true)
    setError(null)
    try {
      const res = await sync(token)
      if (res.status === 1) {
        saveAuth({ ...res, token })
        setUser(getUser())
      } else {
        setError(res.msg || '同步失败')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    refresh(true)
  }, [])

  const handleLogout = async () => {
    if (!confirm('确认退出登录?会清除本地订阅,需要重新登录后才能使用。')) return
    try {
      const cur = await getProfiles()
      for (const item of cur.items ?? []) {
        try {
          await deleteProfile(item.uid)
        } catch (e) {
          console.warn('[DxmaxAccount] 删除 profile 失败', item.uid, e)
        }
      }
    } catch (e) {
      console.warn('[DxmaxAccount] 获取 profile 列表失败', e)
    }
    logout()
    navigate('/login', { replace: true })
  }

  if (!user) {
    return (
      <div style={{ padding: 32, color: MUTED }}>
        未登录数据,
        <a
          onClick={() => navigate('/login')}
          style={{ color: ACCENT, cursor: 'pointer' }}
        >
          去登录
        </a>
      </div>
    )
  }

  const used = user.useTf ?? '—'
  const total = user.transfer_enable ?? '—'
  const pct = Math.max(0, Math.min(100, user.tfPercentage ?? 0))
  const expiredText = user.expired ?? '长期有效'

  return (
    <div
      style={{
        padding: '22px 32px 28px',
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
        background: BG,
        fontFamily:
          '-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        color: TEXT,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800 }}>账号</div>
        <div
          onClick={() => !syncing && refresh(false)}
          title={syncing ? '同步中…' : '刷新'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `1.5px solid ${ACCENT_BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: syncing ? 'wait' : 'pointer',
            background: SURFACE,
            opacity: syncing ? 0.55 : 1,
            transition: 'opacity .2s',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACCENT}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: syncing ? 'dxmax-spin 0.9s linear infinite' : 'none',
            }}
          >
            <path d="M3 12a9 9 0 0 1 15.3-6.36L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.3 6.36L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </div>
      </div>

      {/* Greeting */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 14,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        Hi, {user.email} <span style={{ fontSize: 18 }}>👋</span>
      </div>

      {error && (
        <div
          style={{
            fontSize: 12,
            color: DANGER,
            background: '#FEF2F2',
            padding: '8px 12px',
            borderRadius: 8,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Plan card */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: SHADOW,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#60A5FA',
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: ACCENT,
                marginLeft: -6,
              }}
            />
          </div>
          <div
            style={{
              padding: '3px 9px',
              borderRadius: 999,
              background: SUCCESS,
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#fff',
              }}
            />
            激活
          </div>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 4,
            lineHeight: 1.35,
          }}
        >
          {user.planName ?? '未订阅套餐'}
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
          {expiredText}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>套餐包流量</span>
          <span
            style={{
              fontSize: 11,
              color: MUTED,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            已用 {used} / 总计 {total}
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: PILL,
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: SUCCESS,
              borderRadius: 3,
              transition: 'width .3s ease',
            }}
          />
        </div>
        {typeof user.days === 'number' && user.days >= 0 && (
          <div
            style={{
              fontSize: 11,
              color: WARN,
              textAlign: 'right',
              fontWeight: 500,
            }}
          >
            流量将在 {user.days} 天后重置
          </div>
        )}
      </div>

      {/* Invite code (机场特有,设计稿没有但保留) */}
      {user.code && (
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: '12px 18px',
            boxShadow: SHADOW,
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: MUTED }}>我的邀请码</div>
          <div
            onClick={() => {
              navigator.clipboard?.writeText(user.code ?? '')
            }}
            title="点击复制"
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'SF Mono, Menlo, monospace',
              letterSpacing: 1,
              color: ACCENT,
              cursor: 'pointer',
            }}
          >
            {user.code}
          </div>
        </div>
      )}

      {/* Menu list */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: SHADOW,
          marginBottom: 16,
        }}
      >
        {MENU.map((item, i) => (
          <div key={item.label}>
            {i > 0 && (
              <div style={{ height: 1, background: DIVIDER, marginLeft: 54 }} />
            )}
            <div
              onClick={() => openEmbed(item.href, item.label)}
              style={{
                height: 54,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 12,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: ACCENT,
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
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.d} />
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
                {item.label}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={SUBTLE}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Logout button */}
      <div
        onClick={handleLogout}
        style={{
          height: 46,
          borderRadius: 12,
          background: DANGER,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(239,68,68,0.3)',
        }}
      >
        登出
      </div>

      <style>{`
        @keyframes dxmax-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <DxmaxWebViewOverlay
        open={!!embed}
        url={embed?.url ?? ''}
        title={embed?.title ?? ''}
        onClose={() => setEmbed(null)}
      />
    </div>
  )
}
