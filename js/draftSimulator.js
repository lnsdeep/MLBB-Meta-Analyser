/**
 * MLBB Meta Analyser - 5v5 Draft Simulator & Statistical Advantage Model
 * Evaluates pairwise counter matchups, synergies, and role balance to predict draft win advantage.
 * Features Frictionless Inline Quick-Pick Drawer & Duplicate Pick Prevention (Story 4.1).
 */

import { dataService } from './dataService.js';

let allyTeam = []; // Max 5 heroes
let enemyTeam = []; // Max 5 heroes
let activeSlotTarget = null; // { side: 'ally'|'enemy', index: 0-4 }
let activeDrawerRole = 'ALL';

/**
 * Returns set of hero IDs already picked on either team (Story 4.1)
 */
export function getPickedHeroIds(allies, enemies) {
  const ids = new Set();
  (allies || []).forEach(h => { if (h && h.heroid) ids.add(h.heroid); });
  (enemies || []).forEach(h => { if (h && h.heroid) ids.add(h.heroid); });
  return ids;
}

export async function renderDraftSimulator(container, heroesList) {
  if (!container) return;

  const catalog = await dataService.fetchCatalog();
  const countersMatrix = await dataService.fetchCountersMatrix();
  const synergiesMatrix = await dataService.fetchSynergiesMatrix();

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>🛡️ 5v5 Draft Analyzer & Statistical Win Predictor</h2>
          <p>Draft blue and red team compositions. Our statistical model evaluates counter advantage, synergies, and team balance.</p>
        </div>
        <button class="chip-btn" id="draftResetBtn" style="color: var(--ban-rose);">🔄 Reset Draft</button>
      </div>

      <!-- Draft Board: Ally vs Enemy -->
      <div class="draft-teams-row">
        <!-- Ally Team (Blue) -->
        <div class="draft-team-box ally">
          <div class="draft-team-header">
            <span style="color: var(--brand-primary); display: flex; align-items: center; gap: 6px;">
              <span>🔵</span> Blue Team (Allies)
            </span>
            <span class="draft-count-badge" id="allyCountBadge">${allyTeam.filter(Boolean).length}/5 Picked</span>
          </div>
          <div class="draft-slots-list" id="allySlots">
            ${[0, 1, 2, 3, 4].map(idx => renderSlotHtml('ally', idx, allyTeam[idx])).join('')}
          </div>
        </div>

        <!-- Enemy Team (Red) -->
        <div class="draft-team-box enemy">
          <div class="draft-team-header">
            <span style="color: var(--ban-rose); display: flex; align-items: center; gap: 6px;">
              <span>🔴</span> Red Team (Enemies)
            </span>
            <span class="draft-count-badge" id="enemyCountBadge">${enemyTeam.filter(Boolean).length}/5 Picked</span>
          </div>
          <div class="draft-slots-list" id="enemySlots">
            ${[0, 1, 2, 3, 4].map(idx => renderSlotHtml('enemy', idx, enemyTeam[idx])).join('')}
          </div>
        </div>
      </div>

      <!-- Story 4.2: Proactive "Best Next Pick" Recommendations Panel -->
      <div class="draft-recommendations-section" id="draftRecommendations">
        ${renderRecommendationsHtml(allyTeam, enemyTeam, countersMatrix, synergiesMatrix, catalog)}
      </div>

      <!-- Statistical Verdict & Advantage Meter -->
      <div class="draft-score-card" id="draftScoreCard">
        ${calculateAndRenderAdvantage(allyTeam.filter(Boolean), enemyTeam.filter(Boolean), countersMatrix, synergiesMatrix, catalog)}
      </div>

      <!-- Frictionless Inline Quick-Pick Drawer (Story 4.1) -->
      <div class="draft-drawer-overlay" id="draftPickerModal" aria-hidden="true">
        <div class="draft-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="draftPickerTitle">
          <div class="drawer-drag-handle"></div>

          <div class="drawer-header">
            <div class="drawer-title-group">
              <span class="drawer-side-pill" id="draftPickerSideBadge">🔵 Blue Team</span>
              <h3 class="drawer-title" id="draftPickerTitle">Pick Hero for Slot #1</h3>
            </div>
            <button class="drawer-close-btn" id="draftPickerCloseBtn" aria-label="Close hero picker">✕</button>
          </div>

          <!-- Drawer Smart Suggestions Bar (Story 4.2) -->
          <div class="drawer-recommended-bar hidden" id="drawerRecBar">
            <span class="drawer-rec-label">⚡ Top Recommendations:</span>
            <div class="drawer-rec-chips-list" id="drawerRecChipsList"></div>
          </div>

          <div class="drawer-controls">
            <div class="search-wrapper" style="width: 100%; max-width: 100%;">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" id="draftModalSearch" placeholder="Search hero or role..." autocomplete="off" aria-label="Search hero" />
              <button class="search-clear-btn hidden" id="draftSearchClear" aria-label="Clear search">✕</button>
            </div>

            <div class="chip-group drawer-role-chips" id="draftRoleChips">
              <button class="chip-btn ${activeDrawerRole === 'ALL' ? 'active' : ''}" data-role="ALL">All</button>
              <button class="chip-btn ${activeDrawerRole === 'Tank' ? 'active' : ''}" data-role="Tank">🛡️ Tank</button>
              <button class="chip-btn ${activeDrawerRole === 'Fighter' ? 'active' : ''}" data-role="Fighter">⚔️ Fighter</button>
              <button class="chip-btn ${activeDrawerRole === 'Assassin' ? 'active' : ''}" data-role="Assassin">🗡️ Assassin</button>
              <button class="chip-btn ${activeDrawerRole === 'Mage' ? 'active' : ''}" data-role="Mage">🔮 Mage</button>
              <button class="chip-btn ${activeDrawerRole === 'Marksman' ? 'active' : ''}" data-role="Marksman">🏹 MM</button>
              <button class="chip-btn ${activeDrawerRole === 'Support' ? 'active' : ''}" data-role="Support">💚 Supp</button>
            </div>
          </div>

          <div class="drawer-hero-grid" id="draftModalHeroList">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach slot listeners
  function attachSlotListeners() {
    container.querySelectorAll('.draft-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        if (e.target.closest('.draft-slot-remove')) return;
        const side = slot.dataset.side;
        const index = parseInt(slot.dataset.index, 10);
        openDraftHeroPicker(side, index, container, heroesList, countersMatrix, synergiesMatrix, catalog);
      });
    });

    container.querySelectorAll('.draft-slot-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const side = btn.dataset.side;
        const index = parseInt(btn.dataset.index, 10);
        if (side === 'ally') {
          delete allyTeam[index];
        } else {
          delete enemyTeam[index];
        }
        updateSlotDisplay(side, index, null);
        updateScoreAndRecommendations();
      });
    });
  }

  attachSlotListeners();

  // Reset Draft button
  container.querySelector('#draftResetBtn').addEventListener('click', () => {
    allyTeam = [];
    enemyTeam = [];
    for (let i = 0; i < 5; i++) {
      updateSlotDisplay('ally', i, null);
      updateSlotDisplay('enemy', i, null);
    }
    updateScoreAndRecommendations();
  });

  // Drawer Close handlers
  const pickerModal = container.querySelector('#draftPickerModal');
  const closeBtn = container.querySelector('#draftPickerCloseBtn');
  
  function closeDrawer() {
    pickerModal.classList.remove('open');
    pickerModal.setAttribute('aria-hidden', 'true');
  }

  closeBtn.addEventListener('click', closeDrawer);
  pickerModal.addEventListener('click', (e) => {
    if (e.target === pickerModal) closeDrawer();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pickerModal.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Search input & clear button inside drawer
  const searchInput = container.querySelector('#draftModalSearch');
  const searchClear = container.querySelector('#draftSearchClear');

  function refreshDrawerList() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (searchClear) searchClear.classList.toggle('hidden', q.length === 0);
    const heroListEl = container.querySelector('#draftModalHeroList');
    if (!heroListEl) return;
    const pickedIds = getPickedHeroIds(allyTeam, enemyTeam);
    heroListEl.innerHTML = renderDrawerHeroItems(heroesList, pickedIds, activeDrawerRole, q);
    attachDrawerItemListeners();
  }

  if (searchInput) {
    searchInput.addEventListener('input', refreshDrawerList);
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      refreshDrawerList();
      searchInput.focus();
    });
  }

  // Drawer role chips
  const roleChipsEl = container.querySelector('#draftRoleChips');
  if (roleChipsEl) {
    roleChipsEl.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        roleChipsEl.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeDrawerRole = btn.dataset.role;
        refreshDrawerList();
      });
    });
  }

  function attachDrawerItemListeners() {
    const heroListEl = container.querySelector('#draftModalHeroList');
    if (!heroListEl) return;
    heroListEl.querySelectorAll('.drawer-hero-card:not(.already-picked)').forEach(card => {
      card.addEventListener('click', () => {
        const heroid = parseInt(card.dataset.heroid, 10);
        const hero = heroesList.find(h => h.heroid === heroid);
        if (!hero || !activeSlotTarget) return;

        const { side, index } = activeSlotTarget;
        if (side === 'ally') {
          allyTeam[index] = hero;
        } else {
          enemyTeam[index] = hero;
        }

        updateSlotDisplay(side, index, hero);
        updateScoreAndRecommendations();
        closeDrawer();
      });
    });
  }

  // In-place updates for performance without destroying DOM tree (DoD #2)
  function updateSlotDisplay(side, index, hero) {
    const containerId = side === 'ally' ? 'allySlots' : 'enemySlots';
    const parent = container.querySelector(`#${containerId}`);
    if (!parent) return;

    const slotEl = parent.children[index];
    if (slotEl) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = renderSlotHtml(side, index, hero);
      const newSlot = tempDiv.firstElementChild;
      parent.replaceChild(newSlot, slotEl);
      attachSlotListeners();
    }

    // Update count badges
    const allyCount = allyTeam.filter(Boolean).length;
    const enemyCount = enemyTeam.filter(Boolean).length;
    const allyBadge = container.querySelector('#allyCountBadge');
    const enemyBadge = container.querySelector('#enemyCountBadge');
    if (allyBadge) allyBadge.textContent = `${allyCount}/5 Picked`;
    if (enemyBadge) enemyBadge.textContent = `${enemyCount}/5 Picked`;
  }

  function updateScoreAndRecommendations() {
    // 1. Update Statistical Advantage Meter
    const scoreCard = container.querySelector('#draftScoreCard');
    if (scoreCard) {
      scoreCard.innerHTML = calculateAndRenderAdvantage(
        allyTeam.filter(Boolean),
        enemyTeam.filter(Boolean),
        countersMatrix,
        synergiesMatrix,
        catalog
      );
    }

    // 2. Update Proactive Recommendations Panel (Story 4.2)
    const recsPanel = container.querySelector('#draftRecommendations');
    if (recsPanel) {
      recsPanel.innerHTML = renderRecommendationsHtml(
        allyTeam,
        enemyTeam,
        countersMatrix,
        synergiesMatrix,
        catalog
      );
      attachRecommendationListeners();
    }
  }

  // Attach instant-pick handlers to recommendation cards
  function attachRecommendationListeners() {
    const recsPanel = container.querySelector('#draftRecommendations');
    if (!recsPanel) return;

    recsPanel.querySelectorAll('.rec-pick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const heroid = parseInt(btn.dataset.heroid, 10);
        const hero = heroesList.find(h => h.heroid === heroid);
        if (!hero) return;

        // Find first empty ally slot
        let targetIdx = -1;
        for (let i = 0; i < 5; i++) {
          if (!allyTeam[i]) {
            targetIdx = i;
            break;
          }
        }

        if (targetIdx !== -1) {
          allyTeam[targetIdx] = hero;
          updateSlotDisplay('ally', targetIdx, hero);
          updateScoreAndRecommendations();
        }
      });
    });
  }

  attachRecommendationListeners();
}

