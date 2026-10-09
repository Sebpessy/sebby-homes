---
name: sip-panels
description: >
  Structural Insulated Panel (SIP) design coordination and estimating for
  SP GENCO LLC. Use this skill whenever the user mentions SIPs, SIP panels,
  structural insulated panels, panelized walls/roof, OSB-foam panels, or asks
  about SIP pricing, SIP takeoffs, SIP vs stick framing, SIP spans or load
  capacity, SIP electrical chases, SIP connection details, or getting quotes
  from SIP manufacturers. Also trigger when a plan set is being considered
  for SIP construction or a SIP RFQ needs to be prepared. Structural
  capacities come ONLY from the manufacturer's ICC-ES report or code report —
  this skill never invents panel capacities.
---

# SIP Panels — Design Coordination & Estimating

You are helping a Texas residential GC evaluate, estimate, and coordinate
Structural Insulated Panel projects. SIPs are a proprietary, manufacturer-
specific product: two OSB skins bonded to a foam core (EPS most common;
also XPS, polyiso/GPS). Unlike dimensional lumber there are NO generic code
span tables — every structural number depends on the specific manufacturer's
tested product.

## The Prime Directive: Capacities Come From the Manufacturer's Report

1. **Never state a SIP's axial, transverse (wind), or racking capacity, or
   an allowable span, from memory.** These are established by testing and
   published in each manufacturer's ICC-ES evaluation report (ESR) or
   equivalent code report, and differ by manufacturer, panel thickness,
   skin, core, and spline type.
2. Quote capacities only from a report **open in this session** (user
   uploads the ESR PDF, or it is fetched and read). Cite report number,
   table, and conditions/footnotes.
3. IRC 2018/2021 include prescriptive SIP wall provisions (R610 series —
   confirm section number in the user's adopted edition) with real limits
   (stories, wind speed, seismic category). Read the limits from the code
   text when deciding if a project fits the prescriptive path; outside it,
   the manufacturer's engineering department or an engineer of record
   designs the package — which is standard practice anyway, since SIP
   manufacturers provide stamped shop drawings with the panel order.
4. What you compute freely: areas, panel counts, load takedowns (demand),
   costs, schedules — deterministic math.

## Workflow

### A. Feasibility / SIP-vs-stick comparison
Cover honestly, both directions:
- **For SIPs**: shell speed (days not weeks), better air-tightness and
  effective R-value, less jobsite labor/waste, strong for simple rooflines.
- **Against**: higher material cost, crane day(s), electrical must use
  pre-cut chases (no drilling studs later), HVAC needs fresh-air design for
  tight envelope (get the HVAC sub involved EARLY for a Manual J/D with
  proper ventilation), plumbing walls should be furred interior walls not
  SIP exterior, complex rooflines erode the labor savings, repairs and
  future remodels are harder, termite protection matters in Texas (borate-
  treated cores exist — ask manufacturers), and local inspectors may be
  unfamiliar — pre-meet with the AHJ.

### B. Takeoff for RFQ
Use `scripts/sip_takeoff.py` for deterministic quantities:
- Wall panel net area = perimeter × wall height − openings (list each)
- Roof panel area = plan area / cos(pitch angle), by roof plane
- Panel count at manufacturer's standard sheet sizes (4×8/4×9/4×10; verify
  offerings per manufacturer), spline count, lumber plate/spline stock,
  sealant/tape linear footage, screw counts at manufacturer spacing
  (read spacing from their install manual, don't assume).

### C. RFQ package to manufacturers
Assemble and send (mirror the gc-rfq-windows skill's professional format,
using gc-shared-assets branding):
1. Plan set (PDF), elevation heights, wall thickness target
2. Design criteria: wind speed/exposure per AHJ, roof snow/live per AHJ —
   values confirmed with the jurisdiction, not assumed
3. Scope split: who does what (panel supply only? supply+install? crane?)
4. Ask each bidder for: current ESR number, stamped shop drawings +
   engineering included?, lead time, delivery, spline system, pre-cut
   openings and electrical chases per plan, termite treatment option
5. Texas-area starting points: ask several regional manufacturers to bid;
   the SIPA member directory (sips.org) lists manufacturers by region —
   verify current membership/products rather than relying on a static list.

### D. Bid leveling
Normalize bids to $/SF of panel area with scope adjustments (crane,
install, engineering, freight — freight is significant, panels are bulky).
Present in the standard SP GENCO estimate format via gc-estimate-builder
if a customer-facing number is needed.

## Coordination Checklist (the stuff that bites)
- [ ] Electrical plan overlaid on panel layout BEFORE panel fabrication —
      chases are factory-cut; field changes are foam-scoop misery
- [ ] HVAC ventilation strategy for tight envelope (ERV/fresh air intake)
- [ ] No plumbing in SIP exterior walls — interior wet walls
- [ ] Panel-to-foundation connection detail matches manufacturer's manual
- [ ] Crane access, staging area, and delivery truck path confirmed
- [ ] AHJ pre-approval: show them the ESR before permit submittal
- [ ] Termite treatment/inspection gap detail at slab edge (Texas)
- [ ] Roof SIP: ridge ventilation/hot roof strategy decided with roofer
- [ ] Window/door rough openings: factory-cut, confirm sizes against final
      window order (coordinate with gc-rfq-windows workflow)

## References
- `references/sip-basics.md` — terminology, anatomy, what varies by
  manufacturer, what to verify in an ESR.
- `scripts/sip_takeoff.py` — panel area/count/consumables calculator.
