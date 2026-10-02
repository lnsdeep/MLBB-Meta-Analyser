/**
 * MLBB Meta Analyser - Hidden Mechanics & Stat Cap Reference Guide ("OG Tips") (Tool Idea 2)
 * Interactive reference for competitive players detailing CDR caps, penetration priority order,
 * movement speed soft caps, anti-heal non-stacking, and interactive penetration math.
 */

export function calculatePenetrationOrder(targetDefense, flatReduction, pctReduction, pctPen, flatPen) {
  // Step 1: Flat Reduction
  let def = targetDefense - flatReduction;

  // Step 2: Percentage Reduction
  def = def * (1 - (pctReduction / 100));

  // Step 3: Percentage Penetration
  def = def * (1 - (pctPen / 100));

  // Step 4: Flat Penetration
  def = def - flatPen;

  // Cap lowest possible negative defense at -60 (MLBB engine limit)
  def = Math.max(-60, Math.round(def * 10) / 10);

  // Damage Multiplier:
  // For def >= 0: Multiplier = 120 / (120 + def)
  // For def < 0: Damage is amplified up to ~140%
  let multiplier = 1.0;
  if (def >= 0) {
    multiplier = Math.round((120 / (120 + def)) * 100);
  } else {
    multiplier = Math.round((1.0 + (Math.abs(def) / 150)) * 100);
  }

  return { finalDefense: def, damageMultiplierPct: multiplier };
}

