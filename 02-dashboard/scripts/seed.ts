/**
 * Seed script — creates two demo dealerships with inventory and recon jobs.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS to create
 * users and seed data). The running app never uses this key.
 *
 * Idempotent: clears existing seed data before inserting.
 *
 * Usage: npm run seed
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 10)
}

// ──────────────────────────────────────────────────────────────────────────────
// Dealerships
// ──────────────────────────────────────────────────────────────────────────────

const DEALER_A = {
  email: 'appflow.qa01@gmail.com',
  password: 'forecourt-demo',
  dealership: 'Marina Motors',
}
const DEALER_B = {
  email: 'appflow.qa02@gmail.com',
  password: 'forecourt-demo',
  dealership: 'Rashid Auto',
}

async function upsertUser(email: string, password: string, dealership: string) {
  // Try create; if already exists, get ID via admin list
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { dealership_name: dealership },
  })

  if (created?.user) {
    await supabase
      .from('profiles')
      .upsert({ id: created.user.id, dealership_name: dealership })
    return created.user.id
  }

  // Already exists
  const { data: list } = await supabase.auth.admin.listUsers()
  const existing = list?.users?.find((u) => u.email === email)
  if (!existing) throw new Error(`Could not find or create user ${email}`)
  await supabase
    .from('profiles')
    .upsert({ id: existing.id, dealership_name: dealership })
  return existing.id
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Forecourt demo data…')

  const [ownerA, ownerB] = await Promise.all([
    upsertUser(DEALER_A.email, DEALER_A.password, DEALER_A.dealership),
    upsertUser(DEALER_B.email, DEALER_B.password, DEALER_B.dealership),
  ])

  console.log(`  Owner A: ${ownerA}  (${DEALER_A.email})`)
  console.log(`  Owner B: ${ownerB}  (${DEALER_B.email})`)

  // Clear existing seed data for A (leave B alone)
  await supabase.from('reconditioning_jobs').delete().eq('owner_id', ownerA)
  await supabase.from('reconditioning_jobs').delete().eq('owner_id', ownerB)
  await supabase.from('vehicles').delete().eq('owner_id', ownerA)
  await supabase.from('vehicles').delete().eq('owner_id', ownerB)

  // ── Dealer A — Marina Motors ─────────────────────────────────────────────

  const vehiclesA = [
    {
      owner_id: ownerA, make: 'Toyota', model: 'Land Cruiser', year: 2021,
      mileage_km: 42000, body_type: 'SUV', acquisition_price: 185000,
      asking_price: 215000, sold_price: null, status: 'listed',
      acquired_on: monthsAgo(3), sold_on: null, notes: 'Dealer import, full service history',
    },
    {
      owner_id: ownerA, make: 'Nissan', model: 'Patrol', year: 2020,
      mileage_km: 78000, body_type: 'SUV', acquisition_price: 120000,
      asking_price: 145000, sold_price: 142000, status: 'sold',
      acquired_on: monthsAgo(5), sold_on: monthsAgo(4), notes: null,
    },
    {
      owner_id: ownerA, make: 'BMW', model: '7 Series', year: 2019,
      mileage_km: 55000, body_type: 'Sedan', acquisition_price: 145000,
      asking_price: 162000, sold_price: null, status: 'reconditioning',
      acquired_on: monthsAgo(2), sold_on: null, notes: 'Minor dent on rear quarter',
    },
    {
      owner_id: ownerA, make: 'Mercedes', model: 'GLE 450', year: 2022,
      mileage_km: 28000, body_type: 'SUV', acquisition_price: 210000,
      asking_price: 248000, sold_price: 244000, status: 'sold',
      acquired_on: monthsAgo(4), sold_on: monthsAgo(2), notes: null,
    },
    {
      owner_id: ownerA, make: 'Lexus', model: 'LX 570', year: 2020,
      mileage_km: 62000, body_type: 'SUV', acquisition_price: 195000,
      asking_price: 228000, sold_price: null, status: 'listed',
      acquired_on: monthsAgo(1), sold_on: null, notes: null,
    },
    // The 2-bought / 3-sold regression fixture — all in the same calendar month
    {
      owner_id: ownerA, make: 'Honda', model: 'Pilot', year: 2021,
      mileage_km: 35000, body_type: 'SUV', acquisition_price: 92000,
      asking_price: 108000, sold_price: 105000, status: 'sold',
      acquired_on: monthsAgo(1), sold_on: monthsAgo(0), notes: 'Regression fixture',
    },
    {
      owner_id: ownerA, make: 'Ford', model: 'Explorer', year: 2021,
      mileage_km: 41000, body_type: 'SUV', acquisition_price: 88000,
      asking_price: 103000, sold_price: 101000, status: 'sold',
      acquired_on: monthsAgo(1), sold_on: monthsAgo(0), notes: 'Regression fixture',
    },
    {
      owner_id: ownerA, make: 'Chevrolet', model: 'Tahoe', year: 2020,
      mileage_km: 85000, body_type: 'SUV', acquisition_price: 105000,
      asking_price: 122000, sold_price: 120000, status: 'sold',
      acquired_on: monthsAgo(2), sold_on: monthsAgo(0), notes: 'Regression fixture',
    },
    {
      owner_id: ownerA, make: 'Hyundai', model: 'Palisade', year: 2023,
      mileage_km: 14000, body_type: 'SUV', acquisition_price: 118000,
      asking_price: null, sold_price: null, status: 'sourcing',
      acquired_on: daysAgo(5), sold_on: null, notes: null,
    },
    // Aged car — triggers "needs attention" at >60 days
    {
      owner_id: ownerA, make: 'Mitsubishi', model: 'Pajero', year: 2018,
      mileage_km: 120000, body_type: 'SUV', acquisition_price: 58000,
      asking_price: 68000, sold_price: null, status: 'listed',
      acquired_on: daysAgo(75), sold_on: null, notes: 'Sitting too long',
    },
  ]

  const { data: insertedV, error: vErr } = await supabase
    .from('vehicles')
    .insert(vehiclesA)
    .select('id, make, model')

  if (vErr) { console.error('vehicles insert error:', vErr.message); process.exit(1) }
  console.log(`  Inserted ${insertedV?.length} vehicles for Marina Motors`)

  // Look up IDs by make+model for recon jobs
  const byMake = (make: string, model: string) =>
    insertedV?.find((v) => v.make === make && v.model === model)?.id ?? ''

  const reconJobs = [
    // Land Cruiser
    { owner_id: ownerA, vehicle_id: byMake('Toyota','Land Cruiser'), category: 'mechanical', description: 'Engine service + filters', cost: 2800, vendor: 'Al Futtaim Toyota', completed: true, performed_on: monthsAgo(3) },
    { owner_id: ownerA, vehicle_id: byMake('Toyota','Land Cruiser'), category: 'detailing', description: 'Full detail + ceramic coat', cost: 3200, vendor: 'Shine Pro', completed: true, performed_on: monthsAgo(2) },
    { owner_id: ownerA, vehicle_id: byMake('Toyota','Land Cruiser'), category: 'tyres', description: 'All-terrain tyre set', cost: 4800, vendor: 'Bridgestone AE', completed: true, performed_on: monthsAgo(2) },
    // BMW
    { owner_id: ownerA, vehicle_id: byMake('BMW','7 Series'), category: 'bodywork', description: 'Rear quarter dent repair', cost: 4200, vendor: 'BM Bodyshop JBR', completed: false, performed_on: daysAgo(10) },
    { owner_id: ownerA, vehicle_id: byMake('BMW','7 Series'), category: 'electrical', description: 'iDrive software update', cost: 800, vendor: null, completed: true, performed_on: daysAgo(12) },
    { owner_id: ownerA, vehicle_id: byMake('BMW','7 Series'), category: 'mechanical', description: 'Brake fluid + pads front', cost: 1600, vendor: 'BMW Service Centre', completed: true, performed_on: daysAgo(8) },
    // Nissan Patrol (sold)
    { owner_id: ownerA, vehicle_id: byMake('Nissan','Patrol'), category: 'mechanical', description: 'Timing belt + coolant', cost: 3500, vendor: null, completed: true, performed_on: monthsAgo(5) },
    { owner_id: ownerA, vehicle_id: byMake('Nissan','Patrol'), category: 'detailing', description: 'Interior deep clean', cost: 1200, vendor: 'DetailWorks', completed: true, performed_on: monthsAgo(4) },
    // Pajero (aged)
    { owner_id: ownerA, vehicle_id: byMake('Mitsubishi','Pajero'), category: 'paperwork', description: 'Registration transfer', cost: 950, vendor: 'RTA', completed: true, performed_on: daysAgo(70) },
    { owner_id: ownerA, vehicle_id: byMake('Mitsubishi','Pajero'), category: 'mechanical', description: 'Gearbox service', cost: 5200, vendor: 'Al Habtoor Motors', completed: true, performed_on: daysAgo(65) },
  ].filter((j) => j.vehicle_id)

  const { data: insertedJ, error: jErr } = await supabase
    .from('reconditioning_jobs')
    .insert(reconJobs)
    .select('id')

  if (jErr) { console.error('recon insert error:', jErr.message); process.exit(1) }
  console.log(`  Inserted ${insertedJ?.length} recon jobs`)

  // ── Dealer B — Rashid Auto (exists only to prove A cannot see B's rows) ──
  const vehiclesB = [
    {
      owner_id: ownerB, make: 'Audi', model: 'Q7', year: 2021,
      mileage_km: 31000, body_type: 'SUV', acquisition_price: 175000,
      asking_price: 198000, sold_price: null, status: 'listed',
      acquired_on: monthsAgo(2), sold_on: null, notes: null,
    },
    {
      owner_id: ownerB, make: 'Porsche', model: 'Cayenne', year: 2020,
      mileage_km: 47000, body_type: 'SUV', acquisition_price: 235000,
      asking_price: 265000, sold_price: null, status: 'listed',
      acquired_on: monthsAgo(1), sold_on: null, notes: null,
    },
  ]
  const { data: bVehicles } = await supabase.from('vehicles').insert(vehiclesB).select('id')
  console.log(`  Inserted ${bVehicles?.length} vehicles for Rashid Auto (RLS boundary)`)

  // One recon job for B — needed so verify:rls test 9 (cross-owner vehicle_id attack) actually runs
  if (bVehicles?.[0]?.id) {
    await supabase.from('reconditioning_jobs').insert([{
      owner_id: ownerB,
      vehicle_id: bVehicles[0].id,
      category: 'mechanical',
      description: 'Oil service',
      cost: 800,
      vendor: null,
      completed: true,
      performed_on: monthsAgo(1),
    }])
  }

  console.log('\n✅ Seed complete.')
  console.log(`   Marina Motors: ${DEALER_A.email} / ${DEALER_A.password}`)
  console.log(`   Rashid Auto:   ${DEALER_B.email} / ${DEALER_B.password}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
