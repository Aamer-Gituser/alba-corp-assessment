# 07 · Video Script & Interview Drill

The brief: *"A quick video where you demo it and talk through one part you're proud
of and one part that fought you. It's the fastest way for us to trust that you get
how it works."*

That sentence is the whole assessment in miniature. The video is a **comprehension
check**, not a product demo.

---

## Part 1 — Video script (~4 min, Loom)

Record in one take if you can. A small stumble sounds human; a polished read sounds
rehearsed by someone who didn't build it. **Speak from the beats, don't read the
lines.**

### Beat 1 · What and who (0:00–0:25)
> "This is Forecourt, an inventory dashboard for a used-car dealer. A dealer buys a
> car at auction, spends money getting it ready to sell, then lists it. Between
> those steps the real margin moves, and most spreadsheets lose track of it. This
> answers three things: what's my capital tied up in, what is preparation actually
> costing me, and did the cars I sold earn what I thought they earned."

*Screen: the overview, signed in.*

### Beat 2 · The data model (0:25–1:00)
> "Two related entities. A vehicle, and the reconditioning jobs against it — one to
> many, cascade on delete so costs can't be orphaned. Both scoped to an owner."

*Screen: `0001_init.sql`, scroll through the two tables.*

> "The status field has a check constraint: a car can only be 'sold' if it has both
> a sale price and a sale date. That's there because the margin maths silently goes
> wrong otherwise."

### Beat 3 · Live demo (1:00–2:10)
*Do it, don't narrate it.*
1. Open a car → point at the cost-stack bar:
   > "Black is what I paid, orange is what I've spent preparing it, green is what's
   > left against the asking price. Margin is a gap you can see."
2. Add a reconditioning job — 1,200 on bodywork
3. Watch the stack widen, the KPI move, the category chart move
4. Back to the list → edit a car to `sold` → the margin chart updates

### Beat 4 · Realtime (2:10–2:35)
*Two tabs side by side.* Edit in the left, do not touch the right.
> "Both tables are on Supabase's replication publication, and realtime evaluates
> RLS before it delivers — so you only ever get woken up by rows you could already
> read."

### Beat 5 · The part I'm proud of (2:35–3:25) ← the scoring moment
*Screen: the view definition in the SQL.*

> "The analytics don't run in the browser. There's a view that computes cost basis
> and margin per car, and three functions that aggregate for the charts — so the
> page fetches a handful of rows instead of the whole inventory.
>
> But here's the part I'm actually proud of. A Postgres view runs with the
> privileges of whoever **created** it by default. So this view — the one object
> that has every dealership's economics in it — would have bypassed row level
> security completely and leaked all of it. It's created with
> `security_invoker = on`, which makes it run as the caller instead, so the table
> policies still apply.
>
> And I didn't just assert that." *(run `npm run verify:rls`)* "This signs in as
> dealer A with the public key a browser has, then tries to read, update and delete
> dealer B's rows. Every one comes back empty. Row seven is the one that matters —
> that's the view. If I'd left the default, that row would show B's numbers."

### Beat 6 — The part that fought me (3:25–3:50)
**Fill this in truthfully from the build log.** Do not invent a struggle; a real
one is obvious and a fake one is obvious.

Likely candidates, use whichever actually happened:
- The first teal failed the palette validator's chroma check — it read as grey, so
  the "margin" colour had to be re-picked against the contrast maths, not by eye
- Getting the view to respect RLS at all (this is the genuine trap)
- Cookie handling between middleware and Server Components
- Making the month buckets line up when a car is bought in one month and sold in another

### Beat 7 · Limitations, plainly (3:50–4:10)
> "What I left out: file storage for receipts, because it wasn't worth the time-box
> against the three features I did build. There's no pagination — fine at twenty
> cars, not at two thousand. And a dealership is one user right now; a real one
> would need a team table. All of that's in the README."

*The brief says owning this raises the score. Say it without hedging.*

---

## Part 2 — Interview drill

I will ask these before you submit. If an answer isn't yours yet, we go back over
that part of the code until it is.

### The security boundary — most likely area of questioning

