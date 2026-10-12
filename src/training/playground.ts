export interface PlaygroundScenario {
  id: string;
  name: string;
  input: string;
  output: string;
  badge: string;
  gate: string;
}

export const PLAYGROUND_SCENARIOS: Record<string, PlaygroundScenario> = {
  proposta: {
    id: 'proposta',
    name: 'Proposta Comercial Rápida',
    input: `[INSTRUÇÃO DO ASSISTENTE]
Atua como Gestor Comercial Sénior. Transforma o email de pedido informal do cliente numa proposta comercial estruturada no tom profissional da empresa.

[DADOS DE ENTRADA]
Cliente: Construções & Obras do Tejo, Lda.
Pedido: "Precisamos de equipar 12 postos de trabalho com estações de trabalho e configuração de rede até ao fim do mês. Enviem cotação urgente."

[DIRETRIZES DE SAÍDA]
1. Identificação formal e agradecimento
2. Âmbito detalhado do fornecimento
3. Cronograma (implementação em 8 dias úteis)
4. Condições financeiras (50% adjudicação / 50% entrega)
5. Validade da proposta (15 dias)`,
    output: `PROPOSTA COMERCIAL · REF: PROP-2026-084
Exmos. Senhores Construções & Obras do Tejo, Lda.

Agradecemos o vosso contacto e a oportunidade de apresentar a presente proposta para capacitação e equipamento dos vossos postos de trabalho:

1. ÂMBITO DO FORNECIMENTO
• 12x Estações de trabalho profissionais configuradas com software corporativo
• Configuração de rede local (LAN/Wi-Fi) de alta velocidade com firewall
• Testes de conectividade, backup em nuvem e documentação técnica de entrega

2. CRONOGRAMA & PRAZO DE ENTREGA
• Início imediato após adjudicação formal
• Prazo de instalação e entrega operacional: 8 dias úteis

3. CONDIÇÕES COMERCIAIS
• Valor Total: [A preencher conforme tabela de preços vigente]
• Condições de Pagamento: 50% na adjudicação / 50% na conclusão dos testes
• Validade da Proposta: 15 dias de calendário`,
    badge: 'Tempo: 210ms · 420 tokens · LLM Multimodal',
    gate: 'Validação obrigatória de preços e margens operacionais pelo Gestor Comercial antes do envio ao cliente.',
  },
  fatura: {
    id: 'fatura',
    name: 'Extração de Faturas PDF',
    input: `[INSTRUÇÃO DE EXTRAÇÃO FISCAL]
Analisa o documento PDF da fatura do fornecedor e extrai os metadados fiscais em formato JSON estrito para importação direta no software de contabilidade (ERP).

[REGRAS DE CONFORMIDADE]
• Validar dígito de controlo do NIF
• Segregar linhas de fatura com respetiva taxa de IVA (6%, 13%, 23%)
• Devolver valores numéricos com duas casas decimais`,
    output: `{
  "documento": "Fatura-Recibo",
  "numero": "FT 2026/1042",
  "data_emissao": "2026-09-18",
  "data_vencimento": "2026-10-18",
  "fornecedor": {
    "nome": "Sistemas Industriais do Norte, SA",
    "nif": "509123456",
    "pais": "PT"
  },
  "itens": [
    { "descricao": "Serviço de Manutenção Preventiva", "qtd": 1, "preco_unit": 450.00, "iva_taxa": 23.0 },
    { "descricao": "Peças de Substituição Eixo B", "qtd": 4, "preco_unit": 65.50, "iva_taxa": 23.0 }
  ],
  "totais": {
    "incidencia_23": 712.00,
    "valor_iva": 163.76,
    "total_liquido": 875.76
  }
}`,
    badge: 'Tempo: 180ms · JSON Estrito Validado',
    gate: 'Conferência automática com a base de dados da Autoridade Tributária (AT) e validação manual de discrepâncias superiores a 0,01€.',
  },
  memoria: {
    id: 'memoria',
    name: 'Memória Técnica & Caderno',
    input: `[INSTRUÇÃO DE AUDITORIA TÉCNICA]
Atua como Engenheiro Revisor de Concursos. Lê o caderno de encargos da empreitada e extrai uma matriz de riscos contratuais:
1. Prazos de garantia e penalidades por atraso
2. Exigências de certificação e segurança no trabalho
3. Riscos de ambiguidade que requeiram pedidos de esclarecimento à comissão`,
    output: `MATRIZ DE AUDITORIA CONTRATUAL · CADERNO DE ENCARGOS
----------------------------------------------------------------------------------
CLÁUSULA                EXIGÊNCIA CONTRATUAL                NÍVEL DE RISCO
----------------------------------------------------------------------------------
Cláusula 14.ª (Garantia)  5 anos para impermeabilizações       [MÉDIO] Exige fichas
                         e revestimentos exteriores.          técnicas de fabricante.

Cláusula 22.ª (Penalidades) 500,00 € por cada dia útil        [ELEVADO] Risco de
                          de atraso imputável ao empreiteiro. desvio em tempo chuvoso.

Cláusula 31.ª (Segurança) Técnico de Segurança nível VI      [BAIXO] Recurso interno
                          em permanência em obra.             já disponível no mapa.

PEDIDO DE ESCLARECIMENTO RECOMENDADO:
• Notificar júri sobre ambiguidade no artigo 8.º referente ao destino final dos inertes de demolição.`,
    badge: 'Tempo: 340ms · 610 tokens · Análise Heurística',
    gate: 'Aprovação técnica obrigatória pelo Diretor de Obra e parecer jurídico antes da submissão da proposta de concurso.',
  },
  atendimento: {
    id: 'atendimento',
    name: 'Atendimento & Desescalada',
    input: `[INSTRUÇÃO DE COMUNICAÇÃO CORPORATIVA]
Atua como Coordenador de Experiência do Cliente. Responde a uma reclamação recebida referente ao atraso de entrega da encomenda #8941.

[REGRAS DE TOM]
• Tom sereno, empático e resolutivo (desescalada ativa de tensão)
• Nunca transferir culpas para a transportadora
• Apresentar solução imediata com código de rastreio prioritário
• Disponibilizar contacto telefónico direto para acompanhamento`,
    output: `Assunto: Atualização prioritária sobre a sua encomenda #8941

Estimado(a) Sr.(a) [Nome do Cliente],

Compreendemos perfeitamente a sua preocupação relativamente ao prazo de entrega da sua encomenda #8941 e lamentamos sinceramente o impacto deste atraso na sua rotina.

Para resolver a situação com a máxima brevidade, acionámos esta manhã um envio expresso dedicado. A sua encomenda encontra-se agora em trânsito prioritário e a previsão de entrega é amanhã, dia 14, no período da manhã.

Pode acompanhar o percurso da expedição em tempo real através deste link direto: [Código de Rastreio Expresso].

Estou pessoalmente a acompanhar a entrega. Caso tenha alguma questão adicional, estou ao seu inteiro dispor através da minha linha direta: +351 210 000 000.

Com os nossos melhores cumprimentos,
[Nome do Responsável]
Equipa de Apoio e Relação com o Cliente`,
    badge: 'Tempo: 160ms · 320 tokens · Voz da Marca Garantida',
    gate: 'Revisão humana prévia para garantir que os dados de rastreio e nome do cliente correspondem ao registo real.',
  },
};

