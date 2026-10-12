import { TRAINING_MODULES } from './data';
import { resolveProfile } from './profiles';
import type {
  DiagnosticInput,
  DiagnosticResult,
  RecommendedModuleSummary,
  TrainingModule,
} from './types';

export const DEPARTMENTS = [
  'Direção Geral & Administração',
  'Comercial & Vendas',
  'Marketing & Comunicação',
  'Operações & Logística',
  'Administrativo & Financeiro',
  'Recursos Humanos & Formação',
  'Apoio ao Cliente & Suporte',
  'Técnico & Engenharia',
  'Design & Criação',
  'Outro Departamento',
];

export const OBJECTIVES_MAP: Record<string, { label: string; moduleIds: string[]; reason: string }> = {
  documentacao: {
    label: 'Análise e gestão de documentos técnicos ou contratuais',
    moduleIds: ['documentos'],
    reason: 'Necessidade identificada de otimização no tratamento de relatórios e documentação técnica.',
  },
  comunicacao: {
    label: 'Comunicação com clientes, propostas comerciais e suporte',
    moduleIds: ['comunicacao'],
    reason: 'Foco na aceleração da comunicação comercial e consistência de resposta ao cliente.',
  },
  automacao: {
    label: 'Automação de tarefas manuais e conexão entre sistemas',
    moduleIds: ['automacao', 'no-code'],
    reason: 'Eliminação de tarefas repetitivas e transferência manual de dados entre plataformas.',
  },
  pesquisa: {
    label: 'Pesquisa de mercado, concorrentes e regulamentação',
    moduleIds: ['pesquisa'],
    reason: 'Capacitação na recolha rápida e verificação de inteligência de mercado e normas.',
  },
  conteudo: {
    label: 'Criação de conteúdos, copywriting e materiais de marketing',
    moduleIds: ['conteudo'],
    reason: 'Produção escalável de mensagens, artigos e materiais com a voz da marca.',
  },
  criatividade: {
    label: 'Exploração criativa, imagem conceptual e design',
    moduleIds: ['imagem'],
    reason: 'Aceleração da ideação estética e produção de referências visuais para projetos.',
  },
  dados: {
    label: 'Análise de métricas, folhas de cálculo e relatórios executivos',
    moduleIds: ['analise-dados', 'documentos'],
    reason: 'Transformação de dados brutos e folhas de cálculo em resumos de decisão executiva.',
  },
  produtividade: {
    label: 'Aumento geral de produtividade pessoal e de equipa',
    moduleIds: ['prompting'],
    reason: 'Domínio de técnicas estruturadas de formulação de instruções para ganho imediato de tempo.',
  },
};

export function validateDiagnosticInput(input: Partial<DiagnosticInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.industryId || input.industryId.trim().length === 0) {
    errors.industryId = 'Selecione o setor de atividade.';
  }

  if (!input.companySize) {
    errors.companySize = 'Selecione a dimensão da empresa.';
  }

  if (!input.department || input.department.trim().length === 0) {
    errors.department = 'Selecione o departamento da equipa.';
  }

  if (!input.maturity) {
    errors.maturity = 'Indique o nível de maturidade em IA.';
  }

  if (!Array.isArray(input.objectives) || input.objectives.length === 0) {
    errors.objectives = 'Selecione pelo menos um objetivo de formação.';
  }

  if (input.challenge && input.challenge.length > 2000) {
    errors.challenge = 'O desafio principal não pode exceder 2.000 caracteres.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function computeDiagnosticRecommendations(input: DiagnosticInput): RecommendedModuleSummary[] {
  const moduleMap = new Map<string, TrainingModule>();
  TRAINING_MODULES.forEach((m) => moduleMap.set(m.id, m));

  const reasons = new Map<string, string>();
  const candidates: string[] = [];

  const addCandidate = (id: string, reason: string) => {
    if (!moduleMap.has(id)) return;
    if (!reasons.has(id)) {
      reasons.set(id, reason);
      candidates.push(id);
    }
  };

  // Rule 1: Always include Responsible Use (Módulo 13)
  addCandidate('responsavel', 'Módulo obrigatório em todas as formações: conformidade RGPD, ética e governação de dados.');

  // Rule 2: Low maturity includes Fundamentals & Prompting
  if (input.maturity === 'nenhuma' || input.maturity === 'basica') {
    addCandidate('fundamentos', 'Recomendado para equipas em fase inicial: compreensão clara de conceitos e viabilidade.');
    addCandidate('prompting', 'Competência essencial: técnicas estruturadas de instrução para evitar respostas vagas ou incorretas.');
  }

  // Rule 3: Map selected objectives to modules
  for (const objKey of input.objectives) {
    const config = OBJECTIVES_MAP[objKey];
    if (config) {
      config.moduleIds.forEach((modId) => addCandidate(modId, config.reason));
    }
  }

  // Rule 4: Add profile specific recommendations (exclude fundamentos if higher maturity)
  const profile = resolveProfile(input.industryId);
  for (const modId of profile.recommendedModuleIds) {
    if (modId === 'fundamentos' && input.maturity !== 'nenhuma' && input.maturity !== 'basica') {
      continue;
    }
    if (!reasons.has(modId)) {
      addCandidate(modId, `Prioridade identificada para o setor de ${profile.industryLabel}.`);
    }
  }

  // Deduplicate candidates preserving priority insertion order
  const uniqueCandidates = candidates.filter((id, index, self) => self.indexOf(id) === index);

  // Rule: 'responsavel' must always be included. Cap at 6 modules with stable catalog order.
  const sortedCatalogIds = TRAINING_MODULES.map((m) => m.id);
  let selectedIds: string[];

  if (uniqueCandidates.includes('responsavel')) {
    const others = uniqueCandidates.filter((id) => id !== 'responsavel');
    const selectedOthers = others.slice(0, 5);
    selectedIds = [...selectedOthers, 'responsavel'].sort(
      (a, b) => sortedCatalogIds.indexOf(a) - sortedCatalogIds.indexOf(b),
    );
  } else {
    selectedIds = uniqueCandidates.slice(0, 6).sort(
      (a, b) => sortedCatalogIds.indexOf(a) - sortedCatalogIds.indexOf(b),
    );
  }

  return selectedIds.map((id) => ({
    module: moduleMap.get(id)!,
    reason: reasons.get(id) || 'Módulo selecionado de acordo com o perfil e necessidades.',
  }));
}

