# ⚔️ Mobile Legends: Bang Bang Meta Analyser

An automated, high-performance data extraction engine and meta analytics suite for **Mobile Legends: Bang Bang (MLBB)**. Reverse-engineered directly from Moonton's official portal (`mobilelegends.com/rank`), extracting 100% official data, hero metrics, skills, counters, synergies, and HD visual assets without relying on any third-party websites.

---

## 🚀 Features

- **Direct Moonton API Extraction**: Eliminates the need for slow headless browsers by utilizing reverse-engineered HMAC-SHA1 signature authentication against Moonton's internal Game Management System (GMS).
- **Comprehensive Coverage**:
  - **5 Timeframes**: Past 1 day, 3 days, 7 days, 15 days, and 30 days.
  - **6 Rank Brackets**: ALL, Epic, Legend, Mythic, Mythical Honor, and Mythical Glory+.
  - **Dual Match Dynamics**: Official **Counter Heroes** (`match_type=0`) and **Teammate Synergies** (`match_type=1`).
- **Official Asset Repository**: Full catalog of all 134 MLBB heroes with official CDN HD portraits, skill names, descriptions, cooldowns, role tags, lanes, and difficulty ratings.
- **Multiple Output Formats**:
  - `data/processed/`: Normalized JSON slices optimized for web consumption.
  - `data/exports/mlbb_meta_latest.csv`: Complete flat CSV table (3,990 records) for spreadsheets and data science.
  - `data/exports/MLBB_META_REPORT.md`: Formatted Markdown report with executive tier list and highlight tables.
- **AI-Friendly Design**: Fully documented schemas and modular code structure enabling seamless continuation across AI conversations.

---

## 📂 Project Structure

```
MLBB-Meta-Analyser/
├── .venv/                         # Python 3.12 Virtual Environment
├── data/
│   ├── processed/                 # Normalized web-ready JSON files
│   │   ├── heroes_catalog.json    # Canonical database of 134 heroes
│   │   ├── meta_summary.json      # Metadata summary for fast loading
│   │   ├── ranks/                 # 30 rank/timeframe slices (e.g. mythical_glory_1d.json)
│   │   └── matrices/              # Global Counter & Synergy lookup graphs
│   └── exports/
│       ├── mlbb_meta_latest.csv   # Comprehensive 3,990-row CSV
│       └── MLBB_META_REPORT.md    # Formatted Markdown meta report
├── scraper/
│   ├── config.py                  # Moonton API constants, IDs & endpoints
│   ├── signer.py                  # HMAC-SHA1 signature generator with enigma token
│   ├── client.py                  # HTTP client with retry and error handling
│   ├── parser.py                  # Data cleaner and merger
│   └── run_scraper.py             # CLI orchestrator
├── docs/
│   ├── API_SPECIFICATION.md       # Reverse-engineered Moonton API specification
│   ├── DATA_SCHEMA.md             # Detailed schema for all JSON & CSV files
│   └── ARCHITECTURE.md            # System roadmap for Phase 2 & Phase 3
├── requirements.txt               # Dependencies
├── pyproject.toml                 # Project metadata
└── README.md                      # Project documentation
```

---

## 🛠️ Setup & Usage

### 1. Prerequisites
- Python 3.10+ (Recommended: Python 3.12 with `uv`)

### 2. Activate Virtual Environment
On Windows (PowerShell):
```powershell
.venv\Scripts\Activate.ps1
```
Or on Linux / macOS:
```bash
source .venv/bin/activate
```

### 3. Run the Scraper Pipeline
```powershell
python -m scraper.run_scraper
```
*Note: The pipeline extracts all 30 rank combinations and exports all files in approximately 40 seconds.*

---

## 📊 Sample Output (Mythical Glory+, Past 1 Day)

| # | Hero | Roles | Lanes | Win Rate | Pick Rate | Ban Rate | Tier | Top Counters | Top Synergies |
|---|------|-------|-------|----------|-----------|----------|------|--------------|---------------|
| 1 | Aulus | Fighter | Jungle | 60.72% | 1.81% | 33.43% | S+ | Chip, Silvanna, Zhask | Uranus, Cici, Harley |
| 2 | Chip | Support/Tank | Roam | 58.07% | 0.17% | 1.24% | A | Pharsa, Zilong, Lolita | Franco, Khaleed, Mathilda |
| 3 | Masha | Fighter/Tank | Exp Lane | 57.83% | 1.28% | 41.72% | S | Hilda, Khaleed, Lolita | Uranus, Gatotkaca, Pharsa |
| 4 | Freya | Fighter | Exp Lane/Jungle | 57.48% | 0.95% | 3.47% | A | Yve, Gatotkaca, Lolita | Minsitthar, Luo Yi, Aldous |
| 5 | Rafaela | Support | Roam | 57.06% | 2.03% | 39.37% | S | Bane, Marcel, Lancelot | Hilda, Kalea, Gatotkaca |

---

## 🗺️ Roadmap
- [x] **Phase 1**: Reverse engineer official API, Python environment setup, scraping engine, and data exports.
- [ ] **Phase 2**: Build modern, responsive GitHub Pages web dashboard with hero cards and filters.
- [ ] **Phase 3**: Configure automated daily scraping and deployment via GitHub Actions.
