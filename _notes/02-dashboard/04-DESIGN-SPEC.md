# 04 · Design Spec

Covers brief core requirement A3 ("a beautiful, fluid UI") and the Product Quality
& Polish 25%.

---

## 1. Direction: "auction catalogue, not admin panel"

The reference isn't a SaaS dashboard, it's the paperwork of the trade — auction lot
sheets, windscreen stock cards, instrument clusters. Three consequences:

- The page is **printed stock**, not a dark app chrome.
- Numbers are **instruments**: aligned, monospaced where they're compared.
- Structure comes from **stock numbers**, because real dealers number inventory —
  the numbering carries information rather than decorating the layout.

**Deliberately avoided:** the three looks current AI design defaults to — warm cream
+ high-contrast serif + terracotta; near-black + one acid accent; broadsheet
hairlines with zero radius. The palette below is cool, not warm, for exactly this
reason.

## 2. Colour tokens

| Token | Hex | Used for |
|---|---|---|
| `paper` | `#EDF0F3` | Page background — cool catalogue stock |
| `paper-edge` | `#DCE1E8` | Track behind the cost-stack bar |
| `surface` | `#FFFFFF` | Cards, inputs, tooltips |
| `ink` | `#10161D` | Text; the "bought" portion of every bar |
| `ink-soft` | `#5B6673` | Secondary text |
| `ink-faint` | `#8D97A3` | Labels, axis ticks |
| `signal` | `#E05A26` | **Money still at risk** — recon spend, losses, active nav marker. Indicator-lamp orange |
| `margin` | `#0B8F72` | **Money realised** — margin, sold, live indicator |
| `rule` | `#CCD4DE` | Hairlines |

**`margin` was chosen by running the palette validator, not by eye.** The first
candidate (`#0F6B5C`) FAILED the chroma floor at 0.083 — it would have read as grey.
`#0B8F72` passes all six checks: lightness band, chroma floor, CVD separation
(ΔE 9.8 protan against `signal`), normal-vision separation (ΔE 27.2), and ≥3:1
contrast against the surface.

**Discipline:** signal and margin are semantic, not decorative. Orange never means
"accent", it means money that hasn't been earned yet.

## 3. Type

| Role | Face | Usage |
|---|---|---|
| Display | **Archivo** 600–800 | Headlines; uppercase tracked labels (`.eyebrow`) that read like stamped lot-sheet headings |
| Body | **Inter Tight** 400–600 | All prose and UI text |
| Data | **IBM Plex Mono**, `tabular-nums` | Money and distances **in columns**, axis ticks, tooltips |

**Rule on figures:** tabular only where digits align vertically. KPI hero numbers
use the body sans with proportional figures — tabular at display size reads loose,
and a display/serif face on a hero figure reads as decoration.

## 4. The signature element — cost-stack bar

```
┌──────────────────────┬──────┬────────────┐
│ Bought               │ Recon│ Margin     │   ← one bar, three segments
└──────────────────────┴──────┴────────────┘
  ink                    signal  margin
```

Acquisition and reconditioning stack against the asking (or sold) price, so margin
is a **gap you can see** rather than a number to hunt for. When the cost basis
overruns the asking price, the margin segment disappears and an inline warning says
the car loses money at the current number.

Segments are separated by a 2px surface gap, never a border. Every segment carries
a `title` so the value is reachable on hover, and the same numbers are repeated in
the definition list below — colour is never the only channel.

## 5. Screens

### Login
Split: left is an ink panel carrying the thesis line and a miniature of the
cost-stack; right is the form. Demo credentials pre-filled so a reviewer can press
one button. Sign-in / create-account as tabs. Mobile: stacks, ink panel first.

### Overview
1. Header row: title + realtime Live/Offline indicator
2. Four KPI tiles — capital deployed · recon spend · realised margin · avg days in stock
3. Charts: margin by month · recon by category · bought vs sold
4. "Needs attention" — cars underwater on asking price, or ageing in stock

### Inventory
Filter row (status) above the list. Each row: stock number, car, status chip,
mileage, cost basis, projected margin. Click → detail. "Add vehicle" opens the form.

### Vehicle detail
Header with stock number and status · the cost-stack bar · economics figures ·
reconditioning jobs list with add / toggle-complete / delete · edit and delete
vehicle.

## 6. States — every list and surface has all four

| State | Treatment |
|---|---|
| **Loading** | Route-level skeletons that match the final layout's geometry — tiles, bar blocks, row stripes. Never a bare spinner. No layout jump when real content lands |
| **Empty** | Written as the next action, in the interface's voice: "No cars on the lot yet. Add the first one to start tracking margin." Never "No data" |
| **Error** | `error.tsx` boundary: what failed, what to do, a retry button. Errors don't apologise and are never vague |
| **Partial** | A car with no recon jobs still renders its cost stack; charts with no qualifying rows render an explanatory empty plot, not a broken axis |

## 7. Motion

| Moment | Treatment |
|---|---|
| First paint of a list | `deal-in` — 320ms, 6px rise, staggered. The only ambient motion |
| Realtime change from another tab | `live-mark` — a single signal-wash flash that settles in 1.4s. It exists to make the realtime feature *visible*, which is the point |
| Hover / focus | Colour transitions only, ≤150ms |
| `prefers-reduced-motion` | All animation and transition durations collapse to ~0 |

Restraint is deliberate: scattered effects are what make a UI read as AI-generated.
The boldness is spent on the cost-stack bar.

## 8. Responsive

| Breakpoint | Layout |
|---|---|
| ≥1024px | Max width 1152px. KPI tiles 4-up, charts 2-up |
| 640–1023px | Tiles 2-up, charts stack |
| <640px | Everything single column. Inventory rows become cards. 16px gutters. No horizontal scroll |

## 9. Accessibility floor

- Visible `:focus-visible` outline on every interactive element
- Semantic landmarks, one `h1` per screen, labelled form fields
- Status chips carry text, never colour alone
- Every chart has a `<details>` table view
- Errors use `role="alert"`, notices `role="status"`
- Contrast: body text ≥ 7:1, secondary ≥ 4.5:1, chart marks ≥ 3:1 against surface

## 10. Copy rules

Active voice, sentence case, no filler. Buttons name what happens
("Add vehicle", not "Submit"), and the confirmation uses the same word. The empty
state is an invitation to act. Failure text explains what happened and what to do —
it never apologises and never blames the user.
