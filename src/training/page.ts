import { emitAnalyticsEvent } from './analytics';
import {
  renderIndustrySelector,
  updateContextSection,
  updateExplorerSection,
  updateFinalCta,
  updateFormatsSection,
  updateHeroContent,
  updateModulesCatalog,
  updatePracticalWorkVisualizer,
  updateSolutionsSection,
  updateTrainerSection,
} from './components';
import { INDUSTRY_CATALOG } from './data';
import {
  copyTextToClipboard,
  DEPARTMENTS,
  generateDiagnosticSummary,
  OBJECTIVES_MAP,
  validateDiagnosticInput,
} from './diagnostic';
import { getProfileById, resolveProfile } from './profiles';
import { initPlayground } from './playground';
import type { CompanyProfile, DiagnosticInput } from './types';

// Main Application State
interface TrainingPageState {
  activeSectorId: string;
  activeProfile: CompanyProfile;
  activePracticalCaseIndex: number;
  diagnosticInput: DiagnosticInput;
  hasInteractedWithDiagnostic: boolean;
}

const state: TrainingPageState = {
  activeSectorId: 'pme',
  activeProfile: resolveProfile('pme'),
  activePracticalCaseIndex: 0,
  diagnosticInput: {
    industryId: 'pme',
    companySize: '11-50',
    department: DEPARTMENTS[0],
    maturity: 'basica',
    objectives: ['documentacao', 'comunicacao'],
  },
  hasInteractedWithDiagnostic: false,
};

// Global 3D Scene Reference
let trainingScene: {
  updateProfile: (p: CompanyProfile) => void;
  resize: (w: number, h: number) => void;
  render: () => void;
  dispose: () => void;
} | null = null;

function announceToScreenReader(message: string): void {
  const liveRegion = document.getElementById('a11y-status');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

// URL Handling
function getSectorFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const sectorParam = params.get('sector');
    if (sectorParam && getProfileById(sectorParam)) {
      return sectorParam.toLowerCase();
    }
  } catch {
    // Ignore URL parse error
  }
  return 'pme';
}

function updateUrlSector(sectorId: string, replace = false): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('sector') === sectorId) return;

    url.searchParams.set('sector', sectorId);
    url.searchParams.delete('company');
    url.searchParams.delete('department');

    if (replace) {
      window.history.replaceState({ sector: sectorId }, '', url.toString());
    } else {
      window.history.pushState({ sector: sectorId }, '', url.toString());
    }
  } catch {
    // History API error fallback
  }
}

// Sync all DOM elements with active profile
function applyProfileToUI(profile: CompanyProfile, announce = true): void {
  state.activeProfile = profile;
  state.activeSectorId = profile.id;
  state.activePracticalCaseIndex = 0;

  // Update SEO head metadata
  if (profile.seo.title) document.title = profile.seo.title;
  const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDesc && profile.seo.description) {
    metaDesc.content = profile.seo.description;
  }

  // Update Hero
  const heroEl = document.getElementById('hero');
  if (heroEl) updateHeroContent(heroEl, profile);

  // Update Sector Selector
  const selectorEl = document.querySelector<HTMLElement>('[data-industry-selector]');
  if (selectorEl) {
    renderIndustrySelector(selectorEl, profile.id, (newSectorId) => {
      setSector(newSectorId, false);
    });
  }

  // Update Context & Explorer Sections
  const contextEl = document.querySelector<HTMLElement>('[data-context-card]');
  if (contextEl) updateContextSection(contextEl, profile);

  const explorerEl = document.getElementById('setor');
  if (explorerEl) updateExplorerSection(explorerEl, profile);

  // Update Practical Flow Visualizer
  const practicalEl = document.querySelector<HTMLElement>('[data-practical-container]');
  if (practicalEl) {
    updatePracticalWorkVisualizer(practicalEl, profile, state.activePracticalCaseIndex, (idx) => {
      state.activePracticalCaseIndex = idx;
      updatePracticalWorkVisualizer(practicalEl, state.activeProfile, idx, () => {});
    });
  }

  // Update Modules Catalog with profile recommendations
  const modulesEl = document.getElementById('modulos');
  if (modulesEl) updateModulesCatalog(modulesEl, profile.recommendedModuleIds);

  // Update Solutions Section
  const solutionsEl = document.getElementById('solucoes');
  if (solutionsEl) updateSolutionsSection(solutionsEl, profile);

  // Update Final CTA
  const ctaEl = document.getElementById('contacto');
  if (ctaEl) updateFinalCta(ctaEl, profile);

  // Sync Diagnostic Sector Dropdown
  const diagSectorSelect = document.querySelector<HTMLSelectElement>('#diag-sector');
  if (diagSectorSelect && diagSectorSelect.value !== profile.id) {
    diagSectorSelect.value = profile.id;
  }

  // Invalidate any previously generated diagnostic summary because sector changed
  invalidateDiagnosticSummary();

  // Update 3D scene if initialized
  if (trainingScene) {
    trainingScene.updateProfile(profile);
  }

  if (announce) {
    announceToScreenReader(`Setor alterado para ${profile.industryLabel}. Conteúdo e recomendações atualizados.`);
  }
}

