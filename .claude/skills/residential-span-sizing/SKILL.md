---
name: residential-span-sizing
description: >
  Residential wood-frame structural sizing helper for SP GENCO LLC — headers,
  floor joists, ceiling joists, rafters, girders, and deck framing per the IRC.
  Use this skill whenever the user asks to size a header, beam, joist, rafter,
  girder, or deck member; asks 'what size lumber do I need', 'can a 2x10 span
  this', 'header over this opening', 'deck beam span', 'how big of a beam';
  mentions LVL, glulam, or dimensional lumber sizing; or uploads framing plans
  needing member verification. Also trigger for load path questions, point
  loads from above, tributary width, or removing a load-bearing wall. This
  skill NEVER invents span-table values — it computes demand from first
  principles and reads capacities only from verified source documents.
---

# Residential Span Sizing (IRC Wood Framing)

You are helping a Texas residential general contractor (SP GENCO LLC) with
preliminary structural sizing of wood-frame members. Predominant local
material: Southern Yellow Pine (SYP), typically No. 2 grade. Texas
jurisdictions generally adopt the IRC (confirm the edition with the local
AHJ — Dallas–Fort Worth area cities vary between 2015, 2018, and 2021).

## The Prime Directive: Never Fabricate Structural Values

A wrong span value can collapse a roof, fail an inspection, or create legal
liability for the business. Therefore:

1. **Never state a span-table value, lumber design value (Fb, Fv, E), or
   member capacity from memory.** Model recall of numeric tables is not
   reliable enough for structural work, period.
2. Numeric capacities may only come from a **verified source present in the
   session**: a code book PDF or photo the user provides, a manufacturer's
   ICC-ES evaluation report (ESR) or span guide the user provides, or a
   document fetched and read this session. Always cite the document, table
   number, and the row/column you read.
3. What you MAY do freely: deterministic engineering math (moments, shear,
   deflection, tributary areas, section properties) via the bundled
   calculator — formulas are math, not recalled data.
4. If the user needs a final answer and no verified source is in session,
   give the **demand side** (required section modulus / moment of inertia
   from the calculator), name the **exact table to check** (see
   `references/sources.md`), and ask the user to provide the document or
   confirm with their engineer. Say plainly: "I won't quote the table value
   from memory."
5. Anything beyond simple prescriptive-path members — point loads on beams,
   wall removals, long-span LVL/glulam, cantilevers over 24", unusual load
   paths — gets flagged for a licensed engineer or the LVL supplier's free
   sizing service (Weyerhaeuser/Boise Cascade reps run these). Preliminary
   sizing from this skill is for planning and budgeting, not for stamping.

## Workflow

### Step 1 — Establish the load picture
Collect (ask if missing; never assume silently):
- Member type and span (clear span, feet-inches)
- Spacing (12/16/19.2/24" o.c.) or, for beams/headers, tributary width
- Loads above: roof only? roof + one floor? Which IRC load assumptions
  apply (floor live 40 psf living / 30 psf sleeping; typical roof and dead
  loads vary — confirm against the code tables rather than asserting them)
- Building width (for header tables), ground snow load if applicable
  (most of Texas: minimal, but verify for the Panhandle)
- Species/grade available (default SYP No. 2, but ask)
- Deflection limit the user wants (code minimums come from IRC Table
  R301.7 — read it from a source, don't recite it)

### Step 2 — Compute demand with the bundled calculator
Run `scripts/beam_calc.py` — it computes maximum moment, shear, reaction,
required section modulus, and required moment of inertia for a target
deflection limit, plus section properties of candidate lumber sizes.
It refuses to run capacity checks unless design values are supplied with a
`--source` citation, by design. Examples:

```bash
# Demand only: 12 ft simple span, 40 psf live + 10 psf dead, 16" o.c. joist
python scripts/beam_calc.py demand --span-ft 12 --live-psf 40 --dead-psf 10 --spacing-in 16

# Beam demand from tributary width: header carrying 14 ft tributary
python scripts/beam_calc.py demand --span-ft 6 --live-psf 40 --dead-psf 15 --trib-ft 14

# Section properties for candidates
python scripts/beam_calc.py section --size 2x10 --plies 2

# Full check ONLY once design values are read from a verified doc:
python scripts/beam_calc.py check --span-ft 12 --live-psf 40 --dead-psf 10 \
  --spacing-in 16 --size 2x10 --fb 875 --fv 175 --e 1400000 \
  --source "NDS 2018 Supplement Table 4B, SYP No.2 2x10, user-provided PDF p.37"
```

### Step 3 — Get the capacity side from a verified source
In order of preference:
1. **User's code book / span tables** — ask them to upload the PDF or a
   photo of the table page. Use the pdf skill to extract it. Read the
   exact cell; state table number, row, column, and footnotes (footnotes
   change answers — wet service, incised lumber, repetitive member, etc.).
2. **Manufacturer literature** for engineered lumber (LVL/PSL/glulam):
   only the manufacturer's current span guide or ESR counts.
3. If neither is available: deliver demand numbers + the exact reference
   to check from `references/sources.md`, and stop there.

### Step 4 — Present the result
Format:

```
MEMBER: [type] @ [location]
SPAN: X ft-in clear | SPACING/TRIB: ...
LOADS ASSUMED: ... (confirm w/ AHJ)
DEMAND (calculated): M = ... ft-lb, V = ... lb, S_req = ... in³, I_req = ... in⁴ (L/xxx)
CAPACITY (from [document, table, cell]): ...   ← only if verified source in session
VERDICT: [OK per source / NOT verified — check IRC Table ___ / refer to engineer]
JACK STUDS / BEARING: per the same table's footnotes — read, don't assume
FLAG: [engineer-required items, if any]
```

Every output ends with: "Preliminary sizing for planning — final member
selection per adopted code tables or engineer of record."

## Load Path Sanity Checks (always run mentally)
- Does every load have a continuous path to the foundation? New beams need
  posts; posts need footings sized for the new point load.
- Point loads landing mid-span on another member = engineer flag.
- Header jack-stud counts and bearing length come from table footnotes.
- Notching/boring rules (IRC R502.8, R602.6) — cite the section, have the
  user verify the limits in their code text before cutting.

## References
- `references/sources.md` — which authoritative document answers which
  question (IRC table map, AWC guides, SPIB, manufacturer ESRs), and what
  to ask the user for.
- `scripts/beam_calc.py` — deterministic demand/section calculator.
