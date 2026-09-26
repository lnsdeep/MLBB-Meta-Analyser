/**
 * MLBB Meta Analyser - Patch Meta Movers & Trends
 * Computes momentum deltas (1D vs 7D / 7D vs 30D) to spot rising stars and falling heroes.
 */

import { dataService } from './dataService.js';
import { state } from './state.js';
import { openHeroModal } from './heroModal.js';

let moversState = {
  baselineMode: '1d_vs_7d', // '1d_vs_7d' or '7d_vs_30d'
  activeRole: 'ALL'
};

export function roundFloat(val, decimals = 2) {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Pure calculation function for meta movers momentum
 */
export function calculateMetaMovers(recentSlice, baselineSlice, roleFilter = 'ALL', limit = 8) {
  if (!Array.isArray(recentSlice) || !Array.isArray(baselineSlice)) {
    return { rising: [], falling: [], totalAnalyzed: 0 };
  }

  const baselineMap = new Map();
  for (const h of baselineSlice) {
    baselineMap.set(h.heroid, h);
  }

  const movers = [];
  const targetRole = (roleFilter || 'ALL').toUpperCase();

  for (const recent of recentSlice) {
    const base = baselineMap.get(recent.heroid);
    if (!base) continue;

    // Filter by role if specified
    if (targetRole !== 'ALL') {
      const heroRoles = (recent.roles || []).map(r => r.toUpperCase());
      const match = heroRoles.some(r => r === targetRole || r.includes(targetRole));
      if (!match) continue;
    }

    const deltaWr = roundFloat(recent.win_rate_pct - base.win_rate_pct, 2);
    const deltaPr = roundFloat(recent.pick_rate_pct - base.pick_rate_pct, 2);

    movers.push({
      ...recent,
      baselineWr: base.win_rate_pct,
      baselinePr: base.pick_rate_pct,
      deltaWr,
      deltaPr
    });
  }

  // Rising stars (positive delta, sorted descending)
  const rising = movers
    .filter(m => m.deltaWr > 0)
    .sort((a, b) => b.deltaWr - a.deltaWr)
    .slice(0, limit);

  // Falling picks (negative delta, sorted ascending)
  const falling = movers
    .filter(m => m.deltaWr < 0)
    .sort((a, b) => a.deltaWr - b.deltaWr)
    .slice(0, limit);

  return { rising, falling, totalAnalyzed: movers.length };
}

/**
 * Render Meta Movers with Period Delta Selector & Role Filtering
 */
export async function renderMetaMovers(container) {
  if (!container) return;

  const currentRank = state.get('activeRank') || 'mythical_glory';

  // Show loading skeleton while fetching baseline slices
  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>📈 Patch Meta Movers & Trends</h2>
          <p>Calculating momentum deltas across rank matches...</p>
        </div>
      </div>
      <div class="movers-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 12px; width: 28px; height: 28px; border: 3px solid rgba(56,189,248,0.2); border-top-color: var(--brand-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        Loading comparative rank slices...
      </div>
    </div>
  `;

  // Determine periods based on baselineMode
  const isWeekly = moversState.baselineMode === '7d_vs_30d';
  const recentTf = isWeekly ? '7d' : '1d';
  const baselineTf = isWeekly ? '30d' : '7d';

  let recentSlice = [];
  let baselineSlice = [];

  try {
    [recentSlice, baselineSlice] = await Promise.all([
      dataService.fetchRankSlice(currentRank, recentTf),
      dataService.fetchRankSlice(currentRank, baselineTf)
    ]);
  } catch (err) {
    console.error('Failed to load comparative slices for Meta Movers:', err);
    container.innerHTML = `
      <div class="tool-section">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Data Unavailable for Comparison</div>
          <p>Could not load the comparative ${recentTf} vs ${baselineTf} records for rank ${currentRank}.</p>
        </div>
      </div>
    `;
    return;
  }

  function updateView() {
    const { rising, falling, totalAnalyzed } = calculateMetaMovers(
      recentSlice,
      baselineSlice,
      moversState.activeRole,
      8
    );

    const baselineLabel = isWeekly ? 'Weekly (7D) vs Monthly (30D)' : 'Today (1D) vs 7-Day Baseline';
    const recentTag = isWeekly ? '7D' : '1D';
    const baseTag = isWeekly ? '30D' : '7D';
    const isFiltered = moversState.activeRole !== 'ALL';

    const rolesList = [
      { id: 'ALL', label: 'All Roles' },
      { id: 'TANK', label: '🛡️ Tank' },
      { id: 'FIGHTER', label: '⚔️ Fighter' },
      { id: 'ASSASSIN', label: '🗡️ Assassin' },
      { id: 'MAGE', label: '✨ Mage' },
      { id: 'MARKSMAN', label: '🏹 MM' },
      { id: 'SUPPORT', label: '💖 Support' }
    ];

    container.innerHTML = `
      <div class="tool-section movers-tool-view">
        <div class="tool-header-block">
          <div class="tool-title-group">
            <h2>📈 Patch Meta Movers & Trends</h2>
            <p>Real-time momentum: comparing <strong>${baselineLabel}</strong> to detect shadow buffs, emerging OP heroes, and decaying picks.</p>
          </div>
        </div>

        <!-- Story 5.3: Period Comparison & Role Filters Toolbar -->
        <div class="movers-toolbar">
          <!-- Timeframe Comparison Switcher -->
          <div class="movers-baseline-selector" id="moversBaselineSelector" role="tablist">
            <button
              class="seg-btn ${moversState.baselineMode === '1d_vs_7d' ? 'active' : ''}"
              data-mode="1d_vs_7d"
              role="tab"
              aria-selected="${moversState.baselineMode === '1d_vs_7d'}"
            >
              Today vs 7D
            </button>
            <button
              class="seg-btn ${moversState.baselineMode === '7d_vs_30d' ? 'active' : ''}"
              data-mode="7d_vs_30d"
              role="tab"
              aria-selected="${moversState.baselineMode === '7d_vs_30d'}"
            >
              Weekly vs 30D
            </button>
          </div>

          <!-- Role Filter Chips -->
          <div class="movers-role-chips" id="moversRoleChips">
            ${rolesList.map(r => `
              <button
                class="chip-btn ${moversState.activeRole === r.id ? 'active' : ''}"
                data-role="${r.id}"
              >${r.label}</button>
            `).join('')}
          </div>
        </div>

        <div class="movers-container">
          <!-- Rising Stars Column -->
          <div class="movers-card-box" style="border-top: 4px solid var(--win-green);">
            <div class="radar-col-header">
              <div class="radar-col-title" style="color: var(--win-green);">🚀 Rising Stars (${rising.length})</div>
              <div class="radar-col-desc">Heroes gaining the highest win rate advantage in ${recentTag} vs ${baseTag}.</div>
            </div>
            <div class="radar-list">
              ${rising.length === 0 ? `
                <div class="movers-empty">
                  <div class="empty-mini-icon">🔍</div>
                  <p>No rising heroes found for this role/timeframe.</p>
                  ${isFiltered ? `<button class="btn btn-secondary reset-movers-filter-btn" style="margin-top: 8px; font-size: 0.78rem; padding: 6px 12px;">Reset Role Filter</button>` : ''}
                </div>
              ` : rising.map(h => createMoverItemHtml(h, 'up', baseTag, recentTag)).join('')}
            </div>
          </div>

          <!-- Falling Picks Column -->
          <div class="movers-card-box" style="border-top: 4px solid var(--ban-rose);">
            <div class="radar-col-header">
              <div class="radar-col-title" style="color: var(--ban-rose);">📉 Falling Off (${falling.length})</div>
              <div class="radar-col-desc">Heroes losing ground in ${recentTag} matches vs ${baseTag} baseline.</div>
            </div>
            <div class="radar-list">
              ${falling.length === 0 ? `
                <div class="movers-empty">
                  <div class="empty-mini-icon">🛡️</div>
                  <p>No falling heroes found for this role/timeframe.</p>
                  ${isFiltered ? `<button class="btn btn-secondary reset-movers-filter-btn" style="margin-top: 8px; font-size: 0.78rem; padding: 6px 12px;">Reset Role Filter</button>` : ''}
                </div>
              ` : falling.map(h => createMoverItemHtml(h, 'down', baseTag, recentTag)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Mode Switcher (Today vs 7D / Weekly vs 30D)
    const baselineSelector = container.querySelector('#moversBaselineSelector');
    if (baselineSelector) {
      baselineSelector.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (moversState.baselineMode !== btn.dataset.mode) {
            moversState.baselineMode = btn.dataset.mode;
            renderMetaMovers(container); // Re-fetch slices for new periods
          }
        });
      });
    }

    // Role Chips
    const roleContainer = container.querySelector('#moversRoleChips');
    if (roleContainer) {
      roleContainer.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          moversState.activeRole = btn.dataset.role;
          updateView();
        });
      });
    }

    // Reset buttons inside empty states
    container.querySelectorAll('.reset-movers-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        moversState.activeRole = 'ALL';
        updateView();
      });
    });

    // Modal clicks
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

function createMoverItemHtml(hero, direction, baseTag, recentTag) {
  const isUp = direction === 'up';
  const prefix = isUp && hero.deltaWr > 0 ? '+' : '';
  const prPrefix = hero.deltaPr > 0 ? '+' : '';

  return `
    <div class="radar-item" data-heroid="${hero.heroid}" tabindex="0" role="button" aria-label="${hero.name} ${prefix}${hero.deltaWr}% win rate delta">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${hero.head}" alt="${hero.name}" class="radar-avatar" onerror="this.src='./favicon.svg'"/>
        <div>
          <strong class="radar-hero-name">${hero.name}</strong>
          <div class="radar-hero-meta">
            ${hero.roles.join(', ')} · ${baseTag}: ${hero.baselineWr}% ➔ ${recentTag}: ${hero.win_rate_pct}%
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
        <div class="delta-chip ${isUp ? 'up' : 'down'}">
          <span>${isUp ? '▲' : '▼'}</span>
          <span>${prefix}${hero.deltaWr}%</span>
        </div>
        <div class="delta-stat-sub">
          PR ${prPrefix}${hero.deltaPr}%
        </div>
      </div>
    </div>
  `;
}
