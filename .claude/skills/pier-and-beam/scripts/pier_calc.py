#!/usr/bin/env python3
"""Pier & beam foundation calculator — deterministic math only.

Computes pier loads from tributary areas, required bearing (pad) size for
a CITED allowable soil pressure, and concrete/material quantities. The
bearing command refuses to run without a --soil-source citation: soil
values come from a geotech report, IRC Table R401.4.1 read in-session
(known soil class only), or the engineer — never from memory. Pier depth
is deliberately NOT computed here (AHJ frost depth + expansive-soil
active zone are site determinations).
"""

import argparse
import json
import math
import sys


def loads(beam_spacing_ft, pier_spacing_ft, floor_psf_total, floor_psf_live,
          wall_plf, stories_factor):
    trib_sf = beam_spacing_ft * pier_spacing_ft
    p_floor = trib_sf * floor_psf_total * stories_factor
    p_wall = wall_plf * pier_spacing_ft
    p_total = p_floor + p_wall
    return {
        "tributary_sf_per_pier": round(trib_sf, 1),
        "floor_load_lb": round(p_floor, 0),
        "wall_line_load_lb": round(p_wall, 0),
        "pier_load_lb": round(p_total, 0),
        "live_portion_lb": round(trib_sf * floor_psf_live * stories_factor, 0),
        "NOTE": ("Interior pier on a repeating grid. Perimeter piers and "
                 "piers under girder intersections or point loads (posts "
                 "from above) need their own tributary run — do each "
                 "condition separately. Loads assumed as stated; confirm "
                 "live loads against IRC Table R301.5 in-session."),
    }


def bearing(pier_load_lb, soil_psf, soil_source, pad_thickness_in):
    if not soil_source or len(soil_source.strip()) < 10:
        sys.exit(
            "REFUSING bearing calc: --soil-source citation missing.\n"
            "Allowable soil pressure must come from a geotech report, IRC "
            "Table R401.4.1 read in-session with a KNOWN soil class, or "
            "the engineer. Cite like: --soil-source 'Geotech report "
            "Alpha-2026-014 p.6, 2000 psf' or 'IRC 2021 Table R401.4.1, "
            "sandy gravel row, user code PDF'. Never from memory."
        )
    area_req_sf = pier_load_lb / soil_psf
    side_in = math.sqrt(area_req_sf) * 12.0
    # Round pad side UP to the next even inch for buildability.
    side_round = math.ceil(side_in / 2.0) * 2
    return {
        "pier_load_lb": pier_load_lb,
        "allowable_soil_psf": soil_psf,
        "soil_source": soil_source,
        "required_bearing_sf": round(area_req_sf, 2),
        "square_pad_side_in_min": round(side_in, 1),
        "square_pad_side_in_use": side_round,
        "pad_thickness_in": pad_thickness_in,
        "NOTE": ("Pad thickness/reinforcement per code table or engineer — "
                 "the thickness echoed here is an input, not a design. "
                 "Expansive soils void this simple bearing approach "
                 "(IRC R403.1.8 → engineered)."),
    }


def concrete(n_piers, pad_side_in, pad_thickness_in, pier_shape,
             pier_dim_in, pier_height_in, waste_pct):
    pad_cf = (pad_side_in / 12.0) ** 2 * (pad_thickness_in / 12.0)
    if pier_shape == "round":
        pier_cf = math.pi * (pier_dim_in / 24.0) ** 2 * (pier_height_in / 12.0)
    else:
        pier_cf = (pier_dim_in / 12.0) ** 2 * (pier_height_in / 12.0)
    total_cf = n_piers * (pad_cf + pier_cf) * (1 + waste_pct / 100.0)
    return {
        "piers": n_piers,
        "pad_cf_each": round(pad_cf, 2),
        "pier_cf_each": round(pier_cf, 2),
        "total_cf": round(total_cf, 1),
        "total_cy": round(total_cf / 27.0, 2),
        "order_cy_rounded_quarter": math.ceil(total_cf / 27.0 * 4) / 4.0,
        "NOTE": ("For CMU-block piers instead of poured: blocks = courses x "
                 "blocks-per-course; caps and composite shims per spec. "
                 "Depth below grade excluded — add embedment volume once "
                 "the AHJ/geotech depth is known."),
    }


def count(building_len_ft, building_wid_ft, beam_spacing_ft, pier_spacing_ft):
    n_beam_lines = math.floor(building_wid_ft / beam_spacing_ft) + 1
    piers_per_line = math.floor(building_len_ft / pier_spacing_ft) + 1
    total = n_beam_lines * piers_per_line
    return {
        "beam_lines": n_beam_lines,
        "piers_per_line": piers_per_line,
        "total_piers": total,
        "NOTE": ("Rectangular grid estimate. Real layouts add piers at "
                 "girder intersections, point loads, and openings; perimeter "
                 "may be a continuous grade beam instead of piers — adjust "
                 "to the actual plan."),
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    l = sub.add_parser("loads")
    l.add_argument("--beam-spacing-ft", type=float, required=True)
    l.add_argument("--pier-spacing-ft", type=float, required=True)
    l.add_argument("--floor-psf-total", type=float, required=True,
                   help="Live + dead, stated assumption")
    l.add_argument("--floor-psf-live", type=float, required=True)
    l.add_argument("--wall-plf", type=float, default=0.0,
                   help="Line load from bearing wall above, if any")
    l.add_argument("--stories-factor", type=float, default=1.0,
                   help="1.0 single floor; >1 if upper floors stack on this line")

    b = sub.add_parser("bearing")
    b.add_argument("--pier-load-lb", type=float, required=True)
    b.add_argument("--soil-psf", type=float, required=True)
    b.add_argument("--soil-source", required=True)
    b.add_argument("--pad-thickness-in", type=float, default=0.0,
                   help="Echoed input; thickness per code/engineer")

    c = sub.add_parser("concrete")
    c.add_argument("--n-piers", type=int, required=True)
    c.add_argument("--pad-side-in", type=float, required=True)
    c.add_argument("--pad-thickness-in", type=float, required=True)
    c.add_argument("--pier-shape", choices=["square", "round"], default="square")
    c.add_argument("--pier-dim-in", type=float, required=True,
                   help="Side (square) or diameter (round)")
    c.add_argument("--pier-height-in", type=float, required=True)
    c.add_argument("--waste-pct", type=float, default=7.0)

    n = sub.add_parser("count")
    n.add_argument("--building-len-ft", type=float, required=True)
    n.add_argument("--building-wid-ft", type=float, required=True)
    n.add_argument("--beam-spacing-ft", type=float, required=True)
    n.add_argument("--pier-spacing-ft", type=float, required=True)

    a = p.parse_args()
    if a.cmd == "loads":
        out = loads(a.beam_spacing_ft, a.pier_spacing_ft, a.floor_psf_total,
                    a.floor_psf_live, a.wall_plf, a.stories_factor)
    elif a.cmd == "bearing":
        out = bearing(a.pier_load_lb, a.soil_psf, a.soil_source,
                      a.pad_thickness_in)
    elif a.cmd == "concrete":
        out = concrete(a.n_piers, a.pad_side_in, a.pad_thickness_in,
                       a.pier_shape, a.pier_dim_in, a.pier_height_in,
                       a.waste_pct)
    else:
        out = count(a.building_len_ft, a.building_wid_ft, a.beam_spacing_ft,
                    a.pier_spacing_ft)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
