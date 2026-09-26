/**
 * MLBB Meta Analyser - Hero Dossier Modal & Mobile Bottom Sheet
 * Displays full skill kit, cooldowns, difficulty, official lore, counters, and synergies.
 */

import { dataService } from './dataService.js';
import { state } from './state.js';

let modalEl = null;

export function initHeroModal() {
  modalEl = document.getElementById('heroModal');
  if (!modalEl) return;

  // Close button click
  const closeBtn = modalEl.querySelector('#modalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeHeroModal);
  }

  // Backdrop click
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closeHeroModal();
    }
  });

  // ESC key
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
  const heroRank = rankSlice.find(h => h.heroid === heroId) || {};

  if (!heroDetails && !heroRank.name) {
    console.warn(`Hero ID ${heroId} not found in catalog or slice.`);
    return;
  }

  const name = heroDetails?.name || heroRank.name || 'Hero';
  const head = heroDetails?.head || heroRank.head || '';
  const roles = heroDetails?.roles || heroRank.roles || [];
  const lanes = heroDetails?.lanes || heroRank.lanes || [];
  const difficultyNum = parseInt(heroDetails?.difficulty || '50', 10);

  let diffLabel = '🟢 Easy to Learn';
  if (difficultyNum > 60) diffLabel = '🔴 High Mastery Required';
  else if (difficultyNum > 35) diffLabel = '🟡 Moderate Difficulty';

  // Render modal content
  modalEl.querySelector('#modalHeroAvatar').src = head;
  modalEl.querySelector('#modalHeroAvatar').alt = name;
  modalEl.querySelector('#modalHeroName').textContent = name;
  modalEl.querySelector('#modalHeroRoles').textContent = roles.join(', ');
  modalEl.querySelector('#modalHeroLanes').textContent = lanes.join(', ');
  modalEl.querySelector('#modalDifficultyBadge').textContent = diffLabel;

  // Stats ribbon
  modalEl.querySelector('#modalWinRate').textContent = `${heroRank.win_rate_pct || 50.0}%`;
  modalEl.querySelector('#modalPickRate').textContent = `${heroRank.pick_rate_pct || 1.0}%`;
  modalEl.querySelector('#modalBanRate').textContent = `${heroRank.ban_rate_pct || 0.0}%`;
  modalEl.querySelector('#modalMetaScore').textContent = `${heroRank.meta_score || 50.0}`;

  // Skills List
  const skillsListEl = modalEl.querySelector('#modalSkillsList');
  const skills = heroDetails?.skills || [];
  if (skills.length > 0) {
    skillsListEl.innerHTML = skills.map((sk, idx) => `
      <div class="skill-card">
        <div class="skill-icon-wrap">
          <img class="skill-icon" src="${sk.icon}" alt="${sk.name}" onerror="this.src='./favicon.svg'"/>
        </div>
        <div class="skill-content">
          <div class="skill-header">
            <span class="skill-title">${idx === 0 ? '✨ Passive: ' : ''}${sk.name}</span>
            ${sk.cost ? `<span class="skill-cost">${sk.cost}</span>` : ''}
          </div>
          ${sk.tags && sk.tags.length > 0 ? `
            <div class="skill-tags">
              ${sk.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}
            </div>
          ` : ''}
          <p class="skill-desc">${sk.desc}</p>
        </div>
      </div>
    `).join('');
  } else {
    skillsListEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Skill details currently unavailable.</p>';
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
  document.body.style.overflow = 'hidden'; // prevent background scrolling
}

export function closeHeroModal() {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  document.body.style.overflow = '';
}