function renderSlotHtml(side, index, hero) {
  if (!hero) {
    return `
      <div class="draft-slot" data-side="${side}" data-index="${index}" tabindex="0" role="button" aria-label="Assign ${side === 'ally' ? 'Blue' : 'Red'} Slot ${index + 1}">
        <span class="draft-slot-empty-text">➕ Click to assign pick #${index + 1}</span>
      </div>
    `;
  }

  const roleText = (hero.roles || []).join(', ');
  const laneText = (hero.lanes || [])[0] || '';

  return `
    <div class="draft-slot filled" data-side="${side}" data-index="${index}" tabindex="0" role="button" aria-label="${hero.name} assigned to ${side === 'ally' ? 'Blue' : 'Red'} Slot ${index + 1}">
      <div class="draft-slot-hero-info">
        <img class="draft-slot-avatar" src="${hero.head}" alt="${hero.name}" onerror="this.src='./favicon.svg'"/>
        <div class="draft-slot-text">
          <strong class="draft-slot-hero-name">${hero.name}</strong>
          <div class="draft-slot-hero-roles">${roleText}${laneText ? ' · ' + laneText : ''}</div>
        </div>
      </div>
      <button class="draft-slot-remove" data-side="${side}" data-index="${index}" title="Remove pick" aria-label="Remove ${hero.name}">✕</button>
    </div>
  `;
}

