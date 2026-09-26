/**
 * MLBB Meta Analyser - Tier View Renderer
 * Visual S+, S, A, B, C, D Tier List Hub with Lane & Role filtering
 */

import { state } from './state.js';
import { openHeroModal } from './heroModal.js';

export function renderTierView(container, heroesList) {
  if (!container) return;

  // Filter heroes based on state (role, lane, search query)
  const activeRole = state.get('activeRole');
  const activeLane = state.get('activeLane');
  const query = state.get('searchQuery').toLowerCase().trim();

  const filtered = heroesList.filter(hero => {
    // Role filter
    if (activeRole !== 'ALL' && !hero.roles.includes(activeRole)) {
      return false;
    }
    // Lane filter
    if (activeLane !== 'ALL' && !hero.lanes.includes(activeLane)) {
      return false;
    }
    // Search query filter
    if (query) {
      const matchName = hero.name.toLowerCase().includes(query);
      const matchRole = hero.roles.some(r => r.toLowerCase().includes(query));
      const matchLane = hero.lanes.some(l => l.toLowerCase().includes(query));
      if (!matchName && !matchRole && !matchLane) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No heroes found</div>
        <p>Try clearing your search query or adjusting your role/lane filters.</p>
      </div>
    `;
    return;
  }

  // Tier groupings configuration
  const TIERS = [
    { key: 'S+', title: 'God Tier · Meta Dominators', class: 's-plus', desc: 'Highest priority bans and picks' },
    { key: 'S', title: 'High Priority · Strong Meta', class: 's', desc: 'Excellent win rates and competitive strength' },
    { key: 'A', title: 'Solid Picks · Viable Contenders', class: 'a', desc: 'Reliable and effective across most team compositions' },
    { key: 'B', title: 'Situational · Balanced', class: 'b', desc: 'Works well with proper team synergy or as counter-picks' },
    { key: 'C', title: 'Below Average · Outperformed', class: 'c', desc: 'Requires high mastery or favorable matchups' },
    { key: 'D', title: 'Off-Meta · Struggling', class: 'd', desc: 'Currently underperforming in this rank bracket' },
  ];

  let html = '';

  for (const tier of TIERS) {
    const tierHeroes = filtered.filter(h => h.tier === tier.key);
    if (tierHeroes.length === 0) continue;

    html += `
      <section class="tier-group" aria-label="Tier ${tier.key}">
        <div class="tier-header">
          <span class="tier-badge ${tier.class}">${tier.key}</span>
          <span class="tier-title">${tier.title}</span>
          <span class="tier-count">(${tierHeroes.length})</span>
        </div>
        <div class="tier-grid">
          ${tierHeroes.map(h => createHeroCardHtml(h)).join('')}
        </div>
      </section>
    `;
  }

  container.innerHTML = html;

  // Attach click listeners to cards to open Hero Dossier Modal
  container.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', () => {
      const heroId = parseInt(card.dataset.heroid, 10);
      openHeroModal(heroId);
    });
  });
}

function createHeroCardHtml(hero) {
  const primaryRole = hero.roles[0] || '';
  const primaryLane = hero.lanes[0] || '';
  const banText = hero.ban_rate_pct >= 1.0 ? `${hero.ban_rate_pct}%` : `${hero.ban_rate_pct.toFixed(2)}%`;

  return `
    <article class="hero-card" data-heroid="${hero.heroid}" tabindex="0" role="button" aria-label="View details for ${hero.name}">
      <div class="hero-card-top">
        <div class="hero-avatar-wrapper">
          <img class="hero-avatar" src="${hero.head}" alt="${hero.name}" loading="lazy" width="48" height="48" onerror="this.src='./favicon.svg'"/>
        </div>
        <div class="hero-info">
          <h3 class="hero-name">${hero.name}</h3>
          <div class="hero-meta-tags">
            <span class="hero-role-tag">${primaryRole}</span>
            ${primaryLane ? `<span class="hero-lane-pill">${primaryLane}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="hero-stats-row">
        <div class="stat-item" data-tooltip="Win Rate: percentage of games won">
          <span class="stat-label">Win</span>
          <span class="stat-val win">${hero.win_rate_pct}%</span>
        </div>
        <div class="stat-item" data-tooltip="Ban Rate: percentage of games banned">
          <span class="stat-label">Ban</span>
          <span class="stat-val ban">${banText}</span>
        </div>
        <div class="stat-item" data-tooltip="Meta Score: overall ranking score">
          <span class="stat-label">Score</span>
          <span class="stat-val pick">${hero.meta_score}</span>
        </div>
      </div>
    </article>
  `;
}
