"""
Main scraper orchestrator.
Executes the extraction pipeline across all official Moonton MLBB endpoints,
merges datasets, and exports clean JSON, CSV, and Markdown files.
"""

from datetime import datetime, timezone
import json
import logging
import sys
import time
from typing import Any, Dict, List
import pandas as pd
from tabulate import tabulate

from .client import MoontonClient
from .config import (
    DATA_DIR,
    EXPORTS_DIR,
    MATRICES_DATA_DIR,
    PROCESSED_DATA_DIR,
    RANKS_DATA_DIR,
    RANK_FILTERS,
    TIMEFRAME_SOURCES,
)
from .parser import DataParser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


def ensure_directories():
    """Ensure all storage directories exist."""
    for folder in [DATA_DIR, PROCESSED_DATA_DIR, RANKS_DATA_DIR, MATRICES_DATA_DIR, EXPORTS_DIR]:
        folder.mkdir(parents=True, exist_ok=True)


def export_markdown_report(all_slices: Dict[str, List[Dict[str, Any]]], catalog: Dict[str, Any], filepath: str):
    """Generate a comprehensive, human & AI-friendly Markdown meta report."""
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Select representative slices for report highlights
    mythic_glory_1d = all_slices.get("mythical_glory_1d", [])
    mythic_1d = all_slices.get("mythic_1d", [])
    all_7d = all_slices.get("all_7d", [])

    lines = [
        "# Mobile Legends: Bang Bang — Official Meta & Rank Analytics Report",
        f"\n**Generated At:** `{now_utc}`  ",
        "**Data Source:** Official Moonton MLBB GMS API & Youngjoy CDN  ",
        "**Scope:** 134 Heroes | 5 Timeframes (1, 3, 7, 15, 30 days) | 6 Rank Brackets (All, Epic, Legend, Mythic, Honor, Glory+)  \n",
        "---",
        "\n## 1. Executive Summary: Mythical Glory+ Meta (Past 1 Day)",
        "Top performing heroes in the highest competitive rank bracket:\n",
    ]

    # Glory Top 15 Table
    glory_rows = []
    for h in mythic_glory_1d[:15]:
        counters_str = ", ".join([c["name"] for c in h.get("counters", [])[:3]])
        synergies_str = ", ".join([s["name"] for s in h.get("synergies", [])[:3]])
        glory_rows.append([
            h["ranking"],
            h["name"],
            "/".join(h["roles"]) if h["roles"] else "-",
            "/".join(h["lanes"]) if h["lanes"] else "-",
            f"{h['win_rate_pct']:.2f}%",
            f"{h['pick_rate_pct']:.2f}%",
            f"{h['ban_rate_pct']:.2f}%",
            h["tier"],
            counters_str,
            synergies_str,
        ])

    glory_headers = ["#", "Hero", "Roles", "Lanes", "Win Rate", "Pick Rate", "Ban Rate", "Tier", "Top Counters", "Top Synergies"]
    lines.append(tabulate(glory_rows, headers=glory_headers, tablefmt="github"))

    # Top Ban Rates in Mythic
    lines.append("\n## 2. Most Banned Heroes (Priority Bans in Mythic)")
    lines.append("Heroes with the highest ban rates in Mythic matches:\n")

    sorted_by_ban = sorted(mythic_1d, key=lambda x: x["ban_rate"], reverse=True)
    ban_rows = []
    for idx, h in enumerate(sorted_by_ban[:10], start=1):
        ban_rows.append([
            idx,
            h["name"],
            "/".join(h["roles"]),
            f"{h['ban_rate_pct']:.2f}%",
            f"{h['win_rate_pct']:.2f}%",
            f"{h['pick_rate_pct']:.2f}%",
            h["tier"],
        ])

    ban_headers = ["#", "Hero", "Role", "Ban Rate", "Win Rate", "Pick Rate", "Tier"]
    lines.append(tabulate(ban_rows, headers=ban_headers, tablefmt="github"))

    # Top Pick Rates Overall (Past 7 Days)
    lines.append("\n## 3. Most Popular Heroes (Highest Pick Rates Across All Ranks, 7 Days)")
    sorted_by_pick = sorted(all_7d, key=lambda x: x["pick_rate"], reverse=True)
    pick_rows = []
    for idx, h in enumerate(sorted_by_pick[:10], start=1):
        pick_rows.append([
            idx,
            h["name"],
            "/".join(h["roles"]),
            f"{h['pick_rate_pct']:.2f}%",
            f"{h['win_rate_pct']:.2f}%",
            f"{h['ban_rate_pct']:.2f}%",
            h["tier"],
        ])

    pick_headers = ["#", "Hero", "Role", "Pick Rate", "Win Rate", "Ban Rate", "Tier"]
    lines.append(tabulate(pick_rows, headers=pick_headers, tablefmt="github"))

    lines.append("\n---")
    lines.append("\n*Generated automatically by MLBB Meta Analyser Pipeline.*")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    logger.info(f"Markdown report generated at: {filepath}")


