import { useMemo, useState, type FormEvent } from 'react'
import { X, Calculator } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useData } from '@/context/DataContext'
import { CONCRETE_STRENGTHS, JOB_TYPES, MIXER_TYPES, POUR_METHODS, SELLERS } from '@/data/users'
import { formatCurrency, todayStr } from '@/utils/format'

interface FormState {
  customerName: string
  phone: string
  deliveryDate: string
  deliveryTime: string
  concreteStrength: string
  volume: string
  mixerType: string
  pourMethod: string
  jobType: string
  contactPerson: string
  contactPhone: string
  mapLink: string
  sellerName: string
  pricePerUnit: string
  discount: string
}

const initialState: FormState = {
  customerName: '',
  phone: '',
  deliveryDate: todayStr(),
  deliveryTime: '08:00',
  concreteStrength: CONCRETE_STRENGTHS[2],
  volume: '',
  mixerType: MIXER_TYPES[0],
  pourMethod: POUR_METHODS[0],
  jobType: JOB_TYPES[0],
  contactPerson: '',
  contactPhone: '',
  mapLink: '',
  sellerName: SELLERS[0],
  pricePerUnit: '1950',
  discount: '0',
}

export function BookingModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { addBooking } = useData()
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const volume = parseFloat(form.volume) || 0
  const pricePerUnit = parseFloat(form.pricePerUnit) || 0
  const discount = parseFloat(form.discount) || 0
  const totalPrice = useMemo(() => Math.max(volume * pricePerUnit - discount, 0), [volume, pricePerUnit, discount])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.customerName.trim() || !form.phone.trim()) {
      setError('กรุณากรอกชื่อลูกค้าและเบอร์โทรศัพท์')
      return
    }
    if (volume <= 0) {
      setError('กรุณากรอกปริมาณคอนกรีตให้ถูกต้อง')
      return
    }
    if (!user) return

    setSubmitting(true)
    await addBooking({
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      deliveryDate: form.deliveryDate,
      deliveryTime: form.deliveryTime,
      concreteStrength: form.concreteStrength,
      volume,
      mixerType: form.mixerType,
      pourMethod: form.pourMethod,
      jobType: form.jobType,
      contactPerson: form.contactPerson.trim() || form.customerName.trim(),
      contactPhone: form.contactPhone.trim() || form.phone.trim(),
      mapLink: form.mapLink.trim(),
      sellerName: form.sellerName,
      pricePerUnit,
      discount,
      totalPrice,
      createdBy: user.displayName,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-3 backdrop-blur-sm animate-fade-in sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-slide-in flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-200 bg-white/80 px-5 py-4 sm:px-7">
          <div>
            <h3 className="font-display text-lg font-bold text-stone-900 sm:text-xl">เพิ่มใบสั่งจองคอนกรีต</h3>
            <p className="text-sm text-stone-500">คีย์ข้อมูลการสั่งจองใหม่เข้าสู่ระบบ</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-800/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <section className="mb-6">
            <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-sand-600">ข้อมูลทั่วไป</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">ชื่อลูกค้า *</label>
                <input
                  className="input-field"
                  value={form.customerName}
                  onChange={(e) => update('customerName', e.target.value)}
                  placeholder="เช่น บริษัท ไทยพัฒนา จำกัด"
                  required
                />
              </div>
              <div>
                <label className="field-label">เบอร์โทรศัพท์ *</label>
                <input
                  className="input-field font-mono"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="08XXXXXXXX"
                  required
                />
              </div>
              <div>
                <label className="field-label">วันที่จัดส่ง *</label>
                <input
                  type="date"
                  className="input-field font-mono"
                  value={form.deliveryDate}
                  onChange={(e) => update('deliveryDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">เวลาที่จัดส่ง *</label>
                <input
                  type="time"
                  className="input-field font-mono"
                  value={form.deliveryTime}
                  onChange={(e) => update('deliveryTime', e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-sand-600">
              รายละเอียดคอนกรีต
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="field-label">กำลังอัดคอนกรีต</label>
                <select
                  className="input-field"
                  value={form.concreteStrength}
                  onChange={(e) => update('concreteStrength', e.target.value)}
                >
                  {CONCRETE_STRENGTHS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">ปริมาณ (คิว/ลบ.ม.) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="input-field font-mono"
                  value={form.volume}
                  onChange={(e) => update('volume', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="field-label">ชนิดรถผสม</label>
                <select className="input-field" value={form.mixerType} onChange={(e) => update('mixerType', e.target.value)}>
                  {MIXER_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">ลักษณะการเท</label>
                <select className="input-field" value={form.pourMethod} onChange={(e) => update('pourMethod', e.target.value)}>
                  {POUR_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">ชนิดงาน</label>
                <select className="input-field" value={form.jobType} onChange={(e) => update('jobType', e.target.value)}>
                  {JOB_TYPES.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-sand-600">
              ข้อมูลติดต่อและสถานที่
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">ผู้ติดต่อหน้างาน</label>
                <input
                  className="input-field"
                  value={form.contactPerson}
                  onChange={(e) => update('contactPerson', e.target.value)}
                  placeholder="ชื่อผู้ติดต่อหน้าไซต์งาน"
                />
              </div>
              <div>
                <label className="field-label">เบอร์โทรผู้ติดต่อ</label>
                <input
                  className="input-field font-mono"
                  value={form.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  placeholder="08XXXXXXXX"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">ลิงก์แผนที่หน้างานจัดส่ง</label>
                <input
                  className="input-field"
                  value={form.mapLink}
                  onChange={(e) => update('mapLink', e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
            </div>
          </section>

          <section className="mb-2">
            <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-sand-600">
              ราคาและผู้ขาย
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="field-label">ผู้ขาย (Seller) *</label>
                <select className="input-field" value={form.sellerName} onChange={(e) => update('sellerName', e.target.value)}>
                  {SELLERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">ราคาขาย/คิว (บาท)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field font-mono"
                  value={form.pricePerUnit}
                  onChange={(e) => update('pricePerUnit', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">ส่วนลด (บาท)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field font-mono"
                  value={form.discount}
                  onChange={(e) => update('discount', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  ยอดสุทธิ
                </label>
                <div className="flex h-[42px] items-center rounded-lg border border-sand-300 bg-sand-100 px-3.5 font-mono text-sm font-bold text-sand-700">
                  ฿{formatCurrency(totalPrice)}
                </div>
              </div>
            </div>
          </section>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-sand-200 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              ยกเลิก
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'กำลังบันทึก...' : 'บันทึกใบสั่งจอง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
