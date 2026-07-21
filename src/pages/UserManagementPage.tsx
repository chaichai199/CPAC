import { useEffect, useState } from 'react'
import { Pencil, PlusCircle, Trash2, UserCog } from 'lucide-react'
import clsx from 'clsx'
import { dataStore } from '@/lib/db'
import { useAuth } from '@/context/AuthContext'
import { UserModal } from '@/components/users/UserModal'
import type { AppUser } from '@/types'

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => dataStore.subscribeUsers(setUsers), [])

  const openAddModal = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const openEditModal = (u: AppUser) => {
    setEditingUser(u)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    setError(null)
    try {
      await dataStore.deleteUser(id)
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถลบผู้ใช้งานได้')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">จัดการผู้ใช้งาน</h1>
          <p className="mt-1 text-sm text-stone-500">เพิ่ม แก้ไข หรือลบบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <PlusCircle className="h-4 w-4" />
          เพิ่มผู้ใช้งาน
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card divide-y divide-sand-100">
        {users.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-stone-400">ยังไม่มีผู้ใช้งานในระบบ</p>
        ) : (
          users.map((u) => {
            const isSelf = u.id === currentUser?.id
            const isConfirming = confirmDeleteId === u.id
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand-100 text-sand-700">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      {u.displayName}
                      {isSelf && <span className="ml-2 text-xs font-normal text-stone-400">(คุณ)</span>}
                    </p>
                    <p className="font-mono text-xs text-stone-500">@{u.username}</p>
                  </div>
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide',
                      u.role === 'admin' ? 'bg-sand-100 text-sand-700' : 'bg-stone-800/5 text-stone-600',
                    )}
                  >
                    {u.role === 'admin' ? 'ADMIN' : 'STAFF'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isConfirming ? (
                    <>
                      <span className="text-xs text-stone-500">ยืนยันลบผู้ใช้งานนี้?</span>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting}
                        className="btn-secondary !border-red-300 !text-red-700 hover:!bg-red-50"
                      >
                        ยืนยัน
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost">
                        ยกเลิก
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openEditModal(u)} className="btn-ghost" title="แก้ไข">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(u.id)}
                        disabled={isSelf}
                        title={isSelf ? 'ไม่สามารถลบบัญชีตนเองได้' : 'ลบผู้ใช้งาน'}
                        className="btn-ghost !text-red-600 hover:!bg-red-50 disabled:!text-stone-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {modalOpen && <UserModal editingUser={editingUser} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
