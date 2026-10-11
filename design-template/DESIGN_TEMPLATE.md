# One App Training — Frontend Design Template

A complete, portable spec of the UI in this repo, written so another team can
rebuild the **exact same interface** in a larger, backend-driven project.

This is a *design + composition* contract, not a code dump. Everything here was
read off the working app (`src/styles.css`, `src/components/training/*`), so
following it reproduces the same pixels.

**What this app is:** a guided simulator. The learner sees a fake but
pixel-faithful copy of a field-sales mobile app inside a phone frame, with a
"teacher" panel beside it. Level 1 lets them tap anything and get a plain-words
explanation. Level 2 walks them through one real task (place a sales order),
pulsing the single correct target and rejecting wrong taps.

---

## 1. Stack baseline

| Layer | Choice | Notes for the new project |
|---|---|---|
| Framework | React 19 | |
| Router | TanStack Router + TanStack Start (SSR) | Swap freely — no design depends on it |
| Styling | Tailwind CSS v4 (`@theme inline` CSS vars) | Keep v4 if you can; v3 fallback in `tokens.css` header |
| Components | shadcn/ui, `new-york` style, base colour `slate` | Only a thin slice is actually used — see §7 |
| Icons | `lucide-react` | Icon choice is part of the look; keep the same glyphs |
| Font | **Nunito** 400/600/700/800/900, Google Fonts | Non-negotiable. The rounded, heavy face *is* the brand |
| Motion | hand-written CSS keyframes + `tw-animate-css` | |
| Celebration | `canvas-confetti` | |
| Utilities | `clsx` + `tailwind-merge` via `cn()` | |
| Data fetching | TanStack Query (present, unused) | Already wired in the root — use it for the real backend |

