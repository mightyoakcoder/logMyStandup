import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import fs from 'fs'
import { loadSecrets } from './secrets.js'
import { query } from './database.js'

type Env = {
  Variables: {
    startTime: number
  }
}

const app = new Hono<Env>()


// Middleware
app.use('*', logger())

app.use('*', async (c, next) => {
  c.set('startTime', Date.now())
  await next()
})


// ------ Standup routes ------
app.post('/standups', async (c) => {
  try {
    const body = await c.req.json<{
      userId?: string | number
      date?: string
      yesterdayWork?: any[]
      todayPlan?: any[]
      blockers?: any[]
    }>()

    const { userId, date, yesterdayWork, todayPlan, blockers } = body

    if (!userId || !date) {
      return c.json({ error: 'userId and date are required' }, 400)
    }

    const result = await query<{
      id: number
      user_id: number
      date: string
      yesterday_work: any
      today_plan: any
      blockers: any
      created_at: string
      updated_at: string
    }>(
      `
      INSERT INTO standups (user_id, date, yesterday_work, today_plan, blockers)
      VALUES ($1, $2::date, $3, $4, $5)
      RETURNING id, user_id, date, yesterday_work, today_plan, blockers, created_at, updated_at
      `,
      [
        Number(userId),
        date,
        JSON.stringify(yesterdayWork || []),
        JSON.stringify(todayPlan || []),
        JSON.stringify(blockers || []),
      ]
    )

    const s = result.rows[0]

    return c.json(
      {
        id: s.id,
        userId: s.user_id,
        date: s.date,
        yesterdayWork: s.yesterday_work,
        todayPlan: s.today_plan,
        blockers: s.blockers,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      },
      201
    )
  } catch (err) {
    console.error('Error creating standup entry:', err)
    return c.json({ error: 'Failed to create standup entry' }, 500)
  }
})

// Get all standups for user: GET /standups/:userId?startDate=&endDate=&limit=
app.get('/standups/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const url = new URL(c.req.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = Number(url.searchParams.get('limit') || 50)

    const params: any[] = [Number(userId)]
    let idx = 2

    let sql = `
      SELECT id, user_id, date, yesterday_work, today_plan, blockers,
             created_at, updated_at
      FROM standups
      WHERE user_id = $1
    `

    if (startDate) {
      sql += ` AND date >= $${idx++}::date`
      params.push(startDate)
    }
    if (endDate) {
      sql += ` AND date <= $${idx++}::date`
      params.push(endDate)
    }

    sql += ` ORDER BY date DESC LIMIT $${idx}`
    params.push(limit)

    const { rows } = await query(sql, params)

    const standups = rows.map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      date: s.date,
      yesterdayWork: s.yesterday_work,
      todayPlan: s.today_plan,
      blockers: s.blockers,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }))

    return c.json(standups)
  } catch (err) {
    console.error('Error fetching standup entries:', err)
    return c.json({ error: 'Failed to fetch standup entries' }, 500)
  }
})

// Get specific standup: GET /standups/:userId/:standupId
app.get('/standups/:userId/:standupId', async (c) => {
  try {
    const userId = Number(c.req.param('userId'))
    const standupId = Number(c.req.param('standupId'))

    const { rows } = await query(
      `
      SELECT id, user_id, date, yesterday_work, today_plan, blockers,
             created_at, updated_at
      FROM standups
      WHERE id = $1
      `,
      [standupId]
    )

    if (rows.length === 0) {
      return c.json({ error: 'Standup entry not found' }, 404)
    }

    const s: any = rows[0]

    if (s.user_id !== userId) {
      return c.json({ error: 'Access denied' }, 403)
    }

    return c.json({
      id: s.id,
      userId: s.user_id,
      date: s.date,
      yesterdayWork: s.yesterday_work,
      todayPlan: s.today_plan,
      blockers: s.blockers,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })
  } catch (err) {
    console.error('Error fetching standup entry:', err)
    return c.json({ error: 'Failed to fetch standup entry' }, 500)
  }
})

