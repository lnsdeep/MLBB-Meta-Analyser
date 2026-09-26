/**
 * MLBB Meta Analyser - Configuration & Constants
 * Path safety, metadata dictionaries, beginner-friendly explanations
 */

export const CONFIG = {
  // Path-safe data directory resolver (handles subpaths like username.github.io/repo/)
  DATA_BASE: './data/processed',

  RANKS: [
    { id: 'all', name: 'ALL Ranks', desc: 'All player ranks combined' },
    { id: 'epic', name: 'Epic', desc: 'Mid-tier ranked tier' },
    { id: 'legend', name: 'Legend', desc: 'High-tier competitive bracket' },
    { id: 'mythic', name: 'Mythic', desc: 'Elite bracket with competitive drafting' },
    { id: 'mythical_honor', name: 'Mythical Honor', desc: 'High-elo bracket (25+ Stars)' },
    { id: 'mythical_glory', name: 'Mythical Glory+', desc: 'Highest competitive & pro-level rank (50+ Stars)' },
  ],

  TIMEFRAMES: [
    { id: '1d', name: 'Past 1 Day', shortName: '1D (Today)', desc: 'Current hot meta and latest patch changes' },
    { id: '3d', name: 'Past 3 Days', shortName: '3D', desc: 'Recent short-term trends' },
    { id: '7d', name: 'Past 7 Days', shortName: '7D (Weekly)', desc: 'Standard weekly meta baseline' },
    { id: '15d', name: 'Past 15 Days', shortName: '15D', desc: 'Two-week performance trends' },
    { id: '30d', name: 'Past 30 Days', shortName: '30D (Monthly)', desc: 'Long-term monthly statistical stability' },
  ],

  ROLES: [
    { id: 'ALL', name: 'All Roles', icon: '⚡', desc: 'All hero classes' },
    { id: 'Tank', name: 'Tank', icon: '🛡️', desc: 'High health & defense; protects teammates and absorbs damage' },
    { id: 'Fighter', name: 'Fighter', icon: '⚔️', desc: 'Balanced melee combatant capable of brawling and sustained damage' },
    { id: 'Assassin', name: 'Assassin', icon: '🗡️', desc: 'High mobility burst damage; eliminates fragile enemy targets' },
    { id: 'Mage', name: 'Mage', icon: '🔮', desc: 'Ranged magic damage dealers with burst skills and crowd control' },
    { id: 'Marksman', name: 'Marksman', icon: '🏹', desc: 'Ranged physical damage carries that scale into late-game monsters' },
    { id: 'Support', name: 'Support', icon: '💚', desc: 'Provides healing, shields, buffs, and vision to assist allies' },
  ],

  LANES: [
    { id: 'ALL', name: 'All Lanes', icon: '🗺️', desc: 'All map assignments' },
    { id: 'EXP Lane', name: 'EXP Lane', icon: '🛡️', desc: 'Solo lane near Turtle; level up quickly with higher experience' },
    { id: 'Mid Lane', name: 'Mid Lane', icon: '🔮', desc: 'Center lane; mages clear fast and rotate to assist side lanes' },
    { id: 'Gold Lane', name: 'Gold Lane', icon: '💰', desc: 'Solo lane far from Turtle; earns extra gold to buy core items fast' },
    { id: 'Roam', name: 'Roam', icon: '👟', desc: 'No fixed lane; roams across map granting vision and assisting ganks' },
    { id: 'Jungle', name: 'Jungle', icon: '🌲', desc: 'Defeats jungle monsters with Retribution to secure Lord and Turtle' },
  ],

  // Beginner-friendly tooltips for stats
  STAT_EXPLANATIONS: {
    win_rate: 'Win Rate: How often this hero wins matches (above 52% is considered very strong).',
    pick_rate: 'Pick Rate: How frequently players choose this hero in ranked games.',
    ban_rate: 'Ban Rate: How often teams forbid this hero during draft (high ban = feared threat).',
    meta_score: 'Meta Score: Composite score (0-100) combining win rate, ban rate, and popularity.',
    tier: 'Tier: S+ (God tier), S (High priority), A (Strong), B (Balanced), C/D (Underperforming).',
    counter: 'Counter: A hero whose kit naturally neutralizes this champion based on match records.',
    synergy: 'Synergy: A teammate hero whose abilities combine effectively to boost win rates.',
  }
};

/**
 * Format relative time (e.g. "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Format date nicely for tooltips (e.g. "Sep 25, 2026, 19:34 UTC")
 */
export function formatExactDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toUTCString();
  } catch (e) {
    return dateString;
  }
}
