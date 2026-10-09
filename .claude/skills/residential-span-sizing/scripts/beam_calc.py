#!/usr/bin/env python3
"""Deterministic demand/section calculator for residential wood framing.

Computes loads, moments, shear, and required section properties from
first-principles statics for a uniformly loaded simple-span member.
Capacity checks require caller-supplied design values WITH a --source
citation; the script refuses to check capacity otherwise. This is a
deliberate guard: design values must be read from a verified document,
never recalled from memory.

All formulas are standard statics for a simply supported beam under
uniform load:
    w (plf)   = load (psf) * tributary width (ft)
    M_max     = w * L^2 / 8          (ft-lb)
    V_max     = w * L / 2            (lb)
    delta_max = 5 * w * L^4 / (384 * E * I)
    S_req     = M / Fb'              (in^3)
    I_req for deflection limit L/n:  I = 5 * w * L^3 * n / (384 * E)

Dressed lumber sizes are actual dimensions per standard dressing
(nominal minus 1/2" up to 6", minus 3/4" above — e.g. 2x10 = 1.5 x 9.25).
"""

import argparse
import json
import sys

# Actual dressed dimensions (inches) for common nominal sizes.
DRESSED = {
    "2x4": (1.5, 3.5), "2x6": (1.5, 5.5), "2x8": (1.5, 7.25),
    "2x10": (1.5, 9.25), "2x12": (1.5, 11.25),
    "4x4": (3.5, 3.5), "4x6": (3.5, 5.5), "4x8": (3.5, 7.25),
    "4x10": (3.5, 9.25), "4x12": (3.5, 11.25),
    "6x6": (5.5, 5.5),
    # Common LVL widths x depths (verify against manufacturer literature)
    "1.75x9.25": (1.75, 9.25), "1.75x11.25": (1.75, 11.25),
    "1.75x11.875": (1.75, 11.875), "1.75x14": (1.75, 14.0),
    "1.75x16": (1.75, 16.0),
}


def section_props(size: str, plies: int):
    if size not in DRESSED:
        sys.exit(f"Unknown size '{size}'. Known: {', '.join(sorted(DRESSED))}. "
                 "For odd sizes pass dimensions as WxD in inches, e.g. 1.75x14.")
    b, d = DRESSED[size]
    b_total = b * plies
    area = b_total * d
    s = b_total * d ** 2 / 6.0
    i = b_total * d ** 3 / 12.0
    return {"size": size, "plies": plies, "b_in": b_total, "d_in": d,
            "area_in2": round(area, 2), "S_in3": round(s, 2), "I_in4": round(i, 2)}


def demand(span_ft, live_psf, dead_psf, spacing_in=None, trib_ft=None,
           point_lb=None, deflection_denominators=(240, 360, 480)):
    if (spacing_in is None) == (trib_ft is None):
        sys.exit("Provide exactly one of --spacing-in (joists/rafters) or "
                 "--trib-ft (beams/headers/girders).")
    trib = trib_ft if trib_ft is not None else spacing_in / 12.0
    w_total = (live_psf + dead_psf) * trib      # plf
    w_live = live_psf * trib
    L = span_ft
    m_max = w_total * L ** 2 / 8.0              # ft-lb
    v_max = w_total * L / 2.0                   # lb
    reaction = v_max
    note = None
    if point_lb:
        # Worst case for a single point load is mid-span: adds PL/4 to moment.
        m_max += point_lb * L / 4.0
        v_max += point_lb / 2.0
        reaction += point_lb / 2.0
        note = ("Point load included at mid-span (worst case). Point loads on "
                "beams are outside IRC prescriptive tables — engineer review "
                "required for the final member.")
    out = {
        "span_ft": L, "trib_width_ft": round(trib, 3),
        "w_total_plf": round(w_total, 1), "w_live_plf": round(w_live, 1),
        "M_max_ftlb": round(m_max, 0), "V_max_lb": round(v_max, 0),
        "reaction_each_end_lb": round(reaction, 0),
        # Required I to hit L/n under LIVE load (the usual governing check)
        # and under TOTAL load, both reported so the code-book limit can be
        # applied once read from IRC Table R301.7.
        "I_req_in4_live": {}, "I_req_in4_total": {},
        "S_req_note": ("S_req = M_max*12 / Fb' — compute once Fb' is read "
                       "from a verified source (NDS supplement / span table "
                       "footnotes with adjustment factors)."),
    }
    for n in deflection_denominators:
        # I = 5 w L^3 n / (384 E) with unit conversion: w plf -> lb/in /12,
        # L ft -> in *12. Consolidated: I = 5 * w * (L*12)^3 * n / (384 * E * 12)
        # E left symbolic; report I*E product so any E can be applied.
        # I_req = 5*w*(L_in)^3 * n / (384 * E * 12)  [in^4 given E in psi]
        L_in = L * 12.0
        coeff = 5.0 * w_live * L_in ** 3 * n / (384.0 * 12.0)
        coeff_total = 5.0 * w_total * L_in ** 3 * n / (384.0 * 12.0)
        out["I_req_in4_live"][f"L/{n}"] = f"{coeff:,.0f} / E(psi)"
        out["I_req_in4_total"][f"L/{n}"] = f"{coeff_total:,.0f} / E(psi)"
    if note:
        out["FLAG"] = note
    return out


