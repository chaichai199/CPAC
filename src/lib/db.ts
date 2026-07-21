import type { ActivityLogEntry, AppUser, Booking, BookingStatus, ConnectionMode, NewBookingInput } from '@/types'
import { generateSeedBookings } from '@/lib/seed'
import { DEMO_USERS } from '@/data/users'

const LS_BOOKINGS = 'cpac_bookings_v1'
const LS_ACTIVITY = 'cpac_activity_v1'
const LS_USERS = 'cpac_users_v1'
const CHANNEL_NAME = 'cpac-realtime-sync'
const POLL_INTERVAL_MS = 15 * 60 * 1000
const API_BOOKINGS = '/api/bookings'
const API_ACTIVITY = '/api/activity'
const API_USERS = '/api/users'

export type NewUserInput = Omit<AppUser, 'id'>
export type UserPatch = Partial<Omit<AppUser, 'id'>>

export interface ConnectionStatus {
  mode: ConnectionMode
  online: boolean
  syncing: boolean
  lastSyncAt: string | null
  error: string | null
}

type Unsub = () => void

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function isJsonResponse(res: Response): boolean {
  return (res.headers.get('content-type') ?? '').includes('application/json')
}

class DataStore {
  private mode: ConnectionMode = 'local'
  private status: ConnectionStatus = {
    mode: 'local',
    online: navigator.onLine,
    syncing: true,
    lastSyncAt: null,
    error: null,
  }

  private connectionListeners = new Set<(s: ConnectionStatus) => void>()
  private bookingListeners = new Set<(b: Booking[]) => void>()
  private activityListeners = new Set<(a: ActivityLogEntry[]) => void>()
  private userListeners = new Set<(u: AppUser[]) => void>()
  private newBookingListeners = new Set<(b: Booking) => void>()
  private statusChangeListeners = new Set<(b: Booking, prevStatus: BookingStatus) => void>()

