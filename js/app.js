/**
 * MLBB Meta Analyser - Main Application Orchestrator
 * Bootstraps data loading, event routing, tool switching, and search.
 */

import { CONFIG, formatRelativeTime, formatExactDate } from './config.js';
import { dataService } from './dataService.js';
import { state } from './state.js';
import { renderTierView } from './tierView.js';
import { renderTableView } from './tableView.js';
import { renderCounterTool } from './counterTool.js';
import { renderSynergyTool } from './synergyTool.js';
import { renderDraftSimulator } from './draftSimulator.js';
import { renderBanRadar } from './banRadar.js';
import { renderMetaMovers } from './metaMovers.js';
import { renderBeginnerGuide } from './beginnerGuide.js';
import { initHeroModal } from './heroModal.js';

let currentHeroesList = [];

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  initHeroModal();
  setupEventListeners();

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
});

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
 * Event Listeners Binding
 */
function setupEventListeners() {
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
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      state.set('searchQuery', val);
      if (searchClear) searchClear.classList.toggle('hidden', val.length === 0);
      renderCurrentTool();
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.set('searchQuery', '');
        searchClear.classList.add('hidden');
        searchInput.focus();
        renderCurrentTool();
      });
    }
  }

  // 8. Global Keyboard Shortcut for Search ('/')
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });

  // 9. Subscribe to state changes
  state.subscribe((key) => {
    if (key === 'activeTool' || key === 'viewMode' || key === 'sortField' || key === 'sortOrder') {
      renderCurrentTool();
    }
  });
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
