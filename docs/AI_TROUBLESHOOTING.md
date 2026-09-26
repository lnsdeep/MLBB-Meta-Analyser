# AI-First Troubleshooting & Maintenance Runbook

> **Target Audience**: AI Agents (Gemini, Claude, GPT, Antigravity) and Human Developers maintaining this project.
> **Purpose**: Rapidly diagnose and fix upstream changes from Moonton's internal Game Management System (`api.gms.moontontech.com`).

---

## 1. Quick Emergency Diagnostic

Run this command first to identify where the failure occurred:
```bash
python -m scraper.diagnose
```

### Diagnostic Output Interpretation
| Stage | Component | What to do if Failed |
|---|---|---|
| **Stage 1** | Basev4 & Enigma | Moonton changed the enigma key location or endpoint. Check `https://api.gms.moontontech.com/api/act/basev4?_t=<timestamp>` or inspect `https://mobilelegends.com/rank`. |
| **Stage 2** | HMAC-SHA1 Signer | Check message formatting in `scraper/signer.py`. Format must be: `METHOD\nPATH\nQUERY\nBODY`. |
| **Stage 3** | Rank API Query | Moonton updated the source ID or rank parameter. See Section 3 below. |
| **Stage 4** | Schema Contract | Moonton renamed fields in the JSON response (e.g. `main_heroid`, `main_hero_win_rate`). Update `scraper/parser.py`. |
| **Stage 5** | CDN Reachability | Network issue reaching Youngjoygame CDN (`akmweb.youngjoygame.com`). Check network/proxy. |

---

## 2. Reverse-Engineering Specifications

### 2.1 The Enigma Token & Basev4
- Endpoint: `GET https://api.gms.moontontech.com/api/act/basev4?_t={epoch_millis}`
- Headers:
  ```http
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
  Origin: https://mobilelegends.com
  Referer: https://mobilelegends.com/
  x-lang: 
  ```
- Response contains: `data.server.enigma` (a 32-character hex/hash string).

### 2.2 HMAC-SHA1 Signature Formula
Moonton requires an `authorization` header on all protected API queries:
```
message = METHOD.upper() + "\n" + PATH + "\n" + QUERY_STRING + "\n" + BODY_STRING
signature = Base64(HMAC-SHA1(key=enigma, message=message))
```
Sent as header: `authorization: <signature>`

### 2.3 Direct Reproduction with cURL
```bash
# 1. Fetch current enigma
curl -s "https://api.gms.moontontech.com/api/act/basev4?_t=$(date +%s%3N)" \
  -H "Origin: https://mobilelegends.com" \
  -H "Referer: https://mobilelegends.com/"

# 2. Query Rank List (e.g. ALL, Past 1 Day, source=2756567, rank=101)
# Note: Requires computing the HMAC-SHA1 signature using the enigma token obtained above.
```

---

## 3. How to Inspect Moonton's Frontend if Endpoints Change

If Moonton deploys a major website redesign:
1. Open Chrome DevTools at `https://mobilelegends.com/rank`.
2. Open the **Network** tab, filter by `Fetch/XHR`.
3. Look for calls to `api.gms.moontontech.com`:
   - Inspect the request headers for `authorization`, `x-lang`, and query params (`source`, `rank`, `match_type`).
4. Search for the JavaScript bundle (e.g. `app.*.js` or `chunk-vendors.*.js`) and search for string `"enigma"` or `"basev4"`.
5. Update constants in `scraper/config.py`.

---

## 4. Common Failure Scenarios & Patch Recipes

### Scenario A: Moonton updates timeframe `source` IDs
- Symptom: `Stage 3` fails with empty records or error code.
- Cause: Moonton rotates internal `source` IDs (e.g. `2756567`).
- Fix: Inspect the Network tab on `mobilelegends.com/rank` when clicking "1 day", "3 days", "7 days" and update `TIMEFRAME_SOURCES` in `scraper/config.py`.

### Scenario B: New Hero Added
- The scraper automatically discovers newly released heroes because `HERO_LIST_CDN_URL` is fetched dynamically every run. No code changes are required!

---

## 5. Fail-Safe Data Guarantee
The scraping pipeline in `scraper/run_scraper.py` includes validation guards:
- If a scrape fails or returns fewer than 50 heroes, it **will not overwrite** existing JSON files.
- The web application continues serving the previously verified data until the upstream issue is resolved.
