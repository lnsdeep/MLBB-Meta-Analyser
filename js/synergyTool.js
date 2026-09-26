/**
 * MLBB Meta Analyser - Teammate Synergy Finder Tool (Story 5.1)
 * Select an ally hero -> surfaces best synergistic partners with statistical win-rate boost,
 * lane & role filters, and tactical combo archetype badges.
 */

import { dataService } from './dataService.js';
import { openHeroModal } from './heroModal.js';

let selectedAlly = null;
let activeSynergyLane = 'ALL';
let activeSynergyRole = 'ALL';
let activeSidebarRole = 'ALL';

/**
 * Story 5.1: Categorize hero duo into competitive MLBB combo archetypes
 */
export function getSynergyComboArchetype(anchor, partner) {
  if (!anchor || !partner) {
    return {
      type: 'core-synergy',
      label: 'Core Synergy',
      icon: '🤝',
      desc: 'Complementary hero kit with statistical win-rate boost.'
    };
  }

  const anchorRoles = anchor.roles || [];
  const partnerRoles = partner.roles || [];
  const anchorName = anchor.name || '';
  const partnerName = partner.name || '';

  const pocketSupportNames = ['Angela', 'Estes', 'Floryn', 'Rafaela', 'Mathilda', 'Diggie', 'Carmilla'];
  const isAnchorPocketSupport = pocketSupportNames.includes(anchorName);
  const isPartnerPocketSupport = pocketSupportNames.includes(partnerName);

  const isAnchorCarry = anchorRoles.includes('Assassin') || anchorRoles.includes('Marksman') || (anchorRoles.includes('Fighter') && (anchor.lanes || []).includes('Jungle'));
  const isPartnerCarry = partnerRoles.includes('Assassin') || partnerRoles.includes('Marksman') || (partnerRoles.includes('Fighter') && (partner.lanes || []).includes('Jungle'));

  // 1. Hyper-Carry Buffer (Dedicated Pocket Support + Damage Carry)
  if ((isAnchorPocketSupport && isPartnerCarry) || (isPartnerPocketSupport && isAnchorCarry)) {
    return {
      type: 'hyper-carry',
      label: 'Hyper-Carry Buffer',
      icon: '👑',
      desc: 'Amplifies carry survivability, movement speed, and snowball kill potential.'
    };
  }

  // 2. Wombo Combo (Massive AOE Crowd Control + Heavy AOE Damage Burst)
  const aoeCCNames = ['Tigreal', 'Atlas', 'Carmilla', 'Minotaur', 'Gatotkaca', 'Khufra', 'Belerick', 'Guinevere', 'Silvanna', 'Terizla'];
  const aoeDmgNames = ['Odette', 'Claude', 'Pharsa', 'Vexana', 'Gord', 'Aurora', 'Vale', 'Yve', 'Badang', 'Kadita', 'Ixia', 'Hanabi'];

  const hasCC = aoeCCNames.includes(anchorName) || aoeCCNames.includes(partnerName);
  const hasAoeBurst = aoeDmgNames.includes(anchorName) || aoeDmgNames.includes(partnerName);

  if (hasCC && hasAoeBurst) {
    return {
      type: 'wombo-combo',
      label: 'Wombo Combo',
      icon: '🌪️',
      desc: 'Chains mass crowd control lockdown into devastating multi-target teamfight burst.'
    };
  }

  // 3. Dive Partner (High Mobility Assas / Divers)
  const diveNames = ['Ling', 'Fanny', 'Hayabusa', 'Lancelot', 'Gusion', 'Saber', 'Helcurt', 'Chou', 'Paquito', 'Joy', 'Arlott', 'Benedetta', 'Nolan', 'Suyou'];
  if (diveNames.includes(anchorName) && (diveNames.includes(partnerName) || partnerRoles.includes('Assassin'))) {
    return {
      type: 'dive-partner',
      label: 'Dive Partner',
      icon: '⚡',
      desc: 'Coordinates synchronized backline diving to eliminate vulnerable squishies instantly.'
    };
  }

  // 4. Engage & Peel (Tank/Roam Initiator + Marksman / Mage)
  const isAnchorTank = anchorRoles.includes('Tank');
  const isPartnerTank = partnerRoles.includes('Tank');
  const isAnchorRangedDps = anchorRoles.includes('Marksman') || anchorRoles.includes('Mage');
  const isPartnerRangedDps = partnerRoles.includes('Marksman') || partnerRoles.includes('Mage');

  if ((isAnchorTank && isPartnerRangedDps) || (isPartnerTank && isAnchorRangedDps)) {
    return {
      type: 'engage-peel',
      label: 'Engage & Peel',
      icon: '🛡️',
      desc: 'Frontline creates engage opportunities while peeling incoming dive threats from backline carries.'
    };
  }

  // 5. Zone & Poke Duo (Artillery / Long Range Poke)
  const pokeNames = ['Novaria', 'Xavier', 'Pharsa', 'Cecilion', 'Yve', "Chang'e", 'Beatrix', 'Lesley', 'Valir', 'Kimmy'];
  if (pokeNames.includes(anchorName) && (pokeNames.includes(partnerName) || (anchorRoles.includes('Mage') && partnerRoles.includes('Mage')))) {
    return {
      type: 'zone-poke',
      label: 'Zone & Poke',
      icon: '🎯',
      desc: 'Controls choke points and softens enemy squads from extreme range before objectives.'
    };
  }

  // 6. Sustain Bruisers (Spell Vamp / Regen frontline fighters)
  const sustainNames = ['Terizla', 'Yu Zhong', 'Ruby', 'Thamuz', 'Uranus', 'Esmeralda', 'Alice', 'Dyrroth', 'Barats', 'Alpha', 'Cici', 'Balmond', 'Fredrinn', 'Gatotkaca'];
  if (sustainNames.includes(anchorName) && sustainNames.includes(partnerName)) {
    return {
      type: 'sustain-bruiser',
      label: 'Sustain Bruisers',
      icon: '🩸',
      desc: 'Dominates extended front-to-back brawls through immense durability and sustained lifesteal.'
    };
  }

  // Fallback: Core Synergy
  return {
    type: 'core-synergy',
    label: 'Core Synergy',
    icon: '🤝',
    desc: 'Statistically proven pairwise win-rate boost and balanced draft chemistry.'
  };
}

