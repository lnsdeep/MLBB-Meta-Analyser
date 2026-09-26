/**
 * MLBB Meta Analyser - Ban Priority Radar
 * Classifies heroes into Must-Bans, Situational/Over-Banned, and Sleeper Threats
 * using the statistical Ban Urgency Index (BUI).
 */

import { openHeroModal } from './heroModal.js';

// Module state for Ban Radar view
let banState = {
  searchQuery: '',
  activeMobileTab: 'must' // 'must', 'sleeper', 'over', 'all'
};

/**
 * Pure classification and filtering logic for ban categories
 */
export function classifyBanCategories(heroesList, searchQuery = '') {
  if (!Array.isArray(heroesList)) {
    return { mustBans: [], overBans: [], sleeperThreats: [], searchedHero: null };
  }

  const q = (searchQuery || '').trim().toLowerCase();

  // Find exact or closest matching hero in general dataset for draft safety feedback
  let searchedHero = null;
  if (q) {
    searchedHero = heroesList.find(h => h.name.toLowerCase() === q) ||
                   heroesList.find(h => h.name.toLowerCase().startsWith(q)) ||
                   heroesList.find(h => h.name.toLowerCase().includes(q)) || null;
  }

  const matchSearch = (hero) => {
    if (!q) return true;
    const nameMatch = hero.name.toLowerCase().includes(q);
    const roleMatch = hero.roles && hero.roles.some(r => r.toLowerCase().includes(q));
    const laneMatch = hero.lanes && hero.lanes.some(l => l.toLowerCase().includes(q));
    return nameMatch || roleMatch || laneMatch;
  };

  const filteredList = heroesList.filter(matchSearch);

  // 1. Must-Bans: Ban rate >= 15% AND Win rate >= 52%
  const mustBans = filteredList
    .filter(h => h.ban_rate_pct >= 15.0 && h.win_rate_pct >= 52.0)
    .sort((a, b) => (b.ban_rate_pct * b.win_rate_pct) - (a.ban_rate_pct * a.win_rate_pct));

  // 2. Over-Banned / Comfort Bans: Ban rate >= 10% but Win rate < 50%
  const overBans = filteredList
    .filter(h => h.ban_rate_pct >= 10.0 && h.win_rate_pct < 50.0)
    .sort((a, b) => b.ban_rate_pct - a.ban_rate_pct);

  // 3. Sleeper Threats: Win rate >= 54% but Ban rate < 10% (Free unbanned wins)
  const sleeperThreats = filteredList
    .filter(h => h.win_rate_pct >= 54.0 && h.ban_rate_pct < 10.0)
    .sort((a, b) => b.win_rate_pct - a.win_rate_pct);

  return { mustBans, overBans, sleeperThreats, searchedHero };
}

/**
 * Render Ban Priority Radar with Mobile Segmented Control & Live Search
 */
