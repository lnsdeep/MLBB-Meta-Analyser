/**
 * MLBB Meta Analyser - Teammate Synergy Finder Tool
 * Select an ally hero -> surfaces best synergistic partners with statistical win-rate boost.
 */

import { dataService } from './dataService.js';
import { openHeroModal } from './heroModal.js';

let selectedAlly = null;

export async function renderSynergyTool(container, heroesList) {
  if (!container) return;

  if (!selectedAlly && heroesList.length > 0) {
    selectedAlly = heroesList[0];
  }

  const catalog = await dataService.fetchCatalog();
  const synergiesMatrix = await dataService.fetchSynergiesMatrix();

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>🤝 Teammate Synergy Finder</h2>
          <p>Find the best duo and team combo partners that statistically amplify your teammate's win rate.</p>
        </div>
      </div>

      <div class="picker-container">
        <!-- Sidebar: Ally Hero Selector -->
        <aside class="picker-sidebar">
          <input type="text" class="picker-hero-search" id="synergySearchInput" placeholder="🔍 Search ally hero..."/>
          <div class="picker-hero-list" id="synergyHeroList">
            ${heroesList.map(h => `
              <button class="picker-hero-item ${selectedAlly && selectedAlly.heroid === h.heroid ? 'selected' : ''}" data-heroid="${h.heroid}">
                <img class="picker-hero-thumb" src="${h.head}" alt="${h.name}" loading="lazy" onerror="this.src='./favicon.svg'"/>
                <span>${h.name}</span>
              </button>
            `).join('')}
          </div>
        </aside>

        <!-- Main: Synergies Display -->
        <main class="picker-results-panel" id="synergyResultsPanel">
          ${renderSynergyResults(selectedAlly, synergiesMatrix, catalog)}
        </main>
      </div>
    </div>
  `;

  // Search filter
  const searchInput = container.querySelector('#synergySearchInput');
  const heroListEl = container.querySelector('#synergyHeroList');

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    heroListEl.querySelectorAll('.picker-hero-item').forEach(item => {
      const name = item.querySelector('span').textContent.toLowerCase();
      item.style.display = name.includes(q) ? 'flex' : 'none';
    });
  });

  // Hero click
  heroListEl.querySelectorAll('.picker-hero-item').forEach(item => {
    item.addEventListener('click', () => {
      const heroid = parseInt(item.dataset.heroid, 10);
      selectedAlly = heroesList.find(h => h.heroid === heroid);

      heroListEl.querySelectorAll('.picker-hero-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      const panel = container.querySelector('#synergyResultsPanel');
      panel.innerHTML = renderSynergyResults(selectedAlly, synergiesMatrix, catalog);
      attachResultListeners(panel);
    });
  });

  attachResultListeners(container.querySelector('#synergyResultsPanel'));
}

function renderSynergyResults(hero, synergiesMatrix, catalog) {
  if (!hero) return '<p>Please select an ally hero.</p>';

  const rawSynergies = (synergiesMatrix && synergiesMatrix[hero.heroid]) || hero.synergies || [];

  const synergies = rawSynergies.map(s => {
    const fullInfo = catalog.map.get(s.heroid) || {};
    return {
      ...s,
      lanes: fullInfo.lanes || [],
      roles: fullInfo.roles || [],
    };
  });

  return `
    <div class="target-hero-banner" style="border-left: 4px solid var(--brand-primary);">
      <img class="target-hero-avatar" src="${hero.head}" alt="${hero.name}" onerror="this.src='./favicon.svg'"/>
      <div>
        <div style="font-size: 0.8rem; color: var(--brand-primary); font-weight: 700; text-transform: uppercase;">Ally Anchor Hero</div>
        <h3 style="font-size: 1.4rem; font-weight: 800;">${hero.name}</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted);">${hero.roles.join(', ')} · ${hero.lanes.join(', ')} · Base Win Rate: ${hero.win_rate_pct}%</p>
      </div>
    </div>

    <div>
      <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">
        Best Teammate Pairings for ${hero.name}
      </h4>

      ${synergies.length === 0 ? `
        <div class="empty-state">
          <p>No specific synergy records found for ${hero.name}.</p>
        </div>
      ` : `
        <div class="matchup-grid">
          ${synergies.map(s => `
            <div class="matchup-card" data-heroid="${s.heroid}" tabindex="0" role="button" aria-label="View ${s.name} details">
              <img class="matchup-avatar" src="${s.head}" alt="${s.name}" onerror="this.src='./favicon.svg'"/>
              <div class="matchup-details">
                <span class="matchup-name">${s.name}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${s.roles.join(', ')} · ${s.lanes.join(', ')}</span>
                <div class="matchup-advantage" style="color: var(--brand-primary);">
                  <span>+${s.increase_win_rate_pct}%</span>
                  <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary);">Synergy Boost</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function attachResultListeners(panel) {
  if (!panel) return;
  panel.querySelectorAll('.matchup-card').forEach(card => {
    card.addEventListener('click', () => {
      const hid = parseInt(card.dataset.heroid, 10);
      openHeroModal(hid);
    });
  });
}