/**
 * Filter synergies array by lane and role (Story 5.1)
 */
export function filterSynergies(synergies, laneFilter = 'ALL', roleFilter = 'ALL') {
  if (!Array.isArray(synergies)) return [];
  return synergies.filter(s => {
    if (laneFilter !== 'ALL' && !(s.lanes || []).includes(laneFilter)) return false;
    if (roleFilter !== 'ALL' && !(s.roles || []).includes(roleFilter)) return false;
    return true;
  });
}

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
          <div class="sidebar-header-row">
            <span class="sidebar-title">Select Anchor</span>
            <span class="sidebar-count" id="synergyHeroCount">${heroesList.length} heroes</span>
          </div>

          <div class="search-wrapper" style="width: 100%;">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="synergySearchInput" placeholder="Search ally hero..." autocomplete="off" aria-label="Search ally hero" />
            <button class="search-clear-btn hidden" id="synergySearchClear" aria-label="Clear search">✕</button>
          </div>

          <div class="chip-group sidebar-role-chips" id="synergySidebarRoleChips">
            <button class="chip-btn ${activeSidebarRole === 'ALL' ? 'active' : ''}" data-role="ALL">All</button>
            <button class="chip-btn ${activeSidebarRole === 'Tank' ? 'active' : ''}" data-role="Tank">Tank</button>
            <button class="chip-btn ${activeSidebarRole === 'Fighter' ? 'active' : ''}" data-role="Fighter">Fight</button>
            <button class="chip-btn ${activeSidebarRole === 'Assassin' ? 'active' : ''}" data-role="Assassin">Assas</button>
            <button class="chip-btn ${activeSidebarRole === 'Mage' ? 'active' : ''}" data-role="Mage">Mage</button>
            <button class="chip-btn ${activeSidebarRole === 'Marksman' ? 'active' : ''}" data-role="Marksman">MM</button>
            <button class="chip-btn ${activeSidebarRole === 'Support' ? 'active' : ''}" data-role="Support">Supp</button>
          </div>

          <div class="picker-hero-list" id="synergyHeroList">
            ${renderSidebarHeroItems(heroesList, selectedAlly, activeSidebarRole, '')}
          </div>
        </aside>

        <!-- Main: Synergies Display -->
        <main class="picker-results-panel" id="synergyResultsPanel">
          ${renderSynergyResults(selectedAlly, synergiesMatrix, catalog)}
        </main>
      </div>
    </div>
  `;

  // Sidebar search & filtering
  const searchInput = container.querySelector('#synergySearchInput');
  const searchClear = container.querySelector('#synergySearchClear');
  const heroListEl = container.querySelector('#synergyHeroList');
  const sidebarCount = container.querySelector('#synergyHeroCount');
  const roleChipsEl = container.querySelector('#synergySidebarRoleChips');

  function updateSidebarList() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (searchClear) searchClear.classList.toggle('hidden', q.length === 0);

    const filtered = heroesList.filter(h => {
      if (activeSidebarRole !== 'ALL' && !h.roles.includes(activeSidebarRole)) return false;
      if (q && !h.name.toLowerCase().includes(q)) return false;
      return true;
    });

    if (sidebarCount) sidebarCount.textContent = `${filtered.length} heroes`;
    if (heroListEl) {
      heroListEl.innerHTML = renderSidebarHeroItems(heroesList, selectedAlly, activeSidebarRole, q);
      attachSidebarItemListeners();
    }
  }

  if (searchInput) searchInput.addEventListener('input', updateSidebarList);
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      updateSidebarList();
      searchInput.focus();
    });
  }

  if (roleChipsEl) {
    roleChipsEl.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        roleChipsEl.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSidebarRole = btn.dataset.role;
        updateSidebarList();
      });
    });
  }

  function attachSidebarItemListeners() {
    if (!heroListEl) return;
    heroListEl.querySelectorAll('.picker-hero-item').forEach(item => {
      item.addEventListener('click', () => {
        const heroid = parseInt(item.dataset.heroid, 10);
        selectedAlly = heroesList.find(h => h.heroid === heroid);

        heroListEl.querySelectorAll('.picker-hero-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        const panel = container.querySelector('#synergyResultsPanel');
        if (panel) {
          panel.innerHTML = renderSynergyResults(selectedAlly, synergiesMatrix, catalog);
          attachResultListeners(panel, container, synergiesMatrix, catalog);
        }
      });
    });
  }

  attachSidebarItemListeners();
  attachResultListeners(container.querySelector('#synergyResultsPanel'), container, synergiesMatrix, catalog);
}

function renderSidebarHeroItems(heroesList, selected, roleFilter, query) {
  const filtered = heroesList.filter(h => {
    if (roleFilter !== 'ALL' && !h.roles.includes(roleFilter)) return false;
    if (query && !h.name.toLowerCase().includes(query)) return false;
    return true;
  });

  if (filtered.length === 0) {
    return `<div style="padding: 16px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">No heroes match filter</div>`;
  }

  return filtered.map(h => `
    <button class="picker-hero-item ${selected && selected.heroid === h.heroid ? 'selected' : ''}" data-heroid="${h.heroid}">
      <img class="picker-hero-thumb" src="${h.head}" alt="${h.name}" loading="lazy" onerror="this.src='./favicon.svg'"/>
      <span class="picker-hero-label">${h.name}</span>
    </button>
  `).join('');
}

export function renderSynergyResults(hero, synergiesMatrix, catalog) {
  if (!hero) return '<div class="empty-state"><p>Please select an ally hero.</p></div>';

  const rawSynergies = (synergiesMatrix && synergiesMatrix[hero.heroid]) || hero.synergies || [];

  const allSynergies = rawSynergies.map(s => {
    const fullInfo = (catalog && catalog.map) ? (catalog.map.get(s.heroid) || {}) : {};
    return {
      ...s,
      lanes: fullInfo.lanes || s.lanes || [],
      roles: fullInfo.roles || s.roles || [],
      speciality: fullInfo.speciality || s.speciality || []
    };
  });

  const filtered = filterSynergies(allSynergies, activeSynergyLane, activeSynergyRole);

  return `
    <div class="target-hero-banner" style="border-left: 4px solid var(--brand-primary);">
      <img class="target-hero-avatar" src="${hero.head}" alt="${hero.name}" onerror="this.src='./favicon.svg'"/>
      <div class="target-hero-info">
        <div style="font-size: 0.8rem; color: var(--brand-primary); font-weight: 700; text-transform: uppercase;">Ally Anchor Hero</div>
        <h3 class="target-hero-name">${hero.name}</h3>
        <p class="target-hero-meta">${hero.roles.join(', ')} · ${(hero.lanes || []).join(', ')} · Base Win Rate: ${hero.win_rate_pct}%</p>
      </div>
    </div>

    <!-- Story 5.1: Lane & Role Filter Bar -->
    <div class="synergy-filter-bar">
      <div class="synergy-filter-group">
        <span class="synergy-filter-label">Lane:</span>
        <div class="chip-group" id="synergyLaneChips">
          <button class="chip-btn ${activeSynergyLane === 'ALL' ? 'active' : ''}" data-lane="ALL">All Lanes</button>
          <button class="chip-btn ${activeSynergyLane === 'Roam' ? 'active' : ''}" data-lane="Roam">🛡️ Roam</button>
          <button class="chip-btn ${activeSynergyLane === 'Jungle' ? 'active' : ''}" data-lane="Jungle">🌲 Jungle</button>
          <button class="chip-btn ${activeSynergyLane === 'Gold Lane' ? 'active' : ''}" data-lane="Gold Lane">🏹 Gold</button>
          <button class="chip-btn ${activeSynergyLane === 'Mid Lane' ? 'active' : ''}" data-lane="Mid Lane">🔮 Mid</button>
          <button class="chip-btn ${activeSynergyLane === 'Exp Lane' ? 'active' : ''}" data-lane="Exp Lane">⚔️ Exp</button>
        </div>
      </div>

      <div class="synergy-filter-group">
        <span class="synergy-filter-label">Role:</span>
        <div class="chip-group" id="synergyRoleChips">
          <button class="chip-btn ${activeSynergyRole === 'ALL' ? 'active' : ''}" data-role="ALL">All</button>
          <button class="chip-btn ${activeSynergyRole === 'Tank' ? 'active' : ''}" data-role="Tank">Tank</button>
          <button class="chip-btn ${activeSynergyRole === 'Fighter' ? 'active' : ''}" data-role="Fighter">Fighter</button>
          <button class="chip-btn ${activeSynergyRole === 'Assassin' ? 'active' : ''}" data-role="Assassin">Assassin</button>
          <button class="chip-btn ${activeSynergyRole === 'Mage' ? 'active' : ''}" data-role="Mage">Mage</button>
          <button class="chip-btn ${activeSynergyRole === 'Marksman' ? 'active' : ''}" data-role="Marksman">MM</button>
          <button class="chip-btn ${activeSynergyRole === 'Support' ? 'active' : ''}" data-role="Support">Supp</button>
        </div>
      </div>
    </div>

    <div>
      <div class="results-header-row">
        <h4 class="results-title">
          Best Teammate Pairings for ${hero.name}
        </h4>
        <span class="results-count">${filtered.length} of ${allSynergies.length} Combos</span>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state" style="padding: 24px;">
          <p>No synergy partners found matching <strong>${activeSynergyLane !== 'ALL' ? activeSynergyLane : ''} ${activeSynergyRole !== 'ALL' ? activeSynergyRole : ''}</strong> for ${hero.name}.</p>
          <button class="chip-btn" id="resetSynergyFiltersBtn" style="margin-top: 12px; color: var(--brand-primary); border-color: var(--brand-primary);">Clear Filters</button>
        </div>
      ` : `
        <div class="matchup-grid">
          ${filtered.map(s => {
            const archetype = getSynergyComboArchetype(hero, s);
            return `
              <div class="matchup-card" data-heroid="${s.heroid}" tabindex="0" role="button" aria-label="View ${s.name} details">
                <img class="matchup-avatar" src="${s.head}" alt="${s.name}" onerror="this.src='./favicon.svg'"/>
                <div class="matchup-details">
                  <div class="matchup-top">
                    <span class="matchup-name">${s.name}</span>
                    <span class="synergy-archetype-badge badge-${archetype.type}">
                      <span>${archetype.icon}</span> ${archetype.label}
                    </span>
                  </div>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">${(s.roles || []).join(', ')} · ${(s.lanes || []).join(', ')}</span>
                  <p class="synergy-archetype-desc">${archetype.desc}</p>
                  <div class="matchup-advantage" style="color: var(--brand-primary); margin-top: 4px;">
                    <span>+${s.increase_win_rate_pct}%</span>
                    <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary);">Synergy Boost</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function attachResultListeners(panel, container, synergiesMatrix, catalog) {
  if (!panel) return;

  // Lane chips click
  const laneChipsEl = panel.querySelector('#synergyLaneChips');
  if (laneChipsEl) {
    laneChipsEl.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSynergyLane = btn.dataset.lane;
        panel.innerHTML = renderSynergyResults(selectedAlly, synergiesMatrix, catalog);
        attachResultListeners(panel, container, synergiesMatrix, catalog);
      });
    });
  }

  // Role chips click
  const roleChipsEl = panel.querySelector('#synergyRoleChips');
  if (roleChipsEl) {
    roleChipsEl.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSynergyRole = btn.dataset.role;
        panel.innerHTML = renderSynergyResults(selectedAlly, synergiesMatrix, catalog);
        attachResultListeners(panel, container, synergiesMatrix, catalog);
      });
    });
  }

  // Reset filters button
  const resetBtn = panel.querySelector('#resetSynergyFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeSynergyLane = 'ALL';
      activeSynergyRole = 'ALL';
      panel.innerHTML = renderSynergyResults(selectedAlly, synergiesMatrix, catalog);
      attachResultListeners(panel, container, synergiesMatrix, catalog);
    });
  }

  // Card modal click
  panel.querySelectorAll('.matchup-card').forEach(card => {
    card.addEventListener('click', () => {
      const hid = parseInt(card.dataset.heroid, 10);
      openHeroModal(hid);
    });
  });
}
