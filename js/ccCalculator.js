/**
 * MLBB Meta Analyser - Crowd Control (CC) Hierarchy & Lockdown Calculator (Tool Idea 1)
 * Ranks all MLBB heroes by hard CC duration, chains, and models Tough Boots / Resilience reduction.
 */

export const CC_HEROES_DATABASE = [
  {
    heroid: 9,
    name: 'Akai',
    roles: ['Tank'],
    hardCcType: 'Knockback / Pin',
    baseDuration: 3.5,
    isSuppress: false,
    isAoe: true,
    skills: 'Heavy Spin (Continuous displacement and wall pin)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_28f223447f0174336ff0922d364d81d3.png'
  },
  {
    heroid: 80,
    name: 'Guinevere',
    roles: ['Fighter'],
    hardCcType: 'Airborne',
    baseDuration: 3.0,
    isSuppress: false,
    isAoe: true,
    skills: 'Spatial Migration (1.0s Knockup) + Violet Requiem (2.0s Airborne)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_5033c46e01a1db1b6f04742cb52dfc53.png'
  },
  {
    heroid: 20,
    name: 'Franco',
    roles: ['Tank', 'Support'],
    hardCcType: 'Suppress + Hook',
    baseDuration: 3.0,
    isSuppress: true,
    isAoe: false,
    skills: 'Bloody Feast (1.8s Suppress) + Iron Hook (1.2s Pull)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_01524e93fc4514ba4cbe849d447f3bfa.png'
  },
  {
    heroid: 132,
    name: 'Marcel',
    roles: ['Support', 'Tank'],
    hardCcType: 'Frozen Moment (Stasis)',
    baseDuration: 2.8,
    isSuppress: true,
    isAoe: true,
    skills: 'Golden Hour (2.0s Field Stasis) + Platinum Snap (0.8s Freeze)',
    head: './assets/heroes/132.png'
  },
  {
    heroid: 17,
    name: 'Chou',
    roles: ['Fighter', 'Tank'],
    hardCcType: 'Airborne + Knockback',
    baseDuration: 2.8,
    isSuppress: false,
    isAoe: false,
    skills: 'The Way of Dragon (2.0s Kick) + Jeet Kune Do (0.8s Knockup)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_8227f6e4d6a8f117f7bcf9509df636eb.png'
  },
  {
    heroid: 6,
    name: 'Tigreal',
    roles: ['Tank'],
    hardCcType: 'Airborne + Stun',
    baseDuration: 2.5,
    isSuppress: false,
    isAoe: true,
    skills: 'Implosion (1.5s Stun) + Sacred Hammer (1.0s Knockup)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_8b30576754be1a4f8bebd09df8d6bec7.png'
  },
  {
    heroid: 62,
    name: 'Kaja',
    roles: ['Support', 'Fighter'],
    hardCcType: 'Suppress',
    baseDuration: 2.0,
    isSuppress: true,
    isAoe: false,
    skills: 'Divine Judgment (1.5s Suppress Pull) + Ring of Order (Slow)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_a23983833ad5bee7c83422c8ff727115.png'
  },
  {
    heroid: 93,
    name: 'Atlas',
    roles: ['Tank'],
    hardCcType: 'Airborne + Stun',
    baseDuration: 2.2,
    isSuppress: false,
    isAoe: true,
    skills: 'Fatal Links (2.0s Slam & Stun) + Perfect Match (0.2s Stun)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_d974ac796678180ff8724b88e192898b.png'
  },
  {
    heroid: 28,
    name: 'Lolita',
    roles: ['Support', 'Tank'],
    hardCcType: 'Stun',
    baseDuration: 2.0,
    isSuppress: false,
    isAoe: true,
    skills: 'Noumenon Blast (2.0s AOE Stun) + Charge (0.8s Target Stun)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_e75294a974bfaecf2fb4811a2f901170.png'
  },
  {
    heroid: 99,
    name: 'Barats',
    roles: ['Tank', 'Fighter'],
    hardCcType: 'Suppress',
    baseDuration: 2.0,
    isSuppress: true,
    isAoe: false,
    skills: 'Detona\'s Welcome (1.2s Suppress Devour + Wall Stun)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_8340d04ea7e9f3b570cb3c2d67ec1241.png'
  },
  {
    heroid: 35,
    name: 'Minotaur',
    roles: ['Tank', 'Support'],
    hardCcType: 'Airborne',
    baseDuration: 2.0,
    isSuppress: false,
    isAoe: true,
    skills: 'Minoan Fury (2.0s 3-Stage Earthquake Airborne)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_309b44a2750e30d1e57c6b54a72d3fca.png'
  },
  {
    heroid: 63,
    name: 'Selena',
    roles: ['Assassin', 'Mage'],
    hardCcType: 'Stun',
    baseDuration: 3.0,
    isSuppress: false,
    isAoe: false,
    skills: 'Abyssal Arrow (0.5s - 3.0s scaling stun based on arrow distance)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_c3f967121519ae40509c5b2fdf52b19d.png'
  },
  {
    heroid: 77,
    name: 'Badang',
    roles: ['Fighter'],
    hardCcType: 'Knockback + Wall Stun',
    baseDuration: 2.0,
    isSuppress: false,
    isAoe: true,
    skills: 'Fist Crack + Qigong Fist (Repeated wall stun locking)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_8fa1be892d77d70ee5f7959074df3b84.png'
  },
  {
    heroid: 84,
    name: 'Silvanna',
    roles: ['Fighter', 'Mage'],
    hardCcType: 'Restraint / Arena Lock',
    baseDuration: 3.5,
    isSuppress: false,
    isAoe: false,
    skills: 'Imperial Justice (Traps enemy inside zone; disables blink spells)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_015f013d5a4980bb6e5b4c10712b7f00.png'
  },
  {
    heroid: 29,
    name: 'Ruby',
    roles: ['Fighter', 'Tank'],
    hardCcType: 'Pull + Stun',
    baseDuration: 1.5,
    isSuppress: false,
    isAoe: true,
    skills: 'I\'m offended! (0.5s Pull) + Don\'t run, Wolf King! (0.5s Spin Stun)',
    head: 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_4b96c75b136290576d849309722d4d20.png'
  }
];