function setSector(sectorId: string, fromPopState = false): void {
  const profile = resolveProfile(sectorId);
  if (!fromPopState) {
    updateUrlSector(profile.id);
  }
  applyProfileToUI(profile);
  emitAnalyticsEvent('industry_selected', { industryId: profile.id });
}

// Diagnostic Form Handling
function setupDiagnosticForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-diagnostic-form]');
  const sectorSelect = document.querySelector<HTMLSelectElement>('#diag-sector');
  const deptSelect = document.querySelector<HTMLSelectElement>('#diag-dept');
  const sizeSelect = document.querySelector<HTMLSelectElement>('#diag-size');
  const maturitySelect = document.querySelector<HTMLSelectElement>('#diag-maturity');
  const objectivesContainer = document.querySelector<HTMLElement>('[data-objectives-grid]');
  const resultBox = document.querySelector<HTMLElement>('[data-diagnostic-result]');
  const summaryTextarea = document.querySelector<HTMLTextAreaElement>('[data-summary-text]');
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-copy-summary]');

  if (!form || !sectorSelect || !deptSelect || !objectivesContainer) return;

  // Populate Sector Select
  sectorSelect.innerHTML = '';
  INDUSTRY_CATALOG.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.industryLabel;
    opt.selected = item.id === state.activeSectorId;
    sectorSelect.append(opt);
  });

  sectorSelect.addEventListener('change', () => {
    setSector(sectorSelect.value, false);
  });

  // Populate Department Select
  deptSelect.innerHTML = '';
  DEPARTMENTS.forEach((dept, index) => {
    const opt = document.createElement('option');
    opt.value = dept;
    opt.textContent = dept;
    opt.selected = index === 0;
    deptSelect.append(opt);
  });

  // Populate Objectives Checkboxes
  objectivesContainer.innerHTML = '';
  Object.entries(OBJECTIVES_MAP).forEach(([key, config]) => {
    const label = document.createElement('label');
    label.className = 'checkbox-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'objectives';
    checkbox.value = key;
    checkbox.checked = state.diagnosticInput.objectives.includes(key);

    const span = document.createElement('span');
    span.className = 'checkbox-label';
    span.textContent = config.label;

    label.append(checkbox, span);
    objectivesContainer.append(label);
  });

  // Track first interaction
  form.addEventListener('focusin', () => {
    if (!state.hasInteractedWithDiagnostic) {
      state.hasInteractedWithDiagnostic = true;
      emitAnalyticsEvent('diagnostic_started', { industryId: state.activeSectorId });
    }
  }, { once: true });

  // Invalidate summary when inputs change
  form.addEventListener('input', () => {
    invalidateDiagnosticSummary();
  });

  // Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const checkedBoxes = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name="objectives"]:checked'),
    ).map((cb) => cb.value);

    const challengeEl = form.querySelector<HTMLTextAreaElement>('#diag-challenge');

    const inputData: DiagnosticInput = {
      industryId: sectorSelect.value,
      companySize: (sizeSelect?.value as DiagnosticInput['companySize']) || '11-50',
      department: deptSelect.value,
      maturity: (maturitySelect?.value as DiagnosticInput['maturity']) || 'basica',
      objectives: checkedBoxes,
      challenge: challengeEl?.value || '',
    };

    const validation = validateDiagnosticInput(inputData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      alert(`Por favor verifique os campos do diagnóstico:\n• ${firstError}`);
      return;
    }

    state.diagnosticInput = inputData;
    const summary = generateDiagnosticSummary(inputData);

    if (resultBox && summaryTextarea) {
      summaryTextarea.value = summary.summaryText;
      resultBox.hidden = false;
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    emitAnalyticsEvent('diagnostic_completed', {
      industryId: inputData.industryId,
      department: inputData.department,
      companySize: inputData.companySize,
      maturity: inputData.maturity,
      objectivesCount: inputData.objectives.length,
    });

    emitAnalyticsEvent('proposal_requested', {
      industryId: inputData.industryId,
      mode: 'local_summary',
    });

    announceToScreenReader('Resumo de diagnóstico de formação gerado com sucesso. Pode agora copiar o texto.');
  });

  // Copy Button
  if (copyBtn && summaryTextarea) {
    copyBtn.addEventListener('click', async () => {
      const textToCopy = summaryTextarea.value;
      if (!textToCopy) return;

      const ok = await copyTextToClipboard(textToCopy);
      if (ok) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Resumo Copiado!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2500);
      } else {
        alert('Não foi possível copiar automaticamente. Selecione o texto abaixo e prima Ctrl+C.');
        summaryTextarea.select();
      }
    });
  }
}

