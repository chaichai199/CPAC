export type UserRole = 'admin' | 'staff'

export interface AppUser {
  id: string
  username: string
  password: string
  displayName: string
  role: UserRole
}

export type BookingStatus = 'pending' | 'approved' | 'dispatched' | 'completed' | 'cancelled'

export const BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'approved',
  'dispatched',
  'completed',
  'cancelled',
]

export const STATUS_LABEL_TH: Record<BookingStatus, string> = {
  pending: 'รอดำเนินการ',
  approved: 'กำลังดำเนินการส่ง',
  dispatched: 'รถปล่อยหน้างาน',
  completed: 'ส่งมอบสำเร็จ',
  cancelled: 'ยกเลิก',
}

export const STATUS_COLOR: Record<BookingStatus, { bg: string; text: string; dot: string; ring: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-400', ring: 'ring-amber-300' },
  approved: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', ring: 'ring-yellow-400' },
  dispatched: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', ring: 'ring-orange-400' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', ring: 'ring-green-400' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', ring: 'ring-red-400' },
}

export interface Booking {
  id: string
  code: string
  customerName: string
  phone: string
  deliveryDate: string // YYYY-MM-DD
  deliveryTime: string // HH:mm
  arrivalTime?: string // HH:mm, optional — estimated arrival time on site
  concreteStrength: string // e.g. "240 ksc"
  volume: number // คิว / ลบ.ม.
  mixerType: string
  pourMethod: string
  jobType: string
  contactPerson: string
  contactPhone: string
  mapLink: string
  sellerName: string
  pricePerUnit: number
  discount: number
  totalPrice: number
  status: BookingStatus
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type NewBookingInput = Omit<Booking, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: BookingStatus
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  userName: string
  userRole: UserRole
  action: string
  detail: string
  bookingCode?: string
}

export type ConnectionMode = 'cloudflare' | 'local'

export type OptionListKey = 'concreteStrength' | 'mixerType' | 'pourMethod' | 'jobType' | 'seller'

export interface OptionItem {
  id: string
  listKey: OptionListKey
  value: string
  active: boolean
  sortOrder: number
}

export const OPTION_LIST_LABELS: Record<OptionListKey, string> = {
  concreteStrength: 'กำลังอัดคอนกรีต',
  mixerType: 'ชนิดรถผสม',
  pourMethod: 'ลักษณะการเท',
  jobType: 'ชนิดงาน',
  seller: 'ผู้ขาย (Seller)',
}

export const OPTION_LIST_KEYS: OptionListKey[] = ['concreteStrength', 'mixerType', 'pourMethod', 'jobType', 'seller']
