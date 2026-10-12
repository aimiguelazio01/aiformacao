# MVIRGIL STUDIO — Plano de implementação
**Formação de IA para Empresas · V1**

## 1. Existing Project Findings

Base inspecionada: [depth_webpage](E:/_desktop_2026/VibeCoding/depth_webpage). Destino confirmado: [formacao_webpage](E:/_desktop_2026/VibeCoding/formacao_webpage), atualmente vazio.

| Sistema | Estado verificado |
|---|---|
| Aplicação | Vite 7 + TypeScript estrito; DOM nativo. Sem React, router ou biblioteca de estado. |
| Página | Um hero em HTML. As âncoras de serviços, apresentação e contacto são conteúdo provisório. |
| Visual | Fundo `#080d18`, ciano `#69d8ef`, tipografia Inter/Avenir/Segoe UI, títulos centrais, contornos finos. |
| 3D | Three.js 0.180; geometria procedural, cinco grupos, grelha, linhas, partículas e etiquetas CSS2D. |
| Câmara | PerspectiveCamera, FOV 45°, deslocamento com suavização e zona morta. |
| Movimento | Pointer parallax e oscilação em profundidade; pausa quando o separador fica oculto. Sem sistema de animação por scroll. |
| Mobile | Ajusta posição horizontal dos objetos; ainda não reduz efetivamente a complexidade. |
| Acessibilidade | Foco visível e reduced motion existentes. Falha inicial de WebGL aplica fallback, mas volta a lançar o erro. |
| Extras | Head tracking opcional com MediaPipe em worker. |
| Validação | Vitest; testes existentes de parallax e pose. Scripts de typecheck, testes e build. |

A composição existente foi observada no browser. O plano conserva essa identidade e acrescenta conteúdo abaixo do hero.

## 2. Relevant Visual References

Pesquisa limitada a referências secundárias:

