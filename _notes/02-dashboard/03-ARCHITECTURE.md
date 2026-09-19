# 03 · Architecture

Satisfies brief doc requirement C1 (backend choice) and the Technical Judgment
dimension. This is the file to re-read before the interview.

---

## 1. Where the client/server line sits

```
Browser                          Vercel (Next.js)                 Supabase
───────                          ────────────────                 ────────
                                 middleware.ts
  request ───────────────────▶   refresh session cookie
                                 redirect if signed out
                                        │
                                 Server Component
                                 createClient() bound  ──────────▶  Postgres
                                 to request cookies                 RLS evaluates
                                        │                           auth.uid()
  HTML (already has data) ◀──────  render                ◀──────── only own rows
                                        
  form submit ──────────────▶   Server Action
                                 validate with zod
                                 supabase.insert() ────────────▶   RLS re-checks
                                 revalidatePath()                  WITH CHECK
  updated HTML ◀─────────────         │

  Realtime socket ◀──────────────────────────────────────────────  replication
  router.refresh()                                                 (RLS filtered)
```

**Reads** happen in Server Components. **Writes** happen in Server Actions.
**The only client-side Supabase usage is the Realtime subscription.**

## 2. Why Supabase

| Candidate | Verdict |
|---|---|
| **Supabase** ✅ | The brief names it as their recommended pick "if you want to show off SQL and row-level security". Decisive factor: the security boundary is *demonstrable* — RLS is ordinary Postgres, so I can show the policy, run a script that tries to breach it, and paste the refusal. It also gives auth, realtime and RPC without adding a service |
| Convex | Realtime is cheaper out of the box and the function model is pleasant, but the data layer is proprietary. The thing this task rewards most — a security boundary you can prove in SQL — would have become "trust the permission config" |
| Appwrite | All-in-one and fine, but its document permissions are per-document metadata rather than a predicate on the table. Harder to reason about, harder to prove, and less to show |

## 3. Why the security boundary is in the database, not the app

The browser holds the **public anon key** — that is by design, it is meant to be
public. So the honest question is: *what stops someone opening devtools, taking
that key, and calling the REST API directly?*

The answer must not be "the UI doesn't have a button for it". It is: **RLS**.
Every policy is a predicate Postgres applies to the query itself. A hand-rolled
`curl` with a valid session for dealer A returns dealer A's rows and nothing else.
Remove the middleware, bypass the UI entirely — the answer doesn't change.

This is why the middleware's redirect is described in its own comment as
*convenience, not security*.

## 4. Key decisions and the alternatives considered

| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Where aggregation runs | Postgres view + RPC | Fetch rows, sum in React | The brief offers "server-computed analytics" as an advanced option, and it's the right call anyway: payload stays flat as inventory grows, and the margin definition lives in one place instead of being re-implemented per component |
| View security | `security_invoker = on` | Default (definer) | Default would silently bypass RLS and leak every dealership's economics through the analytics view. This is the single highest-value line in the migration |
| Mutations | Server Actions | Route handlers + fetch | Fewer moving parts, no hand-written API surface, and `revalidatePath` keeps the server-rendered page truthful after a write |
| Feedback on write | `useActionState` pending + inline errors | Full optimistic cache | The brief allows "optimistic **or** clearly-handled". With realtime already re-rendering, a full optimistic layer would add reconciliation bugs for no visible gain in a 3-hour build. Documented as a conscious trade-off |
| `owner_id` | DB default `auth.uid()` | Set it client-side | The client never gets to name an owner. Even a malicious payload can't forge one, because the INSERT policy re-checks it |
| Validation | zod in the Server Action, mirroring the DB CHECKs | Trust the database | The DB is the real guarantee; zod exists to turn a Postgres constraint violation into a sentence a human can act on |
| Type safety | Hand-written row types | `supabase gen types` | Generating requires the CLI logged into the project. Hand-written types are small here and keep setup-from-zero to one SQL paste |

## 5. Failure behaviour

| Failure | Behaviour |
|---|---|
| Not signed in | Middleware redirects to `/login` before any data call |
| Session expired mid-session | Middleware refreshes the cookie; if refresh fails, redirect to login |
| Validation failure | Inline message above the submit button; form keeps its values |
| Constraint violation (e.g. sold car with no sale date) | Caught by zod first with a readable message; the DB CHECK is the backstop |
| Supabase unreachable | Route-level `error.tsx` with a retry action — never a blank screen |
| Realtime socket drops | Header indicator flips to "Offline"; the page still works, it just stops auto-refreshing |
| Empty account | Every list and chart has an empty state written as a next action, not "No data" |

## 6. Performance notes

- Server Components mean no client-side fetch waterfall; HTML arrives with data.
- Three RPC calls for the whole overview instead of downloading the inventory.
- Composite indexes lead with `owner_id` so the RLS predicate and the query
  predicate share one index.
- `auth.uid()` wrapped in a scalar subquery → one InitPlan per statement rather
  than a function call per row.
- Fonts via `next/font` (self-hosted, `display: swap`) — no render-blocking
  third-party CSS, no layout shift.

## 7. What I would do next with more time

1. File storage for purchase invoices and recon receipts, with a per-owner bucket
   policy mirroring the RLS rules.
2. Cursor pagination + a windowed list once inventory passes a few hundred cars.
3. Playwright coverage of the CRUD paths, and the RLS proof promoted into CI.
4. A `dealerships` table so several users can share one lot — today a dealership
   is a single user, which is the main simplification in the model.