**Q: What is RLS, in one sentence?**
A predicate Postgres attaches to every query on a table, so the database itself
decides which rows this user is allowed to see — not the application.

**Q: The anon key is in the browser. Isn't that a hole?**
No, it's public by design. It identifies the project, it doesn't authorise
anything. Authorisation comes from the user's JWT, and RLS evaluates that per
query. Someone can take the key and hit the REST API directly and still get only
their own rows.

**Q: So what does the middleware actually protect?**
Nothing, security-wise. It refreshes the session cookie and redirects signed-out
visitors — that's convenience. If you deleted it, the data would still be safe;
you'd just get empty pages instead of a redirect.

**Q: Why `security_invoker` on the view?**
Because the default is the opposite, and the default would have leaked everything.
A view normally executes with its creator's privileges, so RLS on the underlying
tables doesn't apply. `security_invoker = on` makes it execute as the caller, so it
does.

**Q: You used SECURITY DEFINER on one function. Isn't that a contradiction?**
It's the one place it's correct. The signup trigger writes a profile row before the
new user has a session, so it can't run as them. It's pinned with
`search_path = ''` so nothing on the caller's path can hijack the names inside it.

**Q: USING versus WITH CHECK?**
`USING` filters which existing rows an operation may touch. `WITH CHECK` validates
what the row is allowed to become. An UPDATE needs both — without WITH CHECK a user
could edit their own car and reassign it to someone else's `owner_id`.

**Q: How do you know it works?**
There's a script. It signs in as one dealer and tries eight breaches against the
other's data. Output's in the README.

### Architecture

**Q: Why Supabase over Convex or Appwrite?**
Mainly that the security model is ordinary Postgres, so I can show the policy, run
a script that attacks it, and show the refusal. Convex gives realtime more cheaply
but the data layer is proprietary — "trust the config" instead of "here's the
predicate". Appwrite's per-document permissions are harder to reason about at a
glance.

**Q: Where does the client/server line sit?**
Reads in Server Components, writes in Server Actions, and the only client-side
Supabase use is the realtime socket. So the auth cookie is attached to every query
and RLS applies everywhere by construction.

**Q: Why aggregate in the database?**
Two reasons. The payload stays flat as inventory grows — three small RPC results
instead of every row. And the definition of "margin" lives in one place, so two
components can't drift into disagreeing about it.

**Q: Is the UI optimistic?**
Clearly-handled rather than fully optimistic — the brief allows either. Every
submit has a pending state and inline errors, and realtime re-renders after the
write. A full optimistic cache on top of a realtime subscription adds
reconciliation bugs I didn't think were worth it in a three-hour build. It's in the
build log as a conscious trade-off.

**Q: What breaks first at scale?**
The inventory list — no pagination, no virtualisation. Around a few hundred rows
I'd add cursor pagination. The aggregates are fine much longer because they're
already server-side.

### Product & process

**Q: Why this topic?**
Alba buys and sells used cars, so I built something for that. It also gives two
genuinely related entities and money data worth charting, rather than a
relationship invented to satisfy the brief.

**Q: What did you cut, and why?**
File storage for receipts. It was the fourth advanced option and I'd already done
three; doing it badly would have cost more than leaving it out honestly.

**Q: How much of this did AI write?**
Most of the typing. The decisions are mine and I can defend each one — the schema
shape, the constraint on sold cars, `security_invoker`, aggregating server-side,
skipping file storage. *(Be straightforward here. The brief explicitly permits AI;
pretending otherwise is the only wrong answer.)*

**Q: What would you do next?**
Receipts in storage with a bucket policy mirroring the RLS rules, a dealerships
table so a lot can have staff, cursor pagination, and promoting the RLS script into
CI so the boundary is re-proven on every push.

---

## Recording checklist

- [ ] Seeded data present, so charts aren't empty
- [ ] Two browser windows pre-arranged for the realtime beat
- [ ] Terminal ready on the `verify:rls` command
- [ ] SQL file open at the view definition
- [ ] Notifications off, clean desktop
- [ ] Loom sharing set to anyone-with-link, then tested in incognito