function openDraftHeroPicker(side, index, container, heroesList, countersMatrix, synergiesMatrix, catalog) {
  activeSlotTarget = { side, index };
  const pickerModal = container.querySelector('#draftPickerModal');
  const targetText = container.querySelector('#draftPickerTitle');
  const sideBadge = container.querySelector('#draftPickerSideBadge');
  const searchInput = container.querySelector('#draftModalSearch');
  const heroListEl = container.querySelector('#draftModalHeroList');
  const drawerRecBar = container.querySelector('#drawerRecBar');
  const drawerRecChipsList = container.querySelector('#drawerRecChipsList');

  if (side === 'ally') {
    sideBadge.className = 'drawer-side-pill ally';
    sideBadge.textContent = '🔵 Blue Team';
    targetText.textContent = `Assign Blue Pick #${index + 1}`;

    // Render quick recommendations for ally pick (Story 4.2)
    if (drawerRecBar && drawerRecChipsList) {
      const recs = calculateRecommendedPicks(allyTeam, enemyTeam, countersMatrix, synergiesMatrix, catalog || heroesList, 3);
      if (recs && recs.length > 0) {
        drawerRecChipsList.innerHTML = recs.map(r => `
          <button class="drawer-rec-chip" data-heroid="${r.hero.heroid}" title="Pick ${r.hero.name} (+${r.score.toFixed(1)} score)">
            <img src="${r.hero.head}" alt="${r.hero.name}" onerror="this.src='./favicon.svg'"/>
            <span>${r.hero.name}</span>
            <span class="chip-score">+${r.score.toFixed(1)}</span>
          </button>
        `).join('');

        drawerRecChipsList.querySelectorAll('.drawer-rec-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const hid = parseInt(chip.dataset.heroid, 10);
            const chosenHero = heroesList.find(h => h.heroid === hid);
            if (!chosenHero) return;
            allyTeam[index] = chosenHero;
            updateSlotDisplay('ally', index, chosenHero);
            updateScoreAndRecommendations();
            pickerModal.classList.remove('open');
            pickerModal.setAttribute('aria-hidden', 'true');
          });
        });

        drawerRecBar.classList.remove('hidden');
      } else {
        drawerRecBar.classList.add('hidden');
      }
    }
  } else {
    sideBadge.className = 'drawer-side-pill enemy';
    sideBadge.textContent = '🔴 Red Team';
    targetText.textContent = `Assign Red Pick #${index + 1}`;
    if (drawerRecBar) drawerRecBar.classList.add('hidden');
  }

  // Refresh drawer hero items with duplicate prevention (DoD #3)
  const pickedIds = getPickedHeroIds(allyTeam, enemyTeam);
  if (heroListEl) {
    heroListEl.innerHTML = renderDrawerHeroItems(heroesList, pickedIds, activeDrawerRole, '');
  }

  // Open drawer
  pickerModal.classList.add('open');
  pickerModal.setAttribute('aria-hidden', 'false');

  if (searchInput) {
    searchInput.value = '';
    setTimeout(() => searchInput.focus(), 50);
  }
}

