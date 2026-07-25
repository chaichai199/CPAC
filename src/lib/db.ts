import type {
  ActivityLogEntry,
  AppUser,
  Booking,
  BookingEditInput,
  BookingStatus,
  ConnectionMode,
  NewBookingInput,
  OptionItem,
  OptionListKey,
} from '@/types'
import { OPTION_LIST_LABELS } from '@/types'
import { generateSeedBookings } from '@/lib/seed'
import { DEMO_USERS, CONCRETE_STRENGTHS, MIXER_TYPES, POUR_METHODS, JOB_TYPES, SELLERS, SHIPPING_FEES } from '@/data/users'

const LS_BOOKINGS = 'cpac_bookings_v1'
const LS_ACTIVITY = 'cpac_activity_v1'
const LS_USERS = 'cpac_users_v1'
const LS_OPTIONS = 'cpac_options_v1'
const CHANNEL_NAME = 'cpac-realtime-sync'
const POLL_INTERVAL_MS = 60 * 1000
const API_BOOKINGS = '/api/bookings'
const API_ACTIVITY = '/api/activity'
const API_USERS = '/api/users'
const API_OPTIONS = '/api/options'

export type NewUserInput = Omit<AppUser, 'id'>
export type UserPatch = Partial<Omit<AppUser, 'id'>>
export type OptionPatch = Partial<Pick<OptionItem, 'value' | 'active' | 'sortOrder'>>