| Referência | Ideia aproveitável |
|---|---|
| [Cristina Gatti — AI Landing Page](https://dribbble.com/shots/26504877-AI-Landing-Page-Modern-Futuristic-Minimal-Dark-UI) | Separar claramente mensagem, CTA e geometria; manter espaço negativo. Referência visual inspecionada. |
| [Ashar Waseem — AI Agent Landing Page](https://dribbble.com/shots/27026785-AI-Agent-Landing-Page-UI-Dark-Mode-SaaS-Website) | Hierarquia por cartões e percurso até à ação, conforme descrição da referência. |

Aplicação: melhorar composição e leitura. Paleta, materiais e profundidade vêm do MVIRGIL.

## 3. Reuse / Extend / Create

| Sistema | Ação | Decisão |
|---|---|---|
| Tipografia, cores, botões, contornos | **REUSE** | Usar os estilos existentes. |
| Navegação | **EXTEND** | Acrescentar Formação IA; ligar início e nova página. |
| Parallax e configuração de câmara | **REUSE** | Preservar matemática e suavização. |
| Cena Three.js | **EXTEND** | Configuração opcional para formação; comportamento original por defeito. |
| Fallback e ciclo de renderização | **EXTEND** | Isolar falhas; suspender renderização fora do hero. |
| Perfis e resolução | **CREATE** | Dados independentes da apresentação. |
| Seletor, exemplos, módulos e diagnóstico | **CREATE** | Componentes DOM reutilizáveis. |
| Estado e analytics | **CREATE** | TypeScript e eventos nativos; sem plataforma externa. |

## 4. Proposed Architecture

Copiar o código-fonte, configuração, lockfile e testes para o destino. Excluir dependências instaladas, builds e histórico Git.

Manter a página inicial. Acrescentar uma segunda entrada Vite para a formação, servida em `/formacao-ia`. Sem novo framework.

```text
URL + seleção
      ↓
Repositório de perfis
      ↓
resolveProfile()
      ↓
activeProfile ──→ componentes DOM
      └────────→ configuração da cena existente

Respostas do diagnóstico → regras locais → resumo de necessidades
```

Um controlador TypeScript mantém setor, exemplo selecionado, respostas e resumo. Atualiza apenas regiões dependentes; não reconstrói o formulário.

**Convergência ADHD:** três perspetivas exploradas em paralelo — logística, manutenção e olhar infantil. Seleções aprofundadas:

| Escolha | N / V / F¹ | Aplicação |
|---|---|---|
| ★ Exemplo completo: tarefa → IA → resultado verificável | 7 / 10 / 10 | Evita conteúdo abstrato e combinações incoerentes. |
| Módulo associado a uma entrega e motivo | 7 / 9 / 10 | Explica o valor da formação. |
| Invalidar resumo quando mudam as respostas | 5 / 10 / 10 | Evita recomendações desatualizadas. |

¹ Novidade / viabilidade / adequação; avaliação de projeto.

Descartado para V1: ordenar tarefas por arrasto, expor proveniência técnica na interface e criar configurações 3D exclusivas por empresa.

## 5. CompanyProfile Data Model

Dados locais em TypeScript, com tipos exportados e referências por ID.

| Grupo | Campos |
|---|---|
| Identidade | `id`, `companyName?`, `industry`, `subIndustry?`, `companyType?`, `companySize?` |
| Mensagem | `headline`, `description`, `introduction`, `finalCtaText` |
| Contexto | `departments`, `roles`, `commonTasks`, `painPoints`, `opportunities` |
| Aplicação | `aiUseCases`, `practicalExercises`, `possibleAutomations`, `possibleAISolutions` |
| Formação | `recommendedModuleIds` |
| Apresentação | `visualTheme: { variant, objects }`, `seo: { title, description }` |

Cada caso de uso é um registo completo:

```ts
type UseCase = {
  id: string;
  task: string;
  aiApplication: string;
  expectedResult: string;
  exercise: string;
  validation: string;
  moduleIds: string[];
};
```

Exemplo: **dados de imóvel → estruturar descrição e adaptar comunicação → anúncio e email sujeitos a revisão humana**.

Catálogo único de módulos: ID, título, descrição e entrega prática. Incluir os 13 temas pedidos, de Fundamentos a Utilização Responsável.

Perfis iniciais: `arquitetura`, `imobiliario`, `construcao`, `industria`, `hotelaria`, `restauracao`, `retalho`, `marketing`, `industrias-criativas`, `educacao`, `servicos-profissionais`, `pme`, `outro`.

PME é o perfil genérico. Cada setor terá três casos de uso concretos. Novo setor exige apenas dados; opções do seletor são geradas pelo catálogo.

## 6. Profile Resolution Strategy

Única função pura:

`default → industry → company → department → activeProfile`

- Camadas superiores substituem apenas propriedades presentes.
- Objetos `seo` e `visualTheme` combinam propriedades.
- Arrays são substituídos integralmente; não concatenados.
- Casos de uso são indivisíveis: nunca misturar tarefa de um setor com resultado de outro.
- Campos obrigatórios ausentes ou inválidos recuperam valores da camada anterior.
- IDs de módulos e variantes visuais são validados contra os catálogos.
- Dados externos entram por um adaptador de carregamento/validação. Componentes recebem apenas o perfil resolvido; texto é inserido como texto, nunca HTML arbitrário.

V1 disponibiliza dados globais e setoriais. Overrides de empresa/departamento ficam suportados pelo resolvedor e cobertos por testes, sem interface adicional.

## 7. Dynamic Content Map

| Secção | Tipo | Conteúdo alterado |
|---|---|---|
| Navegação e rodapé | Estático | Apenas ligações entre páginas. |
| Hero | Profile-aware | Título, apoio e contexto setorial. |
| “A sua empresa é diferente…” | Profile-aware | Exemplos de departamentos, funções e tarefas. |
| Processo | Estático | Quatro etapas; interação abre a explicação. |
| Explorer | Dinâmico | Tarefas, dificuldades e oportunidades. |
| Tarefa → IA → Resultado | Dinâmico | Caso, exercício e validação. |
| Módulos | Dinâmico | Recomendações e ordenação; catálogo partilhado. |
| Formatos | Estático | Workshop, equipa, empresa, IA + implementação. |
| Implementação | Profile-aware | Automações e soluções possíveis. |
| Formador | Estático | Miguel Virgílio e experiência indicada no briefing. |
| Diagnóstico | Profile-aware | Setor sincronizado; restantes respostas preservadas. |
| CTA final | Profile-aware | Contexto do setor. |
| Cena | Profile-aware | Etiquetas, objetos destacados e pequenos ajustes. |

## 8. Component Architecture

Componentes como funções de montagem/atualização DOM. Sem árvore React.

- **AITrainingPage:** coordena estado, URL e atualizações.
- **HeroContent + Hero3D:** mensagem e adaptação da cena.
- **IndustrySelector + UseCaseExplorer:** seleção e conteúdo do setor.
- **PracticalWorkVisualizer:** seletor de três exemplos e três cartões ligados.
- **TrainingModules:** catálogo partilhado com recomendações.
- **AIDiagnostic:** formulário, validação e resumo local.

Introdução, processo, formatos, implementação, formador e CTA são secções semânticas. Só recebem funções próprias quando precisam de atualização ou interação.

Ordem da página: hero → personalização → processo → explorer → exemplos → módulos → formatos → implementação → formador → diagnóstico → CTA final.

## 9. 3D Integration Strategy

Estender `createHeroScene` com configuração opcional e método de atualização do perfil. Chamadas existentes conservam a cena original.

- Reutilizar câmara, luzes, grelha, materiais, geometrias e CSS2D.
- Reaproveitar esfera/rede como núcleo IA; volumes, planos e nós representam trabalho empresarial.
- Sete conceitos disponíveis: documentos, comunicação, dados, imagens, automação, pesquisa e conhecimento.
- Mostrar até quatro módulos à volta do núcleo no desktop; os sete conceitos continuam acessíveis em texto.
- Variações por dados: arquitetura destaca volumes; indústria, nós de processo; imobiliário, volumes/documentos; hotelaria, comunicação; marketing, planos de conteúdo.
- Trocar configuração sem recriar renderer, cena ou ciclo de animação.
- Não carregar MediaPipe na página de formação. A página inicial mantém o head tracking.
- Falha de inicialização ou perda de contexto: parar o loop, ocultar canvas/etiquetas e manter conteúdo/CTAs.

Não acrescentar parallax por scroll na V1: não existe uma infraestrutura atual a reutilizar.

## 10. URL Personalization

- Sem `sector`: PME genérico.
- Valor reconhecido: carregar perfil correspondente.
- Valor inválido: PME; não mostrar erro ao visitante.
- Seleção explícita: `history.pushState`, sem reload.
- Seleção repetida: não criar entrada de histórico.
- `popstate`: resolver novamente perfil e sincronizar seletor, formulário e cena.
- Preservar parâmetros de campanha e fragmento.
- Ao mudar de setor, remover `company` e futuro `department`, evitando contexto incompatível.
- `company` ainda sem registo configurado: ignorar com segurança, sem pesquisa ou rede.

A build terá entrada própria de formação. O servidor deverá mapear `/formacao-ia` para essa entrada; testar também acesso direto e refresh em produção.

## 11. Diagnostic Architecture

Formulário único com três grupos visuais, sem wizard:

| Grupo | Campos |
|---|---|
| Empresa | Setor; dimensão: 1–10, 11–50, 51–250, 250+. |
| Equipa | Departamento; maturidade: nenhuma, básica, regular, avançada. |
| Necessidades | Objetivos múltiplos; principal desafio opcional, até 2.000 caracteres. |

Departamentos e objetivos seguem as opções do briefing, traduzidas para PT-PT. Dimensão, departamento, maturidade e pelo menos um objetivo são obrigatórios.

**Estado:** apenas memória durante a visita. Sem armazenamento persistente ou transmissão.

**Regras locais:**

- Utilização Responsável sempre incluída.
- Maturidade nenhuma/básica acrescenta Fundamentos e Prompting.
- Objetivos acrescentam módulos por mapa explícito: documentação → Documentos; comunicação/atendimento → Comunicação; automação → Automação; pesquisa → Pesquisa; conteúdo → Conteúdo; criatividade → Imagem; dados → Documentos e Análise; produtividade → Prompting.
- Departamento e perfil acrescentam prioridades; eliminar duplicados e mostrar até seis módulos, com ordem estável.
- Dimensão e desafio aparecem no resumo, sem inventar preços, duração ou análise automática do texto.

CTA: **“Criar proposta de formação”**, com explicação imediata: **“Prepare um resumo para uma proposta personalizada. Nada é enviado.”**

Resultado: **Resumo de necessidades**, com respostas, módulos, motivos e exercícios do setor. Botão copiar; se a área de transferência falhar, disponibilizar texto selecionável.

Qualquer mudança relevante invalida o resumo. O setor do formulário e o explorer partilham estado; outras respostas mantêm-se.

“Pedir diagnóstico” e “Falar sobre formação” levam ao formulário. Não simular envio nem contacto concluído.

## 12. File-Level Change Plan

Todos os caminhos seguintes pertencem ao destino; os existentes serão copiados da base.

| Caminho | Ação / propósito |
|---|---|
| [index.html](E:/_desktop_2026/VibeCoding/formacao_webpage/index.html) | **MODIFY:** preservar início e acrescentar ligação Formação IA. |
| [vite.config.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/vite.config.ts) | **MODIFY:** build com duas entradas. |
| [formacao-ia/index.html](E:/_desktop_2026/VibeCoding/formacao_webpage/formacao-ia/index.html) | **CREATE:** estrutura semântica, conteúdo genérico e metadata. |
| [src/styles.css](E:/_desktop_2026/VibeCoding/formacao_webpage/src/styles.css) | **REUSE:** identidade existente. |
| [src/training/styles.css](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/styles.css) | **CREATE:** estilos limitados à página de formação. |
| [src/input/parallax.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/input/parallax.ts) | **REUSE:** comportamento testado. |
| [src/scene/createHeroScene.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/scene/createHeroScene.ts) | **EXTEND:** opções, perfil e qualidade. |
| [src/training/scene.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/scene.ts) | **CREATE:** ciclo de vida, visibilidade, movimento e fallback. |
| [src/training/types.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/types.ts) | **CREATE:** contratos de perfil, módulos e diagnóstico. |
| [src/training/data.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/data.ts) | **CREATE:** defaults, setores, módulos e configurações visuais. |
| [src/training/profiles.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/profiles.ts) | **CREATE:** carregamento, validação e resolução. |
| [src/training/page.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/page.ts) | **CREATE:** entrada, estado, URL e atualização dos componentes. |
| [src/training/components.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/components.ts) | **CREATE:** seletores, exemplos, módulos e processo. |
| [src/training/diagnostic.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/diagnostic.ts) | **CREATE:** respostas, regras, resumo e cópia. |
| [src/training/analytics.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/src/training/analytics.ts) | **CREATE:** emissão centralizada de eventos. |
| [tests/training.test.ts](E:/_desktop_2026/VibeCoding/formacao_webpage/tests/training.test.ts) | **CREATE:** resolução, perfis, URL e recomendações. |

Dependências: reutilizar Vite, TypeScript, Three.js e Vitest. **Nenhuma dependência nova prevista.**

## 13. Implementation Phases

| Fase | Objetivo e sistemas | Depende de | Critério de saída |
|---|---|---|---|
| 1. Base | Copiar fontes/configuração; registar referência visual e build atual. | — | Página inicial reproduzida no destino. |
| 2. Dados | Tipos, catálogos, 13 setores e resolvedor. | 1 | Perfis completos; precedência testada. |
| 3. Página | Segunda entrada, navegação, secções e conteúdo genérico. | 1 | Página legível sem 3D e com âncoras válidas. |
| 4. Personalização | Estado, seletor, URL e histórico. | 2–3 | Seleção e back/forward sincronizados. |
| 5. Exemplos | Fluxo prático, exercícios, módulos e implementação. | 4 | Conteúdo coerente nos 13 setores. |
| 6. Cena | Configuração partilhada, variações e fallback. | 3–4 | Mudança de setor não recria a cena. |
| 7. Diagnóstico | Formulário, regras, resumo e eventos. | 2, 4–5 | Validação e resumo copiável funcionam. |
| 8. Mobile/A11y | Layout, teclado, foco e reduced motion. | 5–7 | Fluxo completo a 320 px e por teclado. |
| 9. Desempenho | Lazy loading, qualidade e suspensão do loop. | 6, 8 | Orçamentos medidos e respeitados. |
| 10. Validação | Testes, build e revisão visual comparativa. | Todas | Matriz abaixo concluída sem bloqueios. |

## 14. Mobile + Accessibility

- **Desktop:** seletor em chips com semântica de radio; três cartões do fluxo em linha.
- **Mobile ≤640 px:** seletor nativo compacto, cartões em coluna, formulário numa coluna, CTAs com área de toque mínima de 44 px.
- **Tablet:** grelhas de duas colunas quando houver espaço; nenhuma informação depende de hover.
- Cena mobile: núcleo + dois módulos; retirar fragmentos decorativos e partículas próximas; reduzir partículas distantes para 60 e pixel ratio para 1.
- Pointer parallax desativado em toque; oscilação mobile reduzida a metade.
- Reduced motion: câmara centrada, sem oscilação, transições ou scroll suave; renderizar só quando necessário.
- Atualização setorial preserva foco e anuncia uma frase curta em `aria-live`.
- Labels, fieldsets, mensagens associadas aos campos e foco no primeiro erro.
- Informação essencial fora do canvas; etiquetas 3D decorativas não duplicam a leitura assistiva.
- Sem JavaScript: conteúdo genérico permanece legível e aviso explica a indisponibilidade do diagnóstico interativo.

## 15. Performance Strategy

Medições do build existente, sem o reconstruir:

| Recurso | Baseline |
|---|---:|
| JavaScript principal | 513 KB bruto / 131,5 KB gzip |
| Worker MediaPipe | 144,6 KB bruto / 44 KB gzip |
| CSS | 6,5 KB bruto / 2,3 KB gzip |
| Partículas | 180 distantes + 30 próximas |
| Grupos principais | 5 |

Orçamentos propostos, a validar na implementação:

- Código da formação antes do 3D: **≤40 KB gzip**.
- Total JS carregado pela formação, incluindo Three.js: **≤170 KB gzip**.
- Sem novas texturas, GLB, shaders complexos ou fontes remotas.
- Desktop: máximo de cinco grupos principais e 210 partículas; pixel ratio ≤1,5.
- Importação dinâmica do 3D após montar a interface.
- Suspender animação com hero fora do viewport, separador oculto ou contexto perdido.
- Meta desktop: aproximadamente 60 fps; mobile: pelo menos 30 fps no dispositivo de teste documentado.
- Se a mediana dos intervalos de frame exceder 40 ms durante três segundos visíveis, reduzir uma vez para qualidade mobile; persistindo, usar cena estática.

## 16. SEO + Analytics

**SEO**

- HTML genérico significativo, `lang="pt-PT"`, título, descrição e Open Graph.
- Atualizar metadata no cliente por setor.
- Canonical único para a página genérica; parâmetros não entram no sitemap.
- Partilhas sociais usam metadata genérica na V1: não prometer que crawlers executam personalização JavaScript.
- Domínio final vem da configuração de publicação; não inventar URLs absolutas.
- Renderização por empresa/setor no servidor fica para uma fase justificada por SEO ou partilhas.

**Eventos**, através de `CustomEvent` e adaptador futuro:

| Evento | Momento |
|---|---|
| `industry_selected` | Mudança explícita de setor. |
| `department_selected` | Escolha no diagnóstico. |
| `diagnostic_started` | Primeira interação com o formulário. |
| `diagnostic_completed` | Submissão válida e resumo criado. |
| `cta_clicked` | CTA identificado por localização. |
| `proposal_requested` | Ação válida de criar resumo, marcada `mode: local_summary`. |

Enviar apenas IDs e opções enumeradas. Excluir desafio livre e outros dados pessoais. Sem serviço de analytics.

## 17. Testing Matrix

| Área | Casos | Resultado esperado |
|---|---|---|
| Perfis | Genérico + todos os 13 setores | Campos essenciais presentes; módulos válidos. |
| Revisão editorial | Arquitetura, imobiliário, indústria e hotelaria | Exemplos específicos, naturais em PT-PT. |
| Resolução | Camadas parciais, campos ausentes e overrides | Precedência correta; defaults preservados. |
| URL | Direta, inválida, ausente, refresh, seleção, back/forward | Perfil e controlos sincronizados, sem reload na seleção. |
| Layout | 1440, 1024, 768, 390 e 320 px | Sem overflow nem CTAs obstruídos. |
| Diagnóstico | Vazio, válido, objetivos múltiplos, edição e cópia falhada | Erros claros; regras estáveis; resumo antigo invalidado. |
| Acessibilidade | Teclado, foco, leitor de ecrã e reduced motion | Percurso completo sem rato ou animação. |
| 3D | Inicialização falhada, perda de contexto, scroll, separador oculto | UI funcional; loop suspenso quando necessário. |
| Carga | JS lento, 3D lento/falhado, JS desativado | Conteúdo genérico disponível; estado honesto. |
| Regressão | Página inicial e controlos existentes | Identidade e funcionalidades preservadas. |

Executar typecheck, Vitest e build. Rever consola, ligações internas, metadata e comparação visual. Não foram executados testes da nova página nesta fase: ainda não existe implementação.

## 18. Risks + Mitigation

| Risco | Impacto | Mitigação |
|---|---|---|
| Novo conteúdo divergir visualmente | Parecer outro site | CSS partilhado e comparação com a referência original. |
| Overrides incoerentes | Exemplos contraditórios | Resolver centralmente; substituir casos completos. |
| Alteração partilhada quebrar o início | Regressão | Configuração opcional com defaults originais. |
| 3D competir com formulário | Lentidão | Lazy loading, suspensão fora do hero e qualidade adaptativa. |
| “Criar proposta” sugerir envio | Expectativa errada | Explicação explícita de resumo local; nunca mostrar “enviado”. |
| Metadata dinâmica não chegar a bots | Partilhas genéricas | Assumir OG genérico na V1. |
| Host não servir URL direta | Erro ao abrir campanhas | Verificar mapeamento da segunda entrada antes de publicar. |
| Futuros dados gerados serem fracos | Personalização pouco credível | Validação estrutural e revisão editorial antes da ativação. |

## 19. V1 Scope

Inclui: página inicial preservada; formação integrada; 13 perfis; URL e histórico; exemplos, exercícios e módulos dinâmicos; variações leves de 3D; diagnóstico e resumo local; mobile, acessibilidade, metadata e eventos.

Departamento influencia recomendações no diagnóstico. Personalização global por departamento fica para depois.

Exclui: contas, LMS, pagamentos, CRM, CMS, base de dados, scraping, API de IA, pesquisa autónoma, proposta comercial automática e envio de mensagens.

## 20. Future Automation Path

`Website da empresa → serviço de pesquisa → dados estruturados → perfil validado e revisto → repositório de perfis → resolvedor existente → mesma página`

O futuro adaptador resolve `company`, fornece overrides e reutiliza componentes, módulos e cena. Nenhum HTML gerado pela IA entra diretamente na interface.

Perfis empresariais públicos devem conter apenas informação adequada a uma landing page pública; dados internos exigem uma solução de acesso própria, fora desta V1.

## 21. Acceptance Criteria

Concluído quando:

- Arquitetura, hotelaria, indústria e imobiliário apresentam mensagens, tarefas, exercícios e recomendações diferentes através da mesma UI.
- Adicionar um setor exige apenas dados.
- Um override empresarial de teste altera conteúdo sem alterar componentes.
- URLs diretas e histórico funcionam na build servida.
- A cena mantém a identidade original e não condiciona o uso da página.
- Diagnóstico gera resumo coerente, copiável e claramente local.
- Página inicial continua funcional.
- Matriz de testes passa; nenhuma ligação nova fica sem destino.
- Não existem erros de consola no percurso normal nem exceções não tratadas nos fallbacks.
- Revisão visual, PT-PT, acessibilidade e medições de desempenho ficam registadas.

**Decisões confirmadas:** copiar e estender no destino; resumo local; “caveman” significa comunicação concisa. Este plano não altera código nem instala dependências.
