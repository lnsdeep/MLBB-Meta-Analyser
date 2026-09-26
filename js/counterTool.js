/**
 * MLBB Meta Analyser - Direct Counter Picker Tool
 * Select an enemy hero -> surfaces top hard counters filtered by player's lane.
 */

import { dataService } from './dataService.js';
import { openHeroModal } from './heroModal.js';

let selectedHero = null;
let activeCounterLane = 'ALL';

export async function renderCounterTool(container, heroesList) {
  if (!container) return;

  // Default to first top meta hero if none selected
  if (!selectedHero && heroesList.length > 0) {
    selectedHero = heroesList[0];
  }

  const catalog = await dataService.fetchCatalog();
  const countersMatrix = await dataService.fetchCountersMatrix();

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>⚔️ Direct Counter Picker</h2>
          <p>Find the best champions to counter an enemy pick based on official match win-rate advantage.</p>
        </div>
        <div class="filter-group">
          <span class="filter-label">Filter By Your Lane:</span>
          <div class="chip-group" id="counterLaneFilters">
            ${['ALL', 'EXP Lane', 'Mid Lane', 'Gold Lane', 'Roam', 'Jungle'].map(lane => `
              <button class="chip-btn ${activeCounterLane === lane ? 'active' : ''}" data-lane="${lane}">${lane}</button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="picker-container">
        <!-- Sidebar: Hero Selector -->
        <aside class="picker-sidebar">
          <input type="text" class="picker-hero-search" id="counterSearchInput" placeholder="🔍 Search enemy hero..."/>
          <div class="picker-hero-list" id="counterHeroList">
            ${heroesList.map(h => `
              <button class="picker-hero-item ${selectedHero && selectedHero.heroid === h.heroid ? 'selected' : ''}" data-heroid="${h.heroid}">
                <img class="picker-hero-thumb" src="${h.head}" alt="${h.name}" loading="lazy" onerror="this.src='./favicon.svg'"/>
                <span>${h.name}</span>
              </button>
            `).join('')}
          </div>
        </aside>

        <!-- Main: Counter Matchups Display -->
        <main class="picker-results-panel" id="counterResultsPanel">
          ${renderCounterResults(selectedHero, countersMatrix, catalog)}
        </main>
      </div>
    </div>
  `;

  // Attach search filter for sidebar list
  const searchInput = container.querySelector('#counterSearchInput');
  const heroListEl = container.querySelector('#counterHeroList');

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    heroListEl.querySelectorAll('.picker-hero-item').forEach(item => {
      const name = item.querySelector('span').textContent.toLowerCase();
      item.style.display = name.includes(q) ? 'flex' : 'none';
    });
  });

  // Attach hero item click listener
  heroListEl.querySelectorAll('.picker-hero-item').forEach(item => {
    item.addEventListener('click', () => {
      const heroid = parseInt(item.dataset.heroid, 10);
      selectedHero = heroesList.find(h => h.heroid === heroid);
      
      heroListEl.querySelectorAll('.picker-hero-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      const panel = container.querySelector('#counterResultsPanel');
      panel.innerHTML = renderCounterResults(selectedHero, countersMatrix, catalog);
      attachResultCardListeners(panel);
    });
  });

  // Attach lane filter listeners
  const laneFilters = container.querySelector('#counterLaneFilters');
  laneFilters.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      laneFilters.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCounterLane = btn.dataset.lane;

      const panel = container.querySelector('#counterResultsPanel');
      panel.innerHTML = renderCounterResults(selectedHero, countersMatrix, catalog);
      attachResultCardListeners(panel);
    });
  });

  attachResultCardListeners(container.querySelector('#counterResultsPanel'));
}

function renderCounterResults(hero, countersMatrix, catalog) {
  if (!hero) return '<p>Please select a hero from the list.</p>';

  const rawCounters = (countersMatrix && countersMatrix[hero.heroid]) || hero.counters || [];

  // Filter counters by selected lane if active
  let counters = rawCounters.map(c => {
    const fullInfo = catalog.map.get(c.heroid) || {};
    return {
      ...c,
      lanes: fullInfo.lanes || [],
      roles: fullInfo.roles || [],
      difficulty: fullInfo.difficulty || '50',
    };
  });

  if (activeCounterLane !== 'ALL') {
    counters = counters.filter(c => c.lanes.includes(activeCounterLane));
  }

  return `
    <div class="target-hero-banner">
      <img class="target-hero-avatar" src="${hero.head}" alt="${hero.name}" onerror="this.src='./favicon.svg'"/>
      <div>
        <div style="font-size: 0.8rem; color: var(--ban-rose); font-weight: 700; text-transform: uppercase;">Enemy Target Pick</div>
        <h3 style="font-size: 1.4rem; font-weight: 800;">${hero.name}</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted);">${hero.roles.join(', ')} · ${hero.lanes.join(', ')} · Current Win Rate: ${hero.win_rate_pct}%</p>
      </div>
    </div>

    <div>
      <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">
        Recommended Counter Picks ${activeCounterLane !== 'ALL' ? `in ${activeCounterLane}` : ''}
      </h4>

      ${counters.length === 0 ? `
        <div class="empty-state">
          <p>No specific counter records found for ${hero.name} in ${activeCounterLane}. Try selecting "All Lanes".</p>
        </div>
      ` : `
        <div class="matchup-grid">
          ${counters.map(c => `
            <div class="matchup-card" data-heroid="${c.heroid}" tabindex="0" role="button" aria-label="View ${c.name} details">
              <img class="matchup-avatar" src="${c.head}" alt="${c.name}" onerror="this.src='./favicon.svg'"/>
              <div class="matchup-details">
                <span class="matchup-name">${c.name}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${c.roles.join(', ')} · ${c.lanes.join(', ')}</span>
                <div class="matchup-advantage">
                  <span>+${c.increase_win_rate_pct}%</span>
                  <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary);">Win Rate Advantage</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function attachResultCardListeners(panel) {
  if (!panel) return;
  panel.querySelectorAll('.matchup-card').forEach(card => {
    card.addEventListener('click', () => {
      const hid = parseInt(card.dataset.heroid, 10);
      openHeroModal(hid);
    });
  });
}
