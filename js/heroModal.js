/**
 * MLBB Meta Analyser - Hero Dossier Modal & Mobile Bottom Sheet
 * Displays full skill kit, resource costs, scaling formulas, status keyword tooltips,
 * custom emblem recommendations, difficulty, counters, and synergies.
 */

import { dataService } from './dataService.js';
import { state } from './state.js';

let modalEl = null;

const MECHANIC_DEFINITIONS = {
  'Suppress': 'Suppress: Uninterruptible hard lockdown. CANNOT be removed or reduced by Purify, Tough Boots, or Resilience.',
  'Airborne': 'Airborne: Target is knocked aloft, completely disabling all actions. Cannot be cleansed mid-air by standard skills.',
  'Petrify': 'Petrify: Turns enemies to stone, stopping all movement and skill casts for 0.8s.',
  'Frozen Moment': 'Frozen Moment: Complete stasis freeze. Targets, objectives, and projectiles are suspended in place.',
  'Immobilize': 'Immobilize: Rooted in place; disables movement and dashes, but basic attacks/skills can still be cast.',
  'Slow': 'Slow: Movement speed reduction. Cleansable by Purify or Sprint.',
  'Untargetable': 'Untargetable: Cannot be targeted or hit by standard skills or basic attacks.',
  'Resilience': 'Resilience: Percentage reduction on crowd control durations (capped at 50%). Does not reduce Suppress or Knockback.',
  'True Damage': 'True Damage: Pure unmitigated damage that completely bypasses Physical Defense, Magic Defense, and shields.'
};

/**
 * Wraps status effect keywords in tooltip markup
 */
export function decorateMechanicsKeywords(text) {
  if (!text) return '';
  let decorated = text;
  for (const [kw, def] of Object.entries(MECHANIC_DEFINITIONS)) {
    // Replace word boundaries
    const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
    decorated = decorated.replace(regex, `<span class="mechanic-term" data-tooltip="${def}">$1</span>`);
  }
  return decorated;
}

/**
 * Extracts and formats skill resource costs, cooldowns, and damage types
 */
export function parseSkillBadges(sk, idx) {
  const rawCost = sk.cost || '';
  const desc = sk.desc || '';
  const tags = sk.tags || [];

  // 1. Skill Type
  let typeLabel = sk.skill_type;
  if (!typeLabel) {
    if (idx === 0) typeLabel = 'Passive';
    else if (idx === 3) typeLabel = 'Ultimate';
    else typeLabel = `Skill ${idx}`;
  }

  // 2. Cooldown
  let cdBadge = '';
  const cdMatch = rawCost.match(/CD:\s*([\d\.\s-]+s?)/i);
  if (cdMatch) {
    let cdVal = cdMatch[1].trim();
    if (!cdVal.endsWith('s')) cdVal += 's';
    cdBadge = `⏱️ ${cdVal}`;
  } else if (rawCost.toLowerCase().includes('passive')) {
    cdBadge = '⏱️ Passive';
  }

  // 3. Resource Cost (Mana / Energy / None)
  let costBadge = '';
  const manaMatch = rawCost.match(/Mana\s*(?:Cost)?:\s*([\d\s-]+)/i);
  if (manaMatch) {
    costBadge = `💧 ${manaMatch[1].trim()} Mana`;
  } else if (rawCost.toLowerCase().includes('energy') || desc.toLowerCase().includes('energy')) {
    const energyMatch = rawCost.match(/Energy:\s*([\d\s-]+)/i);
    costBadge = `⚡ ${energyMatch ? energyMatch[1].trim() : '40'} Energy`;
  } else if (rawCost.toLowerCase().includes('no cost') || typeLabel === 'Passive') {
    costBadge = '🛡️ No Cost';
  }

  // 4. Damage Type
  let dmgType = sk.damage_type || '';
  if (!dmgType) {
    if (desc.includes('True Damage')) dmgType = 'True Damage';
    else if (desc.includes('Magic Damage') || tags.includes('Magic')) dmgType = 'Magic Damage';
    else if (desc.includes('Physical Damage') || tags.includes('Physical')) dmgType = 'Physical Damage';
    else if (tags.includes('Buff') || tags.includes('Shield')) dmgType = 'Buff / Shield';
  }

  let dmgBadge = '';
  if (dmgType === 'True Damage') dmgBadge = '⚡ True Damage';
  else if (dmgType === 'Magic Damage') dmgBadge = '🔮 Magic';
  else if (dmgType === 'Physical Damage') dmgBadge = '💥 Physical';
  else if (dmgType) dmgBadge = `🛡️ ${dmgType}`;

  // 5. Scaling
  let scalingText = sk.scaling || '';
  if (!scalingText) {
    const scalingMatches = desc.match(/\(\+[^)]+\)/g);
    if (scalingMatches) {
      scalingText = scalingMatches.slice(0, 2).join(' ');
    }
  }

  return {
    typeLabel,
    cdBadge,
    costBadge,
    dmgBadge,
    scalingText
  };
}

