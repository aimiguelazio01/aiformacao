import { describe, expect, it } from 'vitest';
import { INDUSTRY_CATALOG, TRAINING_MODULES } from '../src/training/data';
import {
  computeDiagnosticRecommendations,
  generateDiagnosticSummary,
  validateDiagnosticInput,
} from '../src/training/diagnostic';
import { getAllIndustryIds, getDefaultProfile, getProfileById, resolveProfile } from '../src/training/profiles';
import type { CompanyProfile, DiagnosticInput } from '../src/training/types';

describe('Training Modules Catalog', () => {
  it('contains exactly 13 modules including Fundamentos and Utilização Responsável', () => {
    expect(TRAINING_MODULES).toHaveLength(13);

    const ids = TRAINING_MODULES.map((m) => m.id);
    expect(ids).toContain('fundamentos');
    expect(ids).toContain('prompting');
    expect(ids).toContain('documentos');
    expect(ids).toContain('comunicacao');
    expect(ids).toContain('pesquisa');
    expect(ids).toContain('conteudo');
    expect(ids).toContain('imagem');
    expect(ids).toContain('analise-dados');
    expect(ids).toContain('automacao');
    expect(ids).toContain('agentes');
    expect(ids).toContain('processos');
    expect(ids).toContain('no-code');
    expect(ids).toContain('responsavel');
  });

  it('has valid non-empty fields in every module', () => {
    for (const mod of TRAINING_MODULES) {
      expect(mod.id).toBeTruthy();
      expect(mod.number).toMatch(/^\d{2}$/);
      expect(mod.title.length).toBeGreaterThan(5);
      expect(mod.description.length).toBeGreaterThan(15);
      expect(mod.deliverable.length).toBeGreaterThan(10);
      expect(mod.tag).toBeTruthy();
    }
  });
});

describe('Industry Catalog & Data Integrity', () => {
  const allIds = getAllIndustryIds();

  it('contains all 13 required industry profiles', () => {
    expect(allIds).toHaveLength(13);
    const expected = [
      'pme',
      'arquitetura',
      'imobiliario',
      'construcao',
      'industria',
      'hotelaria',
      'restauracao',
      'retalho',
      'marketing',
      'industrias-criativas',
      'educacao',
      'servicos-profissionais',
      'outro',
    ];
    for (const exp of expected) {
      expect(allIds).toContain(exp);
    }
  });

  it('verifies that each profile contains 3 complete and valid use cases', () => {
    const validModuleIds = new Set(TRAINING_MODULES.map((m) => m.id));

    for (const profile of INDUSTRY_CATALOG) {
      expect(profile.aiUseCases).toHaveLength(3);

      for (const uc of profile.aiUseCases) {
        expect(uc.id).toBeTruthy();
        expect(uc.task.length).toBeGreaterThan(10);
        expect(uc.aiApplication.length).toBeGreaterThan(10);
        expect(uc.expectedResult.length).toBeGreaterThan(10);
        expect(uc.exercise.length).toBeGreaterThan(10);
        expect(uc.validation.length).toBeGreaterThan(10);
        expect(uc.moduleIds.length).toBeGreaterThan(0);

        for (const mid of uc.moduleIds) {
          expect(validModuleIds.has(mid)).toBe(true);
        }
      }
    }
  });

  it('verifies editorial quality and natural PT-PT terminology in key sectors', () => {
    const arq = getProfileById('arquitetura');
    expect(arq?.headline).toContain('espacial');
    expect(arq?.commonTasks.some((t) => t.includes('PDM') || t.includes('memórias descritivas'))).toBe(true);

    const imo = getProfileById('imobiliario');
    expect(imo?.headline).toContain('angariações');
    expect(imo?.commonTasks.some((t) => t.includes('imóveis') || t.includes('estudos de mercado'))).toBe(true);

    const ind = getProfileById('industria');
    expect(ind?.headline).toContain('documentação técnica');
    expect(ind?.commonTasks.some((t) => t.includes('SOP') || t.includes('Instruções de Trabalho'))).toBe(true);

    const hot = getProfileById('hotelaria');
    expect(hot?.headline).toContain('hóspede');
    expect(hot?.commonTasks.some((t) => t.includes('reviews') || t.includes('TripAdvisor'))).toBe(true);
  });
});

