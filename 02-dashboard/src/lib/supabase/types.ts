export type VehicleStatus = 'sourcing' | 'reconditioning' | 'listed' | 'sold'

export type ReconCategory =
  | 'mechanical'
  | 'bodywork'
  | 'detailing'
  | 'tyres'
  | 'electrical'
  | 'paperwork'

export const VEHICLE_STATUSES: VehicleStatus[] = [
  'sourcing',
  'reconditioning',
  'listed',
  'sold',
]

export const RECON_CATEGORIES: ReconCategory[] = [
  'mechanical',
  'bodywork',
  'detailing',
  'tyres',
  'electrical',
  'paperwork',
]

export type Vehicle = {
  id: string
  owner_id: string
  make: string
  model: string
  year: number
  mileage_km: number
  body_type: string | null
  acquisition_price: number
  asking_price: number | null
  sold_price: number | null
  status: VehicleStatus
  acquired_on: string
  sold_on: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ReconJob = {
  id: string
  vehicle_id: string
  owner_id: string
  category: ReconCategory
  description: string
  cost: number
  vendor: string | null
  completed: boolean
  performed_on: string
  created_at: string
}

/** One row of public.vehicle_economics — margins computed in Postgres. */
export type VehicleEconomics = {
  id: string
  owner_id: string
  make: string
  model: string
  year: number
  mileage_km: number
  body_type: string | null
  status: VehicleStatus
  acquired_on: string
  sold_on: string | null
  acquisition_price: number
  asking_price: number | null
  sold_price: number | null
  notes: string | null
  recon_total: number
  cost_basis: number
  realised_margin: number | null
  projected_margin: number | null
  days_in_stock: number
}

export type DashboardStats = {
  fleet_count: number
  capital_deployed: number
  recon_spend_total: number
  realised_margin_total: number
  sold_count: number
  avg_days_in_stock: number
}

export type MonthlyPerformance = {
  month: string
  acquired_count: number
  sold_count: number
  realised_margin: number
}

export type ReconByCategory = {
  category: ReconCategory
  total_cost: number
  job_count: number
}
