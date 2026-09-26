/**
 * MLBB Meta Analyser - Main Application Orchestrator
 * Bootstraps data loading, event routing, tool switching, and search.
 */

import { CONFIG, formatRelativeTime, formatExactDate } from './config.js?v=3';
import { dataService } from './dataService.js?v=3';
import { state } from './state.js?v=3';
import { renderTierView } from './tierView.js?v=3';
import { renderTableView } from './tableView.js?v=3';
import { renderCounterTool } from './counterTool.js?v=3';
import { renderSynergyTool } from './synergyTool.js?v=3';
import { renderDraftSimulator } from './draftSimulator.js?v=3';
import { renderBanRadar } from './banRadar.js?v=3';
import { renderMetaMovers } from './metaMovers.js?v=3';
import { renderBeginnerGuide } from './beginnerGuide.js?v=3';
import { initHeroModal } from './heroModal.js?v=3';

let currentHeroesList = [];

// Initialize app when DOM is ready or immediately if already loaded
async function initApp() {
  initHeroModal();
  setupEventListeners();
  syncInitialControlsFromState();

  try {
    // 1. Fetch metadata summary
    const summary = await dataService.fetchSummary();
    updateStatusBadge(summary.updated_at);

    // 2. Pre-fetch catalog in background
    dataService.fetchCatalog();

    // 3. Load active rank & timeframe slice
    await loadActiveSlice();
  } catch (err) {
    console.error('Initialization error:', err);
    showErrorNotice('Failed to load live meta data. Please check your network connection.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/**
 * Load and render active rank slice
 */
async function loadActiveSlice() {
  const rank = state.get('activeRank');
  const tf = state.get('activeTimeframe');
  const mainContainer = document.getElementById('mainContentArea');

  try {
    currentHeroesList = await dataService.fetchRankSlice(rank, tf);
    renderCurrentTool();
  } catch (err) {
    console.error(`Error loading slice ${rank}_${tf}:`, err);
    if (mainContainer) {
      mainContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Data slice currently unavailable</div>
          <p>Could not load records for ${rank} (${tf}). Please try another rank or timeframe.</p>
        </div>
      `;
    }
  }
}

/**
 * Render the currently selected tool view
 */
function renderCurrentTool() {
  const tool = state.get('activeTool');
  const viewMode = state.get('viewMode');
  const mainContainer = document.getElementById('mainContentArea');
  const controlHub = document.getElementById('controlHub');

  if (!mainContainer) return;

  // Toggle filter controls visibility: Tier list and table use general filters
  if (tool === 'tier' || tool === 'table') {
    controlHub.style.display = 'flex';
  } else {
    // Other specialized tools manage their own view layout
    controlHub.style.display = 'none';
  }

  // Story 3.1: In-tier sort control only visible when viewing visual tier board
  const tierSortControl = document.getElementById('tierSortControl');
  if (tierSortControl) {
    tierSortControl.style.display = (tool === 'tier' && viewMode === 'grid') ? 'flex' : 'none';
  }

  switch (tool) {
    case 'tier':
      if (viewMode === 'table') {
        renderTableView(mainContainer, currentHeroesList);
      } else {
        renderTierView(mainContainer, currentHeroesList);
      }
      break;

    case 'counter':
      renderCounterTool(mainContainer, currentHeroesList);
      break;

    case 'synergy':
      renderSynergyTool(mainContainer, currentHeroesList);
      break;

    case 'draft':
      renderDraftSimulator(mainContainer, currentHeroesList);
      break;

    case 'radar':
      renderBanRadar(mainContainer, currentHeroesList);
      break;

    case 'movers':
      renderMetaMovers(mainContainer);
      break;

    case 'guide':
      renderBeginnerGuide(mainContainer, currentHeroesList);
      break;

    default:
      renderTierView(mainContainer, currentHeroesList);
  }
}

/**
 * Update Filter Reset Button Visibility based on active filters
 */
function updateFilterResetVisibility() {
  const resetBtn = document.getElementById('filterResetBtn');
  if (!resetBtn) return;
  const activeRole = state.get('activeRole') || 'ALL';
  const activeLane = state.get('activeLane') || 'ALL';
  const searchQuery = (state.get('searchQuery') || '').trim();

  const isFiltered = activeRole !== 'ALL' || activeLane !== 'ALL' || searchQuery !== '';
  resetBtn.classList.toggle('hidden', !isFiltered);
}

/**
 * Event Listeners Binding
 */
function setupEventListeners() {
  // 0. Theme Toggle Button
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem('mlbb_theme', nextTheme);
      } catch (e) {
        // ignore storage quota errors
      }
    });
  }

  // 1. Tool Navigation Tabs
  const toolNav = document.getElementById('toolNav');
  if (toolNav) {
    toolNav.querySelectorAll('.tool-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toolNav.querySelectorAll('.tool-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.set('activeTool', btn.dataset.tool);
      });
    });
  }

  // 2. Rank Selector Buttons
  const rankContainer = document.getElementById('rankSelector');
  if (rankContainer) {
    rankContainer.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        rankContainer.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.set('activeRank', btn.dataset.rank);
        await loadActiveSlice();
      });
    });
  }

  // 3. Timeframe Buttons
  const tfContainer = document.getElementById('timeframeSelector');
  if (tfContainer) {
    tfContainer.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        tfContainer.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.set('activeTimeframe', btn.dataset.tf);
        await loadActiveSlice();
      });
    });
  }

  // 4. Role Filter Chips
  const roleContainer = document.getElementById('roleFilters');
  if (roleContainer) {
    roleContainer.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        roleContainer.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.set('activeRole', btn.dataset.role);
        updateFilterResetVisibility();
        renderCurrentTool();
      });
    });
  }

  // 5. Lane Filter Chips
  const laneContainer = document.getElementById('laneFilters');
  if (laneContainer) {
    laneContainer.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        laneContainer.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.set('activeLane', btn.dataset.lane);
        updateFilterResetVisibility();
        renderCurrentTool();
      });
    });
  }

  // 6. View Mode Toggle (Tier Board vs Table)
  const viewToggle = document.getElementById('viewModeToggle');
  if (viewToggle) {
    viewToggle.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        viewToggle.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.set('viewMode', btn.dataset.view);
        renderCurrentTool();
      });
    });
  }

  // 7. Instant Search Bar & Clear Button
  const searchInput = document.getElementById('heroSearchInput');
  const searchClear = document.getElementById('searchClearBtn');
  const filterResetBtn = document.getElementById('filterResetBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.set('searchQuery', val);
      if (searchClear) searchClear.classList.toggle('hidden', val.length === 0);
      updateFilterResetVisibility();
      renderCurrentTool();
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.set('searchQuery', '');
        searchClear.classList.add('hidden');
        searchInput.focus();
        updateFilterResetVisibility();
        renderCurrentTool();
      });
    }
  }

  // 8. Filter Reset Button (Story 2.2)
  if (filterResetBtn) {
    filterResetBtn.addEventListener('click', () => {
      state.update({
        activeRole: 'ALL',
        activeLane: 'ALL',
        searchQuery: ''
      });

      if (roleContainer) {
        roleContainer.querySelectorAll('.chip-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.role === 'ALL');
        });
      }

      if (laneContainer) {
        laneContainer.querySelectorAll('.chip-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.lane === 'ALL');
        });
      }

      if (searchInput) {
        searchInput.value = '';
      }
      if (searchClear) {
        searchClear.classList.add('hidden');
      }

      filterResetBtn.classList.add('hidden');
      renderCurrentTool();
    });
  }

  // 9. In-Tier Sort Selector (Story 3.1)
  const tierSortContainer = document.getElementById('tierSortSelector');
  if (tierSortContainer) {
    tierSortContainer.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tierSortContainer.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.set('tierSortField', btn.dataset.tiersort);
        renderCurrentTool();
      });
    });
  }

  // 10. Global Keyboard Shortcut for Search ('/')
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });

  // Subscribe to state changes
  state.subscribe((key) => {
    if (key === 'activeTool') {
      const toolNav = document.getElementById('toolNav');
      const tool = state.get('activeTool');
      if (toolNav && tool) {
        toolNav.querySelectorAll('.tool-tab-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.tool === tool);
        });
      }
      renderCurrentTool();
    } else if (key === 'viewMode' || key === 'sortField' || key === 'sortOrder' || key === 'tierSortField') {
      renderCurrentTool();
    }
  });
}

/**
 * Synchronize UI Controls with Initial State
 */
function syncInitialControlsFromState() {
  const tool = state.get('activeTool');
  const toolNav = document.getElementById('toolNav');
  if (toolNav && tool) {
    toolNav.querySelectorAll('.tool-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === tool);
    });
  }

  const rank = state.get('activeRank');
  const rankContainer = document.getElementById('rankSelector');
  if (rankContainer && rank) {
    rankContainer.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.rank === rank);
    });
  }

  const tf = state.get('activeTimeframe');
  const tfContainer = document.getElementById('timeframeSelector');
  if (tfContainer && tf) {
    tfContainer.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tf === tf);
    });
  }
}

/**
 * Update Header "Last Refreshed" Status Badge
 */
function updateStatusBadge(updatedAt) {
  const badge = document.getElementById('statusBadge');
  const textEl = document.getElementById('statusText');
  if (!badge || !textEl || !updatedAt) return;

  const relTime = formatRelativeTime(updatedAt);
  const exact = formatExactDate(updatedAt);

  textEl.textContent = `Refreshed ${relTime}`;
  badge.setAttribute('data-tooltip', `Official Moonton Data • Synced: ${exact}`);
}

function showErrorNotice(message) {
  const banner = document.createElement('div');
  banner.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: var(--ban-rose); color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; box-shadow: var(--shadow-lg); font-size: 0.85rem;';
  banner.textContent = message;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 6000);
}