export function initPlayground(container: HTMLElement): void {
  const tabs = container.querySelectorAll<HTMLButtonElement>('[data-scenario]');
  const inputEl = container.querySelector<HTMLElement>('[data-playground-input]');
  const outputEl = container.querySelector<HTMLElement>('[data-playground-output]');
  const badgeEl = container.querySelector<HTMLElement>('[data-playground-badge]');
  const gateEl = container.querySelector<HTMLElement>('[data-playground-gate]');
  const runBtn = container.querySelector<HTMLButtonElement>('[data-playground-run]');
  const statusEl = container.querySelector<HTMLElement>('[data-playground-status]');

  if (!inputEl || !outputEl || !runBtn) return;
  const input = inputEl;
  const output = outputEl;
  const run = runBtn;

  let currentScenarioKey = 'proposta';
  let isTyping = false;

  function loadScenario(key: string, autoRun = false): void {
    const scenario = PLAYGROUND_SCENARIOS[key];
    if (!scenario) return;

    currentScenarioKey = key;

    tabs.forEach((tab) => {
      const isSelected = tab.getAttribute('data-scenario') === key;
      tab.classList.toggle('playground-tab--active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
    });

    input.textContent = scenario.input;
    if (gateEl) gateEl.textContent = scenario.gate;
    if (badgeEl) badgeEl.textContent = scenario.badge;

    if (autoRun) {
      triggerExecution(scenario);
    } else {
      output.textContent = scenario.output;
      if (statusEl) statusEl.textContent = 'Resultado gerado com sucesso';
    }
  }

  function triggerExecution(scenario: PlaygroundScenario): void {
    if (isTyping) return;
    isTyping = true;
    run.disabled = true;
    run.classList.add('btn-playground-run--loading');
    if (statusEl) statusEl.textContent = 'A processar tokens e diretrizes...';

    output.textContent = '';
    const fullText = scenario.output;
    let charIndex = 0;

    const interval = setInterval(() => {
      charIndex += 4;
      if (charIndex >= fullText.length) {
        output.textContent = fullText;
        clearInterval(interval);
        isTyping = false;
        run.disabled = false;
        run.classList.remove('btn-playground-run--loading');
        if (statusEl) statusEl.textContent = 'Execução concluída · Supervisão humana ativa';
      } else {
        output.textContent = fullText.slice(0, charIndex) + ' ▍';
      }
    }, 15);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const scenarioKey = tab.getAttribute('data-scenario');
      if (scenarioKey && scenarioKey !== currentScenarioKey) {
        loadScenario(scenarioKey, true);
      }
    });
  });

  run.addEventListener('click', () => {
    const scenario = PLAYGROUND_SCENARIOS[currentScenarioKey];
    if (scenario) triggerExecution(scenario);
  });

  // Initial load
  loadScenario('proposta', false);
}
