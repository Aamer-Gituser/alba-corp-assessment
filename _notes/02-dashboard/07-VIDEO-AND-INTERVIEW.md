# 07 · Task 02 walkthrough and interview preparation

Record only after the verified release exists. This is a conditional beat sheet, not permission to claim unbuilt features. Speak naturally; understand each explanation rather than memorize it.

## Four-minute walkthrough

| Time | Screen/action | Suggested words |
|---|---|---|
| 0:00–0:20 | Overview after login | “This is Forecourt, a used-car inventory and preparation dashboard. It shows what each car cost to buy and prepare, and how much is left against its asking or selling price.” |
| 0:20–0:45 | Correct KPI cards and two charts | “These totals are computed in Postgres. Stock cost basis covers unsold cars; preparation cost is all time. The monthly chart shows contribution on cars sold, before fees and overheads.” |
| 0:45–1:30 | Open a car, add/edit a recon job, return to overview | “This job changes the vehicle's recorded cost and projected margin. I can correct its cost or category without deleting it. The same calculation feeds the detail and dashboard.” |
| 1:30–1:50 | Modal, mobile view; profile if shipped | “Forms keep input on a failed save. On a phone, the inventory keeps the useful numbers and actions. The account settings update the dealership name shown here.” |
| 1:50–2:45 | Diagram/view definition and corrected proof result | “Each dealership is one user in this version. Row-level policies apply even to direct API calls. The analytics view uses the caller's permissions. I test successful own-data operations as well as denied access to another user's known rows and exact aggregate totals.” |
| 2:45–3:10 | Realtime only if verified; otherwise data correctness | “A change here updates the other tab through an authorized private channel.” OR “I kept the scope to reliable CRUD and secure server analytics; realtime was deferred.” |
| 3:10–3:40 | One genuine issue, from actual build log | “The KPI function returned an array and I initially treated it as an object. Type assertions hid that mismatch. I fixed the response contract and checked empty and failed responses too.” Use only if this was actually fixed and understood |
| 3:40–4:00 | README limitations/time and closing app | “The main shortcuts are one user per dealership, no receipt uploads, and the documented concurrency/data-size limits. My actual time was [recorded value]. The repo includes setup, the schema and verification evidence.” |

Do not say a currently broken screen works. If profile, mobile or realtime does not ship, replace that beat with verified functionality. Exact times are flexible; no invented production results.

## Proud point — strongest honest version

Use **correct data plus testable isolation**, not one magic SQL setting alone:
“I put the calculation and ownership rules in the database, and I checked the returned values independently. The test fails on missing fixtures and API errors, and confirms the other account's rows are unchanged.”

If a before/after RLS-script repair is part of the actual work, explain why accepting a null count as zero or a skipped test as PASS was wrong. This shows more understanding than simply displaying ten green lines.

Explain security_invoker precisely: default base-table access uses view-owner privileges; privileged ownership can bypass table RLS. Caller permissions avoid that problem here. Do not claim every default Postgres view always bypasses RLS.

## Genuine difficulty — choose from actual history

- KPI array/object mismatch visible in screenshot 1.
- Chart fragments split across CSS grid cells.
- Dialog success state causing reopen problems, if reproduced and fixed.
- SQL monthly fan-out, if you can show the separate aggregation and regression fixture.
- False-positive security proof, if corrected and rerun.

Do not use a palette-validation story unless its actual method/results are available and you understand them. Do not reconstruct a fictional difficulty after the fact.

## Recording preparation

- Use the tested deployment/revision and consistent fixture data.
- No passwords, tokens, email inbox, cloud secrets screens or unrelated desktop notifications.
- Pre-open detail, schema, correct proof output and README; use readable font/zoom.
- Demonstrate one complete workflow instead of clicking every control.
- Keep two windows only if realtime is shipped and proven.
- State only tests actually executed. A saved script or sample output is not a fresh test run.
- Check Loom playback/access signed out. README/source/live links must match the recorded version.

## Interview drill — answer in your own words

| Question | Substance of a good answer |
|---|---|
| What problem does this solve? | Preparation changes vehicle contribution; cost visibility matters before sale |
| Why two entities? | A vehicle has many separately editable jobs; real one-to-many and meaningful aggregation |
| Why Supabase? | SQL relationships, native RLS, Auth/Data API and brief fit; alternatives are valid |
| What caused NaN KPIs? | Table RPC returned an array; unchecked assertion claimed object shape |
| Why didn't TypeScript catch it? | as-casts and untyped client results can lie about runtime shape |
| How are totals calculated? | Acquisition + all recorded jobs; sold/asking price minus basis; clearly scoped time windows |
| Pending job versus paid cost? | Completed is work status; current model records costs without payment accounting |
| Why zero margin isn't empty? | Sales can break even or gains/losses cancel; sales count determines activity |
| What was monthly fan-out? | Joining two many-row sets multiplies rows; aggregate each month independently first |
| Why is the public key public? | Identifies project access context; user JWT, grants and RLS restrict data; it is not elevated |
| USING vs WITH CHECK? | Existing rows versus new row state; explicit checks aid clarity; absent UPDATE check reuses USING |
| Why check child ownership on UPDATE too? | A valid own job can otherwise be moved to an unauthorized parent |
| Why security_invoker? | Apply caller privileges/policies through the analytics view |
| What makes the proof credible? | Known fixtures, own-operation positive controls, exact errors/results, before/after and all RPC totals |
| Why is null mutation count insufficient? | Count may not have been requested; null says nothing about affected rows |
| How is profile edit authorized? | Verified user ID scopes update and profile RLS enforces own row |
| What does middleware do? | Session refresh/navigation; actions and database still need independent authorization |
| How does realtime stay safe? | Explain actual implemented event/channel policy; acknowledge deleted-record caveat if Postgres Changes remains |
| What happens on network failure? | Unavailable/error with preserved input; no fake empty data or false success |
| What happens with two simultaneous editors? | Current disclosed last-writer-wins unless revision check implemented; no claim of conflict protection |
| What breaks at scale? | Unbounded inventory/aggregate query work and event fanout; paginate/measure before inventing infrastructure |
| What did AI do? | Describe actual assistance and your validation; don't claim sole authorship of decisions you cannot defend |
| What would you do next? | Based on real limits: stronger concurrency, pagination, receipt access policies, team model and CI proof |
| How long did it take? | Actual ledger, including known earlier work; disclose unknowns and overruns |

## Submission and later preparation

After strict verification: complete Task 02 live/repo/build-log/access links, include honest limitations and actual selected advanced features, then check every link before Submit locks the form. The brief permits a public or reviewer-shared repo and marks video optional in the form.

For interview preparation after submission, pin the submitted revision and keep examples from it. Rehearse the workflow, architecture diagram, KPI fix, one security test and trade-offs without reading. Post-submission improvements must not be described as features of the submitted revision.