// Update standup: PUT /standups/:userId/:standupId
app.put('/standups/:userId/:standupId', async (c) => {
  try {
    const userId = Number(c.req.param('userId'))
    const standupId = Number(c.req.param('standupId'))
    const body = await c.req.json<{
      yesterdayWork?: any[]
      todayPlan?: any[]
      blockers?: any[]
    }>()

    const { rows: existing } = await query(
      `
      SELECT id, user_id, yesterday_work, today_plan, blockers,
             created_at, updated_at
      FROM standups
      WHERE id = $1
      `,
      [standupId]
    )

    if (existing.length === 0) {
      return c.json({ error: 'Standup entry not found' }, 404)
    }

    const current: any = existing[0]
    if (current.user_id !== userId) {
      return c.json({ error: 'Access denied' }, 403)
    }

    const updatedFields = {
      yesterday_work:
        body.yesterdayWork !== undefined ? body.yesterdayWork : current.yesterday_work,
      today_plan:
        body.todayPlan !== undefined ? body.todayPlan : current.today_plan,
      blockers: body.blockers !== undefined ? body.blockers : current.blockers,
    }

    const { rows } = await query(
      `
      UPDATE standups
      SET yesterday_work = $1,
          today_plan = $2,
          blockers = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, user_id, date, yesterday_work, today_plan, blockers,
                created_at, updated_at
      `,
      [
        JSON.stringify(updatedFields.yesterday_work),
        JSON.stringify(updatedFields.today_plan),
        JSON.stringify(updatedFields.blockers),
        standupId,
      ]
    )

    const s: any = rows[0]

    return c.json({
      id: s.id,
      userId: s.user_id,
      date: s.date,
      yesterdayWork: s.yesterday_work,
      todayPlan: s.today_plan,
      blockers: s.blockers,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })
  } catch (err) {
    console.error('Error updating standup entry:', err)
    return c.json({ error: 'Failed to update standup entry' }, 500)
  }
})

// Delete standup: DELETE /standups/:userId/:standupId
app.delete('/standups/:userId/:standupId', async (c) => {
  try {
    const userId = Number(c.req.param('userId'))
    const standupId = Number(c.req.param('standupId'))

    const { rows: existing } = await query(
      `SELECT id, user_id FROM standups WHERE id = $1`,
      [standupId]
    )

    if (existing.length === 0) {
      return c.json({ error: 'Standup entry not found' }, 404)
    }

    const current: any = existing[0]
    if (current.user_id !== userId) {
      return c.json({ error: 'Access denied' }, 403)
    }

    await query(`DELETE FROM standups WHERE id = $1`, [standupId])

    return c.json({ message: 'Standup entry deleted successfully' })
  } catch (err) {
    console.error('Error deleting standup entry:', err)
    return c.json({ error: 'Failed to delete standup entry' }, 500)
  }
})

// Stats: GET /standups/:userId/stats?days=30
app.get('/standups/:userId/stats', async (c) => {
  try {
    const userId = Number(c.req.param('userId'))
    const url = new URL(c.req.url)
    const days = Number(url.searchParams.get('days') || 30)

    const { rows } = await query(
      `
      SELECT blockers
      FROM standups
      WHERE user_id = $1
        AND date >= (CURRENT_DATE - $2::int)
      `,
      [userId, days]
    )

    const totalEntries = rows.length
    let totalBlockers = 0
    const blockerList: any[] = []

    for (const row of rows) {
      const blockers = row.blockers || []
      if (Array.isArray(blockers) && blockers.length > 0) {
        totalBlockers += blockers.length
        blockerList.push(...blockers)
      }
    }

    const averageBlockersPerEntry =
      totalEntries > 0 ? Number((totalBlockers / totalEntries).toFixed(2)) : 0

    return c.json({
      totalEntries,
      totalBlockers,
      averageBlockersPerEntry,
      daysTracked: days,
      mostRecentBlockers: blockerList.slice(-5),
    })
  } catch (err) {
    console.error('Error fetching standup statistics:', err)
    return c.json({ error: 'Failed to fetch standup statistics' }, 500)
  }
})

// ------ Entries routes ------
// These routes use a simpler text-based schema matching the frontend form.
// Required table:
//   CREATE TABLE entries (
//     id SERIAL PRIMARY KEY,
//     date DATE NOT NULL,
//     yesterday TEXT NOT NULL DEFAULT '',
//     today TEXT NOT NULL,
//     blockers TEXT NOT NULL DEFAULT '',
//     notes TEXT NOT NULL DEFAULT '',
//     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
//   );

