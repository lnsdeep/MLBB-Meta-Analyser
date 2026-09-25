"""
HTTP Client for official Moonton CDN and GMS API.
Handles signed requests, retry logic, and error handling.
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional
import requests

from .config import (
    APP_ID,
    DEFAULT_HEADERS,
    GMS_BASE_URL,
    HERO_LIST_CDN_URL,
)
from .signer import MoontonSigner

logger = logging.getLogger(__name__)


class MoontonClient:
    """Client for querying Moonton CDN and signed GMS APIs."""

    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.signer = MoontonSigner(session=self.session)

    def fetch_hero_catalog(self) -> Dict[str, Any]:
        """
        Fetch the official hero database from Youngjoygame CDN.
        Contains all ~134 heroes with HD portrait URLs, skills, lanes, and roles.
        """
        logger.info(f"Fetching hero catalog from CDN: {HERO_LIST_CDN_URL}")
        resp = self.session.get(HERO_LIST_CDN_URL, headers=DEFAULT_HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        hero_list = data.get("hero_list", [])
        logger.info(f"Loaded {len(hero_list)} heroes from official catalog.")
        return data

    def fetch_rank_records(
        self,
        source_id: str,
        rank_code: str = "101",
        match_type: int = 0,
        page_size: int = 200,
        page_index: int = 1,
        max_retries: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Query rank data slice from Moonton GMS API.
        
        Args:
            source_id: Moonton data source ID (e.g. '2756567' for Past 1 day)
            rank_code: Rank filter code (e.g. '101' for ALL, '7' for Mythic)
            match_type: 0 for Counters, 1 for Synergies/Teammates
            page_size: Number of records per page (default 200 to capture all heroes in one call)
            page_index: Page index (default 1)
            max_retries: Retry attempts on network glitch
        """
        path = f"/api/gms/source/{APP_ID}/{source_id}"
        url = f"{GMS_BASE_URL}{path}"

        payload = {
            "pageSize": page_size,
            "pageIndex": page_index,
            "filters": [
                {"field": "bigrank", "operator": "eq", "value": str(rank_code)},
                {"field": "match_type", "operator": "eq", "value": int(match_type)},
            ],
            "sorts": [
                {"data": {"field": "main_hero_win_rate", "order": "desc"}, "type": "sequence"},
                {"data": {"field": "main_heroid", "order": "desc"}, "type": "sequence"},
            ],
            "fields": [
                "main_hero",
                "main_hero_appearance_rate",
                "main_hero_ban_rate",
                "main_hero_channel",
                "main_hero_win_rate",
                "main_heroid",
                "data.sub_hero.hero",
                "data.sub_hero.hero_channel",
                "data.sub_hero.increase_win_rate",
                "data.sub_hero.heroid",
            ],
        }

        # JSON body without extra spaces for signature match
        body_str = json.dumps(payload, separators=(",", ":"))

        for attempt in range(1, max_retries + 1):
            try:
                # Sign request
                auth_signature = self.signer.sign_request(
                    method="POST",
                    path=path,
                    query_string="",
                    body_string=body_str,
                )

                headers = {
                    **DEFAULT_HEADERS,
                    "Authorization": auth_signature,
                    "Content-Type": "application/json;charset=UTF-8",
                }

                resp = self.session.post(url, data=body_str.encode("utf-8"), headers=headers, timeout=15)
                resp.raise_for_status()
                res_json = resp.json()

                if res_json.get("code") != 0:
                    err_msg = res_json.get("message", "Unknown error")
                    logger.warning(f"Moonton API returned code {res_json.get('code')}: {err_msg} (Attempt {attempt}/{max_retries})")
                    # If signature or token expired, force refresh enigma
                    self.signer.get_enigma(force_refresh=True)
                    time.sleep(1)
                    continue

                records = res_json.get("data", {}).get("records", [])
                total = res_json.get("data", {}).get("total", len(records))
                logger.debug(f"Source {source_id}, Rank {rank_code}, MatchType {match_type}: fetched {len(records)}/{total} records.")
                return records

            except (requests.RequestException, ValueError) as exc:
                logger.warning(f"Error querying {url} (attempt {attempt}/{max_retries}): {exc}")
                if attempt == max_retries:
                    raise
                time.sleep(1.5 * attempt)

        return []
