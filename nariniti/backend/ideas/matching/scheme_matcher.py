"""Scheme Matching Engine — weighted hybrid scoring."""
from __future__ import annotations
from typing import List, Dict


def _keyword_overlap(user_keywords: List[str], scheme_keywords: List[str]) -> float:
    if not user_keywords or not scheme_keywords:
        return 0.0
    u = {k.lower() for k in user_keywords}
    s = {k.lower() for k in scheme_keywords}
    intersection = u & s
    union = u | s
    return len(intersection) / len(union) if union else 0.0


def _capital_compatibility(user_capital, scheme_min, scheme_max) -> float:
    if user_capital is None:
        return 0.5
    if scheme_min is None and scheme_max is None:
        return 0.8
    if scheme_min is not None and user_capital < scheme_min * 0.5:
        return 0.1
    if scheme_max is not None and user_capital > scheme_max * 2:
        return 0.2
    if (scheme_min is None or user_capital >= scheme_min * 0.7) and \
       (scheme_max is None or user_capital <= scheme_max * 1.3):
        return 1.0
    return 0.5


def _state_match(user_location: str, scheme_state: str) -> float:
    if not scheme_state:
        return 1.0
    loc_lower = user_location.lower()
    state_lower = scheme_state.lower()
    if state_lower in loc_lower or loc_lower in state_lower:
        return 1.0
    aliases = {
        'mh': 'maharashtra', 'maharashtra': 'maharashtra',
        'dl': 'delhi', 'ka': 'karnataka', 'tn': 'tamil nadu',
        'gj': 'gujarat', 'rj': 'rajasthan', 'wb': 'west bengal',
        'up': 'uttar pradesh',
    }
    u_norm = aliases.get(loc_lower, loc_lower)
    s_norm = aliases.get(state_lower, state_lower)
    return 1.0 if u_norm == s_norm else 0.0


def _generate_reasons(profile: dict, scheme, scores: dict) -> List[str]:
    reasons = []
    if scores['sector'] >= 0.9:
        reasons.append(f"Matches your {profile.get('sector', '').replace('_', ' ')} sector")
    if scores['state'] >= 1.0 and not scheme.state:
        reasons.append("Available nationwide")
    elif scores['state'] >= 1.0:
        reasons.append(f"Available in {scheme.state}")
    if scheme.gender == 'female':
        reasons.append("Designed for women entrepreneurs")
    if scores['capital'] >= 0.9:
        reasons.append("Your investment level is within the supported range")
    if scores['keyword'] >= 0.3:
        reasons.append("Your business keywords align with this scheme")
    if profile.get('business_stage') in (scheme.business_stages or []):
        reasons.append(f"Suitable for {profile.get('business_stage', 'idea')} stage businesses")
    if not reasons:
        reasons.append("General entrepreneurship support scheme")
    return reasons


def match_schemes(profile: dict, schemes) -> List[Dict]:
    results = []
    user_sector = profile.get('sector', 'other')
    user_keywords = profile.get('keywords', [])
    user_capital = profile.get('capital')
    user_location = profile.get('location', '')
    user_stage = profile.get('business_stage', 'idea')

    for scheme in schemes:
        scores = {}
        scores['sector'] = 1.0 if scheme.sector == user_sector else (0.4 if scheme.sector == '' else 0.0)
        all_scheme_kws = list(scheme.sector_keywords or []) + [scheme.sector] + list(scheme.business_types or [])
        scores['keyword'] = _keyword_overlap(user_keywords, all_scheme_kws)
        scores['state'] = _state_match(user_location, scheme.state or '')
        scores['capital'] = _capital_compatibility(user_capital, scheme.min_capital, scheme.max_capital)
        scores['stage'] = 1.0 if user_stage in (scheme.business_stages or []) else 0.3
        gender_bonus = 0.1 if scheme.gender == 'female' else 0.0

        raw_score = (
            scores['keyword'] * 0.40 + scores['sector'] * 0.20 +
            scores['state'] * 0.15 + scores['capital'] * 0.10 +
            scores['stage'] * 0.05 + gender_bonus
        )
        match_score = min(round(raw_score * 100 / 1.1, 1), 100.0)
        if match_score < 15:
            continue

        results.append({
            'scheme': scheme, 'match_score': match_score,
            'semantic_score': round(scores['keyword'] * 100, 1),
            'rule_score': round((scores['sector'] * 0.20 + scores['state'] * 0.15 + scores['capital'] * 0.10 + scores['stage'] * 0.05) * 100, 1),
            'match_reasons': _generate_reasons(profile, scheme, scores),
        })

    results.sort(key=lambda x: x['match_score'], reverse=True)
    return results[:5]
