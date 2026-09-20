# Build Log: Forecourt — Data Dashboard on a Backend Service

## Goal & scope decision

I built Forecourt, an inventory and margin dashboard for a used-car dealership. It tracks vehicles from acquisition through preparation and sale, so a dealer can see true cost basis, projected margin, realised margin, stock age, and preparation spend in one place.

The core data model has three related entities: `vehicles`, `reconditioning_jobs`, and `profiles`. The dashboard includes the full vehicle and preparation-job lifecycle, a dedicated analytics page, and a profile area.

I deliberately left out multi-user dealership teams, receipt attachments for every preparation job, and pagination. Those are sensible next steps, but would have reduced the quality of the CRUD, security, analytics, and responsive UI delivered here.

## Stack & tooling

| Layer | Choice | Why |
| --- | --- | --- |
| Application | Next.js 16 App Router + TypeScript | Server-rendered reads, typed forms, and Server Actions keep the app structure small and explicit. |
| Backend | Supabase: Postgres, Auth, RLS, Realtime, Storage | It provides relational data, isolated access policies, live updates, and avatar storage in one service. |
| Validation | Zod | Provides readable validation before database writes. |
| UI | Tailwind CSS v4 + design tokens | Supports a responsive, consistent visual system without a large component dependency. |
| Visualisation | Recharts | Provides accessible SVG charts with a tabular fallback. |
| Icons | Lucide React | Small, consistent interface icons. |
| Verification | ESLint, TypeScript compiler, production build, browser checks, RLS script | Covers code quality, production compilation, key routes, and the security boundary. |

## Key decisions & trade-offs

- **Decision: Supabase over a custom API layer** because the brief requires a BaaS and the data is relational. Auth cookies, SQL policies, storage, and realtime subscriptions work together without duplicating backend code. Alternative considered: a separate REST API, which would add setup without improving the submission.

- **Decision: a `vehicle_economics` view with `security_invoker = true`** because vehicle cost basis and margins belong in the database. `security_invoker` ensures the view applies the caller's RLS rules instead of bypassing them.

- **Decision: database RPCs for analytics** because the overview and analytics pages need summaries, not raw record sets. `dashboard_stats`, `monthly_performance`, and `recon_by_category` aggregate in Postgres before data reaches the browser.

- **Decision: Server Components for reads and Server Actions for writes** because authenticated reads and mutations share the same cookie-backed Supabase client. The only browser-side database client is the realtime subscription.

- **Decision: live refresh after database events** because it keeps server-rendered data consistent across open sessions. The trade-off is a full route refresh rather than an optimistic local cache update.

- **Decision: responsive liquid-glass navigation and cards** because the dashboard has dense financial information. Effects use short transitions and lightweight layers so the interface stays responsive on everyday hardware.

## Hard parts / dead ends

- **RLS-safe analytics view:** a Postgres view can otherwise expose rows outside the expected policy boundary. The solution was `security_invoker = true` and a dedicated breach-attempt check for the view.

- **Monthly aggregation fan-out:** joining bought and sold rows before aggregating can multiply totals in months with both kinds of activity. The final function aggregates each set in its own CTE, then joins the small aggregated results to the month series.

- **Server/client component boundary:** passing an icon component from a server layout into a client navigation component caused a runtime error. Icon selection now happens inside the client navigation component, which avoids passing functions across that boundary.

- **Visual motion:** the first navigation surface used a costly blur effect. It was replaced with lighter layers, smaller shadows, and 140ms transitions for more immediate interaction.

## How I verified it works

- Ran `npm run lint` with no warnings or errors.
- Ran `npx tsc --noEmit --incremental false` with no TypeScript errors.
- Ran `npm run build` successfully; all eight routes compile in the optimised production build.
- Started the optimised server with `npm run start` and checked Overview, Inventory, and Analytics with seeded authenticated data.
- Confirmed the navigation, inventory search field, status filters, table rows, charts, analytics performance lists, and responsive header render without browser console errors.
- Verified the vehicle and reconditioning-job CRUD paths through their forms, with server-side validation and handled feedback states.
- The repository includes `npm run verify:rls`, which performs ten cross-dealership breach attempts covering select, insert, update, delete, the economics view, and aggregate RPC access. Run it after seeding to repeat the security proof.

## Known limitations

- Inventory currently loads all accessible rows; cursor pagination should be added for large dealerships.
- One account represents one dealership. A production version would add dealership membership, roles, and invitations.
- Avatar upload demonstrates storage; receipts and photos for individual preparation jobs are not implemented.
- Realtime refreshes the current server-rendered route after a change. This is reliable at the current scale, but targeted cache updates would be better for high write volume.
- Demo setup uses email/password accounts with email confirmation disabled for easy reviewer access. Enable confirmation before a public launch.

## Time spent

| Phase | Approximate time |
| --- | ---: |
| Schema, policies, data view, and analytics functions | 50 min |
| Auth, vehicle CRUD, and preparation-job CRUD | 55 min |
| Overview, inventory, detail, analytics, and profile pages | 70 min |
| Responsive visual system, motion, and accessibility polish | 30 min |
| Seed data, automated RLS verification, production checks, and documentation | 35 min |
| **Total** | **~4 h 20 min** |

## Reviewer quick start

```bash
npm install
cp .env.example .env.local
# apply supabase/migrations/0001_init.sql and 0002_profile_fields.sql
npm run seed
npm run dev
```

Demo credentials and full setup details are in [README.md](./README.md).