export function renderOgTipsGuide(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="tool-section">
      <div class="tool-header-block">
        <div class="tool-title-group">
          <h2>💡 Hidden Mechanics & Stat Cap Reference Guide ("OG Tips")</h2>
          <p>Master the non-obvious game engine calculations: CDR limits, penetration calculation order, speed soft caps, and anti-heal mechanics.</p>
        </div>
      </div>

      <!-- Interactive Penetration Formula Simulator -->
      <div class="card" style="margin-bottom: 24px; padding: 20px 24px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);">
        <h3 style="margin-top: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
          <span>🎯</span> Interactive Penetration & Defense Formula Calculator
        </h3>
        <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 16px;">
          MLBB calculates defense using a strict 4-step sequence: <strong>Flat Reduction → % Reduction → % Penetration → Flat Penetration</strong>. If defense drops below zero, extra amplified damage is dealt!
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
          <div>
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Enemy Defense</label>
            <input type="number" id="calcEnemyDef" value="100" class="search-input" style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">1. Flat Reduction (Saber/Dyrroth)</label>
            <input type="number" id="calcFlatRed" value="20" class="search-input" style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">2. % Reduction (Genius Wand)</label>
            <input type="number" id="calcPctRed" value="0" class="search-input" style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">3. % Pen (Malefic/Glaive %)</label>
            <input type="number" id="calcPctPen" value="35" class="search-input" style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">4. Flat Pen (Heptaseas/Hunter)</label>
            <input type="number" id="calcFlatPen" value="15" class="search-input" style="width: 100%;" />
          </div>
        </div>

        <div id="penCalcResult" style="padding: 14px 18px; background: var(--bg-primary); border-radius: var(--radius-md); border-left: 4px solid var(--brand-primary); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- 4 Core Mechanics Knowledge Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        
        <!-- Card 1: CDR Caps -->
        <div class="card" style="padding: 18px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.95rem; color: var(--brand-primary);">⏱️ Cooldown Reduction (CDR) Caps</strong>
            <span class="index-badge balanced">Cap: 40% / 45%</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 10px 0;">
            The standard maximum CDR limit is <strong>40%</strong>. Any additional CDR from items, buffs, or emblems beyond 40% provides zero benefit.
          </p>
          <div style="padding: 10px; background: var(--bg-surface-elevated); border-radius: 6px; font-size: 0.78rem; border-left: 3px solid #facc15;">
            <strong>The Enchanted Talisman Exception:</strong> Purchasing <em>Enchanted Talisman</em> triggers unique passive <strong>Magic Mastery</strong>, which immediately increases the hero's maximum CDR limit to <strong>45%</strong>.
          </div>
        </div>

        <!-- Card 2: Penetration Sequence & Negative Armor -->
        <div class="card" style="padding: 18px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.95rem; color: #f97316;">⚔️ Penetration Hierarchy & Negative Armor</strong>
            <span class="index-badge info">Priority Order</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 10px 0;">
            Reductions and penetrations are applied in strict order:
          </p>
          <ol style="font-size: 0.78rem; color: var(--text-secondary); padding-left: 18px; margin: 0 0 10px 0; display: flex; flex-direction: column; gap: 4px;">
            <li><strong>Flat Defense Reduction</strong> (reduces base armor before % calculations).</li>
            <li><strong>Percentage Defense Reduction</strong>.</li>
            <li><strong>Percentage Penetration</strong> (e.g. Divine Glaive, Malefic Roar).</li>
            <li><strong>Flat Penetration</strong> (e.g. Hunter Strike, Blade of the Heptaseas).</li>
          </ol>
          <div style="padding: 10px; background: var(--bg-surface-elevated); border-radius: 6px; font-size: 0.78rem; border-left: 3px solid var(--win-green);">
            <strong>Negative Defense Bonus:</strong> If enemy defense drops below 0, damage is amplified up to <strong>+40% bonus damage</strong> at -60 defense.
          </div>
        </div>

        <!-- Card 3: Movement Speed Soft Caps -->
        <div class="card" style="padding: 18px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.95rem; color: #06b6d4;">👟 Movement Speed Diminishing Returns</strong>
            <span class="index-badge warning">Soft Caps</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 10px 0;">
            Movement Speed does not scale linearly forever. The game applies steep diminishing return soft caps:
          </p>
          <ul style="font-size: 0.78rem; color: var(--text-secondary); padding-left: 18px; margin: 0; display: flex; flex-direction: column; gap: 6px;">
            <li><strong>Below 400 MS:</strong> 100% full value applied.</li>
            <li><strong>400 – 490 MS:</strong> 80% effectiveness on additional speed gains.</li>
            <li><strong>Above 490 MS:</strong> 50% effectiveness (severe diminishing returns).</li>
          </ul>
        </div>

        <!-- Card 4: Anti-Heal Non-Stacking Rules -->
        <div class="card" style="padding: 18px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 0.95rem; color: var(--ban-rose);">💚 Anti-Heal (Lifebane) Interaction</strong>
            <span class="index-badge warning">Non-Stacking</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 10px 0;">
            <strong>Sea Halberd</strong>, <strong>Glowing Wand</strong>, and <strong>Dominance Ice</strong> inflict <em>Lifebane</em>, reducing HP Regen and Shields by 50%.
          </p>
          <div style="padding: 10px; background: var(--bg-surface-elevated); border-radius: 6px; font-size: 0.78rem; border-left: 3px solid var(--ban-rose);">
            <strong>Zero Stacking:</strong> Having 2 or 3 teammates hit the same target with different anti-heal items <strong>will NOT stack</strong> to 100% or 75% reduction. Only the highest active debuff applies. Coordinate purchases to avoid wasted gold!
          </div>
        </div>

      </div>
    </div>
  `;

  function updatePenCalc() {
    const enemyDef = parseFloat(container.querySelector('#calcEnemyDef').value) || 0;
    const flatRed = parseFloat(container.querySelector('#calcFlatRed').value) || 0;
    const pctRed = parseFloat(container.querySelector('#calcPctRed').value) || 0;
    const pctPen = parseFloat(container.querySelector('#calcPctPen').value) || 0;
    const flatPen = parseFloat(container.querySelector('#calcFlatPen').value) || 0;

    const { finalDefense, damageMultiplierPct } = calculatePenetrationOrder(enemyDef, flatRed, pctRed, pctPen, flatPen);

    const resultBox = container.querySelector('#penCalcResult');
    if (resultBox) {
      resultBox.innerHTML = `
        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Effective Residual Defense:</span>
          <strong style="font-size: 1.3rem; color: ${finalDefense <= 0 ? 'var(--win-green)' : 'var(--text-primary)'};">
            ${finalDefense} Defense
          </strong>
        </div>
        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Real Damage Dealt:</span>
          <strong style="font-size: 1.3rem; color: ${damageMultiplierPct > 100 ? 'var(--win-green)' : 'var(--brand-primary)'};">
            ${damageMultiplierPct}% of Base Damage
          </strong>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-secondary);">
          ${finalDefense < 0 ? `🔥 <strong>Negative Defense!</strong> Extra +${damageMultiplierPct - 100}% amplified true damage.` : `Armor reduces incoming damage by ${(100 - damageMultiplierPct)}%.`}
        </div>
      `;
    }
  }

  // Bind inputs
  ['#calcEnemyDef', '#calcFlatRed', '#calcPctRed', '#calcPctPen', '#calcFlatPen'].forEach(sel => {
    const el = container.querySelector(sel);
    if (el) el.addEventListener('input', updatePenCalc);
  });

  updatePenCalc();
}
