/**
 * 大炫Max 登录页 (Phase 4 设计稿对齐版)
 * 设计稿源:~/Desktop/大炫max-design/project/components/LoginPage.jsx
 */

import { open as openShell } from '@tauri-apps/plugin-shell'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import {
  createProfile,
  deleteProfile,
  enhanceProfiles,
  getProfiles,
  patchProfilesConfig,
} from '@/services/cmds'
import { loadAndPatchClashYaml, login } from '@/services/dxmax-api'
import { saveAuth } from '@/services/dxmax-auth'

const SITE_URL = 'https://dxmax.net'
const ACCENT = '#3B82F6'
const TEXT = '#111827'
const MUTED = '#6B7280'
const SUBTLE = '#9CA3AF'
const BG = '#F9FAFB'
const BORDER = '#E5E7EB'

export default function DxmaxLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focus, setFocus] = useState<'email' | 'password' | null>(null)

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

      try {
        // wyx2685 后端的 /api/v1/client/subscribe 标准订阅接口已被掏空(只返回占位节点),
        // 真节点配置在 applogin 返回的 res.clash 字段(base64 + AES-128-CBC 加密)。
        // 流程:解密 → 修补 proxy-groups 空数组 → 写本地 profile → 切 current → 删旧 profile。
        // 顺序很关键:先 createProfile + patchProfilesConfig + enhanceProfiles 让 mihomo 接受新配置,
        // 最后才 deleteProfile 清掉旧的(否则 Verge 在删 current 那条时,enhance 拿到空 mapping 灌进 mihomo)。
        if (!res.clash) {
          throw new Error(
            'applogin 返回里没有 clash 配置字段,后端可能未启用 wyx2685 补丁',
          )
        }
        const yaml = await loadAndPatchClashYaml(res.clash)
        console.log(
          '[DxmaxLogin] 解密+修补 clash YAML 完成,字节数:',
          yaml.length,
        )

        // 先快照当前 profile uid 列表,后面用 diff 找新创建的 uid
        const before = await getProfiles()
        const beforeUids = new Set(before.items?.map((i) => i.uid) ?? [])
        const oldRealProfileUids = (before.items ?? [])
          .filter((i) => i.type === 'local' || i.type === 'remote')
          .map((i) => i.uid)

        await createProfile(
          {
            type: 'local',
            name: '大炫Max',
            desc: `登录于 ${new Date().toLocaleString('zh-CN')}`,
          },
          yaml,
        )
        const after = await getProfiles()
        // createProfile 会同时创建主 profile + 5 个空增强模板(merge/script/rules/proxies/groups),
        // 必须 filter type==='local' 拿到主 profile,不然会切到 merge 模板导致 mihomo 拿空配置
        const newProfile = after.items?.find(
          (i) => !beforeUids.has(i.uid) && i.type === 'local',
        )
        console.log(
          '[DxmaxLogin] createProfile 完成,新 profile:',
          newProfile?.uid,
          newProfile?.name,
          'type=',
          newProfile?.type,
        )
        if (!newProfile) {
          throw new Error('找不到刚创建的 local profile')
        }
        // 必须先切 current 再 enhance,否则 enhance 用的是旧 current
        await patchProfilesConfig({ current: newProfile.uid })
        await enhanceProfiles()
        console.log(
          '[DxmaxLogin] enhanceProfiles 完成,current=',
          newProfile.uid,
        )

        // 现在 mihomo 已经吃到新配置,可以安全删旧 profile(只删 local/remote,不删增强模板)
        for (const uid of oldRealProfileUids) {
          try {
            await deleteProfile(uid)
          } catch (err) {
            console.warn('[DxmaxLogin] 删除旧 profile 失败', uid, err)
          }
        }
        console.log('[DxmaxLogin] 旧 profile 清理完成')
      } catch (e) {
        console.error('[DxmaxLogin] 导入订阅失败', e)
        setError(
          '登录成功但订阅导入失败:' +
            (e instanceof Error ? e.message : String(e)),
        )
        setLoading(false)
        return
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

  const inputBoxStyle = (key: 'email' | 'password'): React.CSSProperties => ({
    background: '#fff',
    border: `1px solid ${focus === key ? ACCENT : BORDER}`,
    borderRadius: 10,
    height: 46,
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focus === key ? `0 0 0 4px ${ACCENT}1A` : 'none',
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: BG,
        color: TEXT,
        fontFamily:
          '-apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes dxmax-spin { to { transform: rotate(360deg); } }
        input.dxmax-input { all: unset; flex: 1; margin-left: 10px; font-size: 13px; color: ${TEXT}; font-family: inherit; }
        input.dxmax-input::placeholder { color: ${SUBTLE}; }
        input.dxmax-input:-webkit-autofill,
        input.dxmax-input:-webkit-autofill:hover,
        input.dxmax-input:-webkit-autofill:focus {
          -webkit-text-fill-color: ${TEXT} !important;
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          caret-color: ${ACCENT} !important;
          transition: background-color 9999s ease-in-out 0s;
        }
        input.dxmax-input::selection { background: #DBEAFE; color: ${TEXT}; }
      `}</style>

      {/* 顶部蓝色径向光晕 */}
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 500,
          background: `radial-gradient(circle, ${ACCENT}1A 0%, ${ACCENT}00 65%)`,
          pointerEvents: 'none',
        }}
      />
      {/* 右下蓝色径向光晕 */}
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          right: -100,
          width: 500,
          height: 500,
          background: `radial-gradient(circle, ${ACCENT}14 0%, ${ACCENT}00 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* 开发期清登录态(Phase 5 前删) */}
      <div
        onClick={() => {
          localStorage.clear()
          window.location.reload()
        }}
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          color: SUBTLE,
          fontSize: 10,
          cursor: 'pointer',
          zIndex: 2,
          opacity: 0.5,
        }}
      >
        clear
      </div>

      {/* 主体居中 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 40px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* logo 蓝色圆角方块 + 盾牌对勾 */}
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: 22,
            background: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 12px 32px ${ACCENT}5C`,
            marginBottom: 18,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 L4 6 v6 c0 5 3.5 9 8 10 c4.5 -1 8 -5 8 -10 V6 z" />
            <path d="M9 12 l2 2 l4 -4" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: TEXT,
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          大炫<span style={{ color: ACCENT }}>Dxmax</span>
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 28 }}>
          极速稳定 · 安全可靠 · 为专业用户打造
        </div>

        {/* 表单 */}
        <div
          style={{
            width: '100%',
            maxWidth: 360,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={inputBoxStyle('email')}>
            <MailIcon />
            <input
              className="dxmax-input"
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocus('email')}
              onBlur={() => setFocus(null)}
              onKeyDown={onKey}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div style={inputBoxStyle('password')}>
            <LockIcon />
            <input
              className="dxmax-input"
              type={showPw ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocus('password')}
              onBlur={() => setFocus(null)}
              onKeyDown={onKey}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: SUBTLE,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label={showPw ? '隐藏密码' : '显示密码'}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '2px 2px',
              fontSize: 11,
            }}
          >
            <label
              style={{
                color: MUTED,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <span
                onClick={() => setRemember((r) => !r)}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  border: `1.5px solid ${ACCENT}`,
                  background: remember ? ACCENT : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {remember && (
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              记住登录
            </label>
            <span
              onClick={() => openExternal(`${SITE_URL}/#/forget`)}
              style={{
                color: ACCENT,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              忘记密码?
            </span>
          </div>

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

          <div
            onClick={loading ? undefined : handleLogin}
            style={{
              height: 48,
              borderRadius: 10,
              background: loading ? '#60A5FA' : ACCENT,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: `0 6px 16px ${ACCENT}5C`,
              marginTop: 4,
              transition: 'background 0.2s',
              userSelect: 'none',
            }}
          >
            {loading && (
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'dxmax-spin 0.7s linear infinite',
                }}
              />
            )}
            {loading ? '登录中…' : '登录'}
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: SUBTLE,
              marginTop: 6,
            }}
          >
            还没有账号?
            <span
              onClick={() => openExternal(`${SITE_URL}/#/register`)}
              style={{
                color: ACCENT,
                cursor: 'pointer',
                fontWeight: 500,
                marginLeft: 4,
              }}
            >
              前往网站注册
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'center',
          fontSize: 10,
          color: SUBTLE,
          position: 'relative',
          zIndex: 1,
        }}
      >
        © 2026 大炫Dxmax · v1.0.0 · 基于 Clash Verge 内核
      </div>
    </div>
  )
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={SUBTLE}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={SUBTLE}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11 V7 a4 4 0 0 1 8 0 v4" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12 s3.5-7 10-7 s10 7 10 7 s-3.5 7-10 7 s-10-7-10-7 z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 4.24 a10 10 0 0 1 12 7.76 a13 13 0 0 1-1.67 2.68 M6.61 6.61 A13 13 0 0 0 2 12 s3.5 7 10 7 a13 13 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M9.88 9.88 a3 3 0 0 0 4.24 4.24" />
    </svg>
  )
}
