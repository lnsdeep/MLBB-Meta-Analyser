/**
 * MLBB Meta Analyser - Global State Management
 * Reactive state store with URL parameter synchronization.
 */

class StateStore {
  constructor() {
    // Parse URL search params for deep linking
    const params = new URLSearchParams(window.location.search);

    this.state = {
      activeTool: params.get('tool') || 'tier', // tier, table, counter, synergy, draft, radar, movers, guide
      activeRank: params.get('rank') || 'mythical_glory',
      activeTimeframe: params.get('tf') || '1d',
      activeRole: params.get('role') || 'ALL',
      activeLane: params.get('lane') || 'ALL',
      searchQuery: '',
      sortField: 'win_rate_pct',
      sortOrder: 'desc', // 'asc' or 'desc'
      tierSortField: params.get('tier_sort') || 'meta_score', // 'meta_score', 'win_rate_pct', 'ban_rate_pct'
      viewMode: 'grid', // 'grid' (tier board) or 'table'
      selectedHeroId: null,
    };

    this.listeners = [];
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    if (this.state[key] === value) return;
    const prev = this.state[key];
    this.state[key] = value;

    // Update URL query parameters seamlessly
    this._syncUrl();

    // Notify listeners
    this._notify(key, value, prev);
  }

  update(updates) {
    let changed = false;
    for (const [k, v] of Object.entries(updates)) {
      if (this.state[k] !== v) {
        this.state[k] = v;
        changed = true;
      }
    }
    if (changed) {
      this._syncUrl();
      this._notify('*', this.state);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  _notify(key, value, prev) {
    for (const cb of this.listeners) {
      try {
        cb(key, value, prev);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  }

  _syncUrl() {
    const params = new URLSearchParams();
    if (this.state.activeTool !== 'tier') params.set('tool', this.state.activeTool);
    if (this.state.activeRank !== 'mythical_glory') params.set('rank', this.state.activeRank);
    if (this.state.activeTimeframe !== '1d') params.set('tf', this.state.activeTimeframe);
    if (this.state.activeRole !== 'ALL') params.set('role', this.state.activeRole);
    if (this.state.activeLane !== 'ALL') params.set('lane', this.state.activeLane);
    if (this.state.tierSortField && this.state.tierSortField !== 'meta_score') params.set('tier_sort', this.state.tierSortField);

    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }
}

export const state = new StateStore();