Font link, exactly as used:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" />
```

---

## 2. Design tokens

Copy `./tokens.css` in whole. It is the single source of truth for colour,
radius, type family, and the two coaching animations.

### Palette intent

| Token | Role | Where it appears |
|---|---|---|
| `navy` | Primary brand / ink | Phone bezel, status bar, every heading, activity-tile top half, mobile instruction banner, modal scrim (`navy/60`) |
| `teal` | Action | Primary CTAs, stat chips, inline data values, icon accents, focus ring, "Your Teacher" eyebrow |
| `mint` | Achieved / tag | Focus-area pills, territory pills, Level-1 progress fill, "ready for Level 2" button |
| `soft-blue` | Tinted panel | Grouped sections, list rows, activity-tile label strip, product picker body, meter troughs |
| `highlight` (amber) | Coaching | `.pulse-target` outline + glow, hint strip (`highlight/40`) |
| `destructive` | Danger | Notification badge, discard button |
| `muted` / `muted-foreground` | De-emphasis | Form section backgrounds, small labels |
| raw `blue-500` | Final commit | **Only** the Submit Sales Order button |
| `emerald-*` / `amber-*` | Status | Completed chips, success modal ring, wrong-tap toast |

**Rule of thumb:** navy carries structure, teal carries *do this*, mint carries
*this is already good*, soft-blue carries *these things belong together*, amber
carries *the teacher is talking to you*.

### Radius

Everything derives from `--radius: 1rem`. Observed usage:

- `rounded-lg` (16px) — inputs, small pills, form fields
- `rounded-xl` (20px) — action buttons, stat chips, activity tiles
- `rounded-2xl` (24px) — cards, sections, list rows, modals inside the phone
- `rounded-3xl` (28px) — teacher card, trainer overlay
- `rounded-[42px]` — phone frame only

### Typography

One family, carried by weight rather than size variety.

| Use | Classes |
|---|---|
| Screen H1 | `text-3xl font-extrabold text-navy` |
| Section H2 | `text-2xl font-extrabold text-navy` |
| Card title | `text-xl font-extrabold text-navy` |
| Row title / button label | `text-lg font-extrabold` |
| Body / data rows | `text-[15px] font-bold` |
| Small label | `text-sm font-bold text-muted-foreground` |
| Eyebrow | `text-xs font-extrabold uppercase tracking-widest text-teal` |
| Micro (banner kicker) | `text-[11px] font-bold uppercase tracking-wider` |

`font-extrabold` (800) is the default for anything a learner reads as a thing
they can act on. `font-bold` (700) is the *lightest* weight used anywhere in the
UI. There is no `font-normal` and no `font-medium`. This deliberate heaviness is
what makes it legible to low-literacy users on a cheap phone in daylight — do
not "fix" it by lightening weights in the new project.

---

## 3. Application shell

```
┌────────────────────────────────────────────────────────────────┐
│ bg-gradient-to-br from-soft-blue via-background to-white       │
│ min-h-screen                                                    │
│                                                                 │
│  [mobile only] sticky navy instruction banner  (lg:hidden)      │
│                                                                 │
│  mx-auto grid max-w-7xl gap-6 p-4                               │
│  lg:grid-cols-[minmax(320px,380px)_1fr] lg:p-8                  │
│  ┌────────────────────────┐  ┌───────────────────────────────┐  │
│  │ <aside hidden lg:block │  │ <main>                        │  │
│  │  sticky top-8>         │  │   PhoneFrame                  │  │
│  │                        │  │    └─ active screen           │  │
│  │   TeacherCard          │  │    └─ ProductPicker (absolute)│  │
│  │                        │  │   [mobile] controls row       │  │
│  └────────────────────────┘  └───────────────────────────────┘  │
│                                                                 │
│  fixed bottom wrong-tap toast  ·  fixed TrainerOverlay modal     │
└────────────────────────────────────────────────────────────────┘
```

Two coaching surfaces, mutually exclusive by viewport:

- **≥ lg** — teacher lives in the left sidebar as `TeacherCard`, sticky at `top-8`.
- **< lg** — teacher collapses to a sticky navy banner above the phone
  (`sticky top-0 z-30 border-b border-teal/40 bg-navy px-4 py-3 text-white
  shadow-lg`), plus a row of controls under the phone.

Both show the same state: level label, progress counter, current instruction.

### Phone frame

```
mx-auto w-full max-w-[420px] lg:max-w-[400px]
└─ relative overflow-hidden rounded-[42px] border-[12px] border-navy bg-white shadow-2xl
   ├─ status bar: flex h-6 items-center justify-center bg-navy text-[10px] font-bold text-white
   │  └─ notch: absolute left-1/2 top-0 h-4 w-24 -translate-x-1/2 rounded-b-2xl bg-navy
   └─ viewport: relative h-[720px] overflow-y-auto bg-white
```

Fixed `720px` viewport height, internally scrollable. The frame is the
single strongest visual signal that this is a *simulator* — a 12px navy bezel
with a notch reads as "phone" instantly without any skeuomorphic chrome.

On a real phone there is no frame: `PhoneFrameMobile` renders
`min-h-screen bg-white` and the simulated app fills the device. **Keep this
escape hatch** — a frame inside a frame is the single worst thing you can do to
this design on mobile.

---

## 4. The coaching layer

Four mechanisms. Everything pedagogical in this app is one of these four.

### 4.1 Pulse target — "touch this"

The only affordance that marks the correct next action. Applied by appending a
class, never by wrapping or re-styling:

```ts
const pulseIf = (active: boolean) => (active ? " pulse-target" : "");
// className={"...base classes..." + pulseIf(isActive)}
```

`.pulse-target` (see `tokens.css`) gives a 3px amber outline, an expanding glow
from 0 → 14px, a 1.03 scale breath on a 1.4s loop, and `z-index: 5` so it sits
above sibling cards.

**Exactly one element may carry `.pulse-target` at a time.** The whole Level-2
mental model collapses if two pulse at once.

### 4.2 Trainer overlay — "the teacher is talking"

Full-screen modal, the primary explanation channel.

```
fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm
└─ pop-in relative w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl ring-4 {toneRing}
   ├─ close: absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted
   ├─ icon: mb-3 text-5xl
   ├─ title: mb-3 text-2xl font-extrabold text-navy
   ├─ body:  text-lg leading-relaxed text-foreground
   └─ CTA:   mt-6 w-full rounded-2xl bg-teal py-4 text-lg font-bold text-teal-foreground
             shadow-md transition hover:brightness-110 active:scale-[0.98]
