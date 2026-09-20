# 04 · UI/UX repair and polish specification

Keep the current cool-paper/ink/orange/teal identity. It already suits the dealership domain. The screenshots need clearer grouping, usable forms and trustworthy data more than another theme.

## Screenshot diagnosis

| Screens | Visible issue | Target |
|---|---|---|
| 1 | undefined counts, NaN days and dash KPIs | Correct data contract; valid empty/error variants |
| 1–2 | Chart on left, detached table on right; no clear chart titles | Each plot + table inside one titled card |
| 3–5 | Clean inventory but few finding/navigation tools; ambiguous margin column | Search, counts and compact sorting; realised/projected label |
| 6/8/9 | Dialog aligned to top-left with oversized blurred backdrop | Centered bounded modal, predictable focus, sticky actions on small screens |
| 7 | Money figures repeated, no explicit target, neutral unknown looks semantic | One economics summary + asking/sold target + clear unknown action |

These desktop screenshots do not establish mobile, keyboard, focus, performance or login correctness.

## Layout direction

Use the existing top navigation; two primary destinations do not justify a permanent sidebar. Max content width about 1200px, 24px desktop gutters, 16px mobile. Header around 64px, responsive account menu on the right. A compact dealership label and initials button opens Profile/settings and Sign out.

Overview desktop:
```text
Forecourt   Overview   Inventory             Marina Motors  [Account]
Overview                          [Refresh] [Add vehicle]
Stock and preparation, in AED · as of <successful fetch>
[Stock cost basis] [Recorded recon] [Realised margin] [Avg stock age]
[Monthly realised contribution · last 6 months] [Recon costs · all time]
[plot + accessible table, one panel]             [plot + table, one panel]
[Vehicles bought vs sold · same 6 months, full width]
[Needs attention: reason · vehicle · days · margin · action]
```

Show no fabricated trend percentages or sparklines. Counts and scope captions explain the four KPIs. A range selector is unnecessary unless it actually changes all panels with clearly documented scopes.

## Chart panels

- One section/card per chart: h2, purpose/timeframe, plot, disclosure/table. The fragment children must not become independent grid cells.
- White surface, 20–24px padding, subtle border, 8px radius, stable 240px plot height desktop/200px mobile.
- Title examples: “Realised contribution” / “Last 6 months · AED”; “Preparation costs” / “All time · recorded costs”; “Stock movement” / “Vehicles bought and sold”.
- Accessible table remains inside that card; headers/caption and exact values are available by keyboard/touch.
- Zero net margin with sales shows a zero bar/table, not “No sales”. Loss bars extend below an explicit zero line and use loss text/colour.
- Zero-cost jobs retain their count and a truthful zero; no-work and free-work are different states.
- Use token colours in charts rather than duplicated constants. Tooltips use the same money/date formatting as tables.
- Do not animate an entire chart again on every subscription event. Respect reduced motion in Recharts props, not only CSS.

## Inventory

Header: title, total/matching count and Add vehicle. Toolbar: labelled search by make/model, status filters with counts, sort by newest acquisition/oldest stock/margin where supported, Clear filters.

Encode allowed filters/sort/query in URL. Debounce search 250–300ms; preserve focus and use a subtle pending indicator. Server filtering must cover the loaded dataset; do not search only a truncated client list while claiming complete results. Add stable id tie-break ordering.

Columns: vehicle (stock reference below name), status, age, mileage, cost basis, margin with Actual/Projected label. Amounts right-aligned and tabular. Hover and focus-within make the vehicle link obvious; avoid fake clickable rows with no keyboard behavior.

On phones use stacked vehicle cards showing name/status/age and cost/margin, not a compressed six-column table. Add result-empty guidance and Reset filters distinct from an empty dealership's Add vehicle action.

Back from detail restores status/search/sort using an allowlisted inventory query. A three-row result legitimately leaves whitespace; do not fill it with decorative cards.

## Vehicle detail

Breadcrumb/back, stock reference, title and status, facts, Edit and a secondary destructive action. One economics card:
- Asking price for unsold / Sold price for sold.
- Acquisition, recorded recon, cost basis and projected/realised contribution shown once.
- Cost stack with a small legend; mark target when meaningful.
- Missing asking price: neutral “Not set” and “Set asking price” action; not orange loss or green gain.
- Loss: “Asking price is AED X below recorded cost” or “Sold AED X below recorded cost,” matching state.
- All amounts expose cents; the bar never invents positive width for loss.