def check(args):
    if not args.source or len(args.source.strip()) < 15:
        sys.exit(
            "REFUSING capacity check: --source citation missing or too vague.\n"
            "Design values (Fb, Fv, E) must be read from a verified document "
            "in this session (code book PDF, NDS supplement, manufacturer ESR) "
            "and cited like:\n  --source 'NDS 2018 Supp Table 4B, SYP No.2 "
            "2x10, user PDF p.37'\nNever supply values from memory."
        )
    props = section_props(args.size, args.plies)
    d = demand(args.span_ft, args.live_psf, args.dead_psf,
               spacing_in=args.spacing_in, trib_ft=args.trib_ft,
               point_lb=args.point_lb)
    m_in_lb = d["M_max_ftlb"] * 12.0
    fb_actual = m_in_lb / props["S_in3"]
    fv_actual = 1.5 * d["V_max_lb"] / props["area_in2"]
    L_in = args.span_ft * 12.0
    w_live_pli = d["w_live_plf"] / 12.0
    delta_live = 5.0 * w_live_pli * L_in ** 4 / (384.0 * args.e * props["I_in4"])
    result = {
        "design_values_source": args.source,
        "section": props, "demand": d,
        "fb_actual_psi": round(fb_actual, 0), "fb_allow_psi": args.fb,
        "bending_ratio": round(fb_actual / args.fb, 2),
        "fv_actual_psi": round(fv_actual, 0), "fv_allow_psi": args.fv,
        "shear_ratio": round(fv_actual / args.fv, 2),
        "delta_live_in": round(delta_live, 3),
        "delta_ratio_Ln": round(L_in / delta_live, 0) if delta_live else None,
        "PASS_bending": fb_actual <= args.fb,
        "PASS_shear": fv_actual <= args.fv,
        "NOTE": ("Fb must already include applicable NDS adjustment factors "
                 "(CD, CF, Cr, wet service, etc.) per the cited source. "
                 "Bearing, lateral stability, and connection design not "
                 "checked here. Preliminary sizing only — verify against the "
                 "adopted code table or engineer of record."),
    }
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    d = sub.add_parser("demand", help="Loads/moment/shear/required properties")
    d.add_argument("--span-ft", type=float, required=True)
    d.add_argument("--live-psf", type=float, required=True)
    d.add_argument("--dead-psf", type=float, required=True)
    d.add_argument("--spacing-in", type=float)
    d.add_argument("--trib-ft", type=float)
    d.add_argument("--point-lb", type=float)

    s = sub.add_parser("section", help="Section properties of a lumber size")
    s.add_argument("--size", required=True)
    s.add_argument("--plies", type=int, default=1)

    c = sub.add_parser("check", help="Capacity check (requires cited design values)")
    c.add_argument("--span-ft", type=float, required=True)
    c.add_argument("--live-psf", type=float, required=True)
    c.add_argument("--dead-psf", type=float, required=True)
    c.add_argument("--spacing-in", type=float)
    c.add_argument("--trib-ft", type=float)
    c.add_argument("--point-lb", type=float)
    c.add_argument("--size", required=True)
    c.add_argument("--plies", type=int, default=1)
    c.add_argument("--fb", type=float, required=True, help="Adjusted Fb' psi, from cited source")
    c.add_argument("--fv", type=float, required=True, help="Fv psi, from cited source")
    c.add_argument("--e", type=float, required=True, help="E psi, from cited source")
    c.add_argument("--source", required=True, help="Document/table/cell citation for the design values")

    args = p.parse_args()
    if args.cmd == "demand":
        out = demand(args.span_ft, args.live_psf, args.dead_psf,
                     spacing_in=args.spacing_in, trib_ft=args.trib_ft,
                     point_lb=args.point_lb)
    elif args.cmd == "section":
        out = section_props(args.size, args.plies)
    else:
        out = check(args)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