```

Tone drives only the `ring-4` colour:

| tone | ring | used for |
|---|---|---|
| `info` (default) | `ring-teal` | explanations |
| `warn` | `ring-amber-400` | the GPS/geofence gate |
| `success` | `ring-emerald-400` | level + mission completion |

Optional `after` callback fires 100ms **after** close, so navigation happens
once the modal is gone rather than behind it. CTA text is overridable
(`"OK, got it!"` → `"Start Level 2"` → `"Finish training"`).

### 4.3 Wrong-tap toast — "not that one"

Non-blocking, never punitive. Auto-dismisses at 2200ms.

```
pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4
└─ pop-in flex items-center gap-3 rounded-2xl bg-amber-100 px-5 py-4
   text-amber-900 shadow-xl ring-2 ring-amber-400
   ├─ 👉 (text-2xl)
   └─ text-base font-extrabold
```

Copy: *"Not quite! Tap the flashing button to continue your training."* — it
redirects attention to the pulse rather than naming the mistake.

### 4.4 Confetti — "you did it"

- **Level 1 → 2:** one burst, `{ particleCount: 120, spread: 80, origin: { y: 0.4 } }`
- **Mission complete:** 1.5s `requestAnimationFrame` loop firing two side
  cannons per frame — `{ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 } }`
  and the mirror at `angle: 120, origin: { x: 1 }`.

---

## 5. Teacher card (desktop sidebar)

`rounded-3xl bg-white p-6 shadow-xl ring-1 ring-border`

Header, always present:

```
flex items-center gap-3
├─ grid h-12 w-12 place-items-center rounded-2xl bg-teal text-teal-foreground
│  └─ <GraduationCap className="h-7 w-7" />
└─ ├─ text-xs font-extrabold uppercase tracking-widest text-teal   → "Your Teacher"
   └─ text-lg font-extrabold text-navy                             → "Hello {name}!"
