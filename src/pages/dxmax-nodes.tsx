/**
 * 大炫Max 节点选择页 (Phase 4 设计稿对齐版)
 * 设计稿源:~/Desktop/大炫max-design/project/components/NodesPage.jsx
 *
 * 真实 mihomo 数据:
 * - useAppData().proxies → 主组 all 节点列表
 * - useCurrentProxy → 当前选中
 * - useProxySelection → 切换节点
 * - patchClashConfig → 全局模式开关
 */

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { patchBaseConfig } from 'tauri-plugin-mihomo-api'

import { useCurrentProxy } from '@/hooks/use-current-proxy'
import { useProxySelection } from '@/hooks/use-proxy-selection'
import { useAppData } from '@/providers/app-data-context'

const ACCENT = '#3B82F6'
const ACCENT_LIGHT = '#DBEAFE'
const ACCENT_BORDER = '#DBEAFE'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SUBTLE = '#9CA3AF'
const BG = '#F9FAFB'
const SURFACE = '#FFFFFF'
const BORDER = '#E5E7EB'
const HOVER_BG = '#F9FAFB'
const CHIP_BG = '#F3F4F6'
const CHIP_TEXT = '#6B7280'
const SUCCESS = '#10B981'
const WARN = '#F59E0B'
const DANGER = '#EF4444'
const PILL = '#F3F4F6'

interface NodeItem {
  name: string
  type: string
  latency: number | null
}

function getLatency(record: any): number | null {
  const history = record?.history
  if (!Array.isArray(history) || history.length === 0) return null
  const last = history[history.length - 1]
  if (!last || typeof last.delay !== 'number') return null
  return last.delay > 0 ? last.delay : null
}

