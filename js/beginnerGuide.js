/**
 * MLBB Meta Analyser - Beginner Hero Matcher ("Find My Hero")
 * Approachable, beginner-friendly wizard helping new learners discover easy, high-impact heroes
 * with battle spell recommendations and core item build hints.
 */

import { dataService } from './dataService.js';
import { openHeroModal } from './heroModal.js';

let selectedPlaystyle = 'range'; // range, tank, support, brawler, jungle

export const PLAYSTYLES = [
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
    desc: 'Durable melee combatant with great sustained damage and survivability.',
    roles: ['Fighter'],
  },
  {
    id: 'jungle',
    icon: '⚡',
    label: 'Fast Jungler / Hunter',
    desc: 'Farm monsters, secure Turtles & Lord, and ambush unsuspecting enemies.',
    roles: ['Assassin', 'Fighter', 'Tank'],
  },
];

/**
 * Pure recommendation engine for beginner battle spell
 */
export function getRecommendedBattleSpell(hero, playstyleId) {
  const name = (hero.name || '').toLowerCase();
  const roles = (hero.roles || []).map(r => r.toLowerCase());
  const lanes = (hero.lanes || []).map(l => l.toLowerCase());

  // 1. Jungle playstyle or hero in Jungle lane
  if (playstyleId === 'jungle' || lanes.includes('jungle')) {
    return {
      name: 'Retribution',
      icon: '⚡',
      reason: 'Mandatory for Junglers to secure Lord, Turtle & jungle creep gold.'
    };
  }

  // 2. Signature hero spells
  if (name === 'balmond') {
    return { name: 'Execute', icon: '⚔️', reason: 'Stacks with his spin and Ultimate for lethal execution burst.' };
  }
  if (name === 'tigreal' || name === 'atlas' || name === 'franco') {
    return { name: 'Flicker', icon: '✨', reason: 'Essential for surprise Flicker-Ultimate crowd control engages.' };
  }
  if (name === 'belerick' || name === 'gatotkaca' || name === 'hylos' || name === 'uranus') {
    return { name: 'Vengeance', icon: '🔥', reason: 'Reduces damage taken & reflects damage back to attackers.' };
  }
  if (name === 'estes' || name === 'floryn') {
    return { name: 'Purify', icon: '🛡️', reason: 'Breaks CC stuns so you can keep healing your teammates.' };
  }
  if (name === 'angela') {
    return { name: 'Flicker', icon: '✨', reason: 'Safe escape tool when detaching from your allied host.' };
  }
  if (name === 'miya' || name === 'layla' || name === 'moskov') {
    return { name: 'Inspire', icon: '🎯', reason: 'Massive burst of attack speed and HP regen in fights.' };
  }

  // 3. Role defaults
  if (roles.includes('tank')) {
    return { name: 'Flicker', icon: '✨', reason: 'Surprise engage tool to catch enemy backline carries.' };
  }
  if (roles.includes('support')) {
    return { name: 'Purify', icon: '🛡️', reason: 'Cleanses crowd control to maintain team support.' };
  }
  if (roles.includes('fighter')) {
    return { name: 'Vengeance', icon: '🔥', reason: 'Frontline damage mitigation and reflection.' };
  }
  if (roles.includes('mage') || roles.includes('marksman')) {
    return { name: 'Flicker', icon: '✨', reason: 'Crucial escape flash to survive enemy assassin ganks.' };
  }

  return { name: 'Flicker', icon: '✨', reason: 'Universal safety repositioning tool.' };
}

/**
 * Pure recommendation engine for beginner core power-spike item
 */
export function getRecommendedCoreItem(hero) {
  const name = (hero.name || '').toLowerCase();
  const roles = (hero.roles || []).map(r => r.toLowerCase());

  if (name === 'balmond' || name === 'dyrroth' || name === 'martis') {
    return { name: 'War Axe', desc: 'Ramping physical attack & true damage sustain' };
  }
  if (name === 'saber' || name === 'zilong') {
    return { name: 'Blade of Heptaseas', desc: 'High physical ambush burst on first strike' };
  }
  if (roles.includes('tank')) {
    return { name: 'Dominance Ice', desc: 'Reduces enemy healing + high physical armor' };
  }
  if (roles.includes('support')) {
    return { name: 'Flask of the Oasis', desc: 'Massive ally shields & emergency healing' };
  }
  if (roles.includes('marksman')) {
    return { name: 'Corrosion Scythe', desc: 'Ramping attack speed and target slows' };
  }
  if (roles.includes('mage')) {
    return { name: 'Lightning Truncheon', desc: 'Echoing burst damage to nearby foes' };
  }
  if (roles.includes('fighter')) {
    return { name: 'War Axe', desc: 'Bonus physical damage and sustained lifesteal' };
  }

  return { name: 'Dominance Ice', desc: 'Universal defense & anti-heal utility' };
}

/**
 * Pure matching function for beginner heroes
 */
export function getBeginnerMatchedHeroes(styleId, playstyles, heroesList, catalog) {
  if (!Array.isArray(heroesList)) return [];

  const currentStyle = (playstyles || PLAYSTYLES).find(p => p.id === styleId);
  if (!currentStyle) return [];

  const catalogMap = (catalog && catalog.map instanceof Map) ? catalog.map : new Map();

  return heroesList.filter(h => {
    const full = catalogMap.get(h.heroid) || {};
    const diff = parseInt(full.difficulty || '25', 10);

    let matches = false;
    if (currentStyle.id === 'jungle') {
      const isJungleLane = h.lanes && h.lanes.some(l => l.toLowerCase() === 'jungle');
      const isJungleRole = h.roles && h.roles.some(r => currentStyle.roles.includes(r));
      matches = isJungleLane || isJungleRole;
    } else {
      matches = h.roles && h.roles.some(r => currentStyle.roles.includes(r));
    }

    return matches && diff <= 35 && h.win_rate_pct >= 50.0;
  }).sort((a, b) => b.win_rate_pct - a.win_rate_pct);
}

