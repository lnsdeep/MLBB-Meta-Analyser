/**
 * MLBB Meta Analyser - Table View Renderer
 * High-density sortable meta table with visual rate bars and tooltips
 */

import { state } from './state.js';
import { openHeroModal } from './heroModal.js';

export function renderTableView(container, heroesList) {
  if (!container) return;

  const activeRole = state.get('activeRole');
  const activeLane = state.get('activeLane');
  const query = state.get('searchQuery').toLowerCase().trim();
  const sortField = state.get('sortField');
  const sortOrder = state.get('sortOrder');

  // Filter heroes
  let filtered = heroesList.filter(hero => {
    if (activeRole !== 'ALL' && !hero.roles.includes(activeRole)) return false;
    if (activeLane !== 'ALL' && !hero.lanes.includes(activeLane)) return false;
    if (query) {
      const matchName = hero.name.toLowerCase().includes(query);
      const matchRole = hero.roles.some(r => r.toLowerCase().includes(query));
      const matchLane = hero.lanes.some(l => l.toLowerCase().includes(query));
      if (!matchName && !matchRole && !matchLane) return false;
    }
    return true;
  });

  // Sort heroes
  filtered.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No heroes match your filters</div>
      </div>
    `;
    return;
  }

  const thClass = (field) => {
    if (sortField !== field) return '';
    return sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc';
  };

  const html = `
    <div class="table-container">
      <table class="meta-table" aria-label="MLBB Meta Heroes Table">
        <thead>
          <tr>
            <th data-sort="ranking" class="${thClass('ranking')}">#</th>
            <th data-sort="name" class="${thClass('name')}">Hero</th>
            <th data-sort="tier" class="${thClass('tier')}">Tier</th>
            <th data-sort="win_rate_pct" class="${thClass('win_rate_pct')}" data-tooltip="Percentage of games won">Win Rate</th>
            <th data-sort="pick_rate_pct" class="${thClass('pick_rate_pct')}" data-tooltip="Percentage of games picked">Pick Rate</th>
            <th data-sort="ban_rate_pct" class="${thClass('ban_rate_pct')}" data-tooltip="Percentage of games banned">Ban Rate</th>
            <th data-sort="meta_score" class="${thClass('meta_score')}" data-tooltip="Overall composite strength score (0-100)">Score</th>
            <th>Top Counters</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((hero, idx) => createTableRowHtml(hero, idx + 1)).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;

  // Header click sorting
  container.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (state.get('sortField') === field) {
        state.set('sortOrder', state.get('sortOrder') === 'asc' ? 'desc' : 'asc');
      } else {
        state.update({
          sortField: field,
          sortOrder: field === 'ranking' || field === 'name' ? 'asc' : 'desc'
        });
      }
    });
  });

  // Row click opens hero modal
  container.querySelectorAll('tbody tr').forEach(row => {
    row.addEventListener('click', () => {
      const heroId = parseInt(row.dataset.heroid, 10);
      openHeroModal(heroId);
    });
  });
}

function createTableRowHtml(hero, displayRank) {
  const tierClass = hero.tier.toLowerCase().replace('+', '-plus');
  const winBarWidth = Math.min(100, Math.max(0, (hero.win_rate_pct - 40) * 5)); // 40% to 60% maps to 0-100%
  const banBarWidth = Math.min(100, hero.ban_rate_pct * 2); // 0-50% maps to 0-100%
  const pickBarWidth = Math.min(100, hero.pick_rate_pct * 15);

  const topCounters = (hero.counters || []).slice(0, 3);

  return `
    <tr data-heroid="${hero.heroid}" tabindex="0">
      <td class="table-rank-num">${displayRank}</td>
      <td>
        <div class="table-hero-cell">
          <img class="table-hero-avatar" src="${hero.head}" alt="${hero.name}" loading="lazy" width="36" height="36" onerror="this.src='./favicon.svg'"/>
          <div>
            <strong>${hero.name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${hero.roles.join(', ')} · ${hero.lanes.join(', ')}</div>
          </div>
        </div>
      </td>
      <td><span class="tier-badge ${tierClass}">${hero.tier}</span></td>
      <td>
        <div class="table-bar-wrapper">
          <span style="font-weight: 700; color: var(--win-green);">${hero.win_rate_pct}%</span>
          <div class="mini-bar"><div class="mini-bar-fill win" style="width: ${winBarWidth}%;"></div></div>
        </div>
      </td>
      <td>
        <div class="table-bar-wrapper">
          <span>${hero.pick_rate_pct}%</span>
          <div class="mini-bar"><div class="mini-bar-fill pick" style="width: ${pickBarWidth}%;"></div></div>
        </div>
      </td>
      <td>
        <div class="table-bar-wrapper">
          <span style="color: ${hero.ban_rate_pct >= 20 ? 'var(--ban-rose)' : 'inherit'}; font-weight: ${hero.ban_rate_pct >= 20 ? '700' : '400'};">${hero.ban_rate_pct}%</span>
          <div class="mini-bar"><div class="mini-bar-fill ban" style="width: ${banBarWidth}%;"></div></div>
        </div>
      </td>
      <td><strong style="color: var(--brand-primary);">${hero.meta_score}</strong></td>
      <td>
        <div style="display: flex; gap: 4px;">
          ${topCounters.map(c => `
            <img src="${c.head}" title="${c.name} (+${c.increase_win_rate_pct}% advantage)" alt="${c.name}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover;" onerror="this.src='./favicon.svg'"/>
          `).join('')}
        </div>
      </td>
    </tr>
  `;
}