export default function DxmaxNodesPage() {
  const navigate = useNavigate()
  const { proxies, clashConfig, refreshClashConfig } = useAppData()
  const { primaryGroupName, currentProxy } = useCurrentProxy()
  const { changeProxy } = useProxySelection()
  const [testing, setTesting] = useState(false)

  const group = proxies?.groups?.find((g: any) => g.name === primaryGroupName)
  // calcuProxies 已经把 group.all 转成 IProxyItem 对象数组,直接读对象字段;
  // 同时过滤掉嵌套的 group(type=Selector/URLTest/Fallback 这种,它们也会出现在 all 里)。
  const nodes: NodeItem[] = ((group?.all ?? []) as any[])
    .filter((item) => {
      if (typeof item === 'string') return true
      const t = (item?.type ?? '').toLowerCase()
      return ![
        'selector',
        'urltest',
        'url-test',
        'fallback',
        'loadbalance',
        'relay',
      ].includes(t)
    })
    .map((item) => {
      if (typeof item === 'string') {
        const rec = proxies?.records?.[item]
        return rec
          ? {
              name: item,
              type: rec.type ?? 'Unknown',
              latency: getLatency(rec),
            }
          : null
      }
      return {
        name: item.name,
        type: item.type ?? 'Unknown',
        latency: getLatency(item),
      } as NodeItem
    })
    .filter((n): n is NodeItem => n !== null)

  const currentMode = clashConfig?.mode?.toLowerCase() ?? 'rule'
  const globalMode = currentMode === 'global'

  const toggleGlobalMode = async (next: boolean) => {
    try {
      await patchBaseConfig({ mode: next ? 'global' : 'rule' })
      await refreshClashConfig()
    } catch (e) {
      console.warn('[DxmaxNodes] 切换模式失败', e)
    }
  }

  const handleSelect = (name: string) => {
    if (!primaryGroupName) return
    if (name === currentProxy?.name) return
    changeProxy(primaryGroupName, name, currentProxy?.name)
  }

  const runTest = () => {
    if (testing) return
    setTesting(true)
    setTimeout(() => setTesting(false), 1400)
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BG,
        color: TEXT,
        fontFamily:
          '-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes dxmax-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '18px 28px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div
          onClick={() => navigate('/')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = HOVER_BG
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <ArrowLeftIcon />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>
          节点选择
        </div>
        <div
          onClick={runTest}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: `1.5px solid ${ACCENT_BORDER}`,
            background: testing ? ACCENT_LIGHT : SURFACE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: testing ? 'wait' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ZapIcon spin={testing} />
        </div>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* 全局模式开关 */}
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: '14px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: ACCENT_LIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GlobeIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
              全局模式
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              开启后所有网络请求都将通过 VPN
            </div>
          </div>
          <div
            onClick={() => toggleGlobalMode(!globalMode)}
            style={{
              width: 46,
              height: 26,
              borderRadius: 999,
              background: globalMode ? ACCENT : '#E5E7EB',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: globalMode ? 23 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>

        {/* 公告卡(占位,Phase 5 接 appnotice API) */}
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: '12px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: ACCENT_LIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <InfoGlobeIcon />
          </div>
          <div
            style={{
              fontSize: 12,
              color: TEXT,
              fontWeight: 500,
              flex: 1,
              lineHeight: 1.4,
            }}
          >
            当前选中:
            <span style={{ color: ACCENT, marginLeft: 4 }}>
              {primaryGroupName ?? '—'}
            </span>{' '}
            · 共 {nodes.length} 个节点
          </div>
        </div>

        {/* 节点列表 */}
        {nodes.map((node) => {
          const selected = node.name === currentProxy?.name
          const lat = node.latency
          const latColor =
            lat == null
              ? SUBTLE
              : lat < 100
                ? SUCCESS
                : lat < 200
                  ? WARN
                  : DANGER
          return (
            <div
              key={node.name}
              onClick={() => handleSelect(node.name)}
              style={{
                background: selected ? ACCENT_LIGHT : SURFACE,
                border: `1px solid ${selected ? ACCENT_BORDER : BORDER}`,
                borderRadius: 14,
                padding: '14px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.background = HOVER_BG
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.background = SURFACE
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: selected ? ACCENT : '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {selected ? (
                  <CheckIcon />
                ) : (
                  // 节点名前缀的国旗 emoji 直接复用,简单粗暴但有效
                  <span style={{ fontSize: 20 }}>{extractFlag(node.name)}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: TEXT,
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stripFlag(node.name)}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: CHIP_BG,
                    color: CHIP_TEXT,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {node.type}
                </div>
              </div>
              {testing ? (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: `2px solid ${PILL}`,
                    borderTopColor: ACCENT,
                    borderRadius: '50%',
                    animation: 'dxmax-spin 0.7s linear infinite',
                    flexShrink: 0,
                  }}
                />
              ) : (
                lat != null && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: latColor,
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}
                  >
                    {lat}ms
                  </div>
                )
              )}
            </div>
          )
        })}

        {nodes.length === 0 && (
          <div
            style={{
              padding: '40px 0',
              textAlign: 'center',
              color: MUTED,
              fontSize: 13,
            }}
          >
            暂无节点数据(订阅未加载或网络问题)
          </div>
        )}
      </div>
    </div>
  )
}

// 节点名通常是 "🇸🇬 新加坡1×1" 这种格式,提取前缀的国旗 emoji
function extractFlag(name: string): string {
  // emoji 国旗是 2 个 region indicator(长度 4 个 UTF-16 单元)
  const match = name.match(/^[\u{1F1E6}-\u{1F1FF}]{2}/u)
  return match?.[0] ?? '🌐'
}
function stripFlag(name: string): string {
  return name.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').trim() || name
}

function ArrowLeftIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function ZapIcon({ spin }: { spin: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={spin ? ACCENT : 'none'}
      stroke={ACCENT}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: spin ? 'dxmax-spin 1s linear infinite' : 'none' }}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12 h20" />
      <path d="M12 2 a14.5 14.5 0 0 0 0 20 a14.5 14.5 0 0 0 0-20" />
    </svg>
  )
}

function InfoGlobeIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 a14.5 14.5 0 0 0 0 20 a14.5 14.5 0 0 0 0-20" />
      <path d="M2 12 h20" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
