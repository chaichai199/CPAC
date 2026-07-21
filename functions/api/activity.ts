interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { results } = await context.env.DB.prepare(
    'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 500',
  ).all()
  return Response.json(results)
}
