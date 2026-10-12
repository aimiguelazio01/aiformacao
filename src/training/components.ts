import { INDUSTRY_CATALOG, TRAINER_INFO, TRAINING_FORMATS, TRAINING_MODULES } from './data';
import type { CompanyProfile, UseCase } from './types';

// Helper to escape or safely set text
function setText(element: HTMLElement | null, text: string): void {
  if (element) element.textContent = text;
}

export function updateHeroContent(heroEl: HTMLElement, profile: CompanyProfile): void {
  const headlineEl = heroEl.querySelector<HTMLElement>('[data-hero-title]');
  const introEl = heroEl.querySelector<HTMLElement>('[data-hero-intro]');
  const eyebrowEl = heroEl.querySelector<HTMLElement>('[data-hero-eyebrow-text]');
  const sectorBadgeEl = heroEl.querySelector<HTMLElement>('[data-hero-sector-badge]');

  if (headlineEl) headlineEl.textContent = profile.headline;
  if (introEl) introEl.textContent = profile.introduction;
  if (eyebrowEl) eyebrowEl.textContent = 'Formação Prática em Inteligência Artificial para Empresas';
  if (sectorBadgeEl) sectorBadgeEl.textContent = profile.industryLabel;
}

export function renderIndustrySelector(
  container: HTMLElement,
  activeId: string,
  onSelect: (industryId: string) => void,
): void {
  container.innerHTML = '';

  // 1. Mobile native select
  const selectWrapper = document.createElement('div');
  selectWrapper.className = 'selector-mobile';

  const selectLabel = document.createElement('label');
  selectLabel.className = 'sr-only';
  selectLabel.htmlFor = 'mobile-sector-select';
  selectLabel.textContent = 'Selecionar Setor de Atividade';

  const selectEl = document.createElement('select');
  selectEl.id = 'mobile-sector-select';
  selectEl.className = 'sector-select-native';

  INDUSTRY_CATALOG.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.industryLabel;
    opt.selected = item.id === activeId;
    selectEl.append(opt);
  });

  selectEl.addEventListener('change', () => {
    onSelect(selectEl.value);
  });
  selectWrapper.append(selectLabel, selectEl);

  // 2. Desktop chips / pill buttons
  const chipsWrapper = document.createElement('div');
  chipsWrapper.className = 'selector-chips';
  chipsWrapper.setAttribute('role', 'radiogroup');
  chipsWrapper.setAttribute('aria-label', 'Setores de Atividade');

  INDUSTRY_CATALOG.forEach((item) => {
    const isSelected = item.id === activeId;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip-btn ${isSelected ? 'chip-btn--active' : ''}`;
    chip.setAttribute('role', 'radio');
    chip.setAttribute('aria-checked', String(isSelected));
    chip.textContent = item.industryLabel;

    chip.addEventListener('click', () => {
      if (item.id !== activeId) {
        onSelect(item.id);
      }
    });

    chipsWrapper.append(chip);
  });

  container.append(selectWrapper, chipsWrapper);
}

export function updateContextSection(container: HTMLElement, profile: CompanyProfile): void {
  const labelEl = container.querySelector<HTMLElement>('[data-context-sector]');
  const descEl = container.querySelector<HTMLElement>('[data-context-desc]');
  const rolesList = container.querySelector<HTMLElement>('[data-context-roles]');
  const tasksList = container.querySelector<HTMLElement>('[data-context-tasks]');

  if (labelEl) labelEl.textContent = profile.industryLabel;
  if (descEl) descEl.textContent = profile.description;

  if (rolesList) {
    rolesList.innerHTML = '';
    profile.roles.forEach((role) => {
      const li = document.createElement('li');
      li.className = 'tag-item';
      li.textContent = role;
      rolesList.append(li);
    });
  }

  if (tasksList) {
    tasksList.innerHTML = '';
    profile.commonTasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-bullet';
      li.textContent = task;
      tasksList.append(li);
    });
  }
}

export function updateExplorerSection(container: HTMLElement, profile: CompanyProfile): void {
  const painList = container.querySelector<HTMLElement>('[data-explorer-pains]');
  const oppList = container.querySelector<HTMLElement>('[data-explorer-opps]');

  if (painList) {
    painList.innerHTML = '';
    profile.painPoints.forEach((pain) => {
      const li = document.createElement('li');
      li.className = 'bullet-item bullet-item--pain';
      li.textContent = pain;
      painList.append(li);
    });
  }

  if (oppList) {
    oppList.innerHTML = '';
    profile.opportunities.forEach((opp) => {
      const li = document.createElement('li');
      li.className = 'bullet-item bullet-item--opp';
      li.textContent = opp;
      oppList.append(li);
    });
  }
}

export function updatePracticalWorkVisualizer(
  container: HTMLElement,
  profile: CompanyProfile,
  selectedIndex = 0,
  onSelectIndex: (index: number) => void,
): void {
  const tabsContainer = container.querySelector<HTMLElement>('[data-practical-tabs]');
  const flowCardsContainer = container.querySelector<HTMLElement>('[data-practical-flow]');
  const exerciseEl = container.querySelector<HTMLElement>('[data-practical-exercise]');
  const validationEl = container.querySelector<HTMLElement>('[data-practical-validation]');

  if (!tabsContainer || !flowCardsContainer) return;

  const validIndex = Math.min(Math.max(0, selectedIndex), profile.aiUseCases.length - 1);
  const activeCase: UseCase = profile.aiUseCases[validIndex];

  // Render Tabs
  tabsContainer.innerHTML = '';
  profile.aiUseCases.forEach((uc, index) => {
    const isSelected = index === validIndex;
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `practical-tab ${isSelected ? 'practical-tab--active' : ''}`;
    tabBtn.setAttribute('aria-pressed', String(isSelected));
    tabBtn.textContent = `Caso 0${index + 1}: ${uc.task.split(' ').slice(0, 4).join(' ')}…`;

    tabBtn.addEventListener('click', () => {
      onSelectIndex(index);
    });
    tabsContainer.append(tabBtn);
  });

  // Render 3 Connected Cards (Tarefa -> IA -> Resultado)
  flowCardsContainer.innerHTML = `
    <div class="flow-card flow-card--step1">
      <div class="flow-card__header">
        <span class="flow-card__step">Etapa 01</span>
        <h4 class="flow-card__title">Tarefa Manual Atual</h4>
      </div>
      <p class="flow-card__content">${activeCase.task}</p>
    </div>

    <div class="flow-arrow" aria-hidden="true">→</div>

    <div class="flow-card flow-card--step2">
      <div class="flow-card__header">
        <span class="flow-card__step">Etapa 02</span>
        <h4 class="flow-card__title">Aplicação da IA</h4>
      </div>
      <p class="flow-card__content">${activeCase.aiApplication}</p>
    </div>

    <div class="flow-arrow" aria-hidden="true">→</div>

    <div class="flow-card flow-card--step3">
      <div class="flow-card__header">
        <span class="flow-card__step">Etapa 03</span>
        <h4 class="flow-card__title">Resultado Verificável</h4>
      </div>
      <p class="flow-card__content">${activeCase.expectedResult}</p>
    </div>
  `;

  // Render Exercise & Human Validation
  if (exerciseEl) {
    exerciseEl.textContent = activeCase.exercise;
  }
  if (validationEl) {
    validationEl.textContent = activeCase.validation;
  }
}

export function updateModulesCatalog(container: HTMLElement, recommendedIds: string[] = []): void {
  const grid = container.querySelector<HTMLElement>('[data-modules-grid]');
  if (!grid) return;

  grid.innerHTML = '';
  const recommendedSet = new Set(recommendedIds);

  TRAINING_MODULES.forEach((mod) => {
    const isRecommended = recommendedSet.has(mod.id);
    const card = document.createElement('article');
    card.className = `module-card ${isRecommended ? 'module-card--recommended' : ''}`;

    card.innerHTML = `
      <div class="module-card__top">
        <span class="module-card__num">${mod.number}</span>
        <span class="module-card__tag">${mod.tag}</span>
      </div>
      <h3 class="module-card__title">${mod.title}</h3>
      <p class="module-card__desc">${mod.description}</p>
      <div class="module-card__deliverable">
        <strong>Entrega Prática:</strong> ${mod.deliverable}
      </div>
      ${isRecommended ? '<span class="module-card__badge">Recomendado para o setor</span>' : ''}
    `;

    grid.append(card);
  });
}

export function updateFormatsSection(container: HTMLElement): void {
  const grid = container.querySelector<HTMLElement>('[data-formats-grid]');
  if (!grid) return;

  grid.innerHTML = '';
  TRAINING_FORMATS.forEach((fmt) => {
    const card = document.createElement('article');
    card.className = 'format-card';

    const featuresHtml = fmt.features
      .map((feat) => `<li class="format-feature">${feat}</li>`)
      .join('');

    card.innerHTML = `
      <div class="format-card__header">
        <span class="format-card__duration">${fmt.duration}</span>
        <h3 class="format-card__title">${fmt.title}</h3>
        <p class="format-card__subtitle">${fmt.subtitle}</p>
      </div>
      <p class="format-card__target"><strong>Dirigido a:</strong> ${fmt.target}</p>
      <p class="format-card__desc">${fmt.description}</p>
      <ul class="format-card__features">${featuresHtml}</ul>
    `;

    grid.append(card);
  });
}

export function updateSolutionsSection(container: HTMLElement, profile: CompanyProfile): void {
  const autoList = container.querySelector<HTMLElement>('[data-solutions-automations]');
  const aiList = container.querySelector<HTMLElement>('[data-solutions-ai]');

  if (autoList) {
    autoList.innerHTML = '';
    profile.possibleAutomations.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'solution-item';
      li.textContent = item;
      autoList.append(li);
    });
  }

  if (aiList) {
    aiList.innerHTML = '';
    profile.possibleAISolutions.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'solution-item';
      li.textContent = item;
      aiList.append(li);
    });
  }
}

export function updateTrainerSection(container: HTMLElement): void {
  setText(container.querySelector('[data-trainer-name]'), TRAINER_INFO.name);
  setText(container.querySelector('[data-trainer-role]'), TRAINER_INFO.role);
  setText(container.querySelector('[data-trainer-headline]'), TRAINER_INFO.headline);
  setText(container.querySelector('[data-trainer-bio]'), TRAINER_INFO.bio);

  const credsList = container.querySelector<HTMLElement>('[data-trainer-credentials]');
  if (credsList) {
    credsList.innerHTML = '';
    TRAINER_INFO.credentials.forEach((cred) => {
      const li = document.createElement('li');
      li.className = 'credential-bullet';
      li.textContent = cred;
      credsList.append(li);
    });
  }
}

export function updateFinalCta(container: HTMLElement, profile: CompanyProfile): void {
  const textEl = container.querySelector<HTMLElement>('[data-cta-text]');
  if (textEl) {
    textEl.textContent = profile.finalCtaText;
  }
}