export function renderBanRadar(container, heroesList) {
  if (!container) return;

  function updateView() {
    const { mustBans, overBans, sleeperThreats, searchedHero } = classifyBanCategories(heroesList, banState.searchQuery);
    const q = banState.searchQuery.trim();
    const hasSearch = q.length > 0;
    const allCategoriesEmpty = mustBans.length === 0 && overBans.length === 0 && sleeperThreats.length === 0;

    container.innerHTML = `
      <div class="tool-section ban-radar-container">
        <div class="tool-header-block">
          <div class="tool-title-group">
            <h2>🚫 Ban Priority Radar</h2>
            <p>Don't waste bans on outdated picks. Our Ban Urgency Index reveals real meta threats vs comfort bans.</p>
          </div>
        </div>

        <!-- Story 5.2: Radar Toolbar with Search Lookup & Mobile Segmented Switcher -->
        <div class="ban-radar-toolbar">
          <div class="ban-search-box">
            <span class="ban-search-icon">🔍</span>
            <input
              type="text"
              id="banHeroSearchInput"
              class="ban-search-input"
              placeholder="Check hero ban priority (e.g. Ling, Fanny)..."
              value="${escapeHtml(banState.searchQuery)}"
              autocomplete="off"
            />
            <button
              id="banSearchClearBtn"
              class="ban-search-clear ${hasSearch ? '' : 'hidden'}"
              title="Clear search"
              aria-label="Clear search"
            >✕</button>
          </div>

          <!-- Mobile Segmented Switcher (Visible on < 768px) -->
          <div class="ban-mobile-tabs" id="banMobileTabs" role="tablist">
            <button class="ban-tab-btn ${banState.activeMobileTab === 'must' ? 'active' : ''}" data-tab="must" role="tab" aria-selected="${banState.activeMobileTab === 'must'}">
              🚨 Must-Bans <span class="tab-count-badge">${mustBans.length}</span>
            </button>
            <button class="ban-tab-btn ${banState.activeMobileTab === 'sleeper' ? 'active' : ''}" data-tab="sleeper" role="tab" aria-selected="${banState.activeMobileTab === 'sleeper'}">
              🤫 Sleepers <span class="tab-count-badge">${sleeperThreats.length}</span>
            </button>
            <button class="ban-tab-btn ${banState.activeMobileTab === 'over' ? 'active' : ''}" data-tab="over" role="tab" aria-selected="${banState.activeMobileTab === 'over'}">
              ⚠️ Traps <span class="tab-count-badge">${overBans.length}</span>
            </button>
            <button class="ban-tab-btn ${banState.activeMobileTab === 'all' ? 'active' : ''}" data-tab="all" role="tab" aria-selected="${banState.activeMobileTab === 'all'}">
              All
            </button>
          </div>
        </div>

        ${hasSearch && allCategoriesEmpty && searchedHero ? `
          <div class="ban-safe-notice">
            <div class="ban-safe-icon">🛡️</div>
            <div class="ban-safe-content">
              <div class="ban-safe-title"><strong>${searchedHero.name}</strong> is Safe to Leave Unbanned</div>
              <div class="ban-safe-desc">
                Current stats: <strong>${searchedHero.win_rate_pct}% Win Rate</strong> and <strong>${searchedHero.ban_rate_pct}% Ban Rate</strong>.
                This hero does not meet Must-Ban or Over-Banned risk thresholds in this rank bracket.
              </div>
            </div>
          </div>
        ` : ''}

        <div class="radar-grid" data-active-mobile="${banState.activeMobileTab}">
          <!-- Column 1: Must-Bans -->
          <div class="radar-column radar-col-must ${banState.activeMobileTab !== 'must' && banState.activeMobileTab !== 'all' ? 'mobile-hidden' : ''}" style="border-top: 4px solid var(--ban-rose);">
            <div class="radar-col-header">
              <div class="radar-col-title" style="color: var(--ban-rose);">🚨 Priority Must-Bans (${mustBans.length})</div>
              <div class="radar-col-desc">High ban rate (≥15%) + high win rate (≥52%). Lethal if left open.</div>
            </div>
            <div class="radar-list">
              ${mustBans.length === 0 ? `
                <div class="radar-empty-state">
                  <div class="empty-mini-icon">✓</div>
                  <p>${hasSearch ? `No must-bans match "${escapeHtml(q)}".` : 'No urgent must-bans in this bracket.'}</p>
                </div>
              ` : mustBans.slice(0, 10).map(h => createRadarItemHtml(h, 'must')).join('')}
            </div>
          </div>

          <!-- Column 2: Sleeper Threats -->
          <div class="radar-column radar-col-sleeper ${banState.activeMobileTab !== 'sleeper' && banState.activeMobileTab !== 'all' ? 'mobile-hidden' : ''}" style="border-top: 4px solid var(--win-green);">
            <div class="radar-col-header">
              <div class="radar-col-title" style="color: var(--win-green);">🤫 Sleeper Threats (${sleeperThreats.length})</div>
              <div class="radar-col-desc">Win rate ≥54% but rarely banned (<10%). High-priority secret picks!</div>
            </div>
            <div class="radar-list">
              ${sleeperThreats.length === 0 ? `
                <div class="radar-empty-state">
                  <div class="empty-mini-icon">🔍</div>
                  <p>${hasSearch ? `No sleeper threats match "${escapeHtml(q)}".` : 'No sleeper threats detected.'}</p>
                </div>
              ` : sleeperThreats.slice(0, 10).map(h => createRadarItemHtml(h, 'sleeper')).join('')}
            </div>
          </div>

          <!-- Column 3: Over-Banned / Traps -->
          <div class="radar-column radar-col-over ${banState.activeMobileTab !== 'over' && banState.activeMobileTab !== 'all' ? 'mobile-hidden' : ''}" style="border-top: 4px solid var(--tier-s-plus);">
            <div class="radar-col-header">
              <div class="radar-col-title" style="color: var(--tier-s-plus);">⚠️ Over-Banned / Traps (${overBans.length})</div>
              <div class="radar-col-desc">Banned often (≥10%) despite sub-50% win rates. Don't waste bans!</div>
            </div>
            <div class="radar-list">
              ${overBans.length === 0 ? `
                <div class="radar-empty-state">
                  <div class="empty-mini-icon">🛡️</div>
                  <p>${hasSearch ? `No comfort traps match "${escapeHtml(q)}".` : 'No wasted comfort bans detected.'}</p>
                </div>
              ` : overBans.slice(0, 10).map(h => createRadarItemHtml(h, 'over')).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Search input listener
    const searchInput = container.querySelector('#banHeroSearchInput');
    const searchClear = container.querySelector('#banSearchClearBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        banState.searchQuery = e.target.value;
        updateView();
        const freshInput = container.querySelector('#banHeroSearchInput');
        if (freshInput) {
          freshInput.focus();
          freshInput.setSelectionRange(freshInput.value.length, freshInput.value.length);
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        banState.searchQuery = '';
        updateView();
        const freshInput = container.querySelector('#banHeroSearchInput');
        if (freshInput) freshInput.focus();
      });
    }

    // Mobile tabs switcher listener
    const mobileTabs = container.querySelector('#banMobileTabs');
    if (mobileTabs) {
      mobileTabs.querySelectorAll('.ban-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          banState.activeMobileTab = btn.dataset.tab;
          updateView();
        });
      });
    }

    // Hero card click -> modal
    container.querySelectorAll('.radar-item').forEach(item => {
      item.addEventListener('click', () => {
        const hid = parseInt(item.dataset.heroid, 10);
        openHeroModal(hid);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const hid = parseInt(item.dataset.heroid, 10);
          openHeroModal(hid);
        }
      });
    });
  }

  updateView();
}

function createRadarItemHtml(hero, type) {
  let badgeHtml = '';
  if (type === 'must') {
    badgeHtml = `<span class="radar-urgency-badge must">${hero.ban_rate_pct}% Ban</span>`;
  } else if (type === 'sleeper') {
    badgeHtml = `<span class="radar-urgency-badge sleeper">${hero.win_rate_pct}% Win</span>`;
  } else {
    badgeHtml = `<span class="radar-urgency-badge over">${hero.ban_rate_pct}% Ban (${hero.win_rate_pct}% Win)</span>`;
  }

  return `
    <div class="radar-item" data-heroid="${hero.heroid}" tabindex="0" role="button" aria-label="View stats for ${hero.name}">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${hero.head}" alt="${hero.name}" class="radar-avatar" onerror="this.src='./favicon.svg'"/>
        <div>
          <strong class="radar-hero-name">${hero.name}</strong>
          <div class="radar-hero-meta">${hero.roles.join(', ')} · ${hero.lanes.join(', ')}</div>
        </div>
      </div>
      ${badgeHtml}
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
