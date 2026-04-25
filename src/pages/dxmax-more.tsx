/**
 * 大炫Max 「更多」页 (Phase 4 设计稿对齐版)
 * 设计稿源:~/Desktop/大炫max-design/project/components/MePage.jsx (含 MorePage)
 *
 * 功能:
 * - 联系我们大按钮 → 弹真实 Crisp 客服
 * - 列表项跳浏览器或 Verge 内部页(代理配置)
 * - 关于我们副标显示当前 Tauri 应用版本号
 */

import { getVersion } from '@tauri-apps/api/app'
import { open as openShell } from '@tauri-apps/plugin-shell'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { getUser } from '@/services/dxmax-auth'
import { loadCrisp, openCrispChat, setCrispUser } from '@/services/dxmax-crisp'

const ACCENT = '#3B82F6'
const ACCENT_BORDER = '#BFDBFE'
const TEXT = '#111827'
const MUTED = '#6B7280'
const BG = '#F9FAFB'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'
const DIVIDER = '#F3F4F6'
const SHADOW = '0 1px 3px rgba(0,0,0,0.04)'
const SHADOW_LG = '0 4px 12px rgba(59,130,246,0.18)'

const WEBSITE = 'https://dxmax.net'
const HELP_URL = `${WEBSITE}/#/knowledge`

function openBrowser(url: string) {
  openShell(url).catch(() => {
    window.open(url, '_blank')
  })
}

export default function DxmaxMorePage() {
  const navigate = useNavigate()
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {})

    // 进页就预加载 Crisp,点击时秒开
    loadCrisp().catch(() => {})
    const user = getUser()
    if (user?.email) setCrispUser(user.email)
  }, [])

  const items = [
    {
      label: '官网',
      onClick: () => openBrowser(WEBSITE),
      d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 0 20 M12 2a15.3 15.3 0 0 0 0 20',
    },
    {
      label: '帮助中心',
      onClick: () => openBrowser(HELP_URL),
      d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
    },
    {
      label: '偏好设置',
      sub: '语言｜主题',
      onClick: () => navigate('/settings'),
      d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    },
    {
      label: '代理配置',
      sub: '端口｜TUN模式',
      onClick: () => navigate('/settings'),
      d: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
    },
    {
      label: '关于我们',
      sub: `v${version}`,
      onClick: () =>
        openBrowser('https://github.com/imedisonxuan/dxmax-client'),
      d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8v4 M12 16h.01',
    },
  ] as const

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
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>更多</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
        大炫Max 支持团队随时提供帮助
      </div>

      {/* Contact us button */}
      <div
        onClick={openCrispChat}
        style={{
          height: 48,
          borderRadius: 12,
          background: ACCENT,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: 'pointer',
          boxShadow: SHADOW_LG,
          marginBottom: 14,
          transition: 'transform .15s, filter .15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)'
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" />
        </svg>
        联系我们
      </div>

      {/* Menu list */}
      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: SHADOW,
        }}
      >
        {items.map((item, i) => (
          <div key={item.label}>
            {i > 0 && (
              <div style={{ height: 1, background: DIVIDER, marginLeft: 54 }} />
            )}
            <div
              onClick={item.onClick}
              style={{
                minHeight: 56,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
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
                  flexShrink: 0,
                }}
              >
                <svg
                  width="15"
                  height="15"
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
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {item.label}
                </div>
                {'sub' in item && item.sub && (
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {item.sub}
                  </div>
                )}
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: `1px solid ${ACCENT_BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