/**
 * Story 4.3 & Tool Idea 3: Optimal Custom Emblem & Talent Synergy Recommender
 */
export function getRecommendedEmblem(hero) {
  const primaryRole = (hero?.roles || [])[0] || 'Fighter';
  const name = hero?.name || '';

  if (primaryRole === 'Assassin' || ['Saber', 'Helcurt', 'Natalia', 'Gusion', 'Aamon'].includes(name)) {
    return {
      emblemName: 'Custom Assassin Emblem',
      talents: [
        { name: 'Thrill', icon: '🗡️', effect: '+16 Adaptive Attack' },
        { name: 'Master Assassin', icon: '🎯', effect: '+7% Damage vs Isolated Targets' },
        { name: 'Lethal Ignition', icon: '🔥', effect: 'Multi-hit Burst Burns for 162-750 Damage' }
      ],
      rationale: 'Maximizes single-target ambush burst and accelerates snowball potential.'
    };
  } else if (primaryRole === 'Support' || ['Marcel', 'Angela', 'Floryn', 'Estes', 'Rafaela', 'Mathilda'].includes(name)) {
    return {
      emblemName: 'Custom Support Emblem',
      talents: [
        { name: 'Agility', icon: '👟', effect: '+10% Movement Speed' },
        { name: 'Pull Yourself Together', icon: '⏳', effect: '-15% Battle Spell & Active Item CD' },
        { name: 'Focusing Mark', icon: '👁️', effect: 'Attacking enemy boosts allies\' damage by 6%' }
      ],
      rationale: 'Provides high roaming tempo, rapid Flicker/Revitalize availability, and amplifies carry teamfight DPS.'
    };
  } else if (primaryRole === 'Tank' || ['Tigreal', 'Atlas', 'Hylos', 'Baxia', 'Khufra', 'Gloo'].includes(name)) {
    return {
      emblemName: 'Custom Tank Emblem',
      talents: [
        { name: 'Firmness', icon: '🛡️', effect: '+6 Hybrid Defense' },
        { name: 'Tenacity', icon: '🧱', effect: '+15 Hybrid Defense below 50% HP' },
        { name: 'Concussive Blast', icon: '💥', effect: 'HP-Scaling AOE Magic Burst on Basic Attack' }
      ],
      rationale: 'Boosts frontline survivability and supplies early wave-clear to support the roamer rotation.'
    };
  } else if (primaryRole === 'Mage' || ['Xavier', 'Nana', 'Vexana', 'Luo Yi', 'Cecilion', 'Pharsa'].includes(name)) {
    return {
      emblemName: 'Custom Mage Emblem',
      talents: [
        { name: 'Inspire', icon: '⏱️', effect: '+5% Cooldown Reduction' },
        { name: 'Bargain Hunter', icon: '💰', effect: '5% Equipment Discount' },
        { name: 'Lethal Ignition', icon: '🔥', effect: 'Burst Burn finishes off low-health enemies' }
      ],
      rationale: 'Ensures swift spell rotations, rapid core item completions (Lightning Truncheon), and high combo finish rates.'
    };
  } else if (primaryRole === 'Marksman' || ['Layla', 'Miya', 'Moskov', 'Claude', 'Bruno', 'Beatrix'].includes(name)) {
    return {
      emblemName: 'Custom Marksman Emblem',
      talents: [
        { name: 'Swift', icon: '🏹', effect: '+10% Attack Speed' },
        { name: 'Weapons Master', icon: '⚔️', effect: '+5% Extra Physical Attack from Equipment' },
        { name: 'Quantum Charge', icon: '⚡', effect: 'Basic attacks grant 40% Move Speed + HP Regen' }
      ],
      rationale: 'Enhances sustained kiting agility in teamfights while maximizing late-game scaling multiplier.'
    };
  } else {
    // Fighter default
    return {
      emblemName: 'Custom Fighter Emblem',
      talents: [
        { name: 'Thrill', icon: '🗡️', effect: '+16 Adaptive Attack' },
        { name: 'Festival of Blood', icon: '🩸', effect: '+10% Spell Vamp (Stacks on Kills)' },
        { name: 'Brave Smite', icon: '❤️', effect: 'Skill hits restore 4% Max HP' }
      ],
      rationale: 'Provides sustained dueling endurance, high spell vamp sustain, and objective taking capability.'
    };
  }
}

