"""
AI-First Diagnostic Tool for Moonton GMS API
Tests all layers of the extraction pipeline to immediately pinpoint upstream changes.
Run with: python -m scraper.diagnose
"""

import sys
import time
from typing import Dict, Any
import requests

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from .client import MoontonClient
from .config import GMS_BASE_URL, RANK_FILTERS, TIMEFRAME_SOURCES
from .signer import MoontonSigner


def run_diagnostics() -> bool:
    print("=" * 65)
    print(" 🛠️  MLBB Moonton GMS API Diagnostics")
    print("=" * 65)
    passed = True

    # 1. Basev4 & Enigma Token Test
    print("\n[Stage 1/5] Testing Basev4 Endpoint & Enigma Token...")
    signer = MoontonSigner()
    try:
        start_t = time.time()
        enigma = signer.get_enigma(force_refresh=True)
        dur = (time.time() - start_t) * 1000
        if enigma and len(enigma) > 10:
            print(f"  ✅ SUCCESS: Enigma key fetched in {dur:.1f}ms")
            print(f"     Enigma token (truncated): {enigma[:8]}...{enigma[-4:]} (len: {len(enigma)})")
        else:
            print(f"  ❌ FAILED: Enigma key received but invalid: '{enigma}'")
            passed = False
    except Exception as e:
        print(f"  ❌ FAILED: Could not fetch enigma from basev4: {e}")
        passed = False

    # 2. HMAC-SHA1 Signature Test
    print("\n[Stage 2/5] Testing HMAC-SHA1 Signature Generator...")
    try:
        test_method = "GET"
        test_path = "/api/hero/rank"
        test_query = "source=2756567"
        sig = signer.sign_request(test_method, test_path, query_string=test_query)
        if sig and len(sig) == 28 and sig.endswith("="):
            print(f"  ✅ SUCCESS: Signature computed: {sig}")
        else:
            print(f"  ⚠️ WARNING: Signature generated with unexpected format: {sig}")
    except Exception as e:
        print(f"  ❌ FAILED: Signature generation error: {e}")
        passed = False

    # 3. Probe Rank API Query
    print("\n[Stage 3/5] Querying Sample Rank Slice (ALL, 1D)...")
    client = MoontonClient()
    sample_heroes = []
    try:
        start_t = time.time()
        source_id = TIMEFRAME_SOURCES["1d"]["id"]
        rank_code = RANK_FILTERS["all"]["code"]
        sample_heroes = client.fetch_rank_records(source_id=source_id, rank_code=rank_code)
        dur = (time.time() - start_t) * 1000

        print(f"  ✅ SUCCESS: Fetched {len(sample_heroes)} hero rank records in {dur:.1f}ms")
        if len(sample_heroes) < 100:
            print(f"  ⚠️ WARNING: Expected ~134 heroes, got {len(sample_heroes)}")
    except Exception as e:
        print(f"  ❌ FAILED: Rank API request error: {e}")
        passed = False

    # 4. Schema Contract Check
    print("\n[Stage 4/5] Checking Data Schema Contract...")
    if sample_heroes:
        hero = sample_heroes[0]
        hero_data = hero.get("data", hero)
        required_keys = ["main_heroid"]
        missing_keys = [k for k in required_keys if k not in hero_data]
        if not missing_keys:
            print("  ✅ SUCCESS: Core schema keys verified in record payload")
            print(f"     Record fields present: {list(hero_data.keys())[:8]}...")
            print(f"     Sample Hero ID: {hero_data.get('main_heroid')}")
        else:
            print(f"  ❌ FAILED: Schema changed! Missing expected keys: {missing_keys}")
            print(f"     Actual keys present: {list(hero_data.keys())}")
            passed = False
    else:
        print("  ❌ SKIPPED: No records available from stage 3 to validate schema")
        passed = False

    # 5. Moonton Official CDN Reachability
    print("\n[Stage 5/5] Testing Moonton CDN Asset Reachability...")
    sample_cdn_url = "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_da894b37bfb5cadb32307f371f31918a.png"
    try:
        head_res = requests.head(sample_cdn_url, timeout=5)
        if head_res.status_code == 200:
            content_len = head_res.headers.get("Content-Length", "unknown")
            print(f"  ✅ SUCCESS: Moonton CDN reachable (HTTP 200, length: {content_len} bytes)")
        else:
            print(f"  ⚠️ WARNING: CDN returned HTTP {head_res.status_code}")
    except Exception as e:
        print(f"  ❌ FAILED: Could not reach Moonton CDN: {e}")
        passed = False

    print("\n" + "=" * 65)
    if passed:
        print(" 🎉 ALL DIAGNOSTICS PASSED! Moonton GMS API is fully operational.")
    else:
        print(" ❌ DIAGNOSTICS FAILED! Review error stages above.")
        print(" Refer to docs/AI_TROUBLESHOOTING.md for rapid recovery steps.")
    print("=" * 65)
    return passed


if __name__ == "__main__":
    success = run_diagnostics()
    sys.exit(0 if success else 1)
