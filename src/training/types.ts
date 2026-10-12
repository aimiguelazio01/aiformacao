export interface UseCase {
  id: string;
  task: string;
  aiApplication: string;
  expectedResult: string;
  exercise: string;
  validation: string;
  moduleIds: string[];
}

export interface TrainingModule {
  id: string;
  number: string;
  title: string;
  description: string;
  deliverable: string;
  tag: string;
}

export interface VisualThemeConfig {
  variant: 'volumes' | 'nodes' | 'planes' | 'network' | 'mixed';
  objects: string[];
  accentColor?: string;
  heroHighlight?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
}

export interface CompanyProfile {
  id: string;
  companyName?: string;
  industry: string;
  industryLabel: string;
  subIndustry?: string;
  companyType?: string;
  companySize?: string;
  headline: string;
  description: string;
  introduction: string;
  finalCtaText: string;
  departments: string[];
  roles: string[];
  commonTasks: string[];
  painPoints: string[];
  opportunities: string[];
  aiUseCases: UseCase[];
  practicalExercises: string[];
  possibleAutomations: string[];
  possibleAISolutions: string[];
  recommendedModuleIds: string[];
  visualTheme: VisualThemeConfig;
  seo: SEOConfig;
}

export type CompanySize = '1-10' | '11-50' | '51-250' | '250+';
export type MaturityLevel = 'nenhuma' | 'basica' | 'regular' | 'avancada';

export interface DiagnosticInput {
  industryId: string;
  companySize: CompanySize;
  department: string;
  maturity: MaturityLevel;
  objectives: string[];
  challenge?: string;
}

export interface RecommendedModuleSummary {
  module: TrainingModule;
  reason: string;
}

export interface DiagnosticResult {
  input: DiagnosticInput;
  industryLabel: string;
  recommendedModules: RecommendedModuleSummary[];
  practicalExercises: string[];
  summaryText: string;
  timestamp: number;
}

export type AnalyticsEventType =
  | 'industry_selected'
  | 'department_selected'
  | 'diagnostic_started'
  | 'diagnostic_completed'
  | 'cta_clicked'
  | 'proposal_requested';

export interface AnalyticsEventDetail {
  type: AnalyticsEventType;
  industryId?: string;
  department?: string;
  companySize?: string;
  maturity?: string;
  objectivesCount?: number;
  mode?: 'local_summary';
  location?: string;
}
