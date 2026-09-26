/**
 * MLBB Meta Analyser - 5v5 Draft Simulator & Statistical Advantage Model
 * Evaluates pairwise counter matchups, synergies, and role balance to predict draft win advantage.
 */

import { dataService } from './dataService.js';

let allyTeam = []; // Max 5 heroes
let enemyTeam = []; // Max 5 heroes
let activeSlotTarget = null; // { side: 'ally'|'enemy', index: 0-4 }

export async function renderDraftSimulator(container, heroesList) {
  if (!container) return;

  const catalog = await dataService.fetchCatalog();
  const countersMatrix = await dataService.fetchCountersMatrix();
  const synergiesMatrix = await dataService.fetchSynergiesMatrix();

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>🛡️ 5v5 Draft Analyzer & Statistical Win Predictor</h2>
          <p>Input your ally and enemy team picks. Our statistical model evaluates counter advantage, synergies, and team balance.</p>
        </div>
        <button class="chip-btn" id="draftResetBtn" style="color: var(--ban-rose);">🔄 Reset Draft</button>
      </div>

      <!-- Draft Board: Ally vs Enemy -->
      <div class="draft-teams-row">
        <!-- Ally Team -->
        <div class="draft-team-box ally">
          <div class="draft-team-header">
            <span style="color: var(--brand-primary);">🔵 Your Team (Allies)</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${allyTeam.length}/5 Picked</span>
          </div>
          <div class="draft-slots-list" id="allySlots">
            ${[0, 1, 2, 3, 4].map(idx => renderSlotHtml('ally', idx, allyTeam[idx])).join('')}
          </div>
        </div>

        <!-- Enemy Team -->
        <div class="draft-team-box enemy">
          <div class="draft-team-header">
            <span style="color: var(--ban-rose);">🔴 Enemy Team</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${enemyTeam.length}/5 Picked</span>
          </div>
          <div class="draft-slots-list" id="enemySlots">
            ${[0, 1, 2, 3, 4].map(idx => renderSlotHtml('enemy', idx, enemyTeam[idx])).join('')}
          </div>
        </div>
      </div>

      <!-- Statistical Verdict & Advantage Meter -->
      <div class="draft-score-card" id="draftScoreCard">
        ${calculateAndRenderAdvantage(allyTeam, enemyTeam, countersMatrix, synergiesMatrix, catalog)}
      </div>

      <!-- Hero Selector Modal for Draft Slots -->
      <div class="modal-overlay" id="draftPickerModal">
        <div class="modal-dialog" style="max-width: 600px; max-height: 80vh;">
          <div class="modal-hero-banner" style="min-height: 60px; padding: 16px 20px;">
            <h3 style="font-size: 1.1rem; font-weight: 700;">Select Hero for <span id="draftPickerTargetText"></span></h3>
            <button class="modal-close-btn" id="draftPickerCloseBtn">×</button>
          </div>
          <div style="padding: 16px;">
            <input type="text" class="picker-hero-search" id="draftModalSearch" placeholder="🔍 Search hero..."/>
          </div>
          <div class="picker-hero-list" id="draftModalHeroList" style="max-height: 380px; padding: 0 16px 16px;">
            ${heroesList.map(h => `
              <button class="picker-hero-item" data-heroid="${h.heroid}">
                <img class="picker-hero-thumb" src="${h.head}" alt="${h.name}" onerror="this.src='./favicon.svg'"/>
                <span>${h.name}</span>
                <span style="margin-left: auto; font-size: 0.75rem; color: var(--text-muted);">${h.roles.join(', ')}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach slot click listeners
  container.querySelectorAll('.draft-slot').forEach(slot => {
    slot.addEventListener('click', (e) => {
      if (e.target.closest('.draft-slot-remove')) return; // ignore remove button
      const side = slot.dataset.side;
      const index = parseInt(slot.dataset.index, 10);
      openDraftHeroPicker(side, index, container);
    });
  });

  // Attach remove buttons
  container.querySelectorAll('.draft-slot-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const side = btn.dataset.side;
      const index = parseInt(btn.dataset.index, 10);
      if (side === 'ally') allyTeam.splice(index, 1);
      else enemyTeam.splice(index, 1);
      renderDraftSimulator(container, heroesList);
    });
  });

  // Reset Draft button
  container.querySelector('#draftResetBtn').addEventListener('click', () => {
    allyTeam = [];
    enemyTeam = [];
    renderDraftSimulator(container, heroesList);
  });

  // Modal close
  const pickerModal = container.querySelector('#draftPickerModal');
  const closeBtn = container.querySelector('#draftPickerCloseBtn');
  closeBtn.addEventListener('click', () => pickerModal.classList.remove('open'));
  pickerModal.addEventListener('click', (e) => {
    if (e.target === pickerModal) pickerModal.classList.remove('open');
  });

  // Modal search
  const modalSearch = container.querySelector('#draftModalSearch');
  const modalList = container.querySelector('#draftModalHeroList');
  modalSearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    modalList.querySelectorAll('.picker-hero-item').forEach(item => {
      const name = item.querySelector('span').textContent.toLowerCase();
      item.style.display = name.includes(q) ? 'flex' : 'none';
    });
  });

  // Modal hero select
  modalList.querySelectorAll('.picker-hero-item').forEach(item => {
    item.addEventListener('click', () => {
      const heroid = parseInt(item.dataset.heroid, 10);
      const hero = heroesList.find(h => h.heroid === heroid);

      if (activeSlotTarget) {
        if (activeSlotTarget.side === 'ally') {
          allyTeam[activeSlotTarget.index] = hero;
          allyTeam = allyTeam.filter(Boolean);
        } else {
          enemyTeam[activeSlotTarget.index] = hero;
          enemyTeam = enemyTeam.filter(Boolean);
        }
      }
      pickerModal.classList.remove('open');
      renderDraftSimulator(container, heroesList);
    });
  });
}

function renderSlotHtml(side, index, hero) {
  if (!hero) {
    return `
      <div class="draft-slot" data-side="${side}" data-index="${index}" tabindex="0">
        <span class="draft-slot-empty-text">➕ Click to assign pick #${index + 1}</span>
      </div>
    `;
  }

  return `
    <div class="draft-slot filled" data-side="${side}" data-index="${index}" tabindex="0">
      <div class="draft-slot-hero-info">
        <img class="draft-slot-avatar" src="${hero.head}" alt="${hero.name}" onerror="this.src='./favicon.svg'"/>
        <div>
          <strong style="font-size: 0.95rem;">${hero.name}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${hero.roles.join(', ')} · ${hero.lanes.join(', ')}</div>
        </div>
      </div>
      <button class="draft-slot-remove" data-side="${side}" data-index="${index}" title="Remove">✕</button>
    </div>
  `;
}

function openDraftHeroPicker(side, index, container) {
  activeSlotTarget = { side, index };
  const pickerModal = container.querySelector('#draftPickerModal');
  const targetText = container.querySelector('#draftPickerTargetText');
  targetText.textContent = `${side === 'ally' ? 'Your Team' : 'Enemy Team'} (Slot #${index + 1})`;
  pickerModal.classList.add('open');

  const search = container.querySelector('#draftModalSearch');
  search.value = '';
  search.focus();
  container.querySelectorAll('#draftModalHeroList .picker-hero-item').forEach(i => i.style.display = 'flex');
}

/**
 * Statistical Draft Model Calculation
 */
function calculateAndRenderAdvantage(allies, enemies, countersMatrix, synergiesMatrix, catalog) {
  if (allies.length === 0 && enemies.length === 0) {
    return `
      <div class="empty-state" style="padding: 20px;">
        <p>Pick at least 1 hero on each side to run the statistical draft analysis.</p>
      </div>
    `;
  }

  // 1. Calculate Pairwise Counter Advantage
  let netCounterDelta = 0;
  let counterInsights = [];

  for (const ally of allies) {
    for (const enemy of enemies) {
      // Check if ally counters enemy
      const enemyCounters = countersMatrix[enemy.heroid] || [];
      const counterRecord = enemyCounters.find(c => c.heroid === ally.heroid);
      if (counterRecord) {
        const adv = counterRecord.increase_win_rate_pct || 0;
        netCounterDelta += adv;
        if (adv >= 3.0) {
          counterInsights.push(`✨ <strong>${ally.name}</strong> strongly counters <strong>${enemy.name}</strong> (+${adv}% win rate advantage).`);
        }
      }

      // Check if enemy counters ally
      const allyCounters = countersMatrix[ally.heroid] || [];
      const enemyCounterRecord = allyCounters.find(c => c.heroid === enemy.heroid);
      if (enemyCounterRecord) {
        const adv = enemyCounterRecord.increase_win_rate_pct || 0;
        netCounterDelta -= adv;
        if (adv >= 3.0) {
          counterInsights.push(`⚠️ <strong>${enemy.name}</strong> is a hard counter against your <strong>${ally.name}</strong> (-${adv}%).`);
        }
      }
    }
  }

  // 2. Team Composition Balance Checks
  const allyRoles = allies.flatMap(h => h.roles);
  const hasTank = allyRoles.includes('Tank') || allyRoles.includes('Fighter');
  const hasMage = allyRoles.includes('Mage');
  const hasMarksman = allyRoles.includes('Marksman');

  let compositionAdvice = [];
  if (allies.length >= 3) {
    if (!hasTank) compositionAdvice.push('🛡️ Missing frontline: Your team lacks durable tanks/fighters to absorb damage in team fights.');
    if (!hasMage) compositionAdvice.push('🔮 Lack of magic damage: Enemy team can stack pure physical armor to counter your draft.');
    if (!hasMarksman) compositionAdvice.push('🏹 No late-game marksman: You must end the game early before the enemy outscales.');
  }

  // 3. Composite Predicted Advantage % (-15% to +15% scaled)
  const clampedDelta = Math.max(-15, Math.min(15, netCounterDelta));
  // Convert into 0% - 100% meter where 50% is even
  const allyMeterPercent = Math.round(50 + (clampedDelta / 15) * 40);

  let verdictText = 'Evenly Matched Draft';
  let verdictColor = 'var(--text-primary)';
  if (clampedDelta >= 4.0) {
    verdictText = `+${clampedDelta.toFixed(1)}% Advantage (Ally Favored)`;
    verdictColor = 'var(--brand-primary)';
  } else if (clampedDelta <= -4.0) {
    verdictText = `${clampedDelta.toFixed(1)}% Disadvantage (Enemy Favored)`;
    verdictColor = 'var(--ban-rose)';
  }

  return `
    <div class="draft-verdict-title" style="color: ${verdictColor};">${verdictText}</div>
    <div style="font-size: 0.85rem; color: var(--text-muted);">Based on official Moonton counter matchup matrices and pairwise win rate differentials</div>

    <div class="draft-advantage-meter">
      <span class="meter-side-label" style="color: var(--brand-primary); text-align: left;">Allies (${allyMeterPercent}%)</span>
      <div class="meter-track">
        <div class="meter-fill-ally" style="width: ${allyMeterPercent}%;"></div>
      </div>
      <span class="meter-side-label" style="color: var(--ban-rose); text-align: right;">Enemy (${100 - allyMeterPercent}%)</span>
    </div>

    ${(counterInsights.length > 0 || compositionAdvice.length > 0) ? `
      <div class="draft-tips-box">
        <div style="font-weight: 700; margin-bottom: 6px;">Draft Tactical Analysis:</div>
        <ul style="padding-left: 18px; display: flex; flex-direction: column; gap: 4px;">
          ${counterInsights.slice(0, 3).map(tip => `<li>${tip}</li>`).join('')}
          ${compositionAdvice.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;
}