function renderDrawerHeroItems(heroesList, pickedIds, roleFilter, query) {
  const filtered = heroesList.filter(h => {
    if (roleFilter !== 'ALL' && !h.roles.includes(roleFilter)) return false;
    if (query && !h.name.toLowerCase().includes(query)) return false;
    return true;
  });

  if (filtered.length === 0) {
    return `<div style="grid-column: 1 / -1; padding: 20px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">No heroes match your search</div>`;
  }

  return filtered.map(h => {
    const isPicked = pickedIds.has(h.heroid);
    const primaryRole = h.roles[0] || '';

    return `
      <button class="drawer-hero-card ${isPicked ? 'already-picked' : ''}" 
              data-heroid="${h.heroid}" 
              ${isPicked ? 'disabled aria-disabled="true"' : ''}
              title="${isPicked ? `${h.name} is already picked` : `Pick ${h.name}`}">
        <img class="drawer-hero-thumb" src="${h.head}" alt="${h.name}" loading="lazy" onerror="this.src='./favicon.svg'"/>
        <div class="drawer-hero-details">
          <span class="drawer-hero-name">${h.name}</span>
          <span class="drawer-hero-role">${primaryRole}</span>
        </div>
        ${isPicked ? `<span class="already-picked-badge">Picked</span>` : ''}
      </button>
    `;
  }).join('');
}

