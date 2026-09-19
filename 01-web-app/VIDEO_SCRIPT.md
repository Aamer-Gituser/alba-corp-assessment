# Video Script — Task 01: Apogee

**Total target:** 3–4 minutes  
**Format:** Screen recording with voiceover

---

## Recording Checklist (do before pressing record)

- [ ] Open incognito window at the live Vercel URL
- [ ] DevTools closed (open when needed, not at start)
- [ ] Browser zoom at 100%
- [ ] Mic tested, notifications silenced
- [ ] Prepare a date to jump to: `1969-07-20` (Moon landing day)
- [ ] Prepare a video date: `2023-11-27` (or any recent video entry)
- [ ] Have DevTools → Network tab ready to open

---

## Beat Sheet

### [0:00 – 0:20] Hook & intro

> "This is Apogee. Every day since June 1995, NASA has published one photograph of the universe. This app lets you travel to any date and see the one from that day."

_Scroll slowly down the current page — show the plate developing into a sharp image._

> "Notice the image — it arrives dark and grainy, like a plate in a developing bath, and resolves into the photograph. That's the loading state. There's no spinner. I'll show you why in a moment."

---

### [0:20 – 1:05] Live demo

**Step 1 — Jump to a specific date**

> "Let me navigate to July 20th, 1969 — the day of the Apollo moon landing."

_Click the date input in DateNavigator, type `1969-07-20`, press enter._

> "The URL changed to `?date=1969-07-20`. That's a shareable link — bookmark it, send it to someone, it always loads this exact plate."

**Step 2 — Previous/next navigation**

> "I can step forward and backward. Each navigation is a new URL, so browser history works normally."

_Click prev and next a couple of times._

**Step 3 — Random plate**

> "Random drops me into a random date in the 30-year archive."

_Click Random ×2._

**Step 4 — Load earlier plates**

> "Below the focal plate is the preceding grid. I'll load more."

_Scroll down, click "Load earlier plates"._

> "12 more cards appeared. Each one links to that date."

---

### [1:05 – 2:05] The part I'm proud of: the BFF

> "Here's what I'm most proud of — open DevTools, go to Network, filter by `nasa.gov`."

_Open DevTools → Network → filter `nasa.gov`._

> "Nothing. The browser makes zero requests to NASA. All data comes from our own `/api/apod` endpoint."

_Show the request to `/api/apod` in the Network tab._

> "The reason: `src/lib/nasa.ts` starts with `import 'server-only'`. That's not just a naming convention — if you accidentally import that module from a Client Component, it's a build error. The API key is structurally incapable of reaching the browser."

> "There are two cache TTLs. A photograph from 2011 will never change, so I cache it for a year — `revalidate: 31536000`. Today's plate might still be published or revised, so it gets 15 minutes. That's the dual-TTL cache, and it's what keeps the app inside NASA's rate limit under normal traffic."

> "If NASA returns 429 — rate limited — there's exponential backoff with jitter and up to 3 retries. The `Retry-After` header is honoured."

---

### [2:05 – 2:45] The part that fought me: Eastern time

> "The hardest bug was silent. I called `new Date().toISOString().slice(0,10)` to get 'today' — the most natural thing to do. But NASA publishes on US Eastern time. In UTC+4, the UTC date is already tomorrow. Requesting a future date returns 404."

> "The fix is `Intl.DateTimeFormat` with `timeZone: 'America/New_York'`. One line, but it took a failed request to spot. I've documented it in the build log and the README's API quirks section."

---

### [2:45 – 3:10] States demo

> "Let me show the states. Throttle the network to Slow 4G."

_DevTools → Network → throttle to Slow 4G, navigate to a new date._

> "The plate arrives undeveloped — dark, grainy, with a safelight sweep — and then resolves. That's the same animation as the initial load, so it reads as one continuous exposure."

_Go offline in DevTools, click "Load earlier plates"._

> "Offline: inline alert, no crash, the existing plates stay."

_Restore network, remove throttle._

---

### [3:10 – 3:30] Limitations & what's next

> "Honest limitations: no end-to-end tests, the 'load earlier plates' button doesn't do windowed scroll so the DOM grows indefinitely, and there's no offline support."

> "What I'd do next: add virtual scrolling with `react-window`, a keyboard shortcut to jump to a date, and a 'plate of the day' email with the video script running on a cron in n8n — which is actually Task 3 of this assessment."

> "Code is at `github.com/Aamer-Gituser/alba-corp-assessment`."
