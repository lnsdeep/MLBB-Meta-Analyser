/**
 * MLBB Meta Analyser - Beginner Hero Matcher ("Find My Hero")
 * Approachable, beginner-friendly wizard helping new learners discover easy, high-impact heroes.
 */

import { dataService } from './dataService.js';
import { openHeroModal } from './heroModal.js';

let selectedPlaystyle = 'range'; // range, tank, brawler, support, fast

export async function renderBeginnerGuide(container, heroesList) {
  if (!container) return;

  const catalog = await dataService.fetchCatalog();

  const PLAYSTYLES = [
    {
      id: 'range',
      icon: '🏹',
      label: 'Safe at a Distance',
      desc: 'Attack enemies from afar without being in the middle of danger.',
      roles: ['Marksman', 'Mage'],
    },
    {
      id: 'tank',
      icon: '🛡️',
      label: 'Tough & Indestructible',
      desc: 'High health; initiate fights and absorb hits to protect your team.',
      roles: ['Tank'],
    },
    {
      id: 'support',
      icon: '💚',
      label: 'Healer & Team Helper',
      desc: 'Keep allies alive with healing, shields, and speed boosts.',
      roles: ['Support'],
    },
    {
      id: 'brawler',
      icon: '⚔️',
      label: 'Brawler & Fighter',
      desc: 'Durable melee combatant with great damage and sustain.',
      roles: ['Fighter'],
    },
  ];

  container.innerHTML = `
    <div class="tool-section">
      <div class="beginner-wizard-card">
        <div style="text-align: center; max-width: 600px; margin: 0 auto;">
          <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
            🌟 Beginner Hero Matcher
          </h2>
          <p style="font-size: 0.95rem; color: var(--text-secondary);">
            New to Mobile Legends? Tell us how you like to play, and we'll recommend easy-to-learn champions with strong winning stats!
          </p>
        </div>

        <div>
          <div class="wizard-step-title">Step 1: Choose Your Preferred Playstyle</div>
          <div class="wizard-options-grid" id="playstyleOptions">
            ${PLAYSTYLES.map(p => `
              <button class="wizard-option-btn ${selectedPlaystyle === p.id ? 'selected' : ''}" data-style="${p.id}">
                <span class="wizard-option-icon">${p.icon}</span>
                <span class="wizard-option-label">${p.label}</span>
                <span class="wizard-option-desc">${p.desc}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Matched Heroes List -->
        <div>
          <div class="wizard-step-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Recommended Easy-to-Learn Heroes (Difficulty ≤ 35 & Win Rate ≥ 50%)</span>
          </div>
          <div class="matchup-grid" id="beginnerMatchedGrid" style="margin-top: 14px;">
            ${renderMatchedHeroes(selectedPlaystyle, PLAYSTYLES, heroesList, catalog)}
          </div>
        </div>

        <!-- Beginner Quick Guide Box -->
        <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px; margin-top: 10px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--brand-primary); margin-bottom: 8px;">
            💡 3 Quick Tips for New Players:
          </h4>
          <ol style="padding-left: 20px; font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 6px;">
            <li><strong>Stay with your minion wave</strong>: Minions absorb turret shots and give you gold and experience when they fall.</li>
            <li><strong>Keep an eye on the mini-map</strong>: If you don't see enemies on the map, retreat closer to your turret to stay safe.</li>
            <li><strong>Learn one hero first</strong>: Mastering one simple hero builds game sense much faster than switching every match!</li>
          </ol>
        </div>
      </div>
    </div>
  `;

  // Attach playstyle option click
  const optionsEl = container.querySelector('#playstyleOptions');
  optionsEl.querySelectorAll('.wizard-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      optionsEl.querySelectorAll('.wizard-option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPlaystyle = btn.dataset.style;

      const grid = container.querySelector('#beginnerMatchedGrid');
      grid.innerHTML = renderMatchedHeroes(selectedPlaystyle, PLAYSTYLES, heroesList, catalog);
      attachGridListeners(grid);
    });
  });

  attachGridListeners(container.querySelector('#beginnerMatchedGrid'));
}

function renderMatchedHeroes(styleId, playstyles, heroesList, catalog) {
  const currentStyle = playstyles.find(p => p.id === styleId);
  if (!currentStyle) return '';

  // Filter heroes that match role, have difficulty <= 35, and win rate >= 50%
  const matched = heroesList.filter(h => {
    const full = catalog.map.get(h.heroid) || {};
    const diff = parseInt(full.difficulty || '50', 10);
    const matchesRole = h.roles.some(r => currentStyle.roles.includes(r));
    return matchesRole && diff <= 35 && h.win_rate_pct >= 50.0;
  }).sort((a, b) => b.win_rate_pct - a.win_rate_pct);

  if (matched.length === 0) {
    return `<p style="color: var(--text-muted); font-size: 0.85rem;">No heroes currently meet the strict beginner criteria for this role. Try another playstyle!</p>`;
  }

  return matched.slice(0, 6).map(h => {
    const full = catalog.map.get(h.heroid) || {};
    const primaryLane = h.lanes[0] || 'Any Lane';

    return `
      <div class="matchup-card" data-heroid="${h.heroid}" tabindex="0" role="button" aria-label="View ${h.name} guide">
        <img class="matchup-avatar" src="${h.head}" alt="${h.name}" onerror="this.src='./favicon.svg'"/>
        <div class="matchup-details">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span class="matchup-name">${h.name}</span>
            <span style="font-size: 0.72rem; font-weight: 700; color: var(--win-green);">${h.win_rate_pct}% Win</span>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            ${h.roles.join(', ')} · Recommended Lane: <strong style="color: var(--brand-primary);">${primaryLane}</strong>
          </span>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.3;">
            🟢 Easy to learn (Difficulty: ${full.difficulty || '10'}/100)
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function attachGridListeners(grid) {
  if (!grid) return;
  grid.querySelectorAll('.matchup-card').forEach(card => {
    card.addEventListener('click', () => {
      const hid = parseInt(card.dataset.heroid, 10);
      openHeroModal(hid);
    });
  });
}
