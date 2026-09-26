import sys
import os
import re
import subprocess
import time
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

    print(f"[TEST RUNNER] Using browser: {browser}")

    # Ensure local server is reachable
    url = "http://localhost:8000/tests/unit_tests.html"
    try:
        req = urllib.request.urlopen(url, timeout=5)
        if req.status != 200:
            print(f"[ERROR] HTTP status {req.status} on {url}")
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Could not connect to local server at {url}: {e}")
        sys.exit(1)

    print(f"[TEST RUNNER] Running unit test suite at {url}...")
    cmd = [
        browser,
        "--headless=new",
        "--dump-dom",
        "--virtual-time-budget=6000",
        "--run-all-compositor-stages-before-draw",
        url
    ]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=25)
        dom = proc.stdout
    except Exception as e:
        print(f"[ERROR] Failed running headless browser: {e}")
        sys.exit(1)

    # Check for test results in DOM
    match = re.search(r'id="testStatus"\s+data-passed="([^"]+)"\s+data-total="(\d+)"\s+data-failed="(\d+)"', dom)
    if not match:
        print("[ERROR] Could not find #testStatus in DOM output. Raw snippet:")
        print(dom[:2000])
        sys.exit(1)

    all_passed_str, total_str, failed_str = match.groups()
    all_passed = (all_passed_str.lower() == "true")
    total = int(total_str)
    failed = int(failed_str)
    passed = total - failed

    # Extract individual test results with details
    test_items = re.findall(r'<div class="test-item (pass|fail)">\s*<span><strong>([^<]+)</strong>(?:<br/><small style="color: #f87171">([^<]+)</small>)?', dom)
    print("\n" + "=" * 60)
    print("MLBB META ANALYSER — AUTOMATED UNIT TEST SUITE RESULTS")
    print("=" * 60)
    for status, name, details in test_items:
        icon = "✓ PASS" if status == "pass" else "✗ FAIL"
        detail_msg = f" -> {details}" if details else ""
        print(f"[{icon}] {name}{detail_msg}")

    print("-" * 60)
    print(f"TOTAL: {total} | PASSED: {passed} | FAILED: {failed}")
    print("=" * 60 + "\n")

    if all_passed and failed == 0:
        print("🎉 SUCCESS: All unit tests passed perfectly!")
        sys.exit(0)
    else:
        print(f"❌ FAILURE: {failed} test(s) failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
