# Deployment & GitHub Pages Automation Guide

This guide explains how to deploy the **MLBB Meta Analyser** web platform, protect the scraper logic, and configure daily automated refreshing via GitHub Actions.

---

## 1. Zero-Leak Architecture

The web application is **100% decoupled** from Moonton's API:
- The website is a static HTML/CSS/JS single-page application.
- It loads pre-processed JSON datasets from `./data/processed/`.
- No Moonton endpoints, HMAC-SHA1 algorithms, or scraper code are delivered to browser clients.

---

## 2. GitHub Pages Setup

### Option 1: Native GitHub Pages Deployment (Recommended)
1. Go to your repository settings on GitHub: `Settings` > `Pages`.
2. Under **Build and deployment**:
   - Source: Select **GitHub Actions**.
3. When the daily workflow runs, it automatically builds and publishes the website to `https://<username>.github.io/<repository-name>/`.

### Option 2: Clean `gh-pages` Branch
If you prefer deploying from a dedicated branch where the scraper files are excluded:
1. The GitHub Action pushes *only* `index.html`, `css/`, `js/`, `data/`, and asset files to the `gh-pages` branch.
2. In `Settings` > `Pages`:
   - Source: **Deploy from a branch**
   - Branch: `gh-pages` / `/ (root)`
3. Casual visitors browsing the public website or `gh-pages` branch see only the frontend and static data.

---

## 3. GitHub Actions Daily Automation

The workflow file `.github/workflows/daily_meta_update.yml` runs:
1. **Daily at 02:00 UTC** (via cron schedule).
2. **On-demand** via the "Run workflow" button in the Actions tab.

### Required Repository Permissions:
Under `Settings` > `Actions` > `General` > `Workflow permissions`:
- Select **Read and write permissions** (allows the bot to commit updated `data/` and trigger Pages deployment).

---

## 4. Local Testing
To test the website locally with path safety:
```powershell
# Using Python's built-in HTTP server
python -m http.server 8000
```
Open your browser at `http://localhost:8000`.
