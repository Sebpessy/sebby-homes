---
name: icf-construction
description: >
  Insulated Concrete Form (ICF) construction planning, takeoff, and
  estimating for SP GENCO LLC. Use this skill whenever the user mentions
  ICF, insulated concrete forms, foam block walls, concrete-filled foam
  forms, ICF basement or safe room, or asks about ICF block counts,
  concrete volume for ICF walls, ICF rebar quantities, ICF pour planning,
  ICF vs stick or block comparison, or ICF vendor quotes (Nudura, Fox
  Blocks, BuildBlock, Amvic, etc.). Also trigger for tornado-resistant /
  FEMA safe room walls and concrete wall takeoffs in foam forms.
  Reinforcement sizes/spacing come ONLY from IRC R608 tables, the
  manufacturer's engineering manual, or an engineer — never from memory.
---

# ICF Construction — Planning, Takeoff & Estimating

You are helping a Texas residential GC plan and price Insulated Concrete
Form walls: hollow EPS foam blocks stacked, braced, reinforced, and filled
with concrete. Common in this market for storm resistance (a real selling
point in North Texas hail/tornado country), energy performance, and safe
rooms.

## The Prime Directive: No Invented Structural Values

1. **Never state rebar size/spacing, lintel reinforcement, or wall
   thickness requirements from memory.** These come from IRC chapter R608
   (flat/waffle/screen-grid ICF wall provisions — confirm section
   numbering in the adopted edition), the manufacturer's engineered
   tables, or the engineer of record. Read the governing table in-session
   and cite it, or output quantities parameterized by "spacing per table"
   and tell the user exactly which table to pull.
2. IRC prescriptive ICF provisions have hard applicability limits (number
   of stories, wall height, wind speed, seismic category) — read them
   from the code text before treating a project as prescriptive-path.
   Safe rooms designed to FEMA P-361/ICC 500 are ALWAYS an engineered
   design — flag them.
3. What you compute freely: geometry — block counts, concrete volume,
   rebar linear footage AT a stated spacing, bracing counts, pour rates,
   costs. Deterministic math via `scripts/icf_calc.py`.

## Workflow

### A. Feasibility / comparison honestly stated
- **For ICF**: storm/impact resistance, quiet, energy performance,
  termite-indifferent structure (but see termite note), basement-friendly
  (rare in TX but ICF is the way when done), insurance advantages worth
  asking the client's carrier about.
- **Against**: cost premium over stick framing, fewer experienced subs
  (installer quality is EVERYTHING — a blowout on pour day is expensive),
  window/door bucks and attachment details differ, remodeling/penetrations
  later are hard, electrical requires foam-cut chases, and in Texas:
  termite inspection gap requirements on foam below grade per the adopted
  code — read the local amendment, some areas restrict foam contact with
  grade.

### B. Takeoff with `scripts/icf_calc.py`
Deterministic quantities from wall geometry:
- Block count from net wall area / block face area (standard face ~16"H ×
  48"L varies by brand — take face size from the manufacturer's data
  sheet; the script takes it as input)
- Concrete volume from the manufacturer's stated concrete usage per SF
  for the core size in play (6" core ≠ 6.25" ≠ 8" across brands — input,
  not assumption), plus waste/pump line loss
- Rebar LF: horizontal courses × perimeter + verticals at the spacing the
  user provides FROM the governing table; dowels; lap lengths per table
- Bracing/alignment system rental count from wall LF

### C. Pour planning (where jobs go wrong)
- Lift height per manufacturer's manual (typically limited per pass —
  verify); full-height pours in lifts with a set schedule around the wall
- Concrete spec: slump/flow and aggregate size per manufacturer manual —
  put it ON the concrete order in writing; line-pump vs boom decision
- Vibration/consolidation method per manual
- Blowout kit on site: spare foam, plywood scabs, screws, straps
- Cold joints planned at course lines if multi-day
- Window/door bucks braced INTERNALLY before pour (bowed bucks = reorder
  windows)
- Weather window: same concrete rules as any pour (hot-weather practices
  for Texas summers)

### D. Vendor RFQ / estimate
RFQ to 2–3 ICF brands' regional distributors: block system + accessories
(webs are brand-specific), alignment/bracing rental, training or on-site
tech rep availability for the first pour (many brands offer this — ask),
freight. Then concrete, pump, rebar, and labor as separate lines. Feed the
result into gc-estimate-builder for customer-facing numbers, and log
supplier pricing via price-book-manager.

## Coordination Checklist
- [ ] Which table governs reinforcement (IRC R608 vs manufacturer vs PE)?
      Copy of it in the job file, cited in the estimate
- [ ] AHJ pre-check: ICF familiarity, inspection points (pre-pour
      inspection of rebar is standard — schedule it)
- [ ] Termite: below-grade foam rules per local amendments; inspection
      strip detail
- [ ] Electrical/plumbing chase plan before pour; conduit sleeves for
      future needs
- [ ] Ledger/attachment hardware for floors and roof (brand-specific
      embedded connectors vs anchor bolts — per manual)
- [ ] Brick ledge detail if brick veneer (very common in DFW) — brick
      ledge blocks or corbel form
- [ ] HVAC sizing redone for the tighter envelope (Manual J with ICF
      assemblies, ventilation strategy)
- [ ] Safe room? → FEMA P-361/ICC 500 engineered design, separate scope

## References
- `references/icf-basics.md` — block anatomy, brand variation points,
  what to verify in manufacturer literature, estimating structure.
- `scripts/icf_calc.py` — block/concrete/rebar quantity calculator.
