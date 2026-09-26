/**
 * MLBB Meta Analyser - Ban Priority Radar
 * Classifies heroes into Must-Bans, Situational/Over-Banned, and Sleeper Threats
 * using the statistical Ban Urgency Index (BUI).
 */

import { openHeroModal } from './heroModal.js';

export function renderBanRadar(container, heroesList) {
  if (!container) return;

  // 1. Must-Bans: Ban rate >= 15% AND Win rate >= 52%
  const mustBans = heroesList
    .filter(h => h.ban_rate_pct >= 15.0 && h.win_rate_pct >= 52.0)
    .sort((a, b) => (b.ban_rate_pct * b.win_rate_pct) - (a.ban_rate_pct * a.win_rate_pct));

  // 2. Over-Banned / Comfort Bans: Ban rate >= 10% but Win rate < 50%
  const overBans = heroesList
    .filter(h => h.ban_rate_pct >= 10.0 && h.win_rate_pct < 50.0)
    .sort((a, b) => b.ban_rate_pct - a.ban_rate_pct);

  // 3. Sleeper Threats: Win rate >= 54% but Ban rate < 10% (Free unbanned wins)
  const sleeperThreats = heroesList
    .filter(h => h.win_rate_pct >= 54.0 && h.ban_rate_pct < 10.0)
    .sort((a, b) => b.win_rate_pct - a.win_rate_pct);

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>🚫 Ban Priority Radar</h2>
          <p>Don't waste bans on outdated picks. Our Ban Urgency Index reveals real meta threats vs comfort bans.</p>
        </div>
      </div>

      <div class="radar-grid">
        <!-- Column 1: Must-Bans -->
        <div class="radar-column" style="border-top: 4px solid var(--ban-rose);">
          <div class="radar-col-header">
            <div class="radar-col-title" style="color: var(--ban-rose);">🚨 Priority Must-Bans</div>
            <div class="radar-col-desc">High ban rate + high win rate. Lethal if left open.</div>
          </div>
          <div class="radar-list">
            ${mustBans.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-muted);">No urgent must-bans in this bracket.</p>' : mustBans.slice(0, 8).map(h => createRadarItemHtml(h, 'must')).join('')}
          </div>
        </div>

        <!-- Column 2: Sleeper Threats -->
        <div class="radar-column" style="border-top: 4px solid var(--win-green);">
          <div class="radar-col-header">
            <div class="radar-col-title" style="color: var(--win-green);">🤫 Sleeper Threats (Free Wins)</div>
            <div class="radar-col-desc">Win rate > 54% but rarely banned (< 10%). Pick them!</div>
          </div>
          <div class="radar-list">
            ${sleeperThreats.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-muted);">No sleeper threats detected.</p>' : sleeperThreats.slice(0, 8).map(h => createRadarItemHtml(h, 'sleeper')).join('')}
          </div>
        </div>

        <!-- Column 3: Over-Banned -->
        <div class="radar-column" style="border-top: 4px solid var(--tier-s-plus);">
          <div class="radar-col-header">
            <div class="radar-col-title" style="color: var(--tier-s-plus);">⚠️ Over-Banned / Comfort Bans</div>
            <div class="radar-col-desc">Banned often out of habit despite sub-50% win rates.</div>
          </div>
          <div class="radar-list">
            ${overBans.length === 0 ? '<p style="font-size: 0.8rem; color: var(--text-muted);">No wasted comfort bans detected.</p>' : overBans.slice(0, 8).map(h => createRadarItemHtml(h, 'over')).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach card clicks
  container.querySelectorAll('.radar-item').forEach(item => {
    item.addEventListener('click', () => {
      const hid = parseInt(item.dataset.heroid, 10);
      openHeroModal(hid);
    });
  });
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
    <div class="radar-item" data-heroid="${hero.heroid}" tabindex="0">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${hero.head}" alt="${hero.name}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;" onerror="this.src='./favicon.svg'"/>
        <div>
          <strong style="font-size: 0.9rem;">${hero.name}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${hero.roles.join(', ')} · ${hero.lanes.join(', ')}</div>
        </div>
      </div>
      ${badgeHtml}
    </div>
  `;
}
