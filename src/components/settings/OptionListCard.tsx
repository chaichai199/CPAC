import { useState } from 'react'
import { Pencil, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { dataStore } from '@/lib/db'
import { useAuth } from '@/context/AuthContext'
import type { OptionItem, OptionListKey } from '@/types'

interface OptionListCardProps {
  listKey: OptionListKey
  label: string
  items: OptionItem[]
}

export function OptionListCard({ listKey, label, items }: OptionListCardProps) {
  const { user: currentUser } = useAuth()
  const [newValue, setNewValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const move = async (item: OptionItem, direction: 'up' | 'down') => {
    if (!currentUser) return
    setBusy(true)
    setError(null)
    try {
      await dataStore.moveOption(item.id, direction, currentUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async () => {
    if (!newValue.trim() || !currentUser) return
    setBusy(true)
    setError(null)
    try {
      await dataStore.addOption(listKey, newValue.trim(), currentUser)
      setNewValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (item: OptionItem) => {
    setEditingId(item.id)
    setEditValue(item.value)
    setError(null)
  }

  const saveEdit = async (id: string) => {
    if (!editValue.trim() || !currentUser) return
    setBusy(true)
    setError(null)
    try {
      await dataStore.updateOption(id, { value: editValue.trim() }, currentUser)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (item: OptionItem) => {
    if (!currentUser) return
    setBusy(true)
    setError(null)
    try {
      await dataStore.updateOption(item.id, { active: !item.active }, currentUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-display text-sm font-bold text-stone-800">{label}</h3>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={clsx(
              'flex items-center justify-between gap-2 rounded-lg border px-3 py-2',
              item.active ? 'border-sand-200 bg-white/60' : 'border-stone-200 bg-stone-50',
            )}
          >
            {editingId === item.id ? (
              <>
                <input
                  className="input-field !py-1.5 text-sm"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                  autoFocus
                />
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => saveEdit(item.id)} disabled={busy} className="btn-secondary !px-2.5 !py-1.5 text-xs">
                    บันทึก
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost !px-2.5 !py-1.5 text-xs">
                    ยกเลิก
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex min-w-0 shrink-0 flex-col">
                  <button
                    onClick={() => move(item, 'up')}
                    disabled={busy || index === 0}
                    className="btn-ghost !px-1 !py-0.5 disabled:opacity-30"
                    title="เลื่อนขึ้น"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move(item, 'down')}
                    disabled={busy || index === items.length - 1}
                    className="btn-ghost !px-1 !py-0.5 disabled:opacity-30"
                    title="เลื่อนลง"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span
                  className={clsx('flex-1 truncate text-sm', item.active ? 'text-stone-800' : 'text-stone-400 line-through')}
                >
                  {item.value}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => startEdit(item)} className="btn-ghost !px-2 !py-1.5" title="แก้ไข">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={busy}
                    className={clsx(
                      'btn-ghost !px-2.5 !py-1.5 text-xs',
                      item.active ? 'text-red-600 hover:!bg-red-50' : 'text-green-600 hover:!bg-green-50',
                    )}
                  >
                    {item.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-xs text-stone-400">ยังไม่มีตัวเลือก</p>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input-field text-sm"
          placeholder={`เพิ่ม${label}ใหม่`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} disabled={busy || !newValue.trim()} className="btn-primary !px-3 shrink-0">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
