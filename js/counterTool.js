/**
 * MLBB Meta Analyser - Direct Counter Picker Tool
 * Select an enemy hero -> surfaces top hard counters filtered by player's lane
 * with tactical matchup badges (Story 3.2).
 */

import { dataService } from './dataService.js';
import { openHeroModal } from './heroModal.js';

let selectedHero = null;
let activeCounterLane = 'ALL';
let activeTargetRole = 'ALL';

/**
 * Tactical Reason Inference Engine (Story 3.2)
 * Generates actionable tactical counter tags explaining WHY a hero counters the target.
 */
export function getTacticalReason(counter, target) {
  const targetRoles = target?.roles || [];
  const targetSpecialities = target?.speciality || [];
  const targetName = (target?.name || '').toLowerCase();

  const counterRoles = counter?.roles || [];
  const counterSpecialities = counter?.speciality || [];
  const counterName = (counter?.name || '').toLowerCase();

  // 1. Anti-Dash / Grounding (Khufra, Minsitthar, Phoveus vs dashers)
  const isHighMobility = targetRoles.includes('Assassin') || targetSpecialities.includes('Chase') || 
    ['fanny', 'ling', 'lancelot', 'joy', 'benedetta', 'harith', 'nolan', 'hayabusa', 'wanwan', 'chou'].some(h => targetName.includes(h));
  if (isHighMobility && ['khufra', 'minsitthar', 'phoveus'].some(h => counterName.includes(h))) {
    return { type: 'anti-dash', label: '🚫 Anti-Dash Grounding', desc: 'Interrupts mobility skills and stops dash combos.' };
  }

  // 2. Anti-Sustain / Healing Cut (Baxia, Dyrroth, anti-heal vs regen/healers)
  const isHighRegen = targetSpecialities.includes('Regen') || 
    ['estes', 'floryn', 'rafaela', 'uranus', 'yu zhong', 'ruby', 'esmeralda', 'alice', 'carmilla'].some(h => targetName.includes(h));
  if (isHighRegen && ['baxia', 'dyrroth', 'belerick', 'karrie', 'valir'].some(h => counterName.includes(h))) {
    return { type: 'anti-sustain', label: '💔 Anti-Sustain Melt', desc: 'Cuts continuous healing and penetrates high durability.' };
  }

  // 3. CC Cleanse / Anti-Dive Disruption (Diggie, Akai, Valir vs hard CC initiators)
  const isHardInitiate = targetSpecialities.includes('Control') || 
    ['tigreal', 'atlas', 'minotaur', 'guinevere', 'johnson', 'lolita', 'gatotkaca'].some(h => targetName.includes(h));
  if (isHardInitiate && ['diggie', 'akai', 'valir', 'faramis'].some(h => counterName.includes(h))) {
    return { type: 'disrupt', label: '🕊️ CC Cleanse & Peel', desc: 'Neutralizes teamfight dive and invalidates hard CC setups.' };
  }

  // 4. Armor Shred / Tank Buster (Karrie, Dyrroth, Lunox, Claude vs Tanks)
  const isTanky = targetRoles.includes('Tank') || 
    ['hylos', 'grock', 'fredrinn', 'belerick', 'barats', 'akai', 'baxia', 'terizla'].some(h => targetName.includes(h));
  if (isTanky && (counterSpecialities.includes('Damage') || ['karrie', 'dyrroth', 'lunox', 'claude', 'lesley'].some(h => counterName.includes(h)))) {
    return { type: 'tank-buster', label: '🛡️ Armor Shred / % HP', desc: 'Bypasses physical defense and melts high maximum HP.' };
  }

  // 5. Burst Isolation (Saber, Eudora, Aurora, Natalia vs Squishies)
  const isSquishy = targetRoles.includes('Marksman') || (targetRoles.includes('Mage') && !targetRoles.includes('Tank'));
  if (isSquishy && (counterRoles.includes('Assassin') || counterSpecialities.includes('Burst') || 
    ['saber', 'eudora', 'aurora', 'natalia', 'helcurt', 'harley', 'gusion', 'kadita'].some(h => counterName.includes(h)))) {
    return { type: 'burst', label: '⚡ Burst Pickoff', desc: 'Quickly eliminates fragile carry before they can react.' };
  }

  // 6. Hard CC Lockdown
  if (counterSpecialities.includes('Control') || 
    ['franco', 'kaja', 'chou', 'saber', 'silvanna', 'nana', 'jawhead', 'masha'].some(h => counterName.includes(h))) {
    return { type: 'cc', label: '🔒 Hard Suppression Lock', desc: 'Unavoidable lockdown interrupting crucial skill combos.' };
  }

  // 7. Zone & Poke Outrange
  if (counterSpecialities.includes('Poke') || 
    ['pharsa', 'yve', 'xavier', 'novaria', 'brody', 'chang\'e', 'valir', 'cecilion'].some(h => counterName.includes(h))) {
    return { type: 'poke', label: '🏹 Zone & Kite Outrange', desc: 'Maintains safe distance and chips down enemy health.' };
  }

  // 8. Default Tactical Matchup Advantage
  return { type: 'advantage', label: '⚔️ Kit Advantage', desc: 'Statistical matchup edge based on superior cooldowns and kit trade.' };
}

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
          <p>Find the best champions to counter an enemy pick with tactical reason badges and win-rate advantages.</p>
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
        <aside class="picker-sidebar" id="pickerSidebar">
          <div class="sidebar-header-row">
            <span class="sidebar-title">Select Enemy Target</span>
            <span class="sidebar-count" id="enemyHeroCount">(${heroesList.length})</span>
          </div>

          <div class="search-wrapper" style="max-width: 100%; width: 100%;">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="counterSearchInput" placeholder="Search enemy hero..." autocomplete="off" aria-label="Search enemy hero"/>
            <button class="search-clear-btn hidden" id="counterSearchClear" aria-label="Clear enemy search">✕</button>
          </div>

          <!-- Quick Role Tabs for Enemy Target -->
          <div class="chip-group sidebar-role-chips" id="counterTargetRoleChips">
            <button class="chip-btn ${activeTargetRole === 'ALL' ? 'active' : ''}" data-role="ALL">All</button>
            <button class="chip-btn ${activeTargetRole === 'Marksman' ? 'active' : ''}" data-role="Marksman">MM</button>
            <button class="chip-btn ${activeTargetRole === 'Assassin' ? 'active' : ''}" data-role="Assassin">Assas</button>
            <button class="chip-btn ${activeTargetRole === 'Mage' ? 'active' : ''}" data-role="Mage">Mage</button>
            <button class="chip-btn ${activeTargetRole === 'Fighter' ? 'active' : ''}" data-role="Fighter">Fight</button>
            <button class="chip-btn ${activeTargetRole === 'Tank' ? 'active' : ''}" data-role="Tank">Tank</button>
            <button class="chip-btn ${activeTargetRole === 'Support' ? 'active' : ''}" data-role="Support">Supp</button>
          </div>

          <div class="picker-hero-list" id="counterHeroList">
            ${renderEnemyHeroItems(heroesList, selectedHero, activeTargetRole, '')}
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
  const searchClear = container.querySelector('#counterSearchClear');
  const heroListEl = container.querySelector('#counterHeroList');
  const roleChipsEl = container.querySelector('#counterTargetRoleChips');

  function updateHeroList() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (searchClear) searchClear.classList.toggle('hidden', q.length === 0);
    heroListEl.innerHTML = renderEnemyHeroItems(heroesList, selectedHero, activeTargetRole, q);
    attachSidebarHeroListeners();
  }

  if (searchInput) {
    searchInput.addEventListener('input', updateHeroList);
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      updateHeroList();
      searchInput.focus();
    });
  }

  // Role chip filtering for target hero
  if (roleChipsEl) {
    roleChipsEl.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        roleChipsEl.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTargetRole = btn.dataset.role;
        updateHeroList();
      });
    });
  }

  function attachSidebarHeroListeners() {
    heroListEl.querySelectorAll('.picker-hero-item').forEach(item => {
      item.addEventListener('click', () => {
        const heroid = parseInt(item.dataset.heroid, 10);
        selectedHero = heroesList.find(h => h.heroid === heroid);
        
        heroListEl.querySelectorAll('.picker-hero-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        const panel = container.querySelector('#counterResultsPanel');
        panel.innerHTML = renderCounterResults(selectedHero, countersMatrix, catalog);
        attachResultCardListeners(panel);

        // Smooth scroll to results on mobile devices so user sees results immediately
        if (window.innerWidth < 1024) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  attachSidebarHeroListeners();

  // Attach lane filter listeners
  const laneFilters = container.querySelector('#counterLaneFilters');
  if (laneFilters) {
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
  }

  attachResultCardListeners(container.querySelector('#counterResultsPanel'));
}

function renderEnemyHeroItems(heroesList, currentSelected, targetRole, query) {
  const filtered = heroesList.filter(h => {
    if (targetRole !== 'ALL' && !h.roles.includes(targetRole)) return false;
    if (query && !h.name.toLowerCase().includes(query)) return false;
    return true;
  });

  if (filtered.length === 0) {
    return `<div style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">No matching heroes found</div>`;
  }

  return filtered.map(h => `
    <button class="picker-hero-item ${currentSelected && currentSelected.heroid === h.heroid ? 'selected' : ''}" data-heroid="${h.heroid}">
      <img class="picker-hero-thumb" src="${h.head}" alt="${h.name}" loading="lazy" onerror="this.src='./favicon.svg'"/>
      <span class="picker-hero-label">${h.name}</span>
    </button>
  `).join('');
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
      speciality: fullInfo.speciality || [],
      skills: fullInfo.skills || [],
      difficulty: fullInfo.difficulty || '50',
    };
  });

  if (activeCounterLane !== 'ALL') {
    counters = counters.filter(c => c.lanes.includes(activeCounterLane));
  }

  return `
    <div class="target-hero-banner">
      <img class="target-hero-avatar" src="${hero.head}" alt="${hero.name}" onerror="this.src='./favicon.svg'"/>
      <div class="target-hero-info">
        <div class="target-hero-badge">Enemy Target Pick</div>
        <h3 class="target-hero-name">${hero.name}</h3>
        <p class="target-hero-meta">
          ${hero.roles.join(', ')} · ${hero.lanes.join(', ')} · Current Win Rate: <strong style="color: var(--text-primary);">${hero.win_rate_pct}%</strong>
        </p>
      </div>
      <button class="target-change-btn" id="targetChangeBtn" onclick="document.getElementById('counterSearchInput')?.focus()" title="Tap to pick another enemy">
        <span>Change ▾</span>
      </button>
    </div>

    <div>
      <div class="results-header-row">
        <h4 class="results-title">
          Recommended Counter Picks ${activeCounterLane !== 'ALL' ? `in ${activeCounterLane}` : ''}
        </h4>
        <span class="results-count">(${counters.length} options)</span>
      </div>

      ${counters.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">⚔️</div>
          <div class="empty-state-title">No lane-specific counters</div>
          <p>No high-confidence counter records found for ${hero.name} in ${activeCounterLane}. Try selecting "All Lanes" above.</p>
        </div>
      ` : `
        <div class="matchup-grid">
          ${counters.map(c => {
            const tactical = getTacticalReason(c, hero);
            const primaryRole = c.roles[0] || '';
            const primaryLane = c.lanes[0] || '';

            return `
              <article class="matchup-card" data-heroid="${c.heroid}" tabindex="0" role="button" aria-label="View ${c.name} details">
                <img class="matchup-avatar" src="${c.head}" alt="${c.name}" onerror="this.src='./favicon.svg'"/>
                <div class="matchup-details">
                  <div class="matchup-top">
                    <span class="matchup-name">${c.name}</span>
                    <span class="matchup-tactical-badge badge-${tactical.type}" title="${tactical.desc}">
                      ${tactical.label}
                    </span>
                  </div>
                  <div class="matchup-tags">
                    <span class="hero-role-tag">${primaryRole}</span>
                    ${primaryLane ? `<span class="hero-lane-pill">${primaryLane}</span>` : ''}
                  </div>
                  <div class="matchup-advantage">
                    <span class="advantage-val">+${c.increase_win_rate_pct}%</span>
                    <span class="advantage-label">Pairwise Win Advantage</span>
                  </div>
                  <p class="tactical-reason-text">${tactical.desc}</p>
                </div>
              </article>
            `;
          }).join('')}
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
