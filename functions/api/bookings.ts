interface Env {
  DB: D1Database
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { results } = await context.env.DB.prepare(
    'SELECT * FROM bookings ORDER BY deliveryDate DESC, deliveryTime DESC',
  ).all()
  return Response.json(results)
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json()
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

  const db = context.env.DB
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  const countRow = await db
    .prepare('SELECT COUNT(*) as c FROM bookings WHERE deliveryDate = ?')
    .bind(input.deliveryDate)
    .first<{ c: number }>()
  const seq = (countRow?.c ?? 0) + 1
  const code = `CPAC-${input.deliveryDate.replace(/-/g, '')}-${pad(seq, 3)}`

  await db
    .prepare(
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

  await db
    .prepare(
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