```

Then one body per level, each inside `mt-5 rounded-2xl bg-soft-blue p-4`:

**Level 1 — Click & Learn**
- eyebrow: `<Sparkles/>` + `Level 1 · Click & Learn` (`text-sm font-extrabold uppercase text-teal`)
- `text-2xl font-extrabold text-navy` → "Tap around to learn!"
- `text-base font-semibold text-navy/80` body copy
- progress: label row `text-sm font-extrabold text-navy`, then
  `h-3 overflow-hidden rounded-full bg-muted` trough with
  `h-full rounded-full bg-mint transition-all` fill
- unlock button appears at ≥3 explored:
  `w-full rounded-2xl bg-mint py-4 text-lg font-extrabold text-mint-foreground shadow-md hover:brightness-105`

**Level 2 — Guided Mission**
- eyebrow: `<ArrowRight/>` + `Level 2 · Guided Mission`
- `text-xs font-bold text-navy/70` → "Step {n} of {total}"
- `text-2xl font-extrabold leading-snug text-navy` → the instruction
- hint strip: `rounded-lg bg-highlight/40 p-2 text-sm font-semibold text-navy`, prefixed `💡`
- progress: same trough, `bg-teal` fill

**Done**
- `rounded-2xl bg-emerald-50 p-4 ring-2 ring-emerald-300`, `<Trophy/>` eyebrow in `text-emerald-700`

Footer, always: `flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-extrabold text-navy ring-1 ring-border hover:bg-muted` with `<RotateCcw/>`.

---

## 6. Simulated-app screen patterns

These are the reusable pieces *inside* the phone. In the bigger project these
become the component library — one per pattern, data-driven from the backend.

### AppHeader (dashboard only)
`flex items-center gap-3 px-4 pt-4` — hamburger, avatar block, bell.
- avatar: `<UserCircle2 className="h-11 w-11 text-muted-foreground" />`
- name `text-lg font-extrabold text-navy`; role line `text-xs font-bold text-teal` with the ID in `text-navy`
- bell badge: `absolute -right-0 -top-0 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white`

### ScreenHeader (every inner screen)
`flex items-center gap-2 px-4 pt-5 pb-4` — back chevron (`h-7 w-7 text-navy`),
centred `flex-1 text-center text-xl font-extrabold text-navy` title, and a
spacer div to keep the title optically centred.

### Pill / tag
`rounded-lg bg-mint px-3 py-1.5 text-sm font-bold text-mint-foreground` (large
variant uses `text-lg` + `shadow-sm`). Used for focus area and territory values.

### MetricRow (percentage + meter)
```
text-sm font-extrabold text-navy          → title
text-2xl font-extrabold text-navy         → "0.00 %"
flex justify-between text-xs font-bold text-muted-foreground → "Scheduled" | "0/6"
h-2 rounded-full bg-soft-blue             → meter trough
```
Two per `rounded-2xl bg-white p-4 shadow-md ring-1 ring-border` card, in a
`grid grid-cols-2 gap-3`.

### Stat chip
`flex items-center justify-between rounded-xl bg-teal px-4 py-3 text-left
text-teal-foreground shadow-sm` — label `text-sm font-extrabold`, value
`text-lg font-extrabold`. Laid out `grid grid-cols-2 gap-3`.

### ActivityTile — the signature component
Two-tone vertical split. Navy icon plate over a soft-blue label strip:
```
flex flex-col overflow-hidden rounded-xl shadow-md transition active:scale-[0.98]
├─ flex flex-1 items-center justify-center bg-navy py-5 text-white   → icon h-9 w-9
└─ bg-soft-blue py-2 text-center text-sm font-extrabold text-navy    → label
```
`grid grid-cols-2 gap-3`. Long labels are truncated with an ellipsis character
in the data itself (`"Business Developm…"`), matching the real app.

### Menu row (list screens)
`flex w-full items-center gap-4 rounded-2xl bg-soft-blue p-4 text-left shadow-sm
transition active:scale-[0.99]` — icon `h-8 w-8 text-navy`, title
`text-lg font-extrabold text-navy`, subtitle `text-sm font-bold text-navy/70`,
trailing `<ChevronRight className="h-6 w-6 text-teal" />`.

### Entity card (client / record)
`rounded-2xl border border-border bg-white p-4 shadow-sm`
- title `text-xl font-extrabold text-navy` + trailing `<MapPin className="h-6 w-6 shrink-0 text-navy" />`
- field rows: icon `text-teal` · label `font-extrabold` (navy) · value `text-teal`,
  all `text-[15px] font-bold`, wrapping via `flex flex-wrap items-start gap-1.5`
- footer divided by `border-t border-border pt-3`, status label left, action
  right as `text-sm font-extrabold text-green-700 hover:bg-green-50`, labelled `Details »`

**Label/value colour contract:** navy = what the field is called, teal = what it
says. This holds across every screen and is the fastest way to tell if a new
screen was built to spec.

### Status chip
`ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-sm font-extrabold`
- pending: `bg-sky-100 text-navy` + `<CircleAlert className="h-4 w-4" />` + "No Status"
- done: `bg-emerald-100 text-emerald-700` + `<CheckCircle2 className="h-4 w-4" />` + "Completed"

### ActionButton (full-width teal CTA)
`flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-4 text-lg
font-extrabold text-teal-foreground shadow-md transition active:scale-[0.98]`,
icon `h-6 w-6`, stacked `space-y-3`.

### Form section
`rounded-2xl bg-muted p-4` with `text-lg font-extrabold text-navy` heading.
Fields inside are `rounded-lg border border-border bg-white px-4 py-4`:
- **select-like**: button, label `text-lg font-extrabold` (`text-navy/80` when
  empty, `text-navy` when filled), trailing `<ChevronRight className="h-5 w-5 rotate-90 text-navy" />`
  — a rotated chevron, not a dedicated caret icon
- **input**: `w-full bg-transparent py-2 text-lg font-extrabold text-navy
  placeholder:font-extrabold placeholder:text-navy/80 focus:outline-none`
  (placeholder is as heavy as the value — intentional)
- **emphasised field**: `border-2 border-navy/60` instead of `border-border`
- **computed total**: `text-sm font-bold text-muted-foreground` label over
  `text-2xl font-extrabold text-navy` value

### Sticky commit bar
```
fixed inset-x-0 bottom-0 z-10 space-y-2 p-4 lg:absolute
bg-gradient-to-t from-white via-white to-transparent
```
`fixed` on mobile, `lg:absolute` so it docks inside the phone frame on desktop —
**this one class is what keeps the bar from escaping the simulator.** Screen
body gets `pb-32` to clear it.
- discard: `rounded-xl border-2 border-destructive bg-red-50 py-4 text-lg font-extrabold text-destructive` + `<Trash2/>`
- submit: `rounded-xl bg-blue-500 py-4 text-lg font-extrabold text-white shadow-lg` + `<CheckCircle2/>`

### In-phone picker modal
`absolute inset-0 z-40 flex items-center justify-center bg-navy/50 p-4` —
`absolute`, not `fixed`, so it is clipped by the phone bezel.
```
pop-in w-full max-w-md rounded-2xl bg-soft-blue p-5 shadow-2xl
├─ text-2xl font-extrabold text-navy                       → "Select Product"
├─ max-h-[420px] space-y-2 overflow-y-auto
│  └─ row: flex w-full items-center gap-3 rounded-lg bg-white p-2 text-left
│          transition hover:bg-white/80
│     ├─ radio: <CheckCircle2 h-6 w-6 text-teal> | <Circle h-6 w-6 text-navy/70>
│     ├─ thumb: grid h-12 w-12 place-items-center rounded bg-muted text-xs font-bold text-navy/70
│     └─ name:  text-base font-extrabold text-navy
└─ footer: flex justify-end gap-2
   ├─ Cancel: rounded-lg bg-white px-5 py-2 text-lg font-extrabold text-navy shadow
   └─ Ok:     rounded-lg bg-navy px-5 py-2 text-lg font-extrabold text-white shadow
