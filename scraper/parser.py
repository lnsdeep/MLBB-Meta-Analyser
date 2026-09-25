"""
Data normalization, enrichment, and formatting parser.
Merges official hero catalog with live GMS rank metrics.
"""

import re
from typing import Any, Dict, List, Optional, Tuple


def strip_html(html_str: str) -> str:
    """Remove HTML tags (like <font ...>) from skill descriptions."""
    if not html_str:
        return ""
    clean = re.sub(r"<[^>]+>", "", html_str)
    return clean.strip()


def calculate_meta_score(win_rate: float, pick_rate: float, ban_rate: float) -> Tuple[float, str]:
    """
    Compute a normalized Meta Score (0 - 100) and assign a Tier:
    Weightings: Win Rate (50%), Ban Rate (30%), Pick Rate (20%).
    """
    # Baseline win rate around 50%
    wr_factor = max(0.0, (win_rate - 0.40) / 0.20) * 50.0  # 40% to 60% maps to 0-50
    br_factor = min(1.0, ban_rate / 0.50) * 30.0           # 0% to 50% ban rate maps to 0-30
    pr_factor = min(1.0, pick_rate / 0.05) * 20.0          # 0% to 5% pick rate maps to 0-20

    score = round(wr_factor + br_factor + pr_factor, 1)

    if score >= 75:
        tier = "S+"
    elif score >= 60:
        tier = "S"
    elif score >= 45:
        tier = "A"
    elif score >= 30:
        tier = "B"
    elif score >= 20:
        tier = "C"
    else:
        tier = "D"

    return score, tier


class DataParser:
    """Parses and normalizes hero and rank data."""

    def __init__(self, hero_catalog: Optional[Dict[str, Any]] = None):
        self.heroes_by_id: Dict[int, Dict[str, Any]] = {}
        self.heroes_by_name: Dict[str, Dict[str, Any]] = {}

        if hero_catalog:
            self.load_hero_catalog(hero_catalog)

    def load_hero_catalog(self, catalog_data: Dict[str, Any]):
        """Load and index the official hero database."""
        raw_list = catalog_data.get("hero_list", [])
        for hero in raw_list:
            hid = hero.get("heroid")
            if not hid:
                continue

            # Clean roles and lanes
            roles = [r for r in hero.get("sortlabel", []) if r]
            lanes = [l for l in hero.get("roadsortlabel", []) if l]
            speciality = [s for s in hero.get("speciality", []) if s]

            # Clean skills
            cleaned_skills = []
            skill_groups = hero.get("heroskilllist", [])
            if skill_groups and isinstance(skill_groups, list):
                skills = skill_groups[0].get("skilllist", [])
                for sk in skills:
                    cleaned_skills.append({
                        "id": sk.get("skillid"),
                        "name": sk.get("skillname"),
                        "desc": strip_html(sk.get("skilldesc", "")),
                        "cost": sk.get("skillcd&cost", ""),
                        "icon": sk.get("skillicon", ""),
                        "tags": [t.get("tagname") for t in sk.get("skilltag", []) if t.get("tagname")],
                    })

            normalized_hero = {
                "heroid": hid,
                "name": hero.get("name"),
                "roles": roles,
                "lanes": lanes,
                "speciality": speciality,
                "difficulty": hero.get("difficulty"),
                "head": hero.get("head"),
                "smallmap": hero.get("smallmap"),
                "painting": hero.get("painting"),
                "skills": cleaned_skills,
            }

            self.heroes_by_id[hid] = normalized_hero
            if hero.get("name"):
                self.heroes_by_name[hero["name"].lower()] = normalized_hero

    def clean_sub_heroes(self, sub_heroes: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """Resolve sub-heroes (counters or synergies) with official names and headshots."""
        if not sub_heroes:
            return []
        result = []
        for sub in sub_heroes:
            if not isinstance(sub, dict):
                continue
            sid = sub.get("heroid")
            increase = sub.get("increase_win_rate", 0.0) or 0.0

            # Try to resolve hero info
            cached = self.heroes_by_id.get(sid, {})
            name = cached.get("name") or sub.get("hero", {}).get("data", {}).get("name") or f"Hero #{sid}"
            head = cached.get("head") or sub.get("hero", {}).get("data", {}).get("head") or ""

            result.append({
                "heroid": sid,
                "name": name,
                "head": head,
                "increase_win_rate": increase,
                "increase_win_rate_pct": round(increase * 100, 2),
            })
        return result

    def merge_rank_slice(
        self,
        counter_records: List[Dict[str, Any]],
        synergy_records: List[Dict[str, Any]],
        timeframe_key: str,
        rank_key: str,
        timeframe_name: str,
        rank_name: str,
    ) -> List[Dict[str, Any]]:
        """
        Merge counter and synergy records for a single timeframe and rank slice.
        """
        # Map synergies by heroid
        synergies_by_id: Dict[int, List[Dict[str, Any]]] = {}
        for rec in synergy_records:
            d = rec.get("data", {})
            hid = d.get("main_heroid")
            if hid:
                synergies_by_id[hid] = self.clean_sub_heroes(d.get("sub_hero") or [])

        merged_list = []
        for rec in counter_records:
            d = rec.get("data", {})
            hid = d.get("main_heroid")

            # Filter out dummy/test heroes (e.g. heroid 296 with 0 appearances)
            appearance = d.get("main_hero_appearance_rate", 0.0) or 0.0
            if not hid or (appearance == 0.0 and hid not in self.heroes_by_id):
                continue

            hero_info = self.heroes_by_id.get(hid, {})
            name = hero_info.get("name") or d.get("main_hero", {}).get("data", {}).get("name")
            if not name:
                continue

            head = hero_info.get("head") or d.get("main_hero", {}).get("data", {}).get("head") or ""
            win_rate = d.get("main_hero_win_rate", 0.0) or 0.0
            ban_rate = d.get("main_hero_ban_rate", 0.0) or 0.0
            pick_rate = appearance

            score, tier = calculate_meta_score(win_rate, pick_rate, ban_rate)
            counters = self.clean_sub_heroes(d.get("sub_hero") or [])
            synergies = synergies_by_id.get(hid, [])

            merged_list.append({
                "heroid": hid,
                "name": name,
                "head": head,
                "roles": hero_info.get("roles", []),
                "lanes": hero_info.get("lanes", []),
                "win_rate": round(win_rate, 6),
                "win_rate_pct": round(win_rate * 100, 2),
                "pick_rate": round(pick_rate, 6),
                "pick_rate_pct": round(pick_rate * 100, 2),
                "ban_rate": round(ban_rate, 6),
                "ban_rate_pct": round(ban_rate * 100, 2),
                "meta_score": score,
                "tier": tier,
                "timeframe": timeframe_key,
                "timeframe_name": timeframe_name,
                "rank": rank_key,
                "rank_name": rank_name,
                "counters": counters,
                "synergies": synergies,
            })

        # Sort by Win Rate descending by default
        merged_list.sort(key=lambda x: x["win_rate"], reverse=True)

        # Assign ranking index (1, 2, 3...)
        for idx, item in enumerate(merged_list, start=1):
            item["ranking"] = idx

        return merged_list