function buildDefaultOptions(): OptionItem[] {
  const build = (listKey: OptionListKey, values: string[]): OptionItem[] =>
    values.map((value, i) => ({ id: genId(), listKey, value, active: true, sortOrder: i }))
  return [
    ...build('concreteStrength', CONCRETE_STRENGTHS),
    ...build('mixerType', MIXER_TYPES),
    ...build('pourMethod', POUR_METHODS),
    ...build('jobType', JOB_TYPES),
    ...build('seller', SELLERS),
    ...build('shippingFee', SHIPPING_FEES),
  ]
}

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
  private optionListeners = new Set<(o: OptionItem[]) => void>()
  private newBookingListeners = new Set<(b: Booking) => void>()
  private statusChangeListeners = new Set<(b: Booking, prevStatus: BookingStatus) => void>()

  private cachedBookings: Booking[] = []
  private cachedActivity: ActivityLogEntry[] = []
  private cachedUsers: AppUser[] = []
  private cachedOptions: OptionItem[] = []
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
      await this.refreshOptionsFromCloudflare()
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

  private async refreshOptionsFromCloudflare(): Promise<OptionItem[]> {
    try {
      const res = await fetch(API_OPTIONS)
      if (!res.ok || !isJsonResponse(res)) throw new Error(`HTTP ${res.status}`)
      const next: OptionItem[] = await res.json()
      this.cachedOptions = next
      this.optionListeners.forEach((cb) => cb(next))
      return next
    } catch (err) {
      console.warn('[BURAPACONCRETE] Failed to load options from Cloudflare D1.', err)
      return this.cachedOptions
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

    const rawOptions = localStorage.getItem(LS_OPTIONS)
    if (rawOptions) {
      this.cachedOptions = JSON.parse(rawOptions)
    } else {
      this.cachedOptions = buildDefaultOptions()
      this.persistOptions()
    }

    this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
    this.activityListeners.forEach((cb) => cb(this.cachedActivity))
    this.userListeners.forEach((cb) => cb(this.cachedUsers))
    this.optionListeners.forEach((cb) => cb(this.cachedOptions))
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

  private persistOptions() {
    localStorage.setItem(LS_OPTIONS, JSON.stringify(this.cachedOptions))
  }

  private handleChannelMessage(msg: {
    type: string
    bookings?: Booking[]
    activity?: ActivityLogEntry[]
    users?: AppUser[]
    options?: OptionItem[]
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
    if (msg.type === 'options-updated' && msg.options) {
      this.cachedOptions = msg.options
      this.optionListeners.forEach((cb) => cb(this.cachedOptions))
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

  getUsersSnapshot(): AppUser[] {
    return this.cachedUsers
  }

  subscribeOptions(cb: (o: OptionItem[]) => void): Unsub {
    cb(this.cachedOptions)
    this.optionListeners.add(cb)
    return () => this.optionListeners.delete(cb)
  }

  getOptionsSnapshot(): OptionItem[] {
    return this.cachedOptions
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

  async updateBooking(bookingId: string, input: BookingEditInput, user: AppUser): Promise<void> {
    if (this.mode === 'cloudflare') {
      this.setStatus({ syncing: true })
      const res = await fetch(`${API_BOOKINGS}/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, user: { displayName: user.displayName, role: user.role } }),
      })
      if (!res.ok) {
        this.setStatus({ syncing: false, error: `Failed to update booking (HTTP ${res.status})` })
        throw new Error(`Failed to update booking (HTTP ${res.status})`)
      }
      await this.refreshBookingsFromCloudflare(true)
      await this.refreshActivityFromCloudflare()
      this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString(), error: null })
      return
    }

    const existing = this.cachedBookings.find((b) => b.id === bookingId)
    if (!existing) throw new Error('ไม่พบใบสั่งจองนี้')
    const updated: Booking = { ...existing, ...input, updatedAt: new Date().toISOString() }

    this.cachedBookings = this.cachedBookings.map((b) => (b.id === bookingId ? updated : b))
    this.persistBookings()
    this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
    this.channel?.postMessage({ type: 'bookings-updated', bookings: this.cachedBookings })
    this.setStatus({ lastSyncAt: new Date().toISOString() })

    await this.addLocalActivityLog({
      userName: user.displayName,
      userRole: user.role,
      action: 'แก้ไขใบสั่งจอง',
      detail: `แก้ไขใบสั่งจอง ${existing.code} (ลูกค้า: ${input.customerName})`,
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

  async addUser(input: NewUserInput, actor: AppUser): Promise<AppUser> {
    const roleLabel = (r: string) => (r === 'admin' ? 'แอดมิน' : 'เจ้าหน้าที่')

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
      void this.logActivity({
        userName: actor.displayName,
        userRole: actor.role,
        action: 'เพิ่มผู้ใช้งาน',
        detail: `${actor.displayName} เพิ่มผู้ใช้งานใหม่ ${created.displayName} (@${created.username}) สิทธิ์ ${roleLabel(created.role)}`,
      })
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
    await this.addLocalActivityLog({
      userName: actor.displayName,
      userRole: actor.role,
      action: 'เพิ่มผู้ใช้งาน',
      detail: `${actor.displayName} เพิ่มผู้ใช้งานใหม่ ${created.displayName} (@${created.username}) สิทธิ์ ${roleLabel(created.role)}`,
    })
    return created
  }

  async updateUser(id: string, patch: UserPatch, actor: AppUser): Promise<AppUser> {
    const roleLabel = (r: string) => (r === 'admin' ? 'แอดมิน' : 'เจ้าหน้าที่')

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
      void this.logActivity({
        userName: actor.displayName,
        userRole: actor.role,
        action: 'แก้ไขผู้ใช้งาน',
        detail: `${actor.displayName} แก้ไขข้อมูลผู้ใช้งาน ${updated.displayName} (@${updated.username}) สิทธิ์ ${roleLabel(updated.role)}`,
      })
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
    await this.addLocalActivityLog({
      userName: actor.displayName,
      userRole: actor.role,
      action: 'แก้ไขผู้ใช้งาน',
      detail: `${actor.displayName} แก้ไขข้อมูลผู้ใช้งาน ${updated.displayName} (@${updated.username}) สิทธิ์ ${roleLabel(updated.role)}`,
    })
    return updated
  }

  async deleteUser(id: string, actor: AppUser): Promise<void> {
    const roleLabel = (r: string) => (r === 'admin' ? 'แอดมิน' : 'เจ้าหน้าที่')
    const target = this.cachedUsers.find((u) => u.id === id)

    if (this.mode === 'cloudflare') {
      const res = await fetch(`${API_USERS}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error(res.status === 400 ? 'ไม่สามารถลบแอดมินคนสุดท้ายได้' : `Failed to delete user (HTTP ${res.status})`)
      }
      await this.refreshUsersFromCloudflare()
      if (target) {
        void this.logActivity({
          userName: actor.displayName,
          userRole: actor.role,
          action: 'ลบผู้ใช้งาน',
          detail: `${actor.displayName} ลบผู้ใช้งาน ${target.displayName} (@${target.username}) สิทธิ์ ${roleLabel(target.role)}`,
        })
      }
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
    await this.addLocalActivityLog({
      userName: actor.displayName,
      userRole: actor.role,
      action: 'ลบผู้ใช้งาน',
      detail: `${actor.displayName} ลบผู้ใช้งาน ${existing.displayName} (@${existing.username}) สิทธิ์ ${roleLabel(existing.role)}`,
    })
  }

  // ---------- concrete option lists ----------

  private nextSortOrder(listKey: OptionListKey): number {
    const forKey = this.cachedOptions.filter((o) => o.listKey === listKey)
    return forKey.length === 0 ? 0 : Math.max(...forKey.map((o) => o.sortOrder)) + 1
  }

  async addOption(listKey: OptionListKey, value: string, actor: AppUser): Promise<OptionItem> {
    const label = OPTION_LIST_LABELS[listKey]

    if (this.mode === 'cloudflare') {
      const res = await fetch(API_OPTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listKey, value }),
      })
      if (!res.ok) {
        throw new Error(`Failed to add option (HTTP ${res.status})`)
      }
      const created: OptionItem = await res.json()
      await this.refreshOptionsFromCloudflare()
      void this.logActivity({
        userName: actor.displayName,
        userRole: actor.role,
        action: 'เพิ่มตัวเลือก',
        detail: `${actor.displayName} เพิ่ม${label}ใหม่: "${created.value}"`,
      })
      return created
    }

    const created: OptionItem = {
      id: genId(),
      listKey,
      value: value.trim(),
      active: true,
      sortOrder: this.nextSortOrder(listKey),
    }
    this.cachedOptions = [...this.cachedOptions, created]
    this.persistOptions()
    this.optionListeners.forEach((cb) => cb(this.cachedOptions))
    this.channel?.postMessage({ type: 'options-updated', options: this.cachedOptions })
    await this.addLocalActivityLog({
      userName: actor.displayName,
      userRole: actor.role,
      action: 'เพิ่มตัวเลือก',
      detail: `${actor.displayName} เพิ่ม${label}ใหม่: "${created.value}"`,
    })
    return created
  }

  async updateOption(id: string, patch: OptionPatch, actor: AppUser): Promise<OptionItem> {
    const isToggleOnly = patch.active !== undefined && patch.value === undefined

    if (this.mode === 'cloudflare') {
      const res = await fetch(`${API_OPTIONS}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        throw new Error(`Failed to update option (HTTP ${res.status})`)
      }
      const updated: OptionItem = await res.json()
      await this.refreshOptionsFromCloudflare()
      const label = OPTION_LIST_LABELS[updated.listKey]
      void this.logActivity({
        userName: actor.displayName,
        userRole: actor.role,
        action: isToggleOnly ? (updated.active ? 'เปิดใช้งานตัวเลือก' : 'ปิดใช้งานตัวเลือก') : 'แก้ไขตัวเลือก',
        detail: isToggleOnly
          ? `${actor.displayName} ${updated.active ? 'เปิด' : 'ปิด'}ใช้งาน${label} "${updated.value}"`
          : `${actor.displayName} แก้ไข${label}เป็น "${updated.value}"`,
      })
      return updated
    }

    const existing = this.cachedOptions.find((o) => o.id === id)
    if (!existing) throw new Error('ไม่พบตัวเลือกนี้')

    const updated: OptionItem = {
      ...existing,
      value: patch.value?.trim() || existing.value,
      active: patch.active === undefined ? existing.active : patch.active,
    }
    this.cachedOptions = this.cachedOptions.map((o) => (o.id === id ? updated : o))
    this.persistOptions()
    this.optionListeners.forEach((cb) => cb(this.cachedOptions))
    this.channel?.postMessage({ type: 'options-updated', options: this.cachedOptions })

    const label = OPTION_LIST_LABELS[updated.listKey]
    await this.addLocalActivityLog({
      userName: actor.displayName,
      userRole: actor.role,
      action: isToggleOnly ? (updated.active ? 'เปิดใช้งานตัวเลือก' : 'ปิดใช้งานตัวเลือก') : 'แก้ไขตัวเลือก',
      detail: isToggleOnly
        ? `${actor.displayName} ${updated.active ? 'เปิด' : 'ปิด'}ใช้งาน${label} "${updated.value}"`
        : `${actor.displayName} แก้ไข${label}เป็น "${updated.value}"`,
    })
    return updated
  }

  async moveOption(id: string, direction: 'up' | 'down', actor: AppUser): Promise<void> {
    const current = this.cachedOptions.find((o) => o.id === id)
    if (!current) throw new Error('ไม่พบตัวเลือกนี้')

    const sameList = this.cachedOptions.filter((o) => o.listKey === current.listKey).sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sameList.findIndex((o) => o.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sameList.length) return
    const neighbor = sameList[swapIdx]

    if (this.mode === 'cloudflare') {
      const patchOne = (optionId: string, sortOrder: number) =>
        fetch(`${API_OPTIONS}/${optionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder }),
        })
      const [resA, resB] = await Promise.all([patchOne(current.id, neighbor.sortOrder), patchOne(neighbor.id, current.sortOrder)])
      if (!resA.ok || !resB.ok) {
        throw new Error('Failed to reorder options')
      }
      await this.refreshOptionsFromCloudflare()
    } else {
      this.cachedOptions = this.cachedOptions.map((o) => {
        if (o.id === current.id) return { ...o, sortOrder: neighbor.sortOrder }
        if (o.id === neighbor.id) return { ...o, sortOrder: current.sortOrder }
        return o
      })
      this.persistOptions()
      this.optionListeners.forEach((cb) => cb(this.cachedOptions))
      this.channel?.postMessage({ type: 'options-updated', options: this.cachedOptions })
    }

    const label = OPTION_LIST_LABELS[current.listKey]
    await this.logActivity({
      userName: actor.displayName,
      userRole: actor.role,
      action: 'จัดลำดับตัวเลือก',
      detail: `${actor.displayName} ปรับลำดับ${label}: สลับ "${current.value}" กับ "${neighbor.value}"`,
    })
  }
}

export const dataStore = new DataStore()
