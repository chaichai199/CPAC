import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Lock, Truck, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = login(username, password)
    if (!result.ok) {
      setError(result.message ?? 'เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-800 text-cream-50 shadow-elevated">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">BURAPACONCRETE</h1>
          <p className="mt-1 text-sm font-medium tracking-wide text-sand-600">CPAC Booking System</p>
          <p className="mt-2 text-xs text-stone-400">ระบบรับจองและบริหารจัดการคิวส่งคอนกรีตผสมเสร็จ</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6 sm:p-8">
          <div>
            <label className="field-label">ชื่อผู้ใช้งาน</label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                className="input-field pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin หรือ staff"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="field-label">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                className="input-field pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" className="btn-primary w-full !py-3">
            เข้าสู่ระบบ
          </button>

          <div className="rounded-xl bg-sand-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
            <p className="mb-1 font-semibold text-stone-600">บัญชีทดลองใช้งาน</p>
            <p>Admin: <span className="font-mono">admin / admin123</span></p>
            <p>Staff: <span className="font-mono">staff / staff123</span></p>
          </div>
        </form>
      </div>
    </div>
  )
}
