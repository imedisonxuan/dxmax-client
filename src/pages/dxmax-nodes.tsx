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
  const { proxies, clashConfig, refreshClashConfig, refreshProxy } =
    useAppData()
  const { primaryGroupName, currentProxy } = useCurrentProxy()
  const { changeProxy } = useProxySelection({
    onSuccess: () => {
      // mihomo 切完节点后强刷 React Query,UI 才会更新选中状态
      refreshProxy().catch(() => {})
    },
  })
  const [testing, setTesting] = useState(false)

  // 全局模式下 primaryGroupName='GLOBAL',calcuProxies 把 GLOBAL 单独放在 proxies.global
  const group =
    primaryGroupName === 'GLOBAL'
      ? (proxies?.global as any)
      : proxies?.groups?.find((g: any) => g.name === primaryGroupName)

  const NESTED_GROUP_TYPES = [
    'selector',
    'urltest',
    'url-test',
    'fallback',
    'loadbalance',
    'relay',
  ]

  // 主组里嵌套的 url-test/fallback 等组单独提取为"快捷组"显示在节点列表顶部,
  // 让用户能切换"自动选择"等
  const autoGroups = ((group?.all ?? []) as any[])
    .filter((item) => {
      if (typeof item === 'string') return false
      const t = (item?.type ?? '').toLowerCase()
      return ['urltest', 'url-test', 'fallback', 'loadbalance'].includes(t)
    })
    .map((item) => ({ name: item.name as string, type: item.type as string }))

  // calcuProxies 已经把 group.all 转成 IProxyItem 对象数组,直接读对象字段;
  // 同时过滤掉嵌套的 group(type=Selector/URLTest/Fallback 这种,它们也会出现在 all 里)。
  // 也过滤掉占位节点(server=127.0.0.1 或名字含特定关键字)。
  const PLACEHOLDER_KW = [
    '看公告',
    '剩余流量',
    '套餐到期',
    '到期',
    '客服',
    '官网',
    '更新订阅',
  ]
  const isPlaceholder = (name: string, server?: string) => {
    if (server === '127.0.0.1') return true
    return PLACEHOLDER_KW.some((kw) => name.includes(kw))
  }

  const nodes: NodeItem[] = ((group?.all ?? []) as any[])
    .filter((item) => {
      if (typeof item === 'string') return true
      const t = (item?.type ?? '').toLowerCase()
      if (NESTED_GROUP_TYPES.includes(t)) return false
      return !isPlaceholder(item?.name ?? '', item?.server)
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
    console.log(
      '[DxmaxNodes] handleSelect',
      name,
      'group=',
      primaryGroupName,
      'current=',
      currentProxy?.name,
    )
    if (!primaryGroupName) {
      console.warn('[DxmaxNodes] 没有 primaryGroupName,不能切节点')
      return
    }
    if (name === currentProxy?.name) {
      console.log('[DxmaxNodes] 已是当前节点,跳过')
      return
    }
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
        background: BG,
        color: TEXT,
        fontFamily:
          '-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        boxSizing: 'border-box',
        minHeight: '100%',
      }}
    >
      <style>{`
        @keyframes dxmax-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header(粘性置顶,滚列表时不丢) */}
      <div
        style={{
          padding: '18px 28px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: BG,
          zIndex: 10,
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

      {/* List(自然流式布局,由外层 layout 主内容区滚) */}
      <div
        style={{
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
              background: globalMode ? ACCENT : '#D1D5DB',
              border: globalMode ? `1px solid ${ACCENT}` : `1px solid #9CA3AF`,
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: globalMode ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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

        {/* 快捷组(自动选择/故障转移 等嵌套组,点击切到对应策略) */}
        {autoGroups.map((g) => {
          const selected = g.name === currentProxy?.name
          const t = g.type.toLowerCase()
          const label = /urltest|url-test/.test(t)
            ? '自动选择'
            : /fallback/.test(t)
              ? '故障转移'
              : /loadbalance/.test(t)
                ? '负载均衡'
                : g.name
          const subtitle = /urltest|url-test/.test(t)
            ? '按延迟自动选择最快节点'
            : /fallback/.test(t)
              ? '故障时自动切到下一个节点'
              : g.name
          return (
            <div
              key={g.name}
              onClick={() => handleSelect(g.name)}
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
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: selected ? ACCENT : ACCENT_LIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={selected ? '#fff' : ACCENT}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 0 1-15.3 6.36L3 16" />
                  <path d="M3 12a9 9 0 0 1 15.3-6.36L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M3 21v-5h5" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {subtitle}
                </div>
              </div>
              {selected && (
                <div
                  style={{
                    fontSize: 11,
                    color: ACCENT,
                    fontWeight: 600,
                  }}
                >
                  使用中
                </div>
              )}
            </div>
          )
        })}

        {/* 节点列表(参考截图风格:扁平行 + 选中态蓝勾蓝字) */}
        {nodes.length > 0 && (
          <div
            style={{
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            {nodes.map((node, idx) => {
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
                <div key={node.name}>
                  {idx > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: '#F3F4F6',
                        marginLeft: 56,
                      }}
                    />
                  )}
                  <div
                    onClick={() => handleSelect(node.name)}
                    style={{
                      padding: '14px 18px 14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = HOVER_BG
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* 左侧选中标记(占固定 24px 不抖) */}
                    <div
                      style={{
                        width: 24,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={ACCENT}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* 节点名(带国旗 emoji,选中变蓝) */}
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: selected ? ACCENT : TEXT,
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {node.name}
                      </div>
                      {/* 协议徽章 */}
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: CHIP_BG,
                          color: CHIP_TEXT,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
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
                            fontWeight: 700,
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
                </div>
              )
            })}
          </div>
        )}

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
