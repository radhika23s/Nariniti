"""Mentor Matching Engine."""
from __future__ import annotations
from typing import List, Dict


def _list_overlap_score(a: List[str], b: List[str]) -> float:
    if not a or not b:
        return 0.0
    a_lower = {x.lower() for x in a}
    b_lower = {x.lower() for x in b}
    matches = a_lower & b_lower
    return len(matches) / max(len(a_lower), len(b_lower))


def _location_score(user_location: str, mentor_state: str) -> float:
    if not mentor_state:
        return 0.5
    loc = user_location.lower()
    state = mentor_state.lower()
    if state in loc or loc in state:
        return 1.0
    aliases = {'mh': 'maharashtra', 'dl': 'delhi', 'ka': 'karnataka',
               'tn': 'tamil nadu', 'gj': 'gujarat', 'up': 'uttar pradesh'}
    return 1.0 if aliases.get(state, state) in loc else 0.1


def _generate_mentor_reasons(profile: dict, mentor) -> List[str]:
    reasons = []
    user_sector = profile.get('sector', '').replace('_', ' ')
    mentor_sectors = [s.lower() for s in (mentor.sectors or [])]
    if any(user_sector in s or s in user_sector for s in mentor_sectors):
        reasons.append(f"Expertise in {user_sector}")
    user_lang = profile.get('language', 'English')
    if user_lang in (mentor.languages or []):
        reasons.append(f"Speaks {user_lang}")
    if not reasons:
        reasons.append("General entrepreneurship mentor")
    return reasons


def match_mentors(profile: dict, mentors) -> List[Dict]:
    results = []
    user_sector = profile.get('sector', 'other')
    user_keywords = profile.get('keywords', [])
    user_location = profile.get('location', '')
    user_language = profile.get('language', 'English')
    user_stage = profile.get('business_stage', 'idea')

    for mentor in mentors:
        sector_score = _list_overlap_score(
            [user_sector] + user_keywords,
            list(mentor.sectors or []) + list(mentor.expertise or [])
        )
        lang_score = 1.0 if user_language in (mentor.languages or []) else (
            0.5 if 'English' in (mentor.languages or []) else 0.2
        )
        loc_score = _location_score(user_location, mentor.state or '')
        stage_score = 1.0 if user_stage in (mentor.business_stages or []) else 0.4
        exp_bonus = min(mentor.experience_years / 20, 1.0) * 0.1

        raw = sector_score * 0.35 + lang_score * 0.25 + loc_score * 0.20 + stage_score * 0.10 + exp_bonus
        match_score = min(round(raw * 100 / 0.9, 1), 100.0)
        if match_score < 20:
            continue

        results.append({
            'mentor': mentor, 'match_score': match_score,
            'match_reasons': _generate_mentor_reasons(profile, mentor),
        })

    results.sort(key=lambda x: x['match_score'], reverse=True)
    return results[:4]
