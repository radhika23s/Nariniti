"""NGO Matching Engine."""
from __future__ import annotations
from typing import List, Dict


def _overlap(a: List[str], b: List[str]) -> float:
    if not a or not b:
        return 0.0
    a_s = {x.lower() for x in a}
    b_s = {x.lower() for x in b}
    return len(a_s & b_s) / max(len(a_s), len(b_s))


def _ngo_location_score(user_location: str, ngo_state: str) -> float:
    if not ngo_state:
        return 0.6
    loc = user_location.lower()
    state = ngo_state.lower()
    return 1.0 if (state in loc or loc in state) else 0.0


def _generate_ngo_reasons(profile: dict, ngo) -> List[str]:
    reasons = []
    if ngo.women_support:
        reasons.append("Supports women entrepreneurs")
    if ngo.entrepreneurship_support:
        reasons.append("Provides entrepreneurship support")
    focus = [f.lower() for f in (ngo.focus_areas or [])]
    sector = profile.get('sector', '').replace('_', ' ').lower()
    if any(sector in f or f in sector for f in focus):
        reasons.append(f"Focus on {sector} sector")
    if not reasons:
        reasons.append("General women support organization")
    return reasons


def match_ngos(profile: dict, ngos) -> List[Dict]:
    results = []
    user_location = profile.get('location', '')
    user_sector = profile.get('sector', 'other')
    user_keywords = profile.get('keywords', [])
    user_language = profile.get('language', 'English')

    for ngo in ngos:
        loc_score = _ngo_location_score(user_location, ngo.state or '')
        focus_score = _overlap(
            [user_sector.replace('_', ' ')] + user_keywords,
            list(ngo.focus_areas or []) + list(ngo.services or [])
        )
        women_bonus = 0.20 if ngo.women_support else 0.0
        ent_bonus = 0.10 if ngo.entrepreneurship_support else 0.0
        lang_score = 0.10 if user_language in (ngo.languages or []) else 0.05

        raw = loc_score * 0.30 + focus_score * 0.30 + women_bonus + ent_bonus + lang_score
        match_score = min(round(raw * 100 / 0.95, 1), 100.0)
        if match_score < 20:
            continue

        results.append({
            'ngo': ngo, 'match_score': match_score,
            'match_reasons': _generate_ngo_reasons(profile, ngo),
        })

    results.sort(key=lambda x: x['match_score'], reverse=True)
    return results[:4]