def run_full_pipeline():
    """Main execution orchestrator."""
    start_time = time.time()
    ensure_directories()
    client = MoontonClient()

    # 1. Fetch & parse official hero catalog
    raw_catalog = client.fetch_hero_catalog()
    parser = DataParser(hero_catalog=raw_catalog)

    # Save normalized hero catalog
    catalog_path = PROCESSED_DATA_DIR / "heroes_catalog.json"
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(list(parser.heroes_by_id.values()), f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(parser.heroes_by_id)} normalized heroes to {catalog_path}")

    # 2. Iterate through all timeframes & ranks
    all_slices: Dict[str, List[Dict[str, Any]]] = {}
    flat_rows: List[Dict[str, Any]] = []

    counters_matrix: Dict[int, List[Dict[str, Any]]] = {}
    synergies_matrix: Dict[int, List[Dict[str, Any]]] = {}

    total_slices = len(TIMEFRAME_SOURCES) * len(RANK_FILTERS)
    current_slice = 0

    for tf_key, tf_info in TIMEFRAME_SOURCES.items():
        source_id = tf_info["id"]
        tf_name = tf_info["name"]

        for rank_key, rank_info in RANK_FILTERS.items():
            current_slice += 1
            rank_code = rank_info["code"]
            rank_name = rank_info["name"]
            slice_key = f"{rank_key}_{tf_key}"

            logger.info(f"[{current_slice}/{total_slices}] Scraping {rank_name} ({tf_name}) ...")

            # Fetch Counters (match_type=0)
            counter_records = client.fetch_rank_records(
                source_id=source_id,
                rank_code=rank_code,
                match_type=0,
            )

            # Fetch Synergies (match_type=1)
            synergy_records = client.fetch_rank_records(
                source_id=source_id,
                rank_code=rank_code,
                match_type=1,
            )

            # Merge and normalize
            merged = parser.merge_rank_slice(
                counter_records=counter_records,
                synergy_records=synergy_records,
                timeframe_key=tf_key,
                rank_key=rank_key,
                timeframe_name=tf_name,
                rank_name=rank_name,
            )

            all_slices[slice_key] = merged

            # Save per-slice JSON
            slice_file = RANKS_DATA_DIR / f"{slice_key}.json"
            with open(slice_file, "w", encoding="utf-8") as f:
                json.dump(merged, f, indent=2, ensure_ascii=False)

            # Collect for flat CSV
            for h in merged:
                counters = h.get("counters", [])
                synergies = h.get("synergies", [])

                # Update matrices (using latest 1d ALL rank as baseline)
                if tf_key == "1d" and rank_key == "all":
                    counters_matrix[h["heroid"]] = counters
                    synergies_matrix[h["heroid"]] = synergies

                flat_rows.append({
                    "timeframe": tf_key,
                    "timeframe_name": tf_name,
                    "rank": rank_key,
                    "rank_name": rank_name,
                    "ranking": h["ranking"],
                    "heroid": h["heroid"],
                    "name": h["name"],
                    "roles": ", ".join(h["roles"]),
                    "lanes": ", ".join(h["lanes"]),
                    "win_rate_pct": h["win_rate_pct"],
                    "pick_rate_pct": h["pick_rate_pct"],
                    "ban_rate_pct": h["ban_rate_pct"],
                    "meta_score": h["meta_score"],
                    "tier": h["tier"],
                    "counter_1": counters[0]["name"] if len(counters) > 0 else "",
                    "counter_2": counters[1]["name"] if len(counters) > 1 else "",
                    "counter_3": counters[2]["name"] if len(counters) > 2 else "",
                    "counter_4": counters[3]["name"] if len(counters) > 3 else "",
                    "counter_5": counters[4]["name"] if len(counters) > 4 else "",
                    "synergy_1": synergies[0]["name"] if len(synergies) > 0 else "",
                    "synergy_2": synergies[1]["name"] if len(synergies) > 1 else "",
                    "synergy_3": synergies[2]["name"] if len(synergies) > 2 else "",
                    "synergy_4": synergies[3]["name"] if len(synergies) > 3 else "",
                    "synergy_5": synergies[4]["name"] if len(synergies) > 4 else "",
                    "avatar_url": h["head"],
                })

            time.sleep(0.1)  # Gentle delay between slices

    # 3. Save Matrix files
    with open(MATRICES_DATA_DIR / "counters_matrix.json", "w", encoding="utf-8") as f:
        json.dump(counters_matrix, f, indent=2, ensure_ascii=False)

    with open(MATRICES_DATA_DIR / "synergies_matrix.json", "w", encoding="utf-8") as f:
        json.dump(synergies_matrix, f, indent=2, ensure_ascii=False)

    # 4. Save metadata summary (for fast frontend loading)
    summary_data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "total_heroes": len(parser.heroes_by_id),
        "timeframes": TIMEFRAME_SOURCES,
        "ranks": RANK_FILTERS,
        "slices_available": list(all_slices.keys()),
    }
    with open(PROCESSED_DATA_DIR / "meta_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)

    # 5. Export comprehensive CSV
    csv_path = EXPORTS_DIR / "mlbb_meta_latest.csv"
    df = pd.DataFrame(flat_rows)
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    logger.info(f"Exported CSV with {len(flat_rows)} records to {csv_path}")

    # 6. Export Markdown report
    report_path = EXPORTS_DIR / "MLBB_META_REPORT.md"
    export_markdown_report(all_slices, parser.heroes_by_id, str(report_path))

    duration = round(time.time() - start_time, 2)
    logger.info(f"Pipeline completed successfully in {duration} seconds!")


if __name__ == "__main__":
    run_full_pipeline()
