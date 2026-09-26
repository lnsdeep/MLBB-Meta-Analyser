/**
 * MLBB Meta Analyser - Patch Meta Movers & Trends
 * Computes momentum deltas (1D vs 7D/30D) to spot rising stars and falling heroes.
 */

import { dataService } from './dataService.js';
import { state } from './state.js';
import { openHeroModal } from './heroModal.js';

export async function renderMetaMovers(container) {
  if (!container) return;

  const currentRank = state.get('activeRank');

  // Load 1d and 7d slices for the active rank
  const [slice1d, slice7d] = await Promise.all([
    dataService.fetchRankSlice(currentRank, '1d'),
    dataService.fetchRankSlice(currentRank, '7d')
  ]);

  const map7d = new Map();
  for (const h of slice7d) {
    map7d.set(h.heroid, h);
  }

  // Calculate deltas
  const movers = [];
  for (const h1 of slice1d) {
    const h7 = map7d.get(h1.heroid);
    if (!h7) continue;

    const deltaWr = roundFloat(h1.win_rate_pct - h7.win_rate_pct, 2);
    const deltaPr = roundFloat(h1.pick_rate_pct - h7.pick_rate_pct, 2);

    movers.push({
      ...h1,
      baselineWr: h7.win_rate_pct,
      deltaWr,
      deltaPr,
    });
  }

  // Top 6 Rising Heroes (Highest +WR Delta)
  const rising = [...movers].sort((a, b) => b.deltaWr - a.deltaWr).slice(0, 6);

  // Top 6 Falling Heroes (Lowest -WR Delta)
  const falling = [...movers].sort((a, b) => a.deltaWr - b.deltaWr).slice(0, 6);

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>📈 Patch Meta Movers & Trends</h2>
          <p>Real-time momentum: comparing Today's win rates against the 7-Day baseline to detect shadow buffs and meta shifts.</p>
        </div>
      </div>

      <div class="movers-container">
        <!-- Rising Stars -->
        <div class="movers-card-box" style="border-top: 4px solid var(--win-green);">
          <div class="radar-col-header">
            <div class="radar-col-title" style="color: var(--win-green);">🚀 Rising Stars (Surging Win Rates)</div>
            <div class="radar-col-desc">Heroes gaining the highest win rate advantage in today's matches.</div>
          </div>
          <div class="radar-list">
            ${rising.map(h => createMoverItemHtml(h, 'up')).join('')}
          </div>
        </div>

        <!-- Falling Picks -->
        <div class="movers-card-box" style="border-top: 4px solid var(--ban-rose);">
          <div class="radar-col-header">
            <div class="radar-col-title" style="color: var(--ban-rose);">📉 Falling Off (Win Rate Drop)</div>
            <div class="radar-col-desc">Heroes losing ground in the current meta or struggling against new counters.</div>
          </div>
          <div class="radar-list">
            ${falling.map(h => createMoverItemHtml(h, 'down')).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach modal clicks
  container.querySelectorAll('.radar-item').forEach(item => {
    item.addEventListener('click', () => {
      const hid = parseInt(item.dataset.heroid, 10);
      openHeroModal(hid);
    });
  });
}

function createMoverItemHtml(hero, direction) {
  const isUp = direction === 'up';
  const prefix = isUp && hero.deltaWr > 0 ? '+' : '';

  return `
    <div class="radar-item" data-heroid="${hero.heroid}" tabindex="0">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${hero.head}" alt="${hero.name}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;" onerror="this.src='./favicon.svg'"/>
        <div>
          <strong style="font-size: 0.9rem;">${hero.name}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${hero.roles.join(', ')} · 7D: ${hero.baselineWr}% ➔ Today: ${hero.win_rate_pct}%</div>
        </div>
      </div>
      <div class="delta-badge ${isUp ? 'up' : 'down'}">
        <span>${isUp ? '▲' : '▼'}</span>
        <span>${prefix}${hero.deltaWr}%</span>
      </div>
    </div>
  `;
}

function roundFloat(val, decimals = 2) {
  return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
}