let activeResiliencePct = 0; // 0, 30, or 40
let activeCcFilter = 'ALL';

/**
 * Calculates effective CC duration factoring in Tough Boots and Suppress rules
 */
export function calculateEffectiveDuration(baseSeconds, isSuppress, resiliencePct) {
  if (isSuppress) {
    // Suppress is completely unaffected by Resilience
    return baseSeconds;
  }
  const reduction = Math.min(0.50, resiliencePct / 100); // Resilience cap is 50%
  const effective = baseSeconds * (1 - reduction);
  return Math.round(effective * 10) / 10;
}

export function renderCcCalculator(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>🔒 Crowd Control (CC) Hierarchy & Lockdown Calculator</h2>
          <p>Rank and sort heroes by total hard CC lockdown duration. Model the real-world reduction from <strong>Tough Boots</strong> and <strong>Resilience</strong>.</p>
        </div>
      </div>

      <!-- Resilience Interactive Toggle Bar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <strong style="font-size: 0.95rem;">🥾 Target Resilience Scenario:</strong>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 2px 0 0 0;">
              Resilience reduces Stun and Freeze durations (capped at 50%). <strong style="color: var(--ban-rose);">Suppress & Airborne ignore Resilience.</strong>
            </p>
          </div>
          <div class="segmented-control" id="resilienceSelector">
            <button class="seg-btn ${activeResiliencePct === 0 ? 'active' : ''}" data-res="0">0% (Base)</button>
            <button class="seg-btn ${activeResiliencePct === 30 ? 'active' : ''}" data-res="30" title="Tough Boots (+30% Resilience)">👢 Tough Boots (30%)</button>
            <button class="seg-btn ${activeResiliencePct === 40 ? 'active' : ''}" data-res="40" title="Tough Boots + Tank Emblem Resilience">🛡️ Boots + Tank (40%)</button>
          </div>
        </div>
      </div>

      <!-- CC Category Filter -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <button class="chip-btn ${activeCcFilter === 'ALL' ? 'active' : ''}" data-ccfilter="ALL">All Lockdown</button>
        <button class="chip-btn ${activeCcFilter === 'SUPPRESS' ? 'active' : ''}" data-ccfilter="SUPPRESS">⚡ Suppress Only</button>
        <button class="chip-btn ${activeCcFilter === 'AOE' ? 'active' : ''}" data-ccfilter="AOE">💥 AOE Teamfight CC</button>
      </div>

      <!-- CC Rankings Grid -->
      <div class="table-container">
        <table class="meta-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Hero</th>
              <th>CC Archetype</th>
              <th>Base Duration</th>
              <th>Effective Lockdown (${activeResiliencePct}% Resilience)</th>
              <th>Key Skills Breakdown</th>
              <th>Purify Interaction</th>
            </tr>
          </thead>
          <tbody id="ccTableBody">
            ${renderCcRows(activeResiliencePct, activeCcFilter)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach resilience listeners
  const resSelector = container.querySelector('#resilienceSelector');
  if (resSelector) {
    resSelector.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        resSelector.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeResiliencePct = parseInt(btn.dataset.res, 10);
        renderCcCalculator(container);
      });
    });
  }

  // Attach filter listeners
  container.querySelectorAll('.chip-btn[data-ccfilter]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCcFilter = btn.dataset.ccfilter;
      renderCcCalculator(container);
    });
  });
}

