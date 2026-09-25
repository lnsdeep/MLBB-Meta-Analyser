"""
Configuration constants for Moonton GMS API and CDN endpoints.
All IDs and URLs are derived directly from the official Mobile Legends portal.
"""

from pathlib import Path

# Base Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
RANKS_DATA_DIR = PROCESSED_DATA_DIR / "ranks"
MATRICES_DATA_DIR = PROCESSED_DATA_DIR / "matrices"
EXPORTS_DIR = DATA_DIR / "exports"

# Official Moonton GMS API Settings
GMS_BASE_URL = "https://api.gms.moontontech.com"
APP_ID = "2669606"
ACT_ID = "2669607"

# Official CDN Endpoints
HERO_LIST_CDN_URL = "https://akmweb.youngjoygame.com/web/svnres/mlbb/homepage_2_1_41/latest/en_hero_list.json"
ACT_CONFIG_CDN_URL = "https://akmweb.youngjoygame.com/web/gms/act_2669607_7296bbbffb7bf64de9273d9bb800f5fd.json"

# Timeframe Source ID Mappings
TIMEFRAME_SOURCES = {
    "1d": {"id": "2756567", "name": "Past 1 day", "days": 1},
    "3d": {"id": "2756568", "name": "Past 3 days", "days": 3},
    "7d": {"id": "2756569", "name": "Past 7 days", "days": 7},
    "15d": {"id": "2756565", "name": "Past 15 days", "days": 15},
    "30d": {"id": "2756570", "name": "Past 30 days", "days": 30},
}

# Rank Filter Mappings (bigrank parameter)
RANK_FILTERS = {
    "all": {"code": "101", "name": "ALL"},
    "epic": {"code": "5", "name": "Epic"},
    "legend": {"code": "6", "name": "Legend"},
    "mythic": {"code": "7", "name": "Mythic"},
    "mythical_honor": {"code": "8", "name": "Mythical Honor"},
    "mythical_glory": {"code": "9", "name": "Mythical Glory+"},
}

# Match Type Mappings
MATCH_TYPES = {
    0: "counters",
    1: "synergies",
}

# Default HTTP User-Agent and Headers
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.mobilelegends.com",
    "Referer": "https://www.mobilelegends.com/",
    "x-actid": ACT_ID,
    "x-appid": APP_ID,
    "x-lang": "en",
}
