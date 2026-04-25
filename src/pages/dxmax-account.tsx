/**
 * 大炫Max 「我的」页 — Phase 2 简版
 * 读 localStorage 里的 user + 进页时调一次 sync 刷新
 * Phase 4 会换成设计稿的 MePage.jsx
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { deleteProfile, getProfiles } from '@/services/cmds'
import { sync } from '@/services/dxmax-api'
import {
  getToken,
  getUser,
  logout,
  saveAuth,
  type SavedUser,
} from '@/services/dxmax-auth'

export default function DxmaxAccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<SavedUser | null>(() => getUser())
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      <div style={{ padding: 32, color: '#6B7280' }}>
        未登录数据,<a onClick={() => navigate('/login')}>去登录</a>
      </div>
    )
  }

  const used = user.useTf ?? '—'
  const total = user.transfer_enable ?? '—'
  const pct = Math.max(0, Math.min(100, user.tfPercentage ?? 0))

  return (
    <div
      style={{
        padding: 32,
        fontFamily:
          '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#111827',
        maxWidth: 560,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700 }}>账号</div>
        <button
          onClick={() => refresh(false)}
          disabled={syncing}
          style={btnGhost}
        >
          {syncing ? '同步中…' : '刷新'}
        </button>
      </div>

      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
        Hi,
        <span style={{ color: '#111827', fontWeight: 600 }}>{user.email}</span>{' '}
        👋
      </div>

      {error && (
        <div
          style={{
            fontSize: 12,
            color: '#EF4444',
            background: '#FEF2F2',
            padding: '8px 12px',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div style={card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {user.planName ?? '未订阅套餐'}
          </div>
          <div
            style={{
              background: '#DBEAFE',
              color: '#3B82F6',
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            激活
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
          {user.expired ?? '长期有效'}
          {typeof user.days === 'number' && user.days >= 0 && (
            <span style={{ marginLeft: 8, color: '#F59E0B' }}>
              剩余 {user.days} 天
            </span>
          )}
        </div>
        <div style={progressTrack}>
          <div style={{ ...progressFill, width: `${pct}%` }} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#6B7280',
            marginTop: 6,
          }}
        >
          <span>已用 {used}</span>
          <span>总 {total}</span>
        </div>
        {user.residue && (
          <div style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>
            剩余流量 {user.residue}
          </div>
        )}
      </div>

      {user.code && (
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
            我的邀请码
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'SF Mono, Menlo, monospace',
              letterSpacing: 1,
            }}
          >
            {user.code}
          </div>
        </div>
      )}

      <button onClick={handleLogout} style={btnDanger}>
        退出登录
      </button>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

const btnGhost: React.CSSProperties = {
  height: 32,
  padding: '0 14px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  background: '#fff',
  fontSize: 12,
  fontWeight: 500,
  color: '#3B82F6',
  cursor: 'pointer',
}

const btnDanger: React.CSSProperties = {
  marginTop: 24,
  height: 44,
  width: '100%',
  border: 'none',
  borderRadius: 10,
  background: '#FEF2F2',
  color: '#EF4444',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}

const progressTrack: React.CSSProperties = {
  height: 8,
  background: '#F3F4F6',
  borderRadius: 999,
  overflow: 'hidden',
}

const progressFill: React.CSSProperties = {
  height: '100%',
  background: '#10B981',
  borderRadius: 999,
  transition: 'width 0.3s ease',
}
