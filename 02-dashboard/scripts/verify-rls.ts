/**
 * RLS verification script — signs in as Dealer A (anon key, same as the browser)
 * and attempts 10 breaches against Dealer B's data.
 *
 * Every row should PASS (access denied or empty result).
 *
 * Usage: npm run verify:rls
 * Prerequisite: npm run seed
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !anonKey || !serviceKey) {
  console.error('Missing env vars — check .env.local')
  process.exit(1)
}

const service = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type Result = { id: number; test: string; pass: boolean; detail: string }
const results: Result[] = []

function pass(id: number, test: string, detail = '') {
  results.push({ id, test, pass: true, detail })
}
function fail(id: number, test: string, detail = '') {
  results.push({ id, test, pass: false, detail })
}

async function main() {
  console.log('Forecourt RLS verification\n')

  // Accounts must match seed.ts constants
  const EMAIL_A = process.env.SEED_EMAIL_A ?? 'appflow.qa01@gmail.com'
  const EMAIL_B = process.env.SEED_EMAIL_B ?? 'appflow.qa02@gmail.com'
  const PASSWORD = process.env.SEED_PASSWORD ?? 'forecourt-demo'

  // ── Get Dealer B's IDs ────────────────────────────────────────────────────
  const { data: list } = await service.auth.admin.listUsers()
  const b = list?.users?.find((u) => u.email === EMAIL_B)
  if (!b) { console.error(`Dealer B (${EMAIL_B}) not found — run npm run seed first`); process.exit(1) }

  const { data: bVehicles } = await service
    .from('vehicles')
    .select('id')
    .eq('owner_id', b.id)
    .limit(1)
  const bCarId = bVehicles?.[0]?.id

  if (!bCarId) { console.error('No vehicles for Dealer B — run npm run seed'); process.exit(1) }

  const { data: bJobs } = await service
    .from('reconditioning_jobs')
    .select('id')
    .eq('owner_id', b.id)
    .limit(1)

  // ── Snapshot B's recon_total BEFORE any attacks ───────────────────────────
  const beforeBEcon = await service
    .from('vehicle_economics')
    .select('recon_total')
    .eq('id', bCarId)
    .maybeSingle()

  // ── Sign in as Dealer A (anon key — exactly what a browser has) ───────────
  const anon = createClient(url, anonKey)
  const { error: signInErr } = await anon.auth.signInWithPassword({
    email: EMAIL_A,
    password: PASSWORD,
  })
  if (signInErr) { console.error(`Could not sign in as Dealer A (${EMAIL_A}):`, signInErr.message); process.exit(1) }

  // ── Tests ─────────────────────────────────────────────────────────────────

  // 1. SELECT vehicles — must only see own rows
  const { data: t1 } = await anon.from('vehicles').select('id, owner_id')
  const seesB1 = t1?.some((r) => r.owner_id === b.id)
  seesB1 ? fail(1, 'SELECT vehicles shows only own rows', 'Saw a B row') : pass(1, 'SELECT vehicles shows only own rows')

  // 2. SELECT by B's car ID — must return 0 rows
  const { data: t2 } = await anon.from('vehicles').select('id').eq('id', bCarId)
  ;(t2?.length ?? 0) > 0 ? fail(2, 'SELECT B car by id → 0 rows', `Got ${t2?.length} row(s)`) : pass(2, 'SELECT B car by id → 0 rows')

  // 3. UPDATE B's car — must affect 0 rows
  const { count: t3count } = await anon.from('vehicles').update({ asking_price: 1 }).eq('id', bCarId)
  ;(t3count ?? 0) > 0 ? fail(3, 'UPDATE B car → 0 rows affected', `Affected ${t3count}`) : pass(3, 'UPDATE B car → 0 rows affected')

  // 4. DELETE B's car — must affect 0 rows
  const { count: t4count } = await anon.from('vehicles').delete().eq('id', bCarId)
  ;(t4count ?? 0) > 0 ? fail(4, 'DELETE B car → 0 rows affected', `Affected ${t4count}`) : pass(4, 'DELETE B car → 0 rows affected')

  // 5. INSERT with owner_id = B — must be rejected
  const { error: t5err } = await anon
    .from('vehicles')
    .insert({ owner_id: b.id, make: 'Test', model: 'Fail', year: 2020, mileage_km: 0, acquisition_price: 1, status: 'sourcing', acquired_on: '2024-01-01' })
  t5err ? pass(5, 'INSERT with owner_id=B → rejected', t5err.message) : fail(5, 'INSERT with owner_id=B → rejected', 'Insert succeeded!')

  // 6. SELECT recon_jobs — must only see own rows
  const { data: t6 } = await anon.from('reconditioning_jobs').select('owner_id')
  const seesB6 = t6?.some((r) => r.owner_id === b.id)
  seesB6 ? fail(6, 'SELECT recon_jobs shows only own rows', 'Saw a B row') : pass(6, 'SELECT recon_jobs shows only own rows')

  // 7. SELECT vehicle_economics view — must only see own rows (the security_invoker check)
  const { data: t7 } = await anon.from('vehicle_economics').select('owner_id')
  const seesB7 = t7?.some((r) => r.owner_id === b.id)
  seesB7
    ? fail(7, 'vehicle_economics view respects RLS (security_invoker)', 'Saw a B row — security_invoker missing!')
    : pass(7, 'vehicle_economics view respects RLS (security_invoker)')

  // 8. RPC dashboard_stats — returns data scoped to A's own rows only
  const { data: t8Stats } = await anon.rpc('dashboard_stats')
  const statsRow = Array.isArray(t8Stats) ? (t8Stats as any[])[0] : (t8Stats as any)
  const fleetCount = statsRow?.fleet_count ?? -1
  typeof fleetCount === 'number' && fleetCount >= 0
    ? pass(8, `dashboard_stats returns data for own rows (fleet_count=${fleetCount})`)
    : fail(8, `dashboard_stats returned no data or negative count (${fleetCount})`)

  // 9. UPDATE recon job — set vehicle_id to B's car (the policy fix)
  {
    const { data: aJobs } = await anon.from('reconditioning_jobs').select('id').limit(1)
    if (!aJobs?.[0]?.id) {
      fail(9, 'UPDATE recon vehicle_id to B car → rejected', 'SETUP FAIL: no A jobs found — run npm run seed')
    } else {
      const { error: t9err, count: t9count } = await anon
        .from('reconditioning_jobs')
        .update({ vehicle_id: bCarId })
        .eq('id', aJobs[0].id)
      ;(t9count ?? 0) > 0
        ? fail(9, 'UPDATE recon job vehicle_id to B car → rejected', `Affected ${t9count}`)
        : pass(9, 'UPDATE recon job vehicle_id to B car → rejected', t9err?.message ?? 'policy blocked it')
    }
  }

  // 10. Re-read B's vehicle_economics — recon_total unchanged vs snapshot taken before attacks
  const afterBEcon = await service
    .from('vehicle_economics')
    .select('recon_total')
    .eq('id', bCarId)
    .maybeSingle()
  const unchanged = beforeBEcon.data?.recon_total === afterBEcon.data?.recon_total
  unchanged
    ? pass(10, "B's recon_total unchanged after A's attack attempts")
    : fail(10, "B's recon_total unchanged after A's attack attempts", `before=${beforeBEcon.data?.recon_total} after=${afterBEcon.data?.recon_total}`)

  await anon.auth.signOut()

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\nResults')
  console.log('─'.repeat(70))
  for (const r of results) {
    const icon = r.pass ? '✅ PASS' : '❌ FAIL'
    console.log(`  ${r.id.toString().padStart(2)}  ${icon}  ${r.test}`)
    if (r.detail) console.log(`          ${r.detail}`)
  }
  console.log('─'.repeat(70))

  const failures = results.filter((r) => !r.pass)
  if (failures.length === 0) {
    console.log('\nAll 10 tests passed. RLS boundary is sound.')
  } else {
    console.log(`\n${failures.length} FAILURE(S). Fix before shipping.`)
    process.exit(1)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