export function initHeroModal() {
  modalEl = document.getElementById('heroModal');
  if (!modalEl) return;

  const closeBtn = modalEl.querySelector('#modalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeHeroModal);
  }

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closeHeroModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('open')) {
      closeHeroModal();
    }
  });
}

export async function openHeroModal(heroId) {
  if (!modalEl) initHeroModal();
  if (!modalEl) return;

  const catalog = await dataService.fetchCatalog();
  const currentRank = state.get('activeRank');
  const currentTf = state.get('activeTimeframe');
  const rankSlice = await dataService.fetchRankSlice(currentRank, currentTf);

  const heroDetails = catalog.map.get(heroId);
  const heroRank = (rankSlice || []).find(h => h.heroid === heroId) || {};

  if (!heroDetails && !heroRank.name) {
    console.warn(`Hero ID ${heroId} not found in catalog or slice.`);
    return;
  }

  const name = heroDetails?.name || heroRank.name || 'Hero';
  const head = heroDetails?.head || heroRank.head || '';
  const roles = heroDetails?.roles || heroRank.roles || [];
  const lanes = heroDetails?.lanes || heroRank.lanes || [];
  const primaryRole = (roles[0] || 'default').toLowerCase();
  const fallbackIcon = `./assets/roles/${primaryRole}.svg`;

  const difficultyNum = parseInt(heroDetails?.difficulty || '50', 10);
  let diffLabel = '🟢 Easy to Learn';
  if (difficultyNum > 60) diffLabel = '🔴 High Mastery Required';
  else if (difficultyNum > 35) diffLabel = '🟡 Moderate Difficulty';

  // Render modal identity & banner
  const avatarEl = modalEl.querySelector('#modalHeroAvatar');
  avatarEl.src = head;
  avatarEl.alt = name;
  avatarEl.onerror = () => { avatarEl.src = fallbackIcon; };

  modalEl.querySelector('#modalHeroName').textContent = name;
  modalEl.querySelector('#modalHeroRoles').textContent = roles.join(', ');
  modalEl.querySelector('#modalHeroLanes').textContent = lanes.join(', ');
  modalEl.querySelector('#modalDifficultyBadge').textContent = diffLabel;

  // Stats ribbon
  modalEl.querySelector('#modalWinRate').textContent = `${heroRank.win_rate_pct || 50.0}%`;
  modalEl.querySelector('#modalPickRate').textContent = `${heroRank.pick_rate_pct || 1.0}%`;
  modalEl.querySelector('#modalBanRate').textContent = `${heroRank.ban_rate_pct || 0.0}%`;
  modalEl.querySelector('#modalMetaScore').textContent = `${heroRank.meta_score || 50.0}`;

  // Skills List Breakdown with Badges, Costs & Mechanics Tooltips
  const skillsListEl = modalEl.querySelector('#modalSkillsList');
  const skills = heroDetails?.skills || [];
  if (skills.length > 0) {
    skillsListEl.innerHTML = skills.map((sk, idx) => {
      const { typeLabel, cdBadge, costBadge, dmgBadge, scalingText } = parseSkillBadges(sk, idx);
      const decoratedDesc = decorateMechanicsKeywords(sk.desc);

      return `
        <div class="skill-card">
          <div class="skill-icon-wrap">
            <img class="skill-icon" src="${sk.icon}" alt="${sk.name}" onerror="this.src='${fallbackIcon}'"/>
          </div>
          <div class="skill-content">
            <div class="skill-header">
              <span class="skill-title"><strong>${sk.name}</strong></span>
              <span class="skill-badge-pill type">${typeLabel}</span>
            </div>

            <!-- Enhanced Badges Row: Cooldown + Resource Cost + Damage Typing -->
            <div class="skill-badges-row">
              ${cdBadge ? `<span class="skill-badge-pill cd">${cdBadge}</span>` : ''}
              ${costBadge ? `<span class="skill-badge-pill cost">${costBadge}</span>` : ''}
              ${dmgBadge ? `<span class="skill-badge-pill damage">${dmgBadge}</span>` : ''}
            </div>

            ${sk.tags && sk.tags.length > 0 ? `
              <div class="skill-tags">
                ${sk.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}
              </div>
            ` : ''}

            <!-- Skill Description with Status Keyword Tooltips -->
            <p class="skill-desc ${sk.desc ? '' : 'empty-note'}">
              ${sk.desc ? decoratedDesc : 'Official skill mechanics update pending next patch release.'}
            </p>

            ${scalingText ? `
              <div style="font-size: 0.72rem; color: var(--brand-primary); margin-top: 4px;">
                📈 Scaling: <strong>${scalingText}</strong>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } else {
    skillsListEl.innerHTML = '<p class="skill-desc empty-note">Skill details currently being synchronized from Moonton GMS.</p>';
  }

  // Tool Idea 3: Optimal Emblem & Talent Synergy Recommender Section
  const emblemSectionEl = modalEl.querySelector('#modalEmblemSection');
  if (emblemSectionEl) {
    const emblemData = getRecommendedEmblem(heroDetails || heroRank);
    emblemSectionEl.innerHTML = `
      <h3 class="modal-section-title">🎯 Optimal Custom Emblem & Talent Synergy</h3>
      <div class="emblem-recommender-card">
        <div class="emblem-header-row">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🛡️</span>
            <strong>${emblemData.emblemName}</strong>
          </div>
          <span class="emblem-name-badge">Pro Setup</span>
        </div>
        <div class="emblem-talents-list">
          ${emblemData.talents.map((t, tidx) => `
            <div class="emblem-talent-chip" title="${t.effect}">
              <span>${t.icon}</span>
              <span>Tier ${tidx + 1}: <strong>${t.name}</strong></span>
            </div>
          `).join('')}
        </div>
        <div class="emblem-reason-desc">${emblemData.rationale}</div>
      </div>
    `;
  }

  // Counters List
  const countersListEl = modalEl.querySelector('#modalCountersList');
  const counters = (heroRank.counters || []).slice(0, 5);
  countersListEl.innerHTML = counters.length > 0 ? counters.map(c => `
    <div class="matchup-mini-item" data-heroid="${c.heroid}" tabindex="0" role="button">
      <div class="mini-item-left">
        <img class="mini-thumb" src="${c.head}" alt="${c.name}" onerror="this.src='./favicon.svg'"/>
        <span class="mini-name">${c.name}</span>
      </div>
      <span class="mini-val green">+${c.increase_win_rate_pct}% Adv</span>
    </div>
  `).join('') : '<p style="color: var(--text-muted); font-size: 0.8rem;">No counters recorded.</p>';

  // Synergies List
  const synergiesListEl = modalEl.querySelector('#modalSynergiesList');
  const synergies = (heroRank.synergies || []).slice(0, 5);
  synergiesListEl.innerHTML = synergies.length > 0 ? synergies.map(s => `
    <div class="matchup-mini-item" data-heroid="${s.heroid}" tabindex="0" role="button">
      <div class="mini-item-left">
        <img class="mini-thumb" src="${s.head}" alt="${s.name}" onerror="this.src='./favicon.svg'"/>
        <span class="mini-name">${s.name}</span>
      </div>
      <span class="mini-val blue">+${s.increase_win_rate_pct}% Boost</span>
    </div>
  `).join('') : '<p style="color: var(--text-muted); font-size: 0.8rem;">No synergies recorded.</p>';

  // Attach click listener to mini matchup items to switch modal to that hero
  modalEl.querySelectorAll('.matchup-mini-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetId = parseInt(item.dataset.heroid, 10);
      openHeroModal(targetId);
    });
  });

  // Open modal
  modalEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeHeroModal() {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  document.body.style.overflow = '';
}
