#!/usr/bin/env python3
"""SIP panel takeoff calculator — deterministic quantities only.

Computes wall/roof panel areas, panel counts at a given sheet size,
joint (spline) counts, and consumable linear footages. Contains NO
structural capacities and NO pricing — those come from the manufacturer's
current ESR/quote. Fastener spacing is an input (read it from the
manufacturer's install manual), never a built-in assumption.
"""

import argparse
import json
import math
import sys


def wall_takeoff(perimeter_ft, height_ft, openings_sf, panel_w_ft, panel_h_ft,
                 waste_pct):
    gross = perimeter_ft * height_ft
    net = gross - openings_sf
    if net <= 0:
        sys.exit("Openings exceed gross wall area — check inputs.")
    panel_area = panel_w_ft * panel_h_ft
    count = math.ceil(net * (1 + waste_pct / 100.0) / panel_area)
    # Vertical joints roughly every panel width along the perimeter.
    joints = math.ceil(perimeter_ft / panel_w_ft)
    return {
        "gross_wall_sf": round(gross, 1),
        "openings_sf": openings_sf,
        "net_wall_sf": round(net, 1),
        "panel_size_ft": f"{panel_w_ft}x{panel_h_ft}",
        "panel_count_with_waste": count,
        "vertical_joints_approx": joints,
        "top_and_bottom_plate_lf": round(perimeter_ft * 2, 1),
        "panel_sealant_lf_approx": round(joints * height_ft + perimeter_ft * 2, 1),
        "NOTE": ("Counts are geometric estimates for RFQ/budget. The "
                 "manufacturer's panel layout drawings govern the final "
                 "count. Fastening schedules per their install manual."),
    }


def roof_takeoff(plan_area_sf, pitch_rise_per_12, panel_w_ft, panel_h_ft,
                 waste_pct):
    slope_factor = math.sqrt(1 + (pitch_rise_per_12 / 12.0) ** 2)
    sloped = plan_area_sf * slope_factor
    panel_area = panel_w_ft * panel_h_ft
    count = math.ceil(sloped * (1 + waste_pct / 100.0) / panel_area)
    return {
        "plan_area_sf": plan_area_sf,
        "pitch": f"{pitch_rise_per_12}/12",
        "slope_factor": round(slope_factor, 4),
        "sloped_area_sf": round(sloped, 1),
        "panel_size_ft": f"{panel_w_ft}x{panel_h_ft}",
        "panel_count_with_waste": count,
        "NOTE": ("Run each roof plane separately for hips/valleys and sum. "
                 "Ridge/eave/valley details and spline type per the "
                 "manufacturer's roof details."),
    }


def fasteners(joint_lf, spacing_in, source):
    if not source or len(source.strip()) < 10:
        sys.exit("REFUSING fastener count: cite the manufacturer install "
                 "manual for --spacing-in via --source (e.g. 'AcmeSIP "
                 "install manual rev 2024 p.12'). Spacing is not assumed.")
    count = math.ceil(joint_lf * 12.0 / spacing_in)
    return {"joint_lf": joint_lf, "spacing_in": spacing_in,
            "fastener_count": count, "spacing_source": source}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    w = sub.add_parser("wall")
    w.add_argument("--perimeter-ft", type=float, required=True)
    w.add_argument("--height-ft", type=float, required=True)
    w.add_argument("--openings-sf", type=float, default=0.0)
    w.add_argument("--panel-w-ft", type=float, default=4.0)
    w.add_argument("--panel-h-ft", type=float, default=8.0)
    w.add_argument("--waste-pct", type=float, default=3.0)

    r = sub.add_parser("roof")
    r.add_argument("--plan-area-sf", type=float, required=True)
    r.add_argument("--pitch", type=float, required=True, help="rise per 12")
    r.add_argument("--panel-w-ft", type=float, default=4.0)
    r.add_argument("--panel-h-ft", type=float, default=8.0)
    r.add_argument("--waste-pct", type=float, default=5.0)

    f = sub.add_parser("fasteners")
    f.add_argument("--joint-lf", type=float, required=True)
    f.add_argument("--spacing-in", type=float, required=True)
    f.add_argument("--source", required=True)

    a = p.parse_args()
    if a.cmd == "wall":
        out = wall_takeoff(a.perimeter_ft, a.height_ft, a.openings_sf,
                           a.panel_w_ft, a.panel_h_ft, a.waste_pct)
    elif a.cmd == "roof":
        out = roof_takeoff(a.plan_area_sf, a.pitch, a.panel_w_ft,
                           a.panel_h_ft, a.waste_pct)
    else:
        out = fasteners(a.joint_lf, a.spacing_in, a.source)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