/**
 * Render Beginner Hero Matcher Wizard View
 */
export async function renderBeginnerGuide(container, heroesList) {
  if (!container) return;

  const catalog = await dataService.fetchCatalog();

  container.innerHTML = `
    <div class="tool-section beginner-guide-view">
      <div class="beginner-wizard-card">
        <div class="beginner-header-group">
          <h2>🌟 Beginner Hero Matcher ("Find My Hero")</h2>
          <p>New to Mobile Legends? Choose your preferred playstyle below to get easy-to-learn, high-win-rate heroes with battle spell and core item guidance!</p>
        </div>

        <div>
          <div class="wizard-step-title">Step 1: Choose Your Preferred Playstyle</div>
          <div class="wizard-options-grid" id="playstyleOptions">
            ${PLAYSTYLES.map(p => `
              <button
                class="wizard-option-btn ${selectedPlaystyle === p.id ? 'selected' : ''}"
                data-style="${p.id}"
                role="radio"
                aria-checked="${selectedPlaystyle === p.id}"
              >
                <span class="wizard-option-icon">${p.icon}</span>
                <span class="wizard-option-label">${p.label}</span>
                <span class="wizard-option-desc">${p.desc}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Matched Heroes List -->
        <div>
          <div class="wizard-step-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span>Recommended Easy Heroes (Difficulty ≤ 35 & Win Rate ≥ 50%)</span>
          </div>
          <div class="matchup-grid" id="beginnerMatchedGrid" style="margin-top: 14px;">
            ${renderMatchedHeroesHtml(selectedPlaystyle, heroesList, catalog)}
          </div>
        </div>

        <!-- Beginner Quick Guide Box -->
        <div class="beginner-tips-box">
          <h4 class="beginner-tips-title">
            💡 3 Essential Tips for New Players:
          </h4>
          <ol class="beginner-tips-list">
            <li><strong>Always bring Retribution in Jungle</strong>: Without Retribution, you cannot buy Jungling boots or secure Turtle/Lord.</li>
            <li><strong>Stay with your minion wave</strong>: Minions take turret hits for you and grant gold/XP. Never fight towers alone!</li>
            <li><strong>Master one simple hero first</strong>: Learning map awareness and positioning is 5x faster when your hero mechanics are simple.</li>
          </ol>
        </div>
      </div>
    </div>
  `;

  // Attach playstyle option click listeners
  const optionsEl = container.querySelector('#playstyleOptions');
  if (optionsEl) {
    optionsEl.querySelectorAll('.wizard-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        optionsEl.querySelectorAll('.wizard-option-btn').forEach(b => {
          b.classList.remove('selected');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
        selectedPlaystyle = btn.dataset.style;

        const grid = container.querySelector('#beginnerMatchedGrid');
        if (grid) {
          grid.innerHTML = renderMatchedHeroesHtml(selectedPlaystyle, heroesList, catalog);
          attachGridListeners(grid);
        }
      });
    });
  }

  attachGridListeners(container.querySelector('#beginnerMatchedGrid'));
}

function renderMatchedHeroesHtml(styleId, heroesList, catalog) {
  const matched = getBeginnerMatchedHeroes(styleId, PLAYSTYLES, heroesList, catalog);

  if (matched.length === 0) {
    return `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 20px; grid-column: 1 / -1; text-align: center;">No heroes currently meet the strict beginner criteria for this role. Try another playstyle!</p>`;
  }

  const catalogMap = (catalog && catalog.map instanceof Map) ? catalog.map : new Map();

  return matched.slice(0, 6).map(h => {
    const full = catalogMap.get(h.heroid) || {};
    const primaryLane = (h.lanes && h.lanes[0]) || 'Any Lane';
    const spell = getRecommendedBattleSpell(h, styleId);
    const item = getRecommendedCoreItem(h);
    const diff = full.difficulty || '15';

    return `
      <div class="matchup-card beginner-hero-card" data-heroid="${h.heroid}" tabindex="0" role="button" aria-label="${h.name} — ${h.roles.join(', ')}">
        <img class="matchup-avatar" src="${h.head}" alt="${h.name}" onerror="this.src='./favicon.svg'"/>
        <div class="matchup-details">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
            <span class="matchup-name">${h.name}</span>
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--win-green);">${h.win_rate_pct}% Win</span>
          </div>

          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            ${h.roles.join(', ')} · Lane: <strong style="color: var(--brand-primary);">${primaryLane}</strong>
          </div>

          <!-- Story 5.4: Battle Spell & Core Item Badges -->
          <div class="beginner-guidance-tags">
            <span class="beginner-tag spell-tag" title="${spell.reason}">
              ${spell.icon} ${spell.name}
            </span>
            <span class="beginner-tag item-tag" title="${item.desc}">
              📦 ${item.name}
            </span>
          </div>

          <div class="beginner-diff-rating">
            🟢 Easy to learn (Difficulty: ${diff}/100)
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
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const hid = parseInt(card.dataset.heroid, 10);
        openHeroModal(hid);
      }
    });
  });
}