app.post('/entries', async (c) => {
  try {
    const body = await c.req.json<{
      date?: string
      yesterday?: string
      today?: string
      blockers?: string
      notes?: string
    }>()

    const { date, yesterday = '', today, blockers = '', notes = '' } = body

    if (!date || !today) {
      return c.json({ error: 'date and today are required' }, 400)
    }

    const result = await query<{
      id: number
      date: string
      yesterday: string
      today: string
      blockers: string
      notes: string
      created_at: string
      updated_at: string
    }>(
      `INSERT INTO entries (date, yesterday, today, blockers, notes)
       VALUES ($1::date, $2, $3, $4, $5)
       RETURNING id, date, yesterday, today, blockers, notes, created_at, updated_at`,
      [date, yesterday, today, blockers, notes]
    )

    return c.json(result.rows[0], 201)
  } catch (err) {
    console.error('Error creating entry:', err)
    return c.json({ error: 'Failed to create entry' }, 500)
  }
})

app.get('/entries', async (c) => {
  try {
    const url = new URL(c.req.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const limit = Number(url.searchParams.get('limit') || 50)

    const params: any[] = []
    let idx = 1
    let sql = `SELECT id, date, yesterday, today, blockers, notes, created_at, updated_at FROM entries WHERE 1=1`

    if (startDate) {
      sql += ` AND date >= $${idx++}::date`
      params.push(startDate)
    }
    if (endDate) {
      sql += ` AND date <= $${idx++}::date`
      params.push(endDate)
    }

    sql += ` ORDER BY date DESC LIMIT $${idx}`
    params.push(limit)

    const { rows } = await query(sql, params)
    return c.json(rows)
  } catch (err) {
    console.error('Error fetching entries:', err)
    return c.json({ error: 'Failed to fetch entries' }, 500)
  }
})

app.get('/entries/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const { rows } = await query(
      `SELECT id, date, yesterday, today, blockers, notes, created_at, updated_at FROM entries WHERE id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return c.json({ error: 'Entry not found' }, 404)
    }

    return c.json(rows[0])
  } catch (err) {
    console.error('Error fetching entry:', err)
    return c.json({ error: 'Failed to fetch entry' }, 500)
  }
})

app.put('/entries/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json<{
      date?: string
      yesterday?: string
      today?: string
      blockers?: string
      notes?: string
    }>()

    const { rows: existing } = await query(
      `SELECT id, date, yesterday, today, blockers, notes FROM entries WHERE id = $1`,
      [id]
    )

    if (existing.length === 0) {
      return c.json({ error: 'Entry not found' }, 404)
    }

    const current: any = existing[0]
    const updated = {
      date: body.date ?? current.date,
      yesterday: body.yesterday ?? current.yesterday,
      today: body.today ?? current.today,
      blockers: body.blockers ?? current.blockers,
      notes: body.notes ?? current.notes,
    }

    const { rows } = await query(
      `UPDATE entries
       SET date = $1::date, yesterday = $2, today = $3, blockers = $4, notes = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, date, yesterday, today, blockers, notes, created_at, updated_at`,
      [updated.date, updated.yesterday, updated.today, updated.blockers, updated.notes, id]
    )

    return c.json(rows[0])
  } catch (err) {
    console.error('Error updating entry:', err)
    return c.json({ error: 'Failed to update entry' }, 500)
  }
})

app.delete('/entries/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const { rows } = await query(`SELECT id FROM entries WHERE id = $1`, [id])

    if (rows.length === 0) {
      return c.json({ error: 'Entry not found' }, 404)
    }

    await query(`DELETE FROM entries WHERE id = $1`, [id])
    return c.json({ message: 'Entry deleted successfully' })
  } catch (err) {
    console.error('Error deleting entry:', err)
    return c.json({ error: 'Failed to delete entry' }, 500)
  }
})

// Serve React frontend static assets
app.use('/*', serveStatic({ root: './frontend/build' }))

// SPA fallback — any unmatched route returns index.html
app.use('/*', async (c) => {
  const html = await fs.promises.readFile('./frontend/build/index.html', 'utf-8')
  return c.html(html)
})

await loadSecrets()

await query(`
  CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    yesterday TEXT NOT NULL DEFAULT '',
    today TEXT NOT NULL,
    blockers TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)
console.log('entries table ready')

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server running on port ${info.port}`);
});
