"""
Mobile Viewport Horizontal Overflow Test Runner
Tests 6 mobile/tablet screen sizes across all 7 tools to verify zero unwanted horizontal scrollbars.
"""

import sys
import os
import re
import subprocess
import urllib.request

# Ensure UTF-8 stdout on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
]

def find_browser():
    for p in CHROME_PATHS:
        if os.path.exists(p):
            return p
    return None

def main():
    browser = find_browser()
    if not browser:
        print("[ERROR] Neither Google Chrome nor Microsoft Edge was found on the system.")
        sys.exit(1)

    url = "http://localhost:8000/tests/test_layout.html"
    print(f"[LAYOUT RUNNER] Testing mobile viewport overflow across all views using: {browser}")

    cmd = [
        browser,
        "--headless=new",
        "--dump-dom",
        "--virtual-time-budget=25000",
        "--run-all-compositor-stages-before-draw",
        url
    ]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=45)
        dom = proc.stdout
    except Exception as e:
        print(f"[ERROR] Failed running headless browser: {e}")
        sys.exit(1)

    match = re.search(r'id="layoutStatus"\s+data-passed="([^"]+)"\s+data-total="(\d+)"\s+data-failed="(\d+)"', dom)
    if not match:
        print("[ERROR] Could not find #layoutStatus in DOM output. Snippet:")
        print(dom[:2000])
        sys.exit(1)

    all_passed_str, total_str, failed_str = match.groups()
    all_passed = (all_passed_str.lower() == "true")
    total = int(total_str)
    failed = int(failed_str)
    passed = total - failed

    cards = re.findall(r'<div class="result-card (pass|fail)">\s*<div>\s*<strong>([^<]+)</strong>\s*<div[^>]*>([^<]+)</div>', dom)
    print("\n" + "=" * 65)
    print("MOBILE VIEWPORT & OVERFLOW TEST RESULTS")
    print("=" * 65)
    for status, name, details in cards:
        icon = "✓ PASS" if status == "pass" else "✗ FAIL"
        print(f"[{icon}] {name} -> {details}")

    print("-" * 65)
    print(f"TOTAL VIEWPORT CHECKS: {total} | PASSED: {passed} | FAILED: {failed}")
    print("=" * 65 + "\n")

    if all_passed and failed == 0:
        print("🎉 SUCCESS: ZERO horizontal overflow across all tested mobile resolutions!")
        sys.exit(0)
    else:
        print(f"❌ FAILURE: {failed} layout overflow issue(s) detected.")
        sys.exit(1)

if __name__ == "__main__":
    main()
