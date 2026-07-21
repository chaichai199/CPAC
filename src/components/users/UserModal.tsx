import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { dataStore } from '@/lib/db'
import type { AppUser, UserRole } from '@/types'

interface UserModalProps {
  editingUser: AppUser | null
  onClose: () => void
}

export function UserModal({ editingUser, onClose }: UserModalProps) {
  const isEdit = Boolean(editingUser)
  const [username, setUsername] = useState(editingUser?.username ?? '')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState(editingUser?.displayName ?? '')
  const [role, setRole] = useState<UserRole>(editingUser?.role ?? 'staff')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !displayName.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้งานและชื่อที่แสดง')
      return
    }
    if (!isEdit && !password.trim()) {
      setError('กรุณากำหนดรหัสผ่าน')
      return
    }

    setSubmitting(true)
    try {
      if (isEdit && editingUser) {
        await dataStore.updateUser(editingUser.id, {
          username: username.trim(),
          displayName: displayName.trim(),
          role,
          ...(password.trim() ? { password: password.trim() } : {}),
        })
      } else {
        await dataStore.addUser({
          username: username.trim(),
          password: password.trim(),
          displayName: displayName.trim(),
          role,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-3 backdrop-blur-sm animate-fade-in sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-slide-in flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-200 bg-white/80 px-5 py-4 sm:px-7">
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900">
              {isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
            </h3>
            <p className="text-sm text-stone-500">กำหนดสิทธิ์การเข้าใช้งานระบบ</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-800/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 sm:px-7">
          <div>
            <label className="field-label">ชื่อผู้ใช้งาน (Username) *</label>
            <input
              className="input-field font-mono"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น somchai"
              required
            />
          </div>
          <div>
            <label className="field-label">
              รหัสผ่าน {isEdit ? '(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)' : '*'}
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'กำหนดรหัสผ่านใหม่'}
              required={!isEdit}
            />
          </div>
          <div>
            <label className="field-label">ชื่อที่แสดง (Display Name) *</label>
            <input
              className="input-field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="เช่น คุณสมชาย ใจดี"
              required
            />
          </div>
          <div>
            <label className="field-label">สิทธิ์การใช้งาน (Role)</label>
            <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="staff">เจ้าหน้าที่ (Staff)</option>
              <option value="admin">แอดมิน (Admin)</option>
            </select>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex items-center justify-end gap-3 border-t border-sand-200 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              ยกเลิก
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
