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
    arrivalTime?: string
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
      id, code, customerName, phone, deliveryDate, deliveryTime, arrivalTime, concreteStrength, volume,
      mixerType, pourMethod, jobType, contactPerson, contactPhone, mapLink, sellerName,
      pricePerUnit, discount, totalPrice, status, createdAt, updatedAt, createdBy
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      id,
      code,
      input.customerName,
      input.phone,
      input.deliveryDate,
      input.deliveryTime,
      input.arrivalTime ?? null,
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

async function handlePostActivity(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    userName: string
    userRole: string
    action: string
    detail: string
    bookingCode?: string
  }

  if (!body.userName || !body.userRole || !body.action || !body.detail) {
    return new Response('Invalid activity log payload', { status: 400 })
  }

  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO activity_log (id, timestamp, userName, userRole, action, detail, bookingCode)
     VALUES (?,?,?,?,?,?,?)`,
  )
    .bind(crypto.randomUUID(), now, body.userName, body.userRole, body.action, body.detail, body.bookingCode ?? null)
    .run()

  return new Response(null, { status: 201 })
}

const VALID_ROLES = ['admin', 'staff']

async function handleGetUsers(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT id, username, password, displayName, role FROM users ORDER BY username').all()
  return Response.json(results)
}

async function handlePostUsers(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    username: string
    password: string
    displayName: string
    role: string
  }

  if (!body.username?.trim() || !body.password?.trim() || !body.displayName?.trim() || !VALID_ROLES.includes(body.role)) {
    return new Response('Invalid user payload', { status: 400 })
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(body.username.trim()).first()
  if (existing) {
    return new Response('Username already exists', { status: 409 })
  }

  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO users (id, username, password, displayName, role) VALUES (?,?,?,?,?)')
    .bind(id, body.username.trim(), body.password, body.displayName.trim(), body.role)
    .run()

  return Response.json({ id, username: body.username.trim(), password: body.password, displayName: body.displayName.trim(), role: body.role }, { status: 201 })
}

async function handlePatchUser(id: string, request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as Partial<{
    username: string
    password: string
    displayName: string
    role: string
  }>

  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<{
    username: string
    password: string
    displayName: string
    role: string
  }>()
  if (!existing) {
    return new Response('User not found', { status: 404 })
  }

  if (body.role && !VALID_ROLES.includes(body.role)) {
    return new Response('Invalid role', { status: 400 })
  }

  const nextUsername = body.username?.trim() || existing.username
  if (nextUsername !== existing.username) {
    const clash = await env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?').bind(nextUsername, id).first()
    if (clash) {
      return new Response('Username already exists', { status: 409 })
    }
  }

  if (existing.role === 'admin' && body.role === 'staff') {
    const adminCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").first<{ c: number }>()
    if ((adminCount?.c ?? 0) <= 1) {
      return new Response('Cannot demote the last remaining admin', { status: 400 })
    }
  }

  const nextPassword = body.password?.trim() || existing.password
  const nextDisplayName = body.displayName?.trim() || existing.displayName
  const nextRole = body.role || existing.role

  await env.DB.prepare('UPDATE users SET username = ?, password = ?, displayName = ?, role = ? WHERE id = ?')
    .bind(nextUsername, nextPassword, nextDisplayName, nextRole, id)
    .run()

  return Response.json({ id, username: nextUsername, password: nextPassword, displayName: nextDisplayName, role: nextRole })
}

async function handleDeleteUser(id: string, env: Env): Promise<Response> {
  const existing = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(id).first<{ role: string }>()
  if (!existing) {
    return new Response('User not found', { status: 404 })
  }

  if (existing.role === 'admin') {
    const adminCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").first<{ c: number }>()
    if ((adminCount?.c ?? 0) <= 1) {
      return new Response('Cannot delete the last remaining admin', { status: 400 })
    }
  }

  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return new Response(null, { status: 204 })
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
    if (url.pathname === '/api/activity' && request.method === 'POST') {
      return handlePostActivity(request, env)
    }
    if (url.pathname === '/api/users' && request.method === 'GET') {
      return handleGetUsers(env)
    }
    if (url.pathname === '/api/users' && request.method === 'POST') {
      return handlePostUsers(request, env)
    }
    const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/)
    if (userMatch && request.method === 'PATCH') {
      return handlePatchUser(userMatch[1], request, env)
    }
    if (userMatch && request.method === 'DELETE') {
      return handleDeleteUser(userMatch[1], env)
    }

    return env.ASSETS.fetch(request)
  },
}