```
Selection is local to the picker and only commits on **Ok** — the learner can
change their mind, which matters when the task is "pick the right one".

### Tab strip
`grid grid-cols-2 border-b border-border px-4 text-center text-lg font-extrabold`
— active: `border-b-4 border-navy pb-2 text-navy`; inactive: `pb-2 text-navy/60`.

---

## 7. shadcn/ui usage

`components.json`: style `new-york`, `rsc: false`, `tsx: true`, base colour
`slate`, CSS variables on, icon library `lucide`, aliases
`@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.

The full shadcn set is vendored in `src/components/ui/` (48 files) but the
training UI **imports none of it** — every screen is hand-rolled Tailwind. That
is a deliberate call: the simulated app must match a third-party app's visual
quirks, and shadcn defaults (`text-sm font-medium`, `rounded-md`, muted borders)
fight that.

For the bigger project:
- Keep shadcn for *your* chrome — real dialogs, forms, tables, toasts, admin screens.
- Hand-roll anything *inside the phone*. Reach for the §6 patterns, not `<Button>`.
- If you do wrap §6 patterns as components, use `cva` the way `button.tsx` does,
  and keep the long Tailwind strings intact rather than normalising them to
  shadcn conventions.

---

## 8. State model (port this shape, move the data to the backend)