Jobs section: count, recorded total, pending count and Add job. Each row/card offers Edit, desired completion state and labelled Delete. Completed work gets a text state, not colour alone. Empty state includes Add first job. Notes preserve line breaks.

Avoid adding photos just to fill space: receipt/photo storage is outside scope.

## Shared form/dialog behavior

Use one native dialog wrapper for vehicle/job/profile forms. Explicit centering (inset: 0; margin: auto), width min(100% minus 32px, 560px), max-height calc(100dvh minus 32px), overflow-y:auto. Native showModal provides modality; do not assume Tailwind preserves user-agent centering.

Desktop: comfortable two-column facts; mobile: single column. Name the dialog with aria-labelledby and a unique heading ID. Close is a 44px target. Escape, focus containment, initial focus, focus return and background scroll behavior are tested. A medium opaque scrim is enough; heavy full-page blur is unnecessary and can cost performance.

Group fields into Vehicle / Purchase / Listing or sale; don't shout every label in widely tracked capitals. Normal text labels about 13–14px; reserve small uppercase for compact section markers.

Bottom actions: Cancel + Add/Save, sticky when the content scrolls. Required markers have textual explanation. Field-level errors are linked with aria-describedby and aria-invalid; focus first invalid field. Preserve values after server validation errors.

Mount/reset the form for each open cycle so a previous success cannot auto-close the next opening. Cancel discards safely; if dirty, ask “Discard changes?” within the dialog. While save is pending, prevent duplicate submission and ambiguous closure. Successful save closes, restores focus and announces confirmation once.

Vehicle delete confirmation names the car and number of jobs removed; job delete names the job. Don't provide “Undo” unless a real reversible mechanism exists.

## Profile/settings — requested enhancement

Header account menu → /settings. Two fields: Display name, Dealership name. Email is read-only with an explanation; initials are generated from the name, no upload service.

Save changes and Cancel; dirty indication, pending, inline error and success. On save, header dealership updates immediately and data persists after reload. Do not reset input during realtime updates. Changing passwords/email is a distinct auth workflow and is not implied by this profile form.

## Login

Keep recognizable branding but shorten the dark marketing block on mobile so the form appears immediately. Plain sign-in title, labelled email/password, show/hide password, autocomplete, pending state and helpful service-error copy.

Use a bright focus ring on the dark panel. Remove the unproven “prefilled” claim and database/security implementation copy from the product flow; reviewer technical details belong in README/video. If signup remains, give it independent form/action state and truthful confirmation messaging. No dead forgot-password link.

## Tokens and typography

| Token | Value | Role |
|---|---|---|
| paper / surface | #EDF0F3 / #FFFFFF | Page / panels |
| ink | #10161D | Primary text |
| ink-soft | #5B6673 | Secondary text (about 5.11:1 on paper) |
| ink-faint | #5F6975 | Current repaired labels; measure all actual backgrounds |
| signal / margin | #E05A26 / #0B8F72 | Chart fills, not small text |
| signal-text / margin-text | #B8420F / #08725B | Semantic text variants |
| rule | #CCD4DE | Decorative separation; not sole focus/input affordance |
| focus | ink on light, white on dark | Visible focus with offset |

The original #8D97A3 had about 2.59:1 contrast on paper. Orange/teal fills are about 3.24/3.54:1 and should not be small text. Global tokens were repaired, but CostStack still needs the text variants. Do not repeat colour-vision validation claims without the actual method/output.

Keep Archivo for headings, Inter Tight for body and IBM Plex Mono for aligned figures; reduce loaded weights if measured cost warrants it. Body 14–16px, page title 26–30px, KPI 28–32px. Do not make every label 11px. Grid spacing 8/16/24/32; radius 8px consistently, not a mixture of arbitrary shapes.

## Motion, accessibility and performance acceptance

- Micro-feedback 120–180ms; dialog opacity/6px translate 160–200ms. No height/width animation or decorative scroll effects.
- Limit initial row stagger to first 6–8 rows and at most ~200ms total delay. Do not replay on filter/realtime refresh.
- Reduced-motion turns off CSS and chart JS transitions.
- Meaningful controls at least 44px target; skip link, semantic landmarks, one h1, visible focus and normal text contrast >=4.5:1.
- Check 375/768/1440px, 200% zoom, long names/large amounts, keyboard and a screen reader smoke pass.
- Route-specific inventory/detail skeletons match their actual layout; don't show overview chart skeletons on every route.
- Capture production traces if jank is observed. Do not promise 60fps merely because transforms are used.
