import { useState } from 'react'
import { supabase } from '../lib/supabase'

const AUTH_KEY = 'notepad_authenticated'

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true'
  })
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const verify = async () => {
    if (!password.trim() || checking) return

    setChecking(true)
    setError('')

    const { data, error: rpcError } = await supabase
      .rpc('verify_password', { input_password: password.trim() })

    if (!rpcError && data === true) {
      localStorage.setItem(AUTH_KEY, 'true')
      setAuthed(true)
    } else {
      setError('密码错误')
      setPassword('')
    }
    setChecking(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') verify()
  }

  if (authed) return children

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-stone-50 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 text-center">
          {/* 图标 */}
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-lg font-semibold text-stone-800 mb-2">
            需要密码
          </h1>
          <p className="text-sm text-stone-400 mb-6">
            每台设备只需输入一次
          </p>

          {/* 输入框 */}
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={handleKeyDown}
            placeholder="输入密码"
            autoFocus
            className="w-full px-4 py-3 bg-stone-50 rounded-xl border border-stone-200
                       text-sm text-stone-700 placeholder-stone-300 text-center outline-none
                       focus:border-stone-400 focus:ring-2 focus:ring-stone-100
                       transition-all duration-200"
          />

          {/* 错误提示 */}
          {error && (
            <p className="text-red-400 text-xs mt-3 animate-pulse">{error}</p>
          )}

          {/* 确认按钮 */}
          <button
            onClick={verify}
            disabled={!password.trim() || checking}
            className="mt-5 w-full py-2.5 bg-stone-800 text-white text-sm rounded-xl
                       hover:bg-stone-700 active:scale-95 transition-all duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {checking ? '验证中...' : '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}
