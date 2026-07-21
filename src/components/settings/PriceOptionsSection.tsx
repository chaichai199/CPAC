import { useEffect, useState } from 'react'
import { dataStore } from '@/lib/db'
import { PRICE_OPTION_LIST_KEYS, OPTION_LIST_LABELS } from '@/types'
import type { OptionItem } from '@/types'
import { OptionListCard } from '@/components/settings/OptionListCard'

export function PriceOptionsSection() {
  const [options, setOptions] = useState<OptionItem[]>(() => dataStore.getOptionsSnapshot())

  useEffect(() => dataStore.subscribeOptions(setOptions), [])

  const byKey = (key: (typeof PRICE_OPTION_LIST_KEYS)[number]) =>
    options.filter((o) => o.listKey === key).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        จัดการตัวเลือกราคาที่ใช้ในฟอร์มคีย์ใบสั่งจองคอนกรีต — การ &quot;ปิดใช้งาน&quot; จะซ่อนตัวเลือกจากฟอร์มใบสั่งจองใหม่
        โดยไม่ลบข้อมูลประวัติการจองเดิมที่เคยใช้ค่านี้
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PRICE_OPTION_LIST_KEYS.map((key) => (
          <OptionListCard key={key} listKey={key} label={OPTION_LIST_LABELS[key]} items={byKey(key)} />
        ))}
      </div>
    </div>
  )
}
