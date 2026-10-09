#!/usr/bin/env python3
"""ICF quantity calculator — deterministic geometry only.

Computes block counts, concrete volume, and rebar linear footage from
wall geometry and BRAND-SPECIFIC inputs (block face size, concrete yield)
plus TABLE-SPECIFIED rebar spacing. Concrete yield and rebar spacing must
be cited to a source (manufacturer data sheet / IRC R608 table / PE
drawings) — the script refuses to run without the citation. No structural
capacities, no prices.
"""

import argparse
import json
import math
import sys


def require_source(source, what):
    if not source or len(source.strip()) < 10:
        sys.exit(f"REFUSING: --{what}-source citation missing. Cite the "
                 f"document the value came from (e.g. 'Nudura data sheet "
                 f"2025, 6-in core' or 'IRC 2021 Table R608.x row y' or "
                 f"'PE drawing S1.1'). Values are never assumed.")


def blocks(net_wall_sf, face_h_in, face_l_in, corners_90, corners_45,
           waste_pct):
    face_sf = (face_h_in / 12.0) * (face_l_in / 12.0)
    count = math.ceil(net_wall_sf * (1 + waste_pct / 100.0) / face_sf)
    return {
        "net_wall_sf": net_wall_sf,
        "block_face_sf": round(face_sf, 2),
        "straight_blocks_with_waste": count,
        "corner_90_blocks": corners_90,
        "corner_45_blocks": corners_45,
        "NOTE": ("Corner blocks counted per corner per course — supply "
                 "counts from the wall layout. Manufacturer's estimating "
                 "sheet governs the final order."),
    }


def concrete(net_wall_sf, yield_cf_per_sf, yield_source, waste_pct,
             pump_loss_cf):
    require_source(yield_source, "yield")
    vol_cf = net_wall_sf * yield_cf_per_sf
    total_cf = vol_cf * (1 + waste_pct / 100.0) + pump_loss_cf
    return {
        "net_wall_sf": net_wall_sf,
        "yield_cf_per_sf": yield_cf_per_sf,
        "yield_source": yield_source,
        "concrete_cf": round(vol_cf, 1),
        "with_waste_and_pump_cf": round(total_cf, 1),
        "order_cy": round(total_cf / 27.0, 2),
        "order_cy_rounded_quarter": math.ceil(total_cf / 27.0 * 4) / 4.0,
        "NOTE": "Slump/aggregate per manufacturer manual — put it on the ready-mix order.",
    }


def rebar(wall_lf, wall_h_ft, vert_spacing_in, horiz_courses, spacing_source,
          lap_in, dowel_count, dowel_len_ft, bar_stock_ft):
    require_source(spacing_source, "spacing")
    n_vert = math.ceil(wall_lf * 12.0 / vert_spacing_in) + 1
    vert_lf = n_vert * wall_h_ft
    horiz_run_lf = horiz_courses * wall_lf
    n_horiz_bars = math.ceil(horiz_run_lf / bar_stock_ft)
    lap_lf = (n_horiz_bars * lap_in) / 12.0
    dowel_lf = dowel_count * dowel_len_ft
    total = vert_lf + horiz_run_lf + lap_lf + dowel_lf
    return {
        "spacing_source": spacing_source,
        "vertical_bars": n_vert, "vertical_lf": round(vert_lf, 1),
        "horizontal_courses": horiz_courses,
        "horizontal_lf_with_laps": round(horiz_run_lf + lap_lf, 1),
        "dowel_lf": round(dowel_lf, 1),
        "total_rebar_lf": round(total, 1),
        "sticks_20ft": math.ceil(total / 20.0),
        "NOTE": ("Bar SIZE and spacing come from the cited table/drawing. "
                 "Lap length per the same source. Pre-pour inspection of "
                 "placement before ordering the pump."),
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("blocks")
    b.add_argument("--net-wall-sf", type=float, required=True)
    b.add_argument("--face-h-in", type=float, required=True,
                   help="Block face height, from brand data sheet")
    b.add_argument("--face-l-in", type=float, required=True)
    b.add_argument("--corners-90", type=int, default=0)
    b.add_argument("--corners-45", type=int, default=0)
    b.add_argument("--waste-pct", type=float, default=5.0)

    c = sub.add_parser("concrete")
    c.add_argument("--net-wall-sf", type=float, required=True)
    c.add_argument("--yield-cf-per-sf", type=float, required=True,
                   help="From the brand's data sheet for the core size")
    c.add_argument("--yield-source", required=True)
    c.add_argument("--waste-pct", type=float, default=5.0)
    c.add_argument("--pump-loss-cf", type=float, default=7.0,
                   help="Line prime/loss allowance; confirm with pumper")

    r = sub.add_parser("rebar")
    r.add_argument("--wall-lf", type=float, required=True)
    r.add_argument("--wall-h-ft", type=float, required=True)
    r.add_argument("--vert-spacing-in", type=float, required=True,
                   help="From governing table/drawing — cite via --spacing-source")
    r.add_argument("--horiz-courses", type=int, required=True,
                   help="Number of horizontal bar courses, from same source")
    r.add_argument("--spacing-source", required=True)
    r.add_argument("--lap-in", type=float, default=0.0,
                   help="Lap length per source; 0 if using full-length bars")
    r.add_argument("--dowel-count", type=int, default=0)
    r.add_argument("--dowel-len-ft", type=float, default=0.0)
    r.add_argument("--bar-stock-ft", type=float, default=20.0)

    a = p.parse_args()
    if a.cmd == "blocks":
        out = blocks(a.net_wall_sf, a.face_h_in, a.face_l_in, a.corners_90,
                     a.corners_45, a.waste_pct)
    elif a.cmd == "concrete":
        out = concrete(a.net_wall_sf, a.yield_cf_per_sf, a.yield_source,
                       a.waste_pct, a.pump_loss_cf)
    else:
        out = rebar(a.wall_lf, a.wall_h_ft, a.vert_spacing_in,
                    a.horiz_courses, a.spacing_source, a.lap_in,
                    a.dowel_count, a.dowel_len_ft, a.bar_stock_ft)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