function invalidateDiagnosticSummary(): void {
  const resultBox = document.querySelector<HTMLElement>('[data-diagnostic-result]');
  if (resultBox && !resultBox.hidden) {
    resultBox.hidden = true;
  }
}

// 3D Scene Initialization (Dynamic Import for Fast First Paint)
async function initializeScene(): Promise<void> {
  const heroEl = document.getElementById('hero');
  const canvas = heroEl?.querySelector<HTMLCanvasElement>('.hero__canvas');
  const statusEl = heroEl?.querySelector<HTMLElement>('[data-hero-status]');
  const resetBtn = heroEl?.querySelector<HTMLButtonElement>('[data-reset-view]');

  if (!heroEl || !canvas) return;

  try {
    const { createTrainingScene } = await import('./scene');
    trainingScene = createTrainingScene(heroEl, canvas);
    trainingScene.updateProfile(state.activeProfile);

    if (statusEl) {
      statusEl.textContent = 'Cena 3D interativa ativa';
    }

    // Window resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (trainingScene && width > 0 && height > 0) {
          trainingScene.resize(width, height);
        }
      }
    });
    resizeObserver.observe(heroEl);

    // Reset view button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (trainingScene) {
          trainingScene.render();
        }
      });
    }

    window.addEventListener('pagehide', () => {
      resizeObserver.disconnect();
      trainingScene?.dispose();
    }, { once: true });
  } catch (error) {
    console.warn('Three.js scene initialization fell back to static view:', error);
    heroEl.classList.add('hero--static');
    if (statusEl) {
      statusEl.textContent = 'Vista estática — WebGL indisponível';
    }
  }
}

// Main Bootstrapping
function init(): void {
  // Static content setup
  const formatsEl = document.getElementById('formatos');
  if (formatsEl) updateFormatsSection(formatsEl);

  const trainerEl = document.getElementById('formador');
  if (trainerEl) updateTrainerSection(trainerEl);

  // Setup diagnostic
  setupDiagnosticForm();

  // Setup interactive playground
  const playgroundContainer = document.querySelector<HTMLElement>('[data-playground-container]');
  if (playgroundContainer) {
    initPlayground(playgroundContainer);
  }

  // Resolve initial profile from URL
  const initialSectorId = getSectorFromUrl();
  const initialProfile = resolveProfile(initialSectorId);
  applyProfileToUI(initialProfile, false);

  // CTA Click Tracking
  document.querySelectorAll<HTMLAnchorElement>('a[href="#diagnostico"]').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      emitAnalyticsEvent('cta_clicked', {
        industryId: state.activeSectorId,
        location: anchor.getAttribute('href') || 'cta',
      });
    });
  });

  // Browser Back/Forward navigation listener
  window.addEventListener('popstate', () => {
    const sectorFromUrl = getSectorFromUrl();
    if (sectorFromUrl !== state.activeSectorId) {
      setSector(sectorFromUrl, true);
    }
  });

  // Initialize 3D scene after DOM setup
  void initializeScene();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
