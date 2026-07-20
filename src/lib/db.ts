import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { firestore, isFirebaseConfigured } from '@/lib/firebase'
import type { ActivityLogEntry, AppUser, Booking, BookingStatus, ConnectionMode, NewBookingInput } from '@/types'
import { generateSeedBookings } from '@/lib/seed'

const LS_BOOKINGS = 'cpac_bookings_v1'
const LS_ACTIVITY = 'cpac_activity_v1'
const CHANNEL_NAME = 'cpac-realtime-sync'

export interface ConnectionStatus {
  mode: ConnectionMode
  online: boolean
  syncing: boolean
  lastSyncAt: string | null
  error: string | null
}

type Unsub = () => void

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

class DataStore {
  private mode: ConnectionMode = isFirebaseConfigured ? 'firebase' : 'local'
  private status: ConnectionStatus = {
    mode: this.mode,
    online: navigator.onLine,
    syncing: false,
    lastSyncAt: null,
    error: null,
  }

  private connectionListeners = new Set<(s: ConnectionStatus) => void>()
  private bookingListeners = new Set<(b: Booking[]) => void>()
  private activityListeners = new Set<(a: ActivityLogEntry[]) => void>()
  private newBookingListeners = new Set<(b: Booking) => void>()
  private statusChangeListeners = new Set<(b: Booking, prevStatus: BookingStatus) => void>()

