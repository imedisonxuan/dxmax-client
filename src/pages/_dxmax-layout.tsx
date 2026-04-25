/**
 * 大炫Max 极简 Layout (Phase 4 设计稿对齐版)
 * 设计稿:桌面 900×650 固定 + 左侧 sidebar 3 tab + Outlet
 * 替代 Verge 原版庞大 _layout.tsx(留备份)
 */

import { Outlet, useLocation, useNavigate } from 'react-router'

const ACCENT = '#3B82F6'
const ACCENT_LIGHT = '#DBEAFE'
const TEXT = '#111827'
const MUTED = '#6B7280'
const BG = '#F9FAFB'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'

const SIDEBAR_W = 92

interface TabDef {
  path: string
  label: string
  match: (p: string) => boolean
  icon: (active: boolean) => React.ReactNode
}

const TABS: TabDef[] = [
  {
    path: '/',
    label: '连接',
    match: (p) => p === '/' || p === '',
    icon: (active) => <PowerOutlineIcon active={active} />,
  },
  {
    path: '/account',
    label: '我的',
    match: (p) => p.startsWith('/account'),
    icon: (active) => <UserIcon active={active} />,
  },
  {
    path: '/more',
    label: '更多',
    match: (p) => p.startsWith('/more'),
    icon: (active) => <MenuIcon active={active} />,
  },
]

export default function DxmaxLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: BG,
        color: TEXT,
        fontFamily:
          '-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 左侧 Sidebar */}
      <div
        style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          background: SURFACE,
          borderRight: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 0',
          gap: 6,
        }}
      >
        {/* 顶部 logo:小蓝盾 */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            boxShadow: `0 4px 12px ${ACCENT}5C`,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 L4 6 v6 c0 5 3.5 9 8 10 c4.5 -1 8 -5 8 -10 V6 z" />
            <path d="M9 12 l2 2 l4 -4" />
          </svg>
        </div>

        {TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <div
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                width: 64,
                padding: '10px 0',
                borderRadius: 12,
                background: active ? ACCENT_LIGHT : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#F3F4F6'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              {tab.icon(active)}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  color: active ? ACCENT : MUTED,
                }}
              >
                {tab.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* 主内容区 */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          overflow: 'auto',
          background: BG,
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}

function PowerOutlineIcon({ active }: { active: boolean }) {
  const color = active ? ACCENT : MUTED
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.36 6.64 a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  const color = active ? ACCENT : MUTED
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21 v-2 a4 4 0 0 0-4-4 H8 a4 4 0 0 0-4 4 v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function MenuIcon({ active }: { active: boolean }) {
  const color = active ? ACCENT : MUTED
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
