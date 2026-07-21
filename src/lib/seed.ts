import type { Booking } from '@/types'
import { MIXER_TYPES, POUR_METHODS, JOB_TYPES, CONCRETE_STRENGTHS, SELLERS, SHIPPING_FEES } from '@/data/users'

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const CUSTOMERS = [
  'บริษัท ไทยพัฒนา คอนสตรัคชั่น จำกัด',
  'ห้างหุ้นส่วน รุ่งเรืองก่อสร้าง',
  'คุณประยุทธ์ วงศ์ษา',
  'บริษัท เอเชีย โฮมบิลเดอร์ จำกัด',
  'คุณสุนีย์ แสงทอง',
  'โครงการหมู่บ้านสายลม',
  'บริษัท บูรพาโยธา จำกัด',
]

const STATUSES: Booking['status'][] = ['pending', 'approved', 'dispatched', 'completed', 'cancelled']

export function generateSeedBookings(): Booking[] {
  const now = new Date()
  const bookings: Booking[] = []
  let counter = 1

  for (let dayOffset = -6; dayOffset <= 14; dayOffset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset)
    const itemsToday = dayOffset % 3 === 0 ? 4 : dayOffset % 2 === 0 ? 2 : 1
    for (let i = 0; i < itemsToday; i++) {
      const volume = [10, 15, 20, 25, 30, 45, 60][Math.floor(Math.random() * 7)]
      const pricePerUnit = 1950 + Math.floor(Math.random() * 8) * 25
      const discount = Math.random() > 0.7 ? 500 : 0
      const shippingFee = Number(SHIPPING_FEES[Math.floor(Math.random() * SHIPPING_FEES.length)])
      const total = Math.max(volume * pricePerUnit - discount, 0) + shippingFee
      const status = dayOffset < 0 ? (Math.random() > 0.15 ? 'completed' : 'cancelled') : STATUSES[Math.floor(Math.random() * STATUSES.length)]
      const dateStr = toDateStr(date)
      const code = `CPAC-${dateStr.replace(/-/g, '')}-${pad(counter)}`
      bookings.push({
        id: `seed-${counter}`,
        code,
        customerName: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
        phone: `08${Math.floor(10000000 + Math.random() * 89999999)}`,
        deliveryDate: dateStr,
        deliveryTime: `${pad(7 + Math.floor(Math.random() * 9))}:${Math.random() > 0.5 ? '00' : '30'}`,
        concreteStrength: CONCRETE_STRENGTHS[Math.floor(Math.random() * CONCRETE_STRENGTHS.length)],
        volume,
        mixerType: MIXER_TYPES[Math.floor(Math.random() * MIXER_TYPES.length)],
        pourMethod: POUR_METHODS[Math.floor(Math.random() * POUR_METHODS.length)],
        jobType: JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)],
        contactPerson: 'คุณหัวหน้างานหน้าไซต์',
        contactPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        mapLink: 'https://maps.app.goo.gl/example',
        sellerName: SELLERS[Math.floor(Math.random() * SELLERS.length)],
        pricePerUnit,
        discount,
        shippingFee,
        totalPrice: total,
        status,
        createdAt: new Date(date.getTime() - 86400000).toISOString(),
        updatedAt: new Date(date.getTime() - 43200000).toISOString(),
        createdBy: 'ระบบสาธิต (Demo Seed)',
      })
      counter++
    }
  }
  return bookings
}
