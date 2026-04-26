/**
 * 大炫Max 首页 (Phase 4 设计稿对齐版)
 * 设计稿源:~/Desktop/大炫max-design/project/components/HomePage.jsx
 *
 * 电源按钮策略:
 * - 优先 TUN 模式(mihomo 虚拟网卡接管流量,不依赖 macOS 系统代理),
 *   规避 sysproxy-rs 的 "failed to get default network interface" 死路;
 * - TUN 不可用(helper 服务没装/没 admin)才 fallback 到 system proxy。
 */

import { useNavigate } from 'react-router'

import { useCurrentProxy } from '@/hooks/use-current-proxy'
import { useSystemProxyState } from '@/hooks/use-system-proxy-state'
import { useSystemState } from '@/hooks/use-system-state'
import { useTrafficData } from '@/hooks/use-traffic-data'
import { useVerge } from '@/hooks/use-verge'
import { installService } from '@/services/cmds'

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
  const { indicator: sysProxyOn, toggleSystemProxy } = useSystemProxyState()
  const { verge, patchVerge } = useVerge()
  const { isTunModeAvailable } = useSystemState()
  const { response: trafficQuery } = useTrafficData()
  const { currentProxy, primaryGroupName } = useCurrentProxy()

  const tunOn = !!verge?.enable_tun_mode
  // 任一开启就视为已连接;关闭时两个都关
  const connected = tunOn || sysProxyOn

  const up = trafficQuery.data?.up ?? 0
  const down = trafficQuery.data?.down ?? 0
  const [upVal, upUnit] = formatBytes(connected ? up : 0)
  const [downVal, downUnit] = formatBytes(connected ? down : 0)

  const nodeName = currentProxy?.name || primaryGroupName || '未选择节点'

  const togglePower = async () => {
    console.log(
      '[DxmaxHome] click power, connected=',
      connected,
      'tun=',
      tunOn,
      'sys=',
      sysProxyOn,
      'tunAvail=',
      isTunModeAvailable,
    )
    try {
      if (connected) {
        // 关闭:同时关 TUN + system proxy
        if (tunOn) await patchVerge({ enable_tun_mode: false })
        if (sysProxyOn) await toggleSystemProxy(false)
        return
      }
      // 开启:优先 TUN(绕开 sysproxy 死路),不可用再 fallback system proxy
      if (isTunModeAvailable) {
        await patchVerge({ enable_tun_mode: true })
        return
      }
      // TUN 不可用 → 先试 system proxy
      try {
        await toggleSystemProxy(true)
      } catch (e) {
        console.warn('[DxmaxHome] sysproxy 失败,引导用户装 helper', e)
        const ok = confirm(
          'macOS 系统代理无法启用(常见于网络配置异常)。\n\n建议安装"系统服务"以使用 TUN 模式接管流量,这是更稳定的方案。\n\n点击"确定"立即安装(需要管理员密码)。',
        )
        if (ok) {
          try {
            await installService()
            alert('系统服务安装成功,请再次点击电源按钮开启代理。')
          } catch (instErr) {
            alert(
              `服务安装失败:${instErr instanceof Error ? instErr.message : String(instErr)}`,
            )
          }
        }
      }
    } catch (e) {
      console.error('[DxmaxHome] togglePower 异常', e)
      alert(`开启代理失败:${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const showNotice = () => {
    alert('公告功能开发中,敬请期待。')
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
        @keyframes dxmax-spin { to { transform: rotate(360deg); } }
        /* 按钮周边小幅扩散水波纹 */
        @keyframes dxmax-wave-inner {
          0% { transform: scale(0.98); opacity: 0.75; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes dxmax-wave-outer {
          0% { transform: scale(0.98); opacity: 0.5; }
          100% { transform: scale(1.25); opacity: 0; }
        }
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
          onClick={showNotice}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
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
  const size = 144
  // 配色:开启态深蓝,关闭态淡蓝(跟大炫蓝主调一致)
  const ringColor = ACCENT
  const ringOpacity = connected ? 0.22 : 0.13
  // 水波纹只在按钮边缘附近一圈
  const innerWaveSize = size * 1.12
  const outerWaveSize = size * 1.28
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        width: outerWaveSize,
        height: outerWaveSize,
      }}
    >
      {/* 外层水波纹 */}
      <div
        style={{
          position: 'absolute',
          width: outerWaveSize,
          height: outerWaveSize,
          borderRadius: '50%',
          background: ringColor,
          opacity: ringOpacity * 0.55,
          animation: 'dxmax-wave-outer 2.8s ease-out infinite',
          pointerEvents: 'none',
        }}
      />
      {/* 内层水波纹(延迟 1.4s 形成节奏感) */}
      <div
        style={{
          position: 'absolute',
          width: innerWaveSize,
          height: innerWaveSize,
          borderRadius: '50%',
          background: ringColor,
          opacity: ringOpacity,
          animation: 'dxmax-wave-inner 2.8s ease-out infinite',
          animationDelay: '0.9s',
          pointerEvents: 'none',
        }}
      />
      {/* 中心按钮 */}
      <div
        onClick={onToggle}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: connected ? ACCENT : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: connected ? 'none' : `1.5px solid ${ACCENT_LIGHT}`,
          boxShadow: connected
            ? `0 14px 40px ${ACCENT}66`
            : `0 6px 18px ${ACCENT}1F`,
          position: 'relative',
          zIndex: 1,
          userSelect: 'none',
          transition: 'transform 0.18s ease-out, background 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.96)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)'
        }}
      >
        <PowerIcon size={size * 0.4} color={connected ? '#fff' : ACCENT} />
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
