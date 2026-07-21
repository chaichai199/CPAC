export interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

const VALID_STATUSES = ['pending', 'approved', 'dispatched', 'completed', 'cancelled']

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

async function handleGetBookings(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM bookings ORDER BY deliveryDate DESC, deliveryTime DESC',
  ).all()
  return Response.json(results)
}

async function handlePostBookings(request: Request, env: Env): Promise<Response> {
  const body = await request.json()
  const { user, ...input } = body as {
    user: { displayName: string; role: string }
    customerName: string
    phone: string
    deliveryDate: string
    deliveryTime: string
    concreteStrength: string
    volume: number
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
    createdBy: string
  }

  if (!input.customerName || !input.phone || !input.deliveryDate || !(input.volume > 0)) {
    return new Response('Invalid booking payload', { status: 400 })
  }

  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  const countRow = await env.DB.prepare('SELECT COUNT(*) as c FROM bookings WHERE deliveryDate = ?')
    .bind(input.deliveryDate)
    .first<{ c: number }>()
  const seq = (countRow?.c ?? 0) + 1
  const code = `CPAC-${input.deliveryDate.replace(/-/g, '')}-${pad(seq, 3)}`

  await env.DB.prepare(
    `INSERT INTO bookings (
      id, code, customerName, phone, deliveryDate, deliveryTime, concreteStrength, volume,
      mixerType, pourMethod, jobType, contactPerson, contactPhone, mapLink, sellerName,
      pricePerUnit, discount, totalPrice, status, createdAt, updatedAt, createdBy
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      id,
      code,
      input.customerName,
      input.phone,
      input.deliveryDate,
      input.deliveryTime,
      input.concreteStrength,
      input.volume,
      input.mixerType,
      input.pourMethod,
      input.jobType,
      input.contactPerson,
      input.contactPhone,
      input.mapLink,
      input.sellerName,
      input.pricePerUnit,
      input.discount,
      input.totalPrice,
      'pending',
      now,
      now,
      input.createdBy,
    )
    .run()

  await env.DB.prepare(
    `INSERT INTO activity_log (id, timestamp, userName, userRole, action, detail, bookingCode)
     VALUES (?,?,?,?,?,?,?)`,
  )
    .bind(
      crypto.randomUUID(),
      now,
      user?.displayName ?? 'ไม่ทราบผู้ใช้',
      user?.role ?? 'staff',
      'สร้างใบสั่งจอง',
      `สร้างใบสั่งจอง ${code} ให้ลูกค้า ${input.customerName} ปริมาณ ${input.volume} คิว`,
      code,
    )
    .run()

  return Response.json({ id, code, ...input, status: 'pending', createdAt: now, updatedAt: now }, { status: 201 })
}

async function handlePatchStatus(id: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { status: string; user: { displayName: string; role: string } }

  if (!VALID_STATUSES.includes(body.status)) {
    return new Response('Invalid status', { status: 400 })
  }

  const existing = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<{
    code: string
    status: string
  }>()
  if (!existing) {
    return new Response('Booking not found', { status: 404 })
  }

  const now = new Date().toISOString()
  await env.DB.prepare('UPDATE bookings SET status = ?, updatedAt = ? WHERE id = ?').bind(body.status, now, id).run()

  await env.DB.prepare(
    `INSERT INTO activity_log (id, timestamp, userName, userRole, action, detail, bookingCode)
     VALUES (?,?,?,?,?,?,?)`,
  )
    .bind(
      crypto.randomUUID(),
      now,
      body.user?.displayName ?? 'ไม่ทราบผู้ใช้',
      body.user?.role ?? 'staff',
      'เปลี่ยนสถานะ',
      `เปลี่ยนสถานะใบสั่งจอง ${existing.code} จาก "${existing.status}" เป็น "${body.status}"`,
      existing.code,
    )
    .run()

  const updated = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first()
  return Response.json(updated)
}

async function handleGetActivity(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 500').all()
  return Response.json(results)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/bookings' && request.method === 'GET') {
      return handleGetBookings(env)
    }
    if (url.pathname === '/api/bookings' && request.method === 'POST') {
      return handlePostBookings(request, env)
    }
    const statusMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/status$/)
    if (statusMatch && request.method === 'PATCH') {
      return handlePatchStatus(statusMatch[1], request, env)
    }
    if (url.pathname === '/api/activity' && request.method === 'GET') {
      return handleGetActivity(env)
    }

    return env.ASSETS.fetch(request)
  },
}