export function generateDiagnosticSummary(input: DiagnosticInput): DiagnosticResult {
  const profile = resolveProfile(input.industryId);
  const recommendations = computeDiagnosticRecommendations(input);

  const maturityLabels: Record<string, string> = {
    nenhuma: 'Nenhuma (ainda não utilizam ferramentas de IA)',
    basica: 'Básica (utilização esporádica e individual de ChatGPT ou similar)',
    regular: 'Regular (utilização frequente mas sem métodos estruturados)',
    avancada: 'Avançada (processos automatizados e ferramentas integradas)',
  };

  const selectedObjectiveLabels = input.objectives
    .map((k) => OBJECTIVES_MAP[k]?.label || k)
    .join('\n  - ');

  const modulesList = recommendations
    .map((rec) => `• Módulo ${rec.module.number} — ${rec.module.title}\n  Entrega: ${rec.module.deliverable}\n  Motivo: ${rec.reason}`)
    .join('\n\n');

  const exercisesList = profile.aiUseCases
    .map((uc, i) => `${i + 1}. ${uc.task} -> ${uc.expectedResult}\n   Exercício: ${uc.exercise}\n   Validação: ${uc.validation}`)
    .join('\n\n');

  const challengeSection = input.challenge && input.challenge.trim().length > 0
    ? `\nDESAFIO OPERACIONAL INDICADO:\n"${input.challenge.trim()}"\n`
    : '';

  const summaryText = `=====================================================
MVIRGIL STUDIO — RESUMO DE DIAGNÓSTICO DE FORMAÇÃO EM IA
=====================================================
Nota: Resumo gerado localmente em memória para planeamento de proposta.
Nenhum dado pessoal foi enviado para servidores externos.

DADOS DA EMPRESA E EQUIPA:
- Setor: ${profile.industryLabel}
- Dimensão: ${input.companySize} colaboradores
- Departamento alvo: ${input.department}
- Maturidade em IA: ${maturityLabels[input.maturity] || input.maturity}

OBJETIVOS PRIORITÁRIOS:
  - ${selectedObjectiveLabels}
${challengeSection}
MÓDULOS DE FORMAÇÃO RECOMENDADOS (${recommendations.length} selecionados):
${modulesList}

CASOS PRÁTICOS E EXERCÍCIOS SETORIAIS PREVISTOS:
${exercisesList}

PRÓXIMO PASSO:
Para solicitar uma proposta detalhada com base neste resumo, envie este texto
ou entre em contacto com a equipa através de: miguel@mvirgil.com / mvirgil.studio
=====================================================`;

  return {
    input,
    industryLabel: profile.industryLabel,
    recommendedModules: recommendations,
    practicalExercises: profile.practicalExercises,
    summaryText,
    timestamp: Date.now(),
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  // Fallback for non-secure contexts or legacy browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch {
    return false;
  }
}
