/**
 * 大炫Max 「更多」页 (Phase 4 占位)
 * 设计稿:~/Desktop/大炫max-design/project/components/MorePage.jsx
 * Phase 4 后续完整实现:Crisp 客服 + 列表(官网/帮助/偏好/代理配置/关于)
 */

const ACCENT = '#3B82F6'
const TEXT = '#111827'
const MUTED = '#6B7280'

export default function DxmaxMorePage() {
  return (
    <div
      style={{
        padding: '20px 32px',
        height: '100%',
        boxSizing: 'border-box',
        color: TEXT,
        fontFamily:
          '-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: TEXT,
          marginBottom: 20,
        }}
      >
        更多
      </div>
      <div
        style={{
          color: MUTED,
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        即将上线:
        <br />· 联系我们(Crisp 在线客服)
        <br />· 官方网站
        <br />· 帮助中心
        <br />· 偏好设置(语言 / 主题)
        <br />· 代理配置(端口 / TUN)
        <br />· 关于
        <span style={{ color: ACCENT, marginLeft: 4 }}>大炫Max v1.0.0</span>
      </div>
    </div>
  )
}
