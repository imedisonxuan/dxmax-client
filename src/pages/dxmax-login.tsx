/**
 * 大炫Max 登录页 — Phase 2 简版
 * 调用 https://api.dxmax.cn/api/v1/app/applogin
 * 登录成功 → 保存 token → 跳主页
 *
 * UI 后续 Phase 4 替换成设计稿那版漂亮的
 */

import { open as openShell } from '@tauri-apps/plugin-shell'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import {
  deleteProfile,
  enhanceProfiles,
  getProfiles,
  importProfile,
  patchProfilesConfig,
} from '@/services/cmds'
import { buildSubscribeUrl, login } from '@/services/dxmax-api'
import { saveAuth } from '@/services/dxmax-auth'

const SITE_URL = 'https://dxmax.net'

export default function DxmaxLoginPage() {
  console.log('[DxmaxLogin] 登录页 component 渲染')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }
    setLoading(true)
    try {
      const res = await login(email, password)
      if (res.status !== 1 || !res.token) {
        setError(res.msg || '登录失败')
        setLoading(false)
        return
      }
      saveAuth(res)

      // 走标准 v2board 订阅 URL(applogin 返回的 token 就是 subscribe token)
      // 绕过 wyx2685 硬编码只支持 SS/vmess/trojan 的 clash 字段
      if (res.token) {
        try {
          const subUrl = buildSubscribeUrl(res.token)

          const cur = await getProfiles()
          if (cur.items?.length) {
            for (const item of cur.items) {
              try {
                await deleteProfile(item.uid)
              } catch (err) {
                console.warn('[DxmaxLogin] 删除旧 profile 失败', item.uid, err)
              }
            }
          }

          await importProfile(subUrl)

          const after = await getProfiles()
          const newProfile = after.items?.[after.items.length - 1]
          if (newProfile) {
            await patchProfilesConfig({ current: newProfile.uid })
            await enhanceProfiles()
          }
        } catch (e) {
          console.error('[DxmaxLogin] 导入订阅失败', e)
          setError(
            '登录成功但订阅导入失败:' +
              (e instanceof Error ? e.message : String(e)),
          )
          setLoading(false)
          return
        }
      }

      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  const openExternal = (url: string) => {
    openShell(url).catch(() => {
      window.open(url, '_blank')
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        zIndex: 99999,
      }}
    >
      <style>{`
        input.dxmax-input:-webkit-autofill,
        input.dxmax-input:-webkit-autofill:hover,
        input.dxmax-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #111827 !important;
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          caret-color: #3B82F6 !important;
          transition: background-color 9999s ease-in-out 0s;
        }
        input.dxmax-input::selection {
          background: #DBEAFE;
          color: #111827;
        }
      `}</style>
      {/* DEBUG 标记 - 测试登录页是否渲染 */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: '#10B981',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          zIndex: 100000,
        }}
      >
        ✅ 登录页已加载
      </div>
      {/* DEBUG 入口 - 强制清登录态(开发用,Phase 5 前删) */}
      <div
        onClick={() => {
          localStorage.clear()
          window.location.reload()
        }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: '#EF4444',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 100000,
        }}
      >
        🗑️ 清登录态
      </div>
      <div
        style={{
          width: 360,
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
        }}
      >
        {/* Logo + 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#3B82F6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
              <path d="M13 2 L4 13 h6 l-1 9 l9 -11 h-6 l1 -9 z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#111827',
              letterSpacing: 0.5,
            }}
          >
            大炫<span style={{ color: '#3B82F6' }}>Max</span>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            极速稳定 · 安全可靠
          </div>
        </div>

        {/* 表单 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="dxmax-input"
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
            style={inputStyle}
          />
          <input
            className="dxmax-input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            disabled={loading}
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                fontSize: 12,
                color: '#EF4444',
                background: '#FEF2F2',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #FEE2E2',
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              height: 44,
              borderRadius: 10,
              background: loading ? '#93C5FD' : '#3B82F6',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              marginTop: 4,
              boxShadow: '0 4px 12px rgba(59,130,246,0.18)',
            }}
          >
            {loading ? '登录中…' : '登录'}
          </button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              marginTop: 4,
            }}
          >
            <a
              onClick={() => openExternal(`${SITE_URL}/#/forget`)}
              style={linkStyle}
            >
              忘记密码?
            </a>
            <a
              onClick={() => openExternal(`${SITE_URL}/#/register`)}
              style={linkStyle}
            >
              注册账号
            </a>
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 10,
            color: '#9CA3AF',
            marginTop: 24,
          }}
        >
          © 2026 大炫Max · v1.0.0
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  height: 44,
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: '0 14px',
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  color: '#111827',
  caretColor: '#3B82F6',
  fontFamily: 'inherit',
}

const linkStyle: React.CSSProperties = {
  color: '#3B82F6',
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'none',
}