Current implementation is a single `useState` cluster in `TrainingApp.tsx`:

```ts
screen: ScreenId          // which simulated screen is mounted
level: 1 | 2 | "done"
stepIdx: number           // index into GUIDED_STEPS
overlay: { open, title, body, tone?, icon?, after?, cta? }
wrongTapMsg: string | null
exploredCount: Set<string>   // explanation titles seen — dedupes by title
level1Done: boolean
product / quantity / pickerOpen / completed / clientName   // task state
```

Every screen receives the same `commonProps` bag:

```ts
{ explain, level, activeStep, onStep, wrongTap, goto, nextStep }
```

`activeStep` is `level === 2 ? GUIDED_STEPS[stepIdx]?.id : undefined`, and the
uniform guard inside every handler is:

```ts
if (level === 2 && activeStep && activeStep !== MY_STEP) return wrongTap();
if (activeStep === MY_STEP) onStep(MY_STEP);
doTheThing();
```

Three lines, repeated at every interactive element. Keep the shape — it is what
makes Level 2 trustworthy — but in the bigger project lift it into a
`useTrainingStep(stepId)` hook returning `{ isActive, guard, pulseClass }` so
screens stop carrying the branch by hand.

### Scripting model

```ts
interface Step { id: StepId; screen: ScreenId; instruction: string; hint: string; }
const GUIDED_STEPS: Step[] = [ /* 8 steps, dashboard → submit */ ];
```

Level 1 progress is "6 distinct explanations seen", unlocking at 3 and
auto-celebrating at 6.

### Porting to a backend

The design assumes one linear script and one hardcoded dataset. To go bigger
without changing the look:

1. **Modules & lessons** — `GUIDED_STEPS` becomes `lesson.steps` fetched by id.
   `Step` gains `targetSelector` or keeps `StepId`, plus `screen`, `instruction`,
   `hint`, and optional `explanation`. The teacher card already renders
   "Step n of total" from array length, so it scales without redesign.
2. **Explanation content** — `explain(title, body)` is called with inline
   strings today. Move to a keyed content table (`explanations[key] = { title, body }`)
   so copy is translatable and editable without a deploy. `exploredCount`
   dedupes by title; switch it to dedupe by key.
3. **Screens as data** — screens are hardcoded JSX. For many simulated apps,
   describe each screen as a tree of the §6 pattern names
   (`{ pattern: "activityTile", props: {...} }`) and render through a registry.
   The pattern list in §6 is already the registry's vocabulary.
4. **Fixtures** — `CLIENTS`, `PRODUCTS`, metric numbers and the profile block
   come from the API instead. Keep the same field/value colour contract so the
   screens still read correctly with real strings.
5. **Progress persistence** — `level`, `stepIdx`, `exploredCount`, `completed`
   per user per lesson. Needs a resume path: rehydrate state, mount
   `step.screen`, and the correct pulse appears with no extra work.
6. **Analytics** — the three-line guard is the natural event site. Emit
   `step_completed`, `wrong_tap` (with intended vs actual step), and
   `explanation_opened`. Wrong-tap data tells content authors which hints fail.
7. **Validation hooks** — some steps need a predicate, not just a tap
   (`type-quantity` waits for `>= 1`). Give `Step` an optional
   `complete: (state) => boolean` so the backend-authored script can express it.

---

## 9. Content & voice

As much a part of the design as the colours. The audience is a field officer
with limited literacy using a cheap phone.

- Short sentences. Everyday words. "Tap the blue Submit Sales Order button",
  not "Submit the order form".
- Name the target by **colour, shape and position**: *"Look for the blue box
  that says Journey Cycle Plan"*, *"The second big teal button"*, *"the very
  first row at the top"*.
- Explain *why*, not just what: *"The app fills this in automatically based on
  the product you pick — you do NOT need to type or calculate it."*