describe('Profile Resolution Engine', () => {
  it('returns default PME profile via getDefaultProfile()', () => {
    const defaultProf = getDefaultProfile();
    expect(defaultProf.id).toBe('pme');
    expect(defaultProf.industryLabel).toBe('PME & Negócios Gerais');
  });

  it('falls back cleanly to default PME profile when given null, empty or invalid ID', () => {
    const fallbackNull = resolveProfile(null);
    expect(fallbackNull.id).toBe('pme');

    const fallbackEmpty = resolveProfile('');
    expect(fallbackEmpty.id).toBe('pme');

    const fallbackInvalid = resolveProfile('setor-inexistente-xyz');
    expect(fallbackInvalid.id).toBe('pme');
  });

  it('resolves valid industry profiles correctly', () => {
    const resolved = resolveProfile('arquitetura');
    expect(resolved.id).toBe('arquitetura');
    expect(resolved.industryLabel).toBe('Arquitetura & Urbanismo');
    expect(resolved.visualTheme.variant).toBe('volumes');
  });

  it('applies company-level overrides without altering other properties', () => {
    const companyOverride: Partial<CompanyProfile> = {
      companyName: 'Atelier Silva & Filhos',
      headline: 'Arquitetura Sustentável com IA.',
      roles: ['Arquiteto Sénior Especialista'],
    };

    const resolved = resolveProfile('arquitetura', companyOverride);
    expect(resolved.id).toBe('arquitetura');
    expect(resolved.companyName).toBe('Atelier Silva & Filhos');
    expect(resolved.headline).toBe('Arquitetura Sustentável com IA.');
    expect(resolved.roles).toEqual(['Arquiteto Sénior Especialista']);
    // Keeps intact other properties
    expect(resolved.industryLabel).toBe('Arquitetura & Urbanismo');
    expect(resolved.aiUseCases).toHaveLength(3);
  });

  it('preserves use cases as indivisible records during overrides', () => {
    const customCase = {
      id: 'custom-1',
      task: 'Análise de impacto solar',
      aiApplication: 'Cálculo de sombras',
      expectedResult: 'Gráfico térmico',
      exercise: 'Simulação 3D',
      validation: 'Verificação pelo engenheiro térmico',
      moduleIds: ['documentos', 'analise-dados'],
    };

    const resolved = resolveProfile('arquitetura', {
      aiUseCases: [customCase],
    });

    expect(resolved.aiUseCases).toHaveLength(1);
    expect(resolved.aiUseCases[0].task).toBe('Análise de impacto solar');
    expect(resolved.aiUseCases[0].validation).toBe('Verificação pelo engenheiro térmico');
  });
});

describe('Diagnostic Rules & Summary Engine', () => {
  const baseInput: DiagnosticInput = {
    industryId: 'arquitetura',
    companySize: '11-50',
    department: 'Projetos de Arquitetura',
    maturity: 'basica',
    objectives: ['documentacao', 'pesquisa'],
    challenge: 'Dificuldade em compilar regulamentos de diferentes concelhos rapidamente.',
  };

  it('validates input correctly', () => {
    const valid = validateDiagnosticInput(baseInput);
    expect(valid.isValid).toBe(true);
    expect(Object.keys(valid.errors)).toHaveLength(0);

    const invalid = validateDiagnosticInput({
      industryId: '',
      companySize: undefined,
      objectives: [],
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.industryId).toBeTruthy();
    expect(invalid.errors.companySize).toBeTruthy();
    expect(invalid.errors.objectives).toBeTruthy();
  });

  it('always includes Utilização Responsável and adds Fundamentos + Prompting for basic maturity', () => {
    const recs = computeDiagnosticRecommendations(baseInput);
    const recIds = recs.map((r) => r.module.id);

    expect(recIds).toContain('responsavel');
    expect(recIds).toContain('fundamentos');
    expect(recIds).toContain('prompting');
    expect(recIds).toContain('documentos');
    expect(recIds).toContain('pesquisa');
  });

  it('omits Fundamentos if maturity is regular or avançada unless requested', () => {
    const advancedInput: DiagnosticInput = {
      ...baseInput,
      maturity: 'avancada',
      objectives: ['automacao'],
    };

    const recs = computeDiagnosticRecommendations(advancedInput);
    const recIds = recs.map((r) => r.module.id);

    expect(recIds).toContain('responsavel');
    expect(recIds).toContain('automacao');
    expect(recIds).not.toContain('fundamentos');
  });

  it('generates a complete formatted summary containing all required sections', () => {
    const summary = generateDiagnosticSummary(baseInput);

    expect(summary.industryLabel).toBe('Arquitetura & Urbanismo');
    expect(summary.recommendedModules.length).toBeGreaterThanOrEqual(3);
    expect(summary.summaryText).toContain('MVIRGIL STUDIO');
    expect(summary.summaryText).toContain('Arquitetura & Urbanismo');
    expect(summary.summaryText).toContain('11-50 colaboradores');
    expect(summary.summaryText).toContain('Dificuldade em compilar regulamentos');
    expect(summary.summaryText).toContain('MÓDULOS DE FORMAÇÃO RECOMENDADOS');
    expect(summary.summaryText).toContain('CASOS PRÁTICOS E EXERCÍCIOS SETORIAIS PREVISTOS');
  });
});