  private cachedBookings: Booking[] = []
  private cachedActivity: ActivityLogEntry[] = []
  private cachedUsers: AppUser[] = []
  private channel: BroadcastChannel | null = null

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.onmessage = (ev) => this.handleChannelMessage(ev.data)
    }

    window.addEventListener('online', () => this.setStatus({ online: true }))
    window.addEventListener('offline', () => this.setStatus({ online: false }))

    void this.init()
  }

  private async init() {
    const available = await this.probeCloudflare()
    if (available) {
      this.mode = 'cloudflare'
      this.setStatus({ mode: 'cloudflare' })
      await this.refreshBookingsFromCloudflare(false)
      await this.refreshActivityFromCloudflare()
      await this.refreshUsersFromCloudflare()
      this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString(), error: null })
      window.setInterval(() => {
        void this.refreshBookingsFromCloudflare(true)
        void this.refreshActivityFromCloudflare()
      }, POLL_INTERVAL_MS)
    } else {
      this.initLocal()
    }
  }

  private async probeCloudflare(): Promise<boolean> {
    try {
      const res = await fetch(API_BOOKINGS, { method: 'GET' })
      return res.ok && isJsonResponse(res)
    } catch {
      return false
    }
  }

  // ---------- status ----------

  private setStatus(patch: Partial<ConnectionStatus>) {
    this.status = { ...this.status, ...patch }
    this.connectionListeners.forEach((cb) => cb(this.status))
  }

  subscribeConnectionStatus(cb: (s: ConnectionStatus) => void): Unsub {
    cb(this.status)
    this.connectionListeners.add(cb)
    return () => this.connectionListeners.delete(cb)
  }

  // ---------- cloudflare (D1 via Pages Functions) mode ----------

  private applyBookings(next: Booking[], detectChanges: boolean) {
    if (detectChanges) {
      const prevById = new Map(this.cachedBookings.map((b) => [b.id, b]))
      for (const b of next) {
        const prev = prevById.get(b.id)
        if (!prev) {
          this.newBookingListeners.forEach((cb) => cb(b))
        } else if (prev.status !== b.status) {
          this.statusChangeListeners.forEach((cb) => cb(b, prev.status))
        }
      }
    }
    this.cachedBookings = next
    this.bookingListeners.forEach((cb) => cb(next))
  }

  private async refreshBookingsFromCloudflare(detectChanges: boolean) {
    try {
      const res = await fetch(API_BOOKINGS)
      if (!res.ok || !isJsonResponse(res)) throw new Error(`HTTP ${res.status}`)
      const next: Booking[] = await res.json()
      this.applyBookings(next, detectChanges)
      this.setStatus({ lastSyncAt: new Date().toISOString(), error: null })
    } catch (err) {
      console.warn('[BURAPACONCRETE] Failed to poll bookings from Cloudflare D1.', err)
      this.setStatus({ error: err instanceof Error ? err.message : 'Sync failed' })
    }
  }

  private async refreshActivityFromCloudflare() {
    try {
      const res = await fetch(API_ACTIVITY)
      if (!res.ok || !isJsonResponse(res)) throw new Error(`HTTP ${res.status}`)
      const next: ActivityLogEntry[] = await res.json()
      this.cachedActivity = next
      this.activityListeners.forEach((cb) => cb(next))
    } catch (err) {
      console.warn('[BURAPACONCRETE] Failed to poll activity log from Cloudflare D1.', err)
    }
  }

  private async refreshUsersFromCloudflare(): Promise<AppUser[]> {
    try {
      const res = await fetch(API_USERS)
      if (!res.ok || !isJsonResponse(res)) throw new Error(`HTTP ${res.status}`)
      const next: AppUser[] = await res.json()
      this.cachedUsers = next
      this.userListeners.forEach((cb) => cb(next))
      return next
    } catch (err) {
      console.warn('[BURAPACONCRETE] Failed to load users from Cloudflare D1.', err)
      return this.cachedUsers
    }
  }

  // ---------- local storage mode ----------

  private initLocal() {
    const rawBookings = localStorage.getItem(LS_BOOKINGS)
    if (rawBookings) {
      this.cachedBookings = JSON.parse(rawBookings)
    } else {
      this.cachedBookings = generateSeedBookings()
      this.persistBookings()
    }

    const rawActivity = localStorage.getItem(LS_ACTIVITY)
    this.cachedActivity = rawActivity ? JSON.parse(rawActivity) : []

    const rawUsers = localStorage.getItem(LS_USERS)
    if (rawUsers) {
      this.cachedUsers = JSON.parse(rawUsers)
    } else {
      this.cachedUsers = DEMO_USERS
      this.persistUsers()
    }

    this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
    this.activityListeners.forEach((cb) => cb(this.cachedActivity))
    this.userListeners.forEach((cb) => cb(this.cachedUsers))
    this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString() })
  }

  private persistBookings() {
    localStorage.setItem(LS_BOOKINGS, JSON.stringify(this.cachedBookings))
  }

  private persistActivity() {
    localStorage.setItem(LS_ACTIVITY, JSON.stringify(this.cachedActivity))
  }

  private persistUsers() {
    localStorage.setItem(LS_USERS, JSON.stringify(this.cachedUsers))
  }

  private handleChannelMessage(msg: {
    type: string
    bookings?: Booking[]
    activity?: ActivityLogEntry[]
    users?: AppUser[]
    booking?: Booking
    prevStatus?: BookingStatus
  }) {
    if (this.mode !== 'local') return
    if (msg.type === 'bookings-updated' && msg.bookings) {
      this.cachedBookings = msg.bookings
      this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
      this.setStatus({ lastSyncAt: new Date().toISOString() })
    }
    if (msg.type === 'activity-updated' && msg.activity) {
      this.cachedActivity = msg.activity
      this.activityListeners.forEach((cb) => cb(this.cachedActivity))
    }
    if (msg.type === 'users-updated' && msg.users) {
      this.cachedUsers = msg.users
      this.userListeners.forEach((cb) => cb(this.cachedUsers))
    }
    if (msg.type === 'new-booking' && msg.booking) {
      this.newBookingListeners.forEach((cb) => cb(msg.booking!))
    }
    if (msg.type === 'status-change' && msg.booking && msg.prevStatus) {
      this.statusChangeListeners.forEach((cb) => cb(msg.booking!, msg.prevStatus!))
    }
  }

  // ---------- public subscriptions ----------

  subscribeBookings(cb: (b: Booking[]) => void): Unsub {
    cb(this.cachedBookings)
    this.bookingListeners.add(cb)
    return () => this.bookingListeners.delete(cb)
  }

  subscribeActivityLog(cb: (a: ActivityLogEntry[]) => void): Unsub {
    cb(this.cachedActivity)
    this.activityListeners.add(cb)
    return () => this.activityListeners.delete(cb)
  }

  subscribeNewBooking(cb: (b: Booking) => void): Unsub {
    this.newBookingListeners.add(cb)
    return () => this.newBookingListeners.delete(cb)
  }

  subscribeStatusChange(cb: (b: Booking, prevStatus: BookingStatus) => void): Unsub {
    this.statusChangeListeners.add(cb)
    return () => this.statusChangeListeners.delete(cb)
  }

  subscribeUsers(cb: (u: AppUser[]) => void): Unsub {
    cb(this.cachedUsers)
    this.userListeners.add(cb)
    return () => this.userListeners.delete(cb)
  }

  getMode(): ConnectionMode {
    return this.mode
  }

  // ---------- authentication ----------

  async findUserByCredentials(username: string, password: string): Promise<AppUser | null> {
    const users = this.mode === 'cloudflare' ? await this.refreshUsersFromCloudflare() : this.cachedUsers
    return (
      users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
      ) ?? null
    )
  }

  // ---------- mutations ----------

  private generateBookingCode(dateStr: string): string {
    const compact = dateStr.replace(/-/g, '')
    const countToday = this.cachedBookings.filter((b) => b.deliveryDate === dateStr).length + 1
    return `CPAC-${compact}-${String(countToday).padStart(3, '0')}`
  }

  async addBooking(input: NewBookingInput, user: AppUser): Promise<Booking> {
    if (this.mode === 'cloudflare') {
      this.setStatus({ syncing: true })
      const res = await fetch(API_BOOKINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, user: { displayName: user.displayName, role: user.role } }),
      })
      if (!res.ok) {
        this.setStatus({ syncing: false, error: `Failed to create booking (HTTP ${res.status})` })
        throw new Error(`Failed to create booking (HTTP ${res.status})`)
      }
      const created: Booking = await res.json()
      await this.refreshBookingsFromCloudflare(true)
      await this.refreshActivityFromCloudflare()
      this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString(), error: null })
      return created
    }

    const now = new Date().toISOString()
    const booking: Booking = {
      ...input,
      id: genId(),
      code: this.generateBookingCode(input.deliveryDate),
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    }

    this.cachedBookings = [booking, ...this.cachedBookings]
    this.persistBookings()
    this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
    this.newBookingListeners.forEach((cb) => cb(booking))
    this.channel?.postMessage({ type: 'bookings-updated', bookings: this.cachedBookings })
    this.channel?.postMessage({ type: 'new-booking', booking })
    this.setStatus({ lastSyncAt: new Date().toISOString() })

    await this.addLocalActivityLog({
      userName: user.displayName,
      userRole: user.role,
      action: 'สร้างใบสั่งจอง',
      detail: `สร้างใบสั่งจอง ${booking.code} ให้ลูกค้า ${booking.customerName} ปริมาณ ${booking.volume} คิว`,
      bookingCode: booking.code,
    })

    return booking
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus, user: AppUser): Promise<void> {
    if (this.mode === 'cloudflare') {
      this.setStatus({ syncing: true })
      const res = await fetch(`${API_BOOKINGS}/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, user: { displayName: user.displayName, role: user.role } }),
      })
      if (!res.ok) {
        this.setStatus({ syncing: false, error: `Failed to update status (HTTP ${res.status})` })
        throw new Error(`Failed to update status (HTTP ${res.status})`)
      }
      await this.refreshBookingsFromCloudflare(true)
      await this.refreshActivityFromCloudflare()
      this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString(), error: null })
      return
    }

    const existing = this.cachedBookings.find((b) => b.id === bookingId)
    if (!existing) return
    const prevStatus = existing.status
    const updated: Booking = { ...existing, status, updatedAt: new Date().toISOString() }

    this.cachedBookings = this.cachedBookings.map((b) => (b.id === bookingId ? updated : b))
    this.persistBookings()
    this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
    this.statusChangeListeners.forEach((cb) => cb(updated, prevStatus))
    this.channel?.postMessage({ type: 'bookings-updated', bookings: this.cachedBookings })
    this.channel?.postMessage({ type: 'status-change', booking: updated, prevStatus })
    this.setStatus({ lastSyncAt: new Date().toISOString() })

    await this.addLocalActivityLog({
      userName: user.displayName,
      userRole: user.role,
      action: 'เปลี่ยนสถานะ',
      detail: `เปลี่ยนสถานะใบสั่งจอง ${existing.code} จาก "${prevStatus}" เป็น "${status}"`,
      bookingCode: existing.code,
    })
  }

  private async addLocalActivityLog(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const full: ActivityLogEntry = { ...entry, id: genId(), timestamp: new Date().toISOString() }
    this.cachedActivity = [full, ...this.cachedActivity].slice(0, 500)
    this.persistActivity()
    this.activityListeners.forEach((cb) => cb(this.cachedActivity))
    this.channel?.postMessage({ type: 'activity-updated', activity: this.cachedActivity })
  }

  async logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (this.mode === 'cloudflare') {
      try {
        const res = await fetch(API_ACTIVITY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
        if (res.ok) {
          await this.refreshActivityFromCloudflare()
        }
      } catch (err) {
        console.warn('[BURAPACONCRETE] Failed to log activity to Cloudflare D1.', err)
      }
      return
    }
    await this.addLocalActivityLog(entry)
  }

  // ---------- user management ----------

  async addUser(input: NewUserInput): Promise<AppUser> {
    if (this.mode === 'cloudflare') {
      const res = await fetch(API_USERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        throw new Error(res.status === 409 ? 'มีชื่อผู้ใช้งานนี้อยู่แล้ว' : `Failed to create user (HTTP ${res.status})`)
      }
      const created: AppUser = await res.json()
      await this.refreshUsersFromCloudflare()
      return created
    }

    const usernameLower = input.username.trim().toLowerCase()
    if (this.cachedUsers.some((u) => u.username.toLowerCase() === usernameLower)) {
      throw new Error('มีชื่อผู้ใช้งานนี้อยู่แล้ว')
    }

    const created: AppUser = { ...input, id: genId(), username: input.username.trim(), displayName: input.displayName.trim() }
    this.cachedUsers = [...this.cachedUsers, created]
    this.persistUsers()
    this.userListeners.forEach((cb) => cb(this.cachedUsers))
    this.channel?.postMessage({ type: 'users-updated', users: this.cachedUsers })
    return created
  }

  async updateUser(id: string, patch: UserPatch): Promise<AppUser> {
    if (this.mode === 'cloudflare') {
      const res = await fetch(`${API_USERS}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        throw new Error(
          res.status === 409
            ? 'มีชื่อผู้ใช้งานนี้อยู่แล้ว'
            : res.status === 400
              ? 'ไม่สามารถลดสิทธิ์แอดมินคนสุดท้ายได้'
              : `Failed to update user (HTTP ${res.status})`,
        )
      }
      const updated: AppUser = await res.json()
      await this.refreshUsersFromCloudflare()
      return updated
    }

    const existing = this.cachedUsers.find((u) => u.id === id)
    if (!existing) throw new Error('ไม่พบผู้ใช้งานนี้')

    if (patch.username) {
      const usernameLower = patch.username.trim().toLowerCase()
      if (this.cachedUsers.some((u) => u.id !== id && u.username.toLowerCase() === usernameLower)) {
        throw new Error('มีชื่อผู้ใช้งานนี้อยู่แล้ว')
      }
    }
    if (existing.role === 'admin' && patch.role === 'staff') {
      const adminCount = this.cachedUsers.filter((u) => u.role === 'admin').length
      if (adminCount <= 1) {
        throw new Error('ไม่สามารถลดสิทธิ์แอดมินคนสุดท้ายได้')
      }
    }

    const updated: AppUser = {
      ...existing,
      ...patch,
      username: patch.username?.trim() || existing.username,
      displayName: patch.displayName?.trim() || existing.displayName,
      password: patch.password?.trim() || existing.password,
    }
    this.cachedUsers = this.cachedUsers.map((u) => (u.id === id ? updated : u))
    this.persistUsers()
    this.userListeners.forEach((cb) => cb(this.cachedUsers))
    this.channel?.postMessage({ type: 'users-updated', users: this.cachedUsers })
    return updated
  }

  async deleteUser(id: string): Promise<void> {
    if (this.mode === 'cloudflare') {
      const res = await fetch(`${API_USERS}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error(res.status === 400 ? 'ไม่สามารถลบแอดมินคนสุดท้ายได้' : `Failed to delete user (HTTP ${res.status})`)
      }
      await this.refreshUsersFromCloudflare()
      return
    }

    const existing = this.cachedUsers.find((u) => u.id === id)
    if (!existing) return
    if (existing.role === 'admin') {
      const adminCount = this.cachedUsers.filter((u) => u.role === 'admin').length
      if (adminCount <= 1) {
        throw new Error('ไม่สามารถลบแอดมินคนสุดท้ายได้')
      }
    }

    this.cachedUsers = this.cachedUsers.filter((u) => u.id !== id)
    this.persistUsers()
    this.userListeners.forEach((cb) => cb(this.cachedUsers))
    this.channel?.postMessage({ type: 'users-updated', users: this.cachedUsers })
  }
}

export const dataStore = new DataStore()
