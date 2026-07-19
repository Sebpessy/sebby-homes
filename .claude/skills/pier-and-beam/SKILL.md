---
name: pier-and-beam
description: >
  Pier and beam foundation sizing, layout, and estimating for SP GENCO LLC —
  pier loads, pad/footing dimensions, pier spacing, beam demand, crawl space
  requirements, and house-leveling/repair scoping. Use this skill whenever
  the user mentions pier and beam, piers, crawl space foundation, house
  leveling, foundation repair on a pier and beam home, sinking or sagging
  floors, shimming, sonotubes, pier pads, pier depth, pier spacing, drilled
  piers, bell-bottom piers, or asks 'how many piers', 'how big of a pad',
  'how deep do piers go', or wants to price a pier and beam foundation or
  releveling job. Soil bearing values and pier depths are NEVER assumed —
  they come from a geotech report, the IRC soil table read in-session, or
  the engineer of record.
---

# Pier and Beam Foundations — Sizing, Layout & Estimating

You are helping a Texas residential GC with pier and beam (crawl space)
foundations: new construction, additions, and the very common repair and
releveling work on older DFW-area homes. The defining local reality is
**expansive clay soil** — most North Texas foundation problems are
seasonal clay movement, and it changes what can be answered with math
versus what belongs to a geotech or engineer.

## The Prime Directive: Soil and Depth Are Never Guessed

1. **Never state an allowable soil bearing capacity from memory.** It comes
   from (in order of preference): a geotechnical report for the site; the
   presumptive values in IRC Table R401.4.1 **read from the user's code
   text in-session** (and only when the soil class is actually known); or
   the engineer. Cite the source next to every bearing-derived dimension.
   If the soil class is unknown, that's the finding: "soil class unknown —
   presumptive table can't be applied; geotech or engineer call."
2. **Never state a required pier depth from memory.** Minimum footing depth
   and frost depth are set by the AHJ (IRC R403.1.4 + local amendments);
   on expansive clay, depth is governed by the active/moisture zone, which
   is a geotech determination. Drilled/bell-bottom piers on expansive clay
   are ALWAYS an engineered design.
3. **Expansive soil trigger**: if the site is in known expansive clay
   territory (most of DFW, Austin, San Antonio Blackland Prairie), IRC
   R403.1.8 sends expansive-soil foundation design to engineered design.
   Prescriptive pad-and-block math below is for planning/budgeting and for
   sites where soil is confirmed non-expansive — say so explicitly.
4. What you compute freely (deterministic): tributary areas, pier loads,
   required bearing area FOR a cited soil value, pad dimensions, concrete
   volumes, pier counts, beam demand (via the residential-span-sizing
   skill's calculator), materials takeoffs, repair scopes.

## Workflow

### A. New pier layout / sizing
1. Collect: building footprint, floor loads (live per IRC R301.5 read
   in-session or stated as assumption; dead load stated), beam lines and
   spacing, pier spacing along beams, number of stories, and what carries
   roof load (exterior walls to perimeter beam? interior girder lines?).
2. Run `scripts/pier_calc.py loads` — computes each pier's load from
   tributary area (beam spacing × pier spacing × psf, plus line loads
   from bearing walls above).
3. Run `scripts/pier_calc.py bearing` with the **cited** soil value —
   returns required pad area and square pad dimension per pier. The
   script refuses to run without a `--soil-source` citation.
4. Run `scripts/pier_calc.py concrete` for pad + pier volumes and
   CMU/block counts.
5. Beam sizing: hand the beam demand off to the residential-span-sizing
   skill (same rules: demand computed, capacity from verified tables).
6. Flag list (always check): expansive soil → engineered; pier height >
   ~3× least dimension without lateral analysis → engineer; sloped sites,
   uplift/wind anchorage (R403 anchorage read in-session), drainage.

### B. Crawl space requirements (new work)
Read the specifics from the adopted code rather than reciting: ventilation
area and openings (IRC R408), access opening size, ground clearance under
joists/beams (R317 wood protection distances), vapor retarder options,
drainage. Name the section, read the numbers from the user's code text.

### C. Repair / releveling scoping (the frequent money-maker)
Deterministic scoping, honest boundaries:
1. **Symptoms intake**: interior door rubs, drywall cracks, floor slope
   direction and magnitude (ask for a zip-level/laser survey — offer the
   survey as the first billable step; never diagnose from description
   alone).
2. **Elevation survey** → map of highs/lows. The survey data drives the
   shim/adjust/add-pier plan, not guesswork.
3. Typical scope items to price: reshim existing piers, replace crushed
   or rotted shims/blocks/caps, sister or replace rotted beams and joists
   (moisture readings first), add piers mid-span where beams sag between
   existing piers (spacing per load math above), drainage correction
   (gutters, grading, French drain) — on expansive clay, fixing water is
   often the actual fix.
4. **Referral triggers**: masonry cracks above (brittle finishes moving),
   plumbing leaks under the house (leak test before leveling — leaks
   cause heave), repeated seasonal movement (geotech + engineered drilled
   piers conversation), pier settlement vs shim crush (different fixes).
5. Feed the scoped items into gc-estimate-builder for the customer
   estimate; log any engineering/geotech subs via contact-manager.

### D. Output format

```
PIER & BEAM — [job]
LAYOUT: beam lines @ X ft o.c., piers @ Y ft o.c. → N piers
LOADS: [assumptions stated] → typical interior pier P = ... lb, perimeter P = ... lb
SOIL: [value + SOURCE citation, or "unknown — geotech/engineer required"]
PADS: required area ... sf → ... in square @ [thickness per code/engineer]
DEPTH: per AHJ frost/local amendment + soil conditions — NOT assumed here
CONCRETE/MATERIALS: ... cy pads, ... piers/blocks, caps, shims
FLAGS: [expansive soil / engineer items]
```
End with: "Planning-level layout — foundation design on expansive soils
per engineer of record; depths and soil values per geotech/AHJ."

## References
- `references/sources.md` — where every non-computed number comes from.
- `scripts/pier_calc.py` — pier loads, bearing-area, concrete/materials.
