/**
 * 大炫Max 首页 (Phase 4 设计稿对齐版)
 * 设计稿源:~/Desktop/大炫max-design/project/components/HomePage.jsx
 *
 * 复用 Verge 现成 hook:
 * - useSystemProxyState → 电源按钮(toggleSystemProxy)
 * - useTrafficData → 流量卡(实时 up/down)
 * - useCurrentProxy → 节点条(当前选中的代理)
 */

import { useNavigate } from 'react-router'

import { useCurrentProxy } from '@/hooks/use-current-proxy'
import { useSystemProxyState } from '@/hooks/use-system-proxy-state'
import { useTrafficData } from '@/hooks/use-traffic-data'

const ACCENT = '#3B82F6'
const ACCENT_LIGHT = '#DBEAFE'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SUBTLE = '#9CA3AF'
const BG = '#F9FAFB'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'
const DIVIDER = '#F3F4F6'
const SUCCESS = '#10B981'
const DANGER = '#EF4444'

function formatBytes(n: number): [string, string] {
  if (!n || n < 1024) return [n.toFixed(1), 'B/s']
  if (n < 1024 * 1024) return [(n / 1024).toFixed(1), 'KB/s']
  if (n < 1024 * 1024 * 1024) return [(n / (1024 * 1024)).toFixed(1), 'MB/s']
  return [(n / (1024 * 1024 * 1024)).toFixed(1), 'GB/s']
}

export default function DxmaxHomePage() {
  const navigate = useNavigate()
  const { indicator: connected, toggleSystemProxy } = useSystemProxyState()
  const { response: trafficQuery } = useTrafficData()
  const { currentProxy, primaryGroupName } = useCurrentProxy()

  const up = trafficQuery.data?.up ?? 0
  const down = trafficQuery.data?.down ?? 0
  const [upVal, upUnit] = formatBytes(connected ? up : 0)
  const [downVal, downUnit] = formatBytes(connected ? down : 0)

  const nodeName = currentProxy?.name || primaryGroupName || '未选择节点'

  const togglePower = () => {
    toggleSystemProxy(!connected).catch((e) =>
      console.warn('[DxmaxHome] toggle 系统代理失败', e),
    )
  }

  return (
    <div
      style={{
        height: '100%',
        background: BG,
        color: TEXT,
        fontFamily:
          '-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        padding: '20px 32px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes dxmax-bell-ring {
          0%, 92%, 100% { transform: rotate(0deg); }
          93% { transform: rotate(-12deg); }
          95% { transform: rotate(12deg); }
          97% { transform: rotate(-8deg); }
          99% { transform: rotate(4deg); }
        }
        @keyframes dxmax-bell-dot {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes dxmax-ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes dxmax-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header: 大炫Max + 铃铛 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: TEXT,
            letterSpacing: 0.5,
          }}
        >
          大炫<span style={{ color: ACCENT }}>Max</span>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'default',
          }}
        >
          <div
            style={{
              animation: 'dxmax-bell-ring 4s ease-in-out infinite',
              transformOrigin: '50% 0%',
              display: 'flex',
            }}
          >
            <BellIcon />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: DANGER,
              border: `1.5px solid ${BG}`,
              animation: 'dxmax-bell-dot 1.8s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* 节点选择条 */}
      <div
        onClick={() => navigate('/nodes')}
        style={{
          height: 52,
          borderRadius: 999,
          border: `2px solid ${ACCENT}`,
          background: SURFACE,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          cursor: 'pointer',
          transition: 'background 0.2s',
          boxShadow: `0 2px 8px ${ACCENT}1F`,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = ACCENT_LIGHT
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = SURFACE
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: '2px solid #fff',
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: TEXT,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 8px',
          }}
        >
          {nodeName}
        </div>
        <ChevronRightIcon />
      </div>

      {/* 大圆电源按钮 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
        }}
      >
        <PowerButton connected={connected} onToggle={togglePower} />
      </div>

      {/* 状态卡 + 流量卡 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: connected ? SUCCESS : TEXT,
            }}
          >
            {connected ? '已连接' : '未连接'}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            {connected ? '加密隧道已建立' : '点击按钮进行连接'}
          </div>
        </div>

        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <TrafficCol
            label="上传"
            val={upVal}
            unit={upUnit}
            icon={<ArrowUpIcon />}
          />
          <div style={{ width: 1, height: 28, background: DIVIDER }} />
          <TrafficCol
            label="下载"
            val={downVal}
            unit={downUnit}
            icon={<ArrowDownIcon />}
          />
        </div>
      </div>
    </div>
  )
}

function PowerButton({
  connected,
  onToggle,
}: {
  connected: boolean
  onToggle: () => void
}) {
  const size = 180
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: size * 1.8,
          height: size * 1.8,
          borderRadius: '50%',
          background: connected
            ? `radial-gradient(circle, ${ACCENT}33 0%, ${ACCENT}00 60%)`
            : `radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />
      {connected && (
        <div
          style={{
            position: 'absolute',
            width: size + 40,
            height: size + 40,
            borderRadius: '50%',
            border: `1.5px solid ${ACCENT}4D`,
            animation: 'dxmax-ripple 2.4s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        onClick={onToggle}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: connected ? ACCENT : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: connected
            ? `0 14px 40px ${ACCENT}66, inset 0 -4px 12px rgba(0,0,0,0.1)`
            : `0 6px 20px rgba(0,0,0,0.08)`,
          position: 'relative',
          zIndex: 1,
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <PowerIcon size={size * 0.38} color={connected ? '#fff' : MUTED} />
      </div>
    </div>
  )
}

function TrafficCol({
  label,
  val,
  unit,
  icon,
}: {
  label: string
  val: string
  unit: string
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: ACCENT_LIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: TEXT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {val}
          </span>
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>
            {unit}
          </span>
        </div>
        <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
      </div>
    </div>
  )
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8 a6 6 0 0 1 12 0 c0 7 3 9 3 9 H3 s3-2 3-9" />
      <path d="M10.3 21 a2 2 0 0 0 3.4 0" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function PowerIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.36 6.64 a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  )
}

// SUBTLE 暂未使用,保留供后续节点页等组件复用
void SUBTLE