function renderCcRows(resiliencePct, filter) {
  let list = [...CC_HEROES_DATABASE];

  if (filter === 'SUPPRESS') {
    list = list.filter(h => h.isSuppress);
  } else if (filter === 'AOE') {
    list = list.filter(h => h.isAoe);
  }

  // Sort by effective duration descending
  list.sort((a, b) => {
    const effA = calculateEffectiveDuration(a.baseDuration, a.isSuppress, resiliencePct);
    const effB = calculateEffectiveDuration(b.baseDuration, b.isSuppress, resiliencePct);
    return effB - effA;
  });

  return list.map((hero, idx) => {
    const eff = calculateEffectiveDuration(hero.baseDuration, hero.isSuppress, resiliencePct);
    const diff = hero.baseDuration - eff;

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-muted);">${idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${hero.head}" alt="${hero.name}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;" onerror="this.src='./favicon.svg'"/>
            <div>
              <strong>${hero.name}</strong>
              <div style="font-size: 0.74rem; color: var(--text-muted);">${hero.roles.join(', ')}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; ${hero.isSuppress ? 'background: rgba(244, 63, 94, 0.15); color: var(--ban-rose); border: 1px solid var(--ban-rose);' : 'background: rgba(56, 189, 248, 0.12); color: var(--brand-primary);'}">
            ${hero.hardCcType}
          </span>
        </td>
        <td style="font-weight: 700;">${hero.baseDuration.toFixed(1)}s</td>
        <td>
          <div style="display: flex; align-items: baseline; gap: 6px;">
            <strong style="color: ${hero.isSuppress ? 'var(--ban-rose)' : 'var(--win-green)'}; font-size: 1.05rem;">
              ${eff.toFixed(1)}s
            </strong>
            ${diff > 0 ? `<small style="color: var(--text-muted); font-size: 0.74rem;">(-${diff.toFixed(1)}s)</small>` : ''}
          </div>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 280px;">${hero.skills}</td>
        <td>
          <span style="font-size: 0.75rem; font-weight: 600; color: ${hero.isSuppress ? 'var(--ban-rose)' : 'var(--win-green)'};">
            ${hero.isSuppress ? '❌ Cannot Cleanse' : '✅ Purifiable'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}
