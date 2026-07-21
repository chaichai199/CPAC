interface Env {
  DB: D1Database
}

const VALID_STATUSES = ['pending', 'approved', 'dispatched', 'completed', 'cancelled']

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string
  const body = (await context.request.json()) as {
    status: string
    user: { displayName: string; role: string }
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return new Response('Invalid status', { status: 400 })
  }

  const db = context.env.DB
  const existing = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<{
    code: string
    status: string
  }>()
  if (!existing) {
    return new Response('Booking not found', { status: 404 })
  }

  const now = new Date().toISOString()
  await db.prepare('UPDATE bookings SET status = ?, updatedAt = ? WHERE id = ?').bind(body.status, now, id).run()

  await db
    .prepare(
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

  const updated = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first()
  return Response.json(updated)
}