  private cachedBookings: Booking[] = []
  private cachedActivity: ActivityLogEntry[] = []
  private channel: BroadcastChannel | null = null

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.onmessage = (ev) => this.handleChannelMessage(ev.data)
    }

    window.addEventListener('online', () => this.setStatus({ online: true }))
    window.addEventListener('offline', () => this.setStatus({ online: false }))

    if (this.mode === 'firebase' && firestore) {
      this.initFirebase()
    } else {
      this.initLocal()
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

  // ---------- firebase mode ----------

  private initFirebase() {
    if (!firestore) return
    this.setStatus({ syncing: true })

    const bookingsQuery = query(collection(firestore, 'bookings'), orderBy('deliveryDate', 'desc'))
    let firstBookingsSnapshot = true

    onSnapshot(
      bookingsQuery,
      (snap) => {
        const next: Booking[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }))
        if (!firstBookingsSnapshot) {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const b = { id: change.doc.id, ...(change.doc.data() as Omit<Booking, 'id'>) }
              this.newBookingListeners.forEach((cb) => cb(b))
            }
            if (change.type === 'modified') {
              const b = { id: change.doc.id, ...(change.doc.data() as Omit<Booking, 'id'>) }
              const prev = this.cachedBookings.find((x) => x.id === b.id)
              if (prev && prev.status !== b.status) {
                this.statusChangeListeners.forEach((cb) => cb(b, prev.status))
              }
            }
          })
        }
        firstBookingsSnapshot = false
        this.cachedBookings = next
        this.bookingListeners.forEach((cb) => cb(next))
        this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString(), error: null })
      },
      (err) => {
        console.warn('[BURAPACONCRETE] Firestore bookings sync failed, switching to local fallback.', err)
        this.fallbackToLocal(err.message)
      },
    )

    const activityQuery = query(collection(firestore, 'activityLog'), orderBy('timestamp', 'desc'))
    onSnapshot(
      activityQuery,
      (snap) => {
        const next: ActivityLogEntry[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLogEntry, 'id'>) }))
        this.cachedActivity = next
        this.activityListeners.forEach((cb) => cb(next))
      },
      (err) => {
        console.warn('[BURAPACONCRETE] Firestore activity sync failed.', err)
      },
    )
  }

  private fallbackToLocal(errorMsg: string) {
    this.mode = 'local'
    this.setStatus({ mode: 'local', error: `Firebase unavailable: ${errorMsg}`, syncing: false })
    this.initLocal()
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

    this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
    this.activityListeners.forEach((cb) => cb(this.cachedActivity))
    this.setStatus({ lastSyncAt: new Date().toISOString() })
  }

  private persistBookings() {
    localStorage.setItem(LS_BOOKINGS, JSON.stringify(this.cachedBookings))
  }

  private persistActivity() {
    localStorage.setItem(LS_ACTIVITY, JSON.stringify(this.cachedActivity))
  }

  private handleChannelMessage(msg: { type: string; bookings?: Booking[]; activity?: ActivityLogEntry[]; booking?: Booking; prevStatus?: BookingStatus }) {
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

  getMode(): ConnectionMode {
    return this.mode
  }

  // ---------- mutations ----------

  private generateBookingCode(dateStr: string): string {
    const compact = dateStr.replace(/-/g, '')
    const countToday = this.cachedBookings.filter((b) => b.deliveryDate === dateStr).length + 1
    return `CPAC-${compact}-${pad(countToday, 3)}`
  }

  async addBooking(input: NewBookingInput, user: AppUser): Promise<Booking> {
    const now = new Date().toISOString()
    const booking: Booking = {
      ...input,
      id: genId(),
      code: this.generateBookingCode(input.deliveryDate),
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    }

    if (this.mode === 'firebase' && firestore) {
      this.setStatus({ syncing: true })
      const { id, ...rest } = booking
      void id
      const docRef = await addDoc(collection(firestore, 'bookings'), rest)
      booking.id = docRef.id
      this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString() })
    } else {
      this.cachedBookings = [booking, ...this.cachedBookings]
      this.persistBookings()
      this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
      this.newBookingListeners.forEach((cb) => cb(booking))
      this.channel?.postMessage({ type: 'bookings-updated', bookings: this.cachedBookings })
      this.channel?.postMessage({ type: 'new-booking', booking })
      this.setStatus({ lastSyncAt: new Date().toISOString() })
    }

    await this.addActivityLog({
      userName: user.displayName,
      userRole: user.role,
      action: 'สร้างใบสั่งจอง',
      detail: `สร้างใบสั่งจอง ${booking.code} ให้ลูกค้า ${booking.customerName} ปริมาณ ${booking.volume} คิว`,
      bookingCode: booking.code,
    })

    return booking
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus, user: AppUser): Promise<void> {
    const existing = this.cachedBookings.find((b) => b.id === bookingId)
    if (!existing) return
    const prevStatus = existing.status
    const updated: Booking = { ...existing, status, updatedAt: new Date().toISOString() }

    if (this.mode === 'firebase' && firestore) {
      this.setStatus({ syncing: true })
      await updateDoc(doc(firestore, 'bookings', bookingId), {
        status,
        updatedAt: updated.updatedAt,
      })
      this.setStatus({ syncing: false, lastSyncAt: new Date().toISOString() })
    } else {
      this.cachedBookings = this.cachedBookings.map((b) => (b.id === bookingId ? updated : b))
      this.persistBookings()
      this.bookingListeners.forEach((cb) => cb(this.cachedBookings))
      this.statusChangeListeners.forEach((cb) => cb(updated, prevStatus))
      this.channel?.postMessage({ type: 'bookings-updated', bookings: this.cachedBookings })
      this.channel?.postMessage({ type: 'status-change', booking: updated, prevStatus })
      this.setStatus({ lastSyncAt: new Date().toISOString() })
    }

    await this.addActivityLog({
      userName: user.displayName,
      userRole: user.role,
      action: 'เปลี่ยนสถานะ',
      detail: `เปลี่ยนสถานะใบสั่งจอง ${existing.code} จาก "${prevStatus}" เป็น "${status}"`,
      bookingCode: existing.code,
    })
  }

  private async addActivityLog(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const full: ActivityLogEntry = { ...entry, id: genId(), timestamp: new Date().toISOString() }

    if (this.mode === 'firebase' && firestore) {
      const { id, ...rest } = full
      void id
      await addDoc(collection(firestore, 'activityLog'), rest)
    } else {
      this.cachedActivity = [full, ...this.cachedActivity].slice(0, 500)
      this.persistActivity()
      this.activityListeners.forEach((cb) => cb(this.cachedActivity))
      this.channel?.postMessage({ type: 'activity-updated', activity: this.cachedActivity })
    }
  }
}

export const dataStore = new DataStore()
