/**
 * MLBB Meta Analyser - Data Service
 * Loads pre-processed official JSON datasets with cache-busting, in-memory caching, and error resilience.
 */

import { CONFIG } from './config.js';

class DataService {
  constructor() {
    this.cache = new Map();
    this.updatedAt = null;
    this.catalog = null;
    this.countersMatrix = null;
    this.synergiesMatrix = null;
  }

  /**
   * Safe fetch with cache busting and JSON parsing
   */
  async _fetchJson(url, versionTag = null) {
    const versionParam = versionTag ? `?v=${encodeURIComponent(versionTag)}` : `?t=${Date.now()}`;
    const targetUrl = `${url}${versionParam}`;

    try {
      const resp = await fetch(targetUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} fetching ${url}`);
      }
      return await resp.json();
    } catch (err) {
      console.warn(`Failed to fetch ${targetUrl}, trying without query string:`, err);
      // Fallback without query parameter
      const fallbackResp = await fetch(url);
      if (!fallbackResp.ok) {
        throw new Error(`Failed to load ${url}: ${fallbackResp.statusText}`);
      }
      return await fallbackResp.json();
    }
  }

  /**
   * Fetch meta summary containing sync timestamps and available slices
   */
  async fetchSummary() {
    if (this.cache.has('summary')) {
      return this.cache.get('summary');
    }

    const summary = await this._fetchJson(`${CONFIG.DATA_BASE}/meta_summary.json`);
    this.updatedAt = summary.updated_at || null;
    this.cache.set('summary', summary);
    return summary;
  }

  /**
   * Fetch canonical hero database (134 heroes with HD portraits, skills, lore)
   */
  async fetchCatalog() {
    if (this.catalog) return this.catalog;

    const data = await this._fetchJson(`${CONFIG.DATA_BASE}/heroes_catalog.json`, this.updatedAt);
    
    // Index by ID for instant O(1) lookups
    const catalogMap = new Map();
    for (const hero of data) {
      catalogMap.set(hero.heroid, hero);
    }

    this.catalog = { list: data, map: catalogMap };
    return this.catalog;
  }

  /**
   * Fetch a specific rank and timeframe slice (e.g. mythical_glory_1d.json)
   */
  async fetchRankSlice(rankKey = 'mythical_glory', timeframeKey = '1d') {
    const sliceKey = `${rankKey}_${timeframeKey}`;

    if (this.cache.has(sliceKey)) {
      return this.cache.get(sliceKey);
    }

    const url = `${CONFIG.DATA_BASE}/ranks/${sliceKey}.json`;
    const sliceData = await this._fetchJson(url, this.updatedAt);

    this.cache.set(sliceKey, sliceData);
    return sliceData;
  }

  /**
   * Fetch Global Counters Matrix
   */
  async fetchCountersMatrix() {
    if (this.countersMatrix) return this.countersMatrix;

    const url = `${CONFIG.DATA_BASE}/matrices/counters_matrix.json`;
    this.countersMatrix = await this._fetchJson(url, this.updatedAt);
    return this.countersMatrix;
  }

  /**
   * Fetch Global Synergies Matrix
   */
  async fetchSynergiesMatrix() {
    if (this.synergiesMatrix) return this.synergiesMatrix;

    const url = `${CONFIG.DATA_BASE}/matrices/synergies_matrix.json`;
    this.synergiesMatrix = await this._fetchJson(url, this.updatedAt);
    return this.synergiesMatrix;
  }
}

export const dataService = new DataService();
