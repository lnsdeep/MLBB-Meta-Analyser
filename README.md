# ⚔️ Mobile Legends: Bang Bang Meta Analyser & Analytics Suite

[![Daily Meta Sync](https://github.com/lnsdeep/MLBB-Meta-Analyser/actions/workflows/daily_meta_update.yml/badge.svg)](https://github.com/lnsdeep/MLBB-Meta-Analyser/actions/workflows/daily_meta_update.yml)
[![Live Web App](https://img.shields.io/badge/Web_App-GitHub_Pages-38bdf8?style=flat&logo=github)](https://lnsdeep.github.io/MLBB-Meta-Analyser/)
[![AI-Ready](https://img.shields.io/badge/LLM_Standard-llms.txt-34d399?style=flat)](https://lnsdeep.github.io/MLBB-Meta-Analyser/llms.txt)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)

An automated, official-data analytics engine and aesthetic web platform for **Mobile Legends: Bang Bang (MLBB)**. Reverse-engineered directly from Moonton's Game Management System (GMS), providing 100% official match statistics, tier rankings, counter matchups, team synergies, and 5v5 draft simulations refreshed daily via GitHub Actions.

🌐 **Live Web Application:** [https://lnsdeep.github.io/MLBB-Meta-Analyser/](https://lnsdeep.github.io/MLBB-Meta-Analyser/)  
🤖 **LLM Summary for AI Search:** [https://lnsdeep.github.io/MLBB-Meta-Analyser/llms.txt](https://lnsdeep.github.io/MLBB-Meta-Analyser/llms.txt)

---

## 🚀 Key Features

### 1. Aesthetic, Approachable Web Dashboard (Linear / Apple Inspired)
- **Zero "Gamer Clutter"**: Elegant dark slate interface (`#0b0f19`) with high-contrast typography (`Inter`), clean whitespace, and gentle color accents.
- **Beginner-Friendly**: Plain-English tooltips explaining *Win Rate*, *Ban Rate*, *Lanes (Gold, EXP, Roam)*, and *Counters*, making competitive data accessible even to players just learning the game.
- **Mobile-First & Ultra-Fast**: Loads in < 250ms with zero heavy bundlers; converts into a smooth bottom-sheet drawer on mobile phones with 48px+ touch targets and zero horizontal scroll overflow.

### 2. The 7 Specialized Gamer Tools
1. 🏆 **Visual Role & Lane Tier List Hub**: S+ to D tier buckets filterable by **Lane** (EXP, Mid, Gold, Roam, Jungle) and **Role** (Tank, Fighter, Assassin, Mage, Marksman, Support).
2. 📋 **High-Density Meta Table**: Tabular view with visual win/ban rate bars and sortable columns.
3. ⚔️ **Lane-Specific Counter Picker**: Select an enemy target pick and your lane to reveal top 5 hard counters with exact Win Rate Advantage % from official match records.
4. 🛡️ **5v5 Draft Analyzer (Statistical Win Advantage Model)**: Input 5 Ally vs 5 Enemy picks. Computes pairwise counter deltas, synergy bonuses, and team balance to output a **Predicted Draft Win Advantage %** ($\Delta W$) with tactical drafting advice.
5. 🤝 **Teammate Synergy Finder**: Select your ally's anchor champion to discover top duo/combo partners with statistical win-rate boosts.
6. 🚫 **Ban Priority Radar**: Employs the **Ban Urgency Index** to classify picks into **🚨 Priority Must-Bans**, **🤫 Sleeper Threats (Free Wins)**, and **⚠️ Over-Banned / Comfort Bans**.
7. 📈 **Patch Meta Movers & Trends**: Compares Today's win rates against the 7-day baseline to detect stealth buffs and emerging patch meta shifts.
8. 🌟 **Beginner Hero Matcher**: Interactive "Find My Hero" wizard filtering for forgiving heroes (Difficulty $\le 35$ & Win Rate $\ge 50\%$) with role explanations for new learners.

### 3. Zero-Leak Architecture (Scraper Protection)
- The web frontend is **100% decoupled** from Moonton's private endpoints.
- It runs purely on pre-generated, static JSON files in `data/processed/`.
- Casual visitors inspecting DevTools or Network tabs **only see static JSON**—zero HMAC-SHA1 signing code, zero tokens, and zero scraper endpoints are shipped to browser clients.

### 4. AI-First Maintainability & Search Optimization
- **Diagnostic CLI (`python -m scraper.diagnose`)**: 5-stage automated health check verifying Basev4 tokens, HMAC signatures, endpoints, and schema contracts in seconds.
- **AI Troubleshooting Runbook (`docs/AI_TROUBLESHOOTING.md`)**: Full reproduction steps, cURL templates, and patch recipes for future AI models or developers.
- **Google & Gemini Search Optimization**: Pre-rendered semantic HTML table, Schema.org JSON-LD (`WebApplication` + `Dataset`), `/llms.txt`, and permissive `robots.txt` welcoming `Googlebot` and `Google-Extended`.

---

## 📂 Project Structure

```
MLBB-Meta-Analyser/
├── index.html                       # Semantic, accessible HTML5 dashboard with pre-rendered fallback
├── favicon.svg                      # Vector shield favicon
├── robots.txt                       # Search & AI crawler rules (Googlebot, Gemini, GPTBot)
├── sitemap.xml                      # XML Sitemap
├── llms.txt                         # Modern LLM standard markdown meta summary
├── css/
│   ├── base.css                     # Design tokens, clean reset, typography, layout
│   ├── components.css               # Cards, badges, filter pills, search input, tooltips
│   ├── tools.css                    # 5v5 Draft Simulator, Ban radar, Counter picker styles
│   ├── modal.css                    # Hero dossier modal & mobile bottom sheet drawer
│   └── responsive.css               # Breakpoints for mobile (<640px), tablet, desktop
├── js/
│   ├── config.js                    # Relative base paths, roles, lanes, beginner descriptions
│   ├── dataService.js               # Resilient JSON loader with cache-busting & retry logic
│   ├── state.js                     # Central reactive state & URL parameter sync
│   ├── tierView.js                  # Visual Role & Lane Tier List Hub
│   ├── tableView.js                 # High-density sortable meta table
│   ├── counterTool.js               # Lane-filtered hard counter picker
│   ├── synergyTool.js               # Teammate duo combo finder
│   ├── draftSimulator.js            # 5v5 Draft Analyzer & Statistical Win Predictor
│   ├── banRadar.js                  # Ban Urgency Index (Must-Bans vs Sleepers)
│   ├── metaMovers.js                # Patch trend momentum (1D vs 7D/30D deltas)
│   ├── beginnerGuide.js             # "Find My Hero" wizard for new players
│   ├── heroModal.js                 # Hero dossier modal with skills, CD, counters, synergies
│   └── app.js                       # Main application orchestrator & event routing
├── data/
│   ├── processed/                   # Normalized web-ready JSON files
│   │   ├── heroes_catalog.json      # Canonical database of 134 heroes
│   │   ├── meta_summary.json        # Metadata summary & sync timestamps
│   │   ├── ranks/                   # 30 rank/timeframe slices (e.g. mythical_glory_1d.json)
│   │   └── matrices/                # Global Counter & Synergy lookup tables
│   └── exports/
│       ├── mlbb_meta_latest.csv     # Complete 3,990-row flat CSV
│       └── MLBB_META_REPORT.md      # Formatted Markdown report
├── scraper/
│   ├── config.py                    # Moonton API constants, IDs & endpoints
│   ├── signer.py                    # HMAC-SHA1 signature generator with enigma token
│   ├── client.py                    # Resilient HTTP client with retry logic
│   ├── parser.py                    # Data cleaner, merger, and tier calculator
│   ├── run_scraper.py               # Orchestrator with data integrity safety guards
│   └── diagnose.py                  # AI-first diagnostic CLI health-check
├── docs/
│   ├── AI_TROUBLESHOOTING.md        # Rapid diagnosis & patch runbook for AI models
│   ├── DEPLOYMENT_GUIDE.md          # GitHub Pages setup & daily workflow documentation
│   ├── API_SPECIFICATION.md         # Reverse-engineered Moonton API specification
│   ├── DATA_SCHEMA.md               # Detailed schema for all JSON & CSV files
│   └── ARCHITECTURE.md              # System roadmap & architecture
├── .github/
│   └── workflows/
│       └── daily_meta_update.yml    # Automated daily cron (02:00 UTC) + GitHub Pages deploy
├── requirements.txt                 # Python dependencies
└── README.md                        # Project documentation
```

---

## 🛠️ Setup & Local Usage

### 1. Prerequisites
- Python 3.10+ (Recommended: Python 3.12)
- Modern web browser

### 2. View the Web Dashboard Locally
```powershell
# Start local static server
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### 3. Run AI Diagnostics Health Check
Verify that Moonton's API endpoints, tokens, signatures, and CDN are operational:
```powershell
python -m scraper.diagnose
```

### 4. Run the Data Scraper Pipeline
Extract fresh data across all 30 rank combinations and update datasets:
```powershell
python -m scraper.run_scraper
```

---

## 📊 Sample Meta Highlights (Mythical Glory+, Past 1 Day)

| # | Hero | Roles | Lanes | Win Rate | Pick Rate | Ban Rate | Tier | Top Counters | Top Synergies |
|---|------|-------|-------|----------|-----------|----------|------|--------------|---------------|
| 1 | **Aulus** | Fighter | Jungle | 60.72% | 1.81% | 33.43% | **S+** | Chip, Silvanna, Zhask | Uranus, Cici, Harley |
| 2 | **Chip** | Support / Tank | Roam | 58.07% | 0.17% | 1.24% | **A** | Pharsa, Zilong, Lolita | Franco, Khaleed, Mathilda |
| 3 | **Masha** | Fighter / Tank | EXP Lane | 57.83% | 1.28% | 41.72% | **S** | Hilda, Khaleed, Lolita | Uranus, Gatotkaca, Pharsa |
| 4 | **Freya** | Fighter | EXP / Jungle | 57.48% | 0.95% | 3.47% | **A** | Yve, Gatotkaca, Lolita | Minsitthar, Luo Yi, Aldous |
| 5 | **Rafaela** | Support | Roam | 57.06% | 2.03% | 39.37% | **S** | Bane, Marcel, Lancelot | Hilda, Kalea, Gatotkaca |

---

## 🗺️ Roadmap Status

- [x] **Phase 1**: Reverse-engineer Moonton GMS API, HMAC-SHA1 signer, scraping engine, and JSON/CSV/Markdown data exports.
- [x] **Phase 2**: Build clean, aesthetic, mobile-responsive web dashboard with 7 specialized gamer tools, search, and beginner aids.
- [x] **Phase 3**: Configure automated daily scraping and GitHub Pages deployment via GitHub Actions with AI diagnostics and runbooks.

---

## 📄 License & Attribution
- Data extracted directly from Moonton's official Game Management System.
- Mobile Legends: Bang Bang and all associated hero portraits, names, and assets are trademarks of Moonton Technology.
- Project code licensed under the MIT License.
