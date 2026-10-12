import { INDUSTRY_CATALOG, TRAINING_MODULES } from './data';
import type { CompanyProfile, SEOConfig, UseCase, VisualThemeConfig } from './types';

const VALID_MODULE_IDS = new Set(TRAINING_MODULES.map((module) => module.id));
const VALID_VARIANTS = new Set<VisualThemeConfig['variant']>(['volumes', 'nodes', 'planes', 'network', 'mixed']);

export function getProfileById(id: string): CompanyProfile | undefined {
  return INDUSTRY_CATALOG.find((profile) => profile.id.toLowerCase() === id.toLowerCase());
}

export function getDefaultProfile(): CompanyProfile {
  const pme = getProfileById('pme');
  if (!pme) {
    throw new Error('Default PME profile must exist in catalog.');
  }
  return pme;
}

export function getAllIndustryIds(): string[] {
  return INDUSTRY_CATALOG.map((profile) => profile.id);
}

function sanitizeUseCases(useCases: UseCase[] | undefined, fallbackUseCases: UseCase[]): UseCase[] {
  if (!Array.isArray(useCases) || useCases.length === 0) {
    return fallbackUseCases;
  }

  // Ensure each useCase is an indivisible, coherent record
  const sanitized = useCases.filter((uc) =>
    typeof uc.id === 'string'
    && typeof uc.task === 'string'
    && typeof uc.aiApplication === 'string'
    && typeof uc.expectedResult === 'string'
    && typeof uc.exercise === 'string'
    && typeof uc.validation === 'string'
    && Array.isArray(uc.moduleIds)
  );

  return sanitized.length > 0 ? sanitized : fallbackUseCases;
}

function sanitizeModuleIds(moduleIds: string[] | undefined, fallbackIds: string[]): string[] {
  if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
    return fallbackIds;
  }
  const valid = moduleIds.filter((id) => VALID_MODULE_IDS.has(id));
  return valid.length > 0 ? valid : fallbackIds;
}

function mergeVisualTheme(
  base: VisualThemeConfig,
  override?: Partial<VisualThemeConfig>,
): VisualThemeConfig {
  if (!override) return { ...base, objects: [...base.objects] };

  const variant = override.variant && VALID_VARIANTS.has(override.variant)
    ? override.variant
    : base.variant;

  const objects = Array.isArray(override.objects) && override.objects.length > 0
    ? [...override.objects]
    : [...base.objects];

  return {
    variant,
    objects,
    accentColor: override.accentColor || base.accentColor,
    heroHighlight: override.heroHighlight || base.heroHighlight,
  };
}

function mergeSEO(base: SEOConfig, override?: Partial<SEOConfig>): SEOConfig {
  if (!override) return { ...base };
  return {
    title: typeof override.title === 'string' && override.title.trim().length > 0
      ? override.title
      : base.title,
    description: typeof override.description === 'string' && override.description.trim().length > 0
      ? override.description
      : base.description,
  };
}

/**
 * Pure resolution function:
 * default (PME) -> industry -> company overrides -> department overrides
 */
export function resolveProfile(
  industryId?: string | null,
  companyOverrides?: Partial<CompanyProfile> | null,
  departmentOverrides?: Partial<CompanyProfile> | null,
): CompanyProfile {
  const defaultProfile = getDefaultProfile();
  const matchedIndustry = industryId ? getProfileById(industryId) : undefined;
  const industryProfile = matchedIndustry || defaultProfile;

  // Start with a shallow clone of the industry profile
  let resolved: CompanyProfile = {
    ...industryProfile,
    departments: [...industryProfile.departments],
    roles: [...industryProfile.roles],
    commonTasks: [...industryProfile.commonTasks],
    painPoints: [...industryProfile.painPoints],
    opportunities: [...industryProfile.opportunities],
    practicalExercises: [...industryProfile.practicalExercises],
    possibleAutomations: [...industryProfile.possibleAutomations],
    possibleAISolutions: [...industryProfile.possibleAISolutions],
    recommendedModuleIds: [...industryProfile.recommendedModuleIds],
    aiUseCases: industryProfile.aiUseCases.map((uc) => ({ ...uc, moduleIds: [...uc.moduleIds] })),
    visualTheme: { ...industryProfile.visualTheme, objects: [...industryProfile.visualTheme.objects] },
    seo: { ...industryProfile.seo },
  };

  // Helper to apply override layer
  const applyLayer = (layer?: Partial<CompanyProfile> | null) => {
    if (!layer) return;

    if (layer.headline && typeof layer.headline === 'string') resolved.headline = layer.headline;
    if (layer.description && typeof layer.description === 'string') resolved.description = layer.description;
    if (layer.introduction && typeof layer.introduction === 'string') resolved.introduction = layer.introduction;
    if (layer.finalCtaText && typeof layer.finalCtaText === 'string') resolved.finalCtaText = layer.finalCtaText;
    if (layer.companyName && typeof layer.companyName === 'string') resolved.companyName = layer.companyName;
    if (layer.companySize && typeof layer.companySize === 'string') resolved.companySize = layer.companySize;
    if (layer.subIndustry && typeof layer.subIndustry === 'string') resolved.subIndustry = layer.subIndustry;

    // Arrays are replaced completely if valid, never concatenated
    if (Array.isArray(layer.departments) && layer.departments.length > 0) {
      resolved.departments = [...layer.departments];
    }
    if (Array.isArray(layer.roles) && layer.roles.length > 0) {
      resolved.roles = [...layer.roles];
    }
    if (Array.isArray(layer.commonTasks) && layer.commonTasks.length > 0) {
      resolved.commonTasks = [...layer.commonTasks];
    }
    if (Array.isArray(layer.painPoints) && layer.painPoints.length > 0) {
      resolved.painPoints = [...layer.painPoints];
    }
    if (Array.isArray(layer.opportunities) && layer.opportunities.length > 0) {
      resolved.opportunities = [...layer.opportunities];
    }
    if (Array.isArray(layer.practicalExercises) && layer.practicalExercises.length > 0) {
      resolved.practicalExercises = [...layer.practicalExercises];
    }
    if (Array.isArray(layer.possibleAutomations) && layer.possibleAutomations.length > 0) {
      resolved.possibleAutomations = [...layer.possibleAutomations];
    }
    if (Array.isArray(layer.possibleAISolutions) && layer.possibleAISolutions.length > 0) {
      resolved.possibleAISolutions = [...layer.possibleAISolutions];
    }

    resolved.recommendedModuleIds = sanitizeModuleIds(
      layer.recommendedModuleIds,
      resolved.recommendedModuleIds,
    );

    resolved.aiUseCases = sanitizeUseCases(
      layer.aiUseCases,
      resolved.aiUseCases,
    );

    resolved.visualTheme = mergeVisualTheme(resolved.visualTheme, layer.visualTheme);
    resolved.seo = mergeSEO(resolved.seo, layer.seo);
  };

  applyLayer(companyOverrides);
  applyLayer(departmentOverrides);

  return resolved;
}