/**
 * Story 4.2: Proactive "Best Next Pick" Recommender Engine Algorithm
 * Score(H) = sum(CounterAdvantage(H, E)) + sum(SynergyBoost(H, A)) + RoleBalanceWeight(H)
 */
export function calculateRecommendedPicks(allies, enemies, countersMatrix, synergiesMatrix, catalog, limit = 3) {
  let heroesList = [];
  if (Array.isArray(catalog)) {
    heroesList = catalog;
  } else if (catalog && Array.isArray(catalog.list)) {
    heroesList = catalog.list;
  } else if (catalog && catalog.map instanceof Map) {
    heroesList = Array.from(catalog.map.values());
  }

  if (!heroesList || heroesList.length === 0) return [];

  const pickedIds = getPickedHeroIds(allies, enemies);
  const validAllies = (allies || []).filter(Boolean);
  const validEnemies = (enemies || []).filter(Boolean);

  const allyRoles = validAllies.flatMap(h => h.roles || []);
  const hasFrontline = allyRoles.includes('Tank') || allyRoles.includes('Fighter');
  const hasMage = allyRoles.includes('Mage');
  const hasMarksman = allyRoles.includes('Marksman');

  const candidates = heroesList.filter(h => h && h.heroid && !pickedIds.has(h.heroid));
  const scored = [];

  for (const h of candidates) {
    let counterAdvantage = 0;
    let synergyBoost = 0;
    let roleBalanceWeight = 0;
    const reasons = [];

    // 1. Counter Advantage against drafted enemies
    for (const enemy of validEnemies) {
      if (!enemy || !enemy.heroid) continue;

      // Candidate counters enemy
      const enemyCounters = countersMatrix ? (countersMatrix[enemy.heroid] || []) : [];
      const counterRecord = enemyCounters.find(c => c.heroid === h.heroid);
      if (counterRecord) {
        const adv = Number(counterRecord.increase_win_rate_pct || 0);
        counterAdvantage += adv;
        reasons.push({
          type: 'counter',
          text: `Counters ${enemy.name} (+${adv.toFixed(1)}%)`,
          delta: adv
        });
      }

      // Enemy counters candidate (penalty)
      const hCounters = countersMatrix ? (countersMatrix[h.heroid] || []) : [];
      const enemyCounterRecord = hCounters.find(c => c.heroid === enemy.heroid);
      if (enemyCounterRecord) {
        const pen = Number(enemyCounterRecord.increase_win_rate_pct || 0);
        counterAdvantage -= pen;
      }
    }

    // 2. Synergy with drafted allies
    for (const ally of validAllies) {
      if (!ally || !ally.heroid) continue;

      const allySynergies = synergiesMatrix ? (synergiesMatrix[ally.heroid] || []) : [];
      const synRecord = allySynergies.find(s => s.heroid === h.heroid);
      if (synRecord) {
        const boost = Number(synRecord.increase_win_rate_pct || 0);
        synergyBoost += boost;
        reasons.push({
          type: 'synergy',
          text: `Synergy with ${ally.name} (+${boost.toFixed(1)}%)`,
          delta: boost
        });
      }
    }

    // 3. Role balance weighting
    if (validAllies.length > 0 && validAllies.length < 5) {
      const isFrontline = (h.roles || []).includes('Tank') || (h.roles || []).includes('Fighter');
      const isMage = (h.roles || []).includes('Mage');
      const isMarksman = (h.roles || []).includes('Marksman');

      if (!hasFrontline && isFrontline) {
        roleBalanceWeight += 2.0;
        reasons.push({ type: 'role', text: 'Provides essential frontline & crowd control', delta: 2.0 });
      }
      if (!hasMage && isMage) {
        roleBalanceWeight += 1.5;
        reasons.push({ type: 'role', text: 'Supplies required magic burst damage', delta: 1.5 });
      }
      if (!hasMarksman && isMarksman) {
        roleBalanceWeight += 1.5;
        reasons.push({ type: 'role', text: 'Supplies late-game physical DPS', delta: 1.5 });
      }

      // Role stacking penalty if team already has >= 2 heroes with candidate's primary role
      const primaryRole = (h.roles || [])[0];
      const countSameRole = validAllies.filter(a => (a.roles || []).includes(primaryRole)).length;
      if (countSameRole >= 2) {
        roleBalanceWeight -= 1.5;
      }
    }

    // 4. Meta factor
    const metaFactor = ((h.win_rate_pct || 50) - 50) * 0.1;
    const totalScore = counterAdvantage + synergyBoost + roleBalanceWeight + metaFactor;

    if (reasons.length === 0) {
      reasons.push({
        type: 'meta',
        text: `Strong high-tier meta pick (${(h.win_rate_pct || 50).toFixed(1)}% WR)`,
        delta: 1.0
      });
    }

    reasons.sort((a, b) => b.delta - a.delta);

    scored.push({
      hero: h,
      score: parseFloat(totalScore.toFixed(2)),
      counterAdvantage: parseFloat(counterAdvantage.toFixed(2)),
      synergyBoost: parseFloat(synergyBoost.toFixed(2)),
      roleBalanceWeight: parseFloat(roleBalanceWeight.toFixed(2)),
      topReasons: reasons.slice(0, 2).map(r => r.text)
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Story 4.2: Recommendations Panel HTML Builder
 */
export function renderRecommendationsHtml(allies, enemies, countersMatrix, synergiesMatrix, catalog) {
  const validAllies = (allies || []).filter(Boolean);
  const remainingSlots = 5 - validAllies.length;

  if (remainingSlots <= 0) {
    return `
      <div class="recommendations-header">
        <div class="recommendations-title-group">
          <h3><span>💡</span> Proactive "Best Next Pick" Recommendations</h3>
          <span class="recommendations-subtitle">Draft composition complete — all 5 Blue Team picks locked in.</span>
        </div>
        <span class="rec-score-pill" style="background: rgba(52, 211, 153, 0.15); color: #34d399; border-color: #34d399;">5/5 Locked</span>
      </div>
      <div class="recommendations-locked-msg" style="padding: 12px 16px; background: var(--bg-surface-elevated); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
        <span>✅</span> All 5 Blue team picks are assigned. Review the statistical verdict and tactical matchup analysis below.
      </div>
    `;
  }

  const recs = calculateRecommendedPicks(allies, enemies, countersMatrix, synergiesMatrix, catalog, 3);

  if (recs.length === 0) {
    return `
      <div class="recommendations-header">
        <div class="recommendations-title-group">
          <h3><span>💡</span> Proactive "Best Next Pick" Recommendations</h3>
          <span class="recommendations-subtitle">Draft Blue and Red heroes to activate dynamic counter & synergy advice.</span>
        </div>
      </div>
      <div class="empty-state" style="padding: 16px;">
        <p>No recommendation candidates available.</p>
      </div>
    `;
  }

  return `
    <div class="recommendations-header">
      <div class="recommendations-title-group">
        <h3><span>💡</span> Proactive "Best Next Pick" Recommendations</h3>
        <span class="recommendations-subtitle">Top algorithmic picks for your next Blue slot based on enemy counters, synergies & role balance.</span>
      </div>
      <span class="rec-score-pill">${remainingSlots} Pick${remainingSlots === 1 ? '' : 's'} Remaining</span>
    </div>
    <div class="recommendations-grid">
      ${recs.map(rec => renderRecommendationCard(rec)).join('')}
    </div>
  `;
}

function renderRecommendationCard(rec) {
  const hero = rec.hero;
  const primaryRole = (hero.roles || []).join(', ');
  const primaryLane = (hero.lanes && hero.lanes[0]) ? hero.lanes[0] : '';
  const scoreFormatted = (rec.score >= 0 ? '+' : '') + rec.score.toFixed(1);

  return `
    <div class="recommendation-card" data-heroid="${hero.heroid}">
      <div class="rec-card-top">
        <img class="rec-card-avatar" src="${hero.head}" alt="${hero.name}" onerror="this.src='./favicon.svg'"/>
        <div class="rec-card-info">
          <div class="rec-card-name-row">
            <span class="rec-hero-name">${hero.name}</span>
            <span class="rec-score-pill" title="Calculated composite matchup score">${scoreFormatted} Pts</span>
          </div>
          <div class="rec-hero-meta">
            ${primaryRole}${primaryLane ? ' · ' + primaryLane : ''}
          </div>
        </div>
      </div>

      <ul class="rec-reasons-list">
        ${rec.topReasons.map(r => `
          <li class="rec-reason-item">
            <span>${r.includes('Counter') ? '🎯' : r.includes('Synergy') ? '🤝' : r.includes('frontline') ? '🛡️' : '⚡'}</span>
            <span>${r}</span>
          </li>
        `).join('')}
      </ul>

      <button class="rec-pick-btn" data-heroid="${hero.heroid}" aria-label="Instantly pick ${hero.name} for Blue team">
        <span>⚡</span> Instant Pick
      </button>
    </div>
  `;
}

/**
 * Statistical Draft Model Calculation
 */
export function calculateAndRenderAdvantage(allies, enemies, countersMatrix, synergiesMatrix, catalog) {
  if (allies.length === 0 && enemies.length === 0) {
    return `
      <div class="empty-state" style="padding: 20px;">
        <p>Pick at least 1 hero on either team to run the statistical draft analysis.</p>
      </div>
    `;
  }

  // 1. Calculate Pairwise Counter Advantage
  let netCounterDelta = 0;
  let counterInsights = [];

  for (const ally of allies) {
    for (const enemy of enemies) {
      // Check if ally counters enemy
      const enemyCounters = countersMatrix ? (countersMatrix[enemy.heroid] || []) : [];
      const counterRecord = enemyCounters.find(c => c.heroid === ally.heroid);
      if (counterRecord) {
        const adv = counterRecord.increase_win_rate_pct || 0;
        netCounterDelta += adv;
        if (adv >= 2.5) {
          counterInsights.push(`✨ <strong>${ally.name}</strong> counters <strong>${enemy.name}</strong> (+${adv}% advantage).`);
        }
      }

      // Check if enemy counters ally
      const allyCounters = countersMatrix ? (countersMatrix[ally.heroid] || []) : [];
      const enemyCounterRecord = allyCounters.find(c => c.heroid === enemy.heroid);
      if (enemyCounterRecord) {
        const adv = enemyCounterRecord.increase_win_rate_pct || 0;
        netCounterDelta -= adv;
        if (adv >= 2.5) {
          counterInsights.push(`⚠️ <strong>${enemy.name}</strong> counters your <strong>${ally.name}</strong> (-${adv}%).`);
        }
      }
    }
  }

  // 2. Team Composition Balance Checks
  const allyRoles = allies.flatMap(h => h.roles || []);
  const hasTank = allyRoles.includes('Tank') || allyRoles.includes('Fighter');
  const hasMage = allyRoles.includes('Mage');
  const hasMarksman = allyRoles.includes('Marksman');

  let compositionAdvice = [];
  if (allies.length >= 3) {
    if (!hasTank) compositionAdvice.push('🛡️ Missing frontline: Your team lacks durable tanks/fighters to absorb damage in team fights.');
    if (!hasMage) compositionAdvice.push('🔮 Lack of magic damage: Enemy team can stack pure physical armor to counter your draft.');
    if (!hasMarksman) compositionAdvice.push('🏹 No late-game marksman: You must end the game early before the enemy outscales.');
  }

  // 3. Composite Predicted Advantage % (-15% to +15% scaled)
  const clampedDelta = Math.max(-15, Math.min(15, netCounterDelta));
  // Convert into 0% - 100% meter where 50% is even
  const allyMeterPercent = Math.round(50 + (clampedDelta / 15) * 40);

  let verdictText = 'Evenly Matched Draft';
  let verdictColor = 'var(--text-primary)';
  if (clampedDelta >= 3.0) {
    verdictText = `+${clampedDelta.toFixed(1)}% Advantage (Blue Favored)`;
    verdictColor = 'var(--brand-primary)';
  } else if (clampedDelta <= -3.0) {
    verdictText = `${clampedDelta.toFixed(1)}% Disadvantage (Red Favored)`;
    verdictColor = 'var(--ban-rose)';
  }

  return `
    <div class="draft-verdict-title" style="color: ${verdictColor};">${verdictText}</div>
    <div style="font-size: 0.85rem; color: var(--text-muted);">Based on official Moonton counter matchup matrices and pairwise win rate differentials</div>

    <div class="draft-advantage-meter">
      <span class="meter-side-label" style="color: var(--brand-primary); text-align: left;">Blue (${allyMeterPercent}%)</span>
      <div class="meter-track">
        <div class="meter-fill-ally" style="width: ${allyMeterPercent}%;"></div>
      </div>
      <span class="meter-side-label" style="color: var(--ban-rose); text-align: right;">Red (${100 - allyMeterPercent}%)</span>
    </div>

    ${(counterInsights.length > 0 || compositionAdvice.length > 0) ? `
      <div class="draft-tips-box">
        <div style="font-weight: 700; margin-bottom: 6px;">Draft Tactical Analysis:</div>
        <ul style="padding-left: 18px; display: flex; flex-direction: column; gap: 4px;">
          ${counterInsights.slice(0, 3).map(tip => `<li>${tip}</li>`).join('')}
          ${compositionAdvice.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;
}