- Mistakes are redirects, never failures.
- Role-play framing: *"Remember — pretend you are standing at the shop!"*
- Celebrate out loud, with emoji in headings: "Good Job! 🎉",
  "Mission Complete! ✅".
- Expand every acronym on first touch: SPO → Sales Promotion Officer, MTD →
  Month To Date, WSP → Wholesale Price.
- Teach real-world constraints in-flow: the geofence overlay stops the learner
  and explains the 100m GPS rule before letting them continue.

---

## 10. Non-obvious decisions worth preserving

These look like accidents and are not. Breaking them is how the port goes wrong.

1. **`lg:absolute` on the sticky commit bar** — without it the submit bar
   escapes the phone frame on desktop and sits on the page.
2. **Picker uses `absolute`, trainer overlay uses `fixed`** — in-app modals must
   be clipped by the bezel; teacher modals must cover everything.
3. **`font-bold` is the lightest weight in the app.** No `font-normal` anywhere.
4. **Placeholders are `font-extrabold`** at the same weight as real values.
5. **Rotated `ChevronRight` (`rotate-90`) as the dropdown caret**, repeated.
6. **One `.pulse-target` at a time**, applied by string concat so base styles
   are never disturbed.
7. **`after` callback fires 100ms post-close** so navigation never shows behind
   the modal.
8. **Fixed `h-[720px]` phone viewport** — screens are authored against it;
   making it fluid changes every scroll position.
9. **Dark mode is intentionally incomplete.** The phone screen is always light
   because the real app is light. Don't "finish" it without re-theming screens.
10. **Explanations dedupe by title** — same title twice counts once toward the
    Level-1 goal. Title strings are therefore load-bearing identifiers.
11. **Level 1 unlocks at 3 but auto-celebrates at 6** — eager learners move on
    early, thorough ones get the confetti.
12. **Wrong taps in Level 2 still open the geofence overlay path**
    (`handleDetails` sets `clientName` before guarding) — side effects before
    the guard are a bug class to watch for when porting.

---

## 11. Port checklist

- [ ] `tokens.css` copied; Nunito 400–900 loaded
- [ ] `cn()` helper (`clsx` + `tailwind-merge`) in place
- [ ] `lucide-react` installed; same glyphs per §6
- [ ] `canvas-confetti` installed, both celebration recipes wired
- [ ] Shell: gradient background, `lg:grid-cols-[minmax(320px,380px)_1fr]`, sticky sidebar
- [ ] `PhoneFrame` + `PhoneFrameMobile` (no frame on real mobile)
- [ ] Mobile navy instruction banner mirrors sidebar state
- [ ] `.pulse-target` + `.pop-in` keyframes present
- [ ] `TrainerOverlay` with all three tones and the `after` delay
- [ ] Wrong-tap toast at 2200ms auto-dismiss
- [ ] All §6 patterns built, label=navy / value=teal contract honoured
- [ ] Sticky commit bar carries `lg:absolute`
- [ ] Guard triplet centralised in a `useTrainingStep`-style hook
- [ ] Script, explanation copy and fixtures served from the backend
- [ ] Progress persisted and resumable to `step.screen`
- [ ] Verified at 375px, 768px and 1440px

---

## 12. Source map

| Concern | File |
|---|---|
| Tokens, animations, base layer | `src/styles.css` |
| Shell, state machine, teacher card, celebrations | `src/components/training/TrainingApp.tsx` |
| All simulated screens + in-phone patterns | `src/components/training/screens.tsx` |
| Phone frame (desktop + mobile) | `src/components/training/PhoneFrame.tsx` |
| Trainer modal | `src/components/training/TrainerOverlay.tsx` |
| Script, step/screen/level types | `src/components/training/types.ts` |
| Head, fonts, meta, error + 404 screens | `src/routes/__root.tsx` |
| shadcn config | `components.json` |
| `cn()` | `src/lib/utils.ts` |
