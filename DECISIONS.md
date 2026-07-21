# Registro de Decisões Arquiteturais (ADR) — Pumps SaaS

Este documento mantém o histórico de decisões técnicas, premissas de negócio e escolhas de engenharia do projeto **Pumps SaaS**. Para cada decisão relevante, registre os trade-offs aceitos e as justificativas.

---

## 2026-07-20 — Layout Absoluto para Componentes Flutuantes em Relatórios PDF
Decisão: No módulo de exportação (`printMode`), todas as caixas de KPI e legendas sobrepostas aos gráficos (OP e NPSH) devem ser implementadas usando posicionamento absoluto rígido (ex: `absolute`, `top: -15px`, `left: 50%`), abandonando injeções Flexbox entre o Título e a Área de Plotagem.
Motivo: Ao injetar blocos HTML baseados em Flex (que ocupam volume estrutural real) em containers desenhados para ter altura fixa (para encaixar no tamanho de uma página A4 PDF), o container transborda (overflow). Isso causava o estrangulamento da altura livre da biblioteca `recharts`, resultando na "decepagem" (corte vertical) dos rótulos do eixo X e das legendas inferiores.
Trade-off aceito: Exige o uso preciso e pontual de "números mágicos" de CSS (`top: -15px`) que demandam manutenção visual se a hierarquia de fontes mudar, em troca de preservar 100% da integridade da escala, geometria e leitura dos dados hidráulicos no PDF.

---

## 2026-07-20 — Identidade de Bomba Incorporada aos Snapshots de Cenários
Decisão: O Backend e o schema do banco de dados (modelos `OperatingPointRead` e correlatos) foram alterados para trafegar e persistir as propriedades de leitura `pump_manufacturer` e `pump_model` gravadas dentro do snapshot estático (`operating_point`).
Motivo: Evitar o "congelamento" ou poluição visual de informações de bomba entre abas. Quando um cenário (`scenario`) era carregado, a UI recuperava a física hidráulica corretamente, mas ignorava a qual bomba aquela física pertencia. A bomba selecionada anteriormente ficava presa na tela e no PDF, destruindo a confiabilidade do documento exportado.
Trade-off aceito: Quebra sutil de normalização de banco de dados (já que os dados descritivos da bomba poderiam ser recuperados via Join com a tabela de bombas, mas a decisão de persistir no snapshot blinda o cenário caso a bomba matriz seja deletada no futuro).

---

## 2026-07-19 — Controle Dinâmico do Domínio Recharts (Fix de Pontos Flutuantes)
Decisão: Eixos X (Vazão) nas telas de HeadFlowChart e NPSHChart mudaram de configuração de domínio dependente (`domain={['dataMin', 'dataMax']}`) para domínio com fim autônomo (`domain={[0, 'auto']}`), associados a funções customizadas de exibição de labels `tickFormatter={(val) => Math.round(val)}`.
Trade-off: A renderização gráfica pode descolar a malha alguns pixels da última coordenada interpolada de dados (quando o valor de dados não for exato, ex: 273.5999), mas previne as quebras de passo da UI mantendo um eixo harmonizado, íntegro (0, 70, 140, 210, 280) e com zero confusão cognitiva para o usuário sem exigir normalização destrutiva na base de dados do Backend.

---

## 2026-07-19 — Renderização Dinâmica em Ziguezague de Trechos P&ID e viewBox estendido
Decisão: No componente genérico de renderização SVG `SystemSchematic.tsx`, alterou-se a proporção do diagrama para 900x650 (quase quadrado) limitando o `minHeight`, e implantou-se uma lógica par-ímpar para desenhar caixas de badges para cima e para baixo.
Motivo: Atender uma exigência imperativa de UX e engenharia. Redes de tubulação do mundo real muitas vezes agrupam 2 ou mais componentes curtos em série (ex: válvula de retenção + registro de gaveta em um gap de meio metro), o que destruía a leitura gráfica do fluxo com sobreposições brutais se as badges estivessem no mesmo eixo Y.
Trade-off aceito: Adição de uma quebra visual e de conectores SVG auxiliares para relacionar a caixa em ziguezague ao trecho flutuante. A escalabilidade do diagrama passa a ser infinita para trechos retos de fluidos incompressíveis sem quebrar a leitura.

---

## 2026-07-12 — Parâmetro de Dias de Operação no Ano (`days_per_year`) configurável no cálculo de LCC
Decisão: Adoção de um campo explícito `days_per_year` (padrão 365) no painel de configuração de energia e custos do Frontend e no payload do Backend (`OperatingPointRequest`).
Motivo: Eliminar a premissa rígida de 365 dias por ano no cálculo do custo de energia (`cost_per_year`), permitindo modelar com precisão regimes industriais sazonais e intermitentes (ex: usinas de cana-de-açúcar que operam em torno de 220 dias na safra).
Trade-off aceito: Adição de mais um campo numérico na interface de entrada, justificado pelo ganho substancial em precisão na projeção financeira de Life Cycle Cost (LCC) para o cliente final.

---

## 2026-07-20 — Prevenção de Deadlock via Circuit Breaker em Motor Hidráulico
Decisão: Inserção de uma barreira de iteração (limite de 50 ciclos) nos loops `while` de busca de raízes para cálculo de perdas em paralelo (`calculate_parallel_loss` em `optimization.py`).
Motivo: Tubulações hipotéticas ou acidentais sem perda (comprimento nulo e diâmetro válido) faziam a resistência tender a zero e o extrapolador duplicar a estimativa de vazão infinitamente ($Q_{high} \times 2$), travando o Worker único na infraestrutura (Render).
Trade-off aceito: Em sistemas cujas perdas por atrito cheguem à casa dos centésimos de milímetro e exijam cálculos absurdamente longos, o sistema abortará e reverterá o cálculo na 50ª iteração, o que não reflete tubulações do mundo real, mas protege a nuvem.

---

## 2026-07-20 — Conversão de html2canvas para html2canvas-pro e rgba()
Decisão: Migração da engine de relatórios PDF `html2canvas` para a variação comunitária modernizada `html2canvas-pro`. Todos os tokens CSS `color-mix()` foram também reescritos para suas equivalências clássicas `rgba()` (injetando `rgb(...)` via variáveis nas classes utilitárias globais).
Motivo: A biblioteca anterior apresentava erro de sintaxe (*Attempting to parse an unsupported color function "color"*) ao lidar com cores do TailwindCSS v3.4 ou renderizações avançadas de navegadores Safari (P3/sRGB).
Trade-off aceito: Aumento sutil no volume de variáveis no `:root` e maior complexidade de temas. Maior flexibilidade e fim absoluto das quebras de download do memorial.

---

## 2026-07-19 — Otimização Extrema (Auto-Select AI)
Decisão: O algoritmo de recomendação de bombas foi reescrito para gerar um polinômio da Curva do Sistema *uma única vez* e utilizar interseção matemática direta ($O(1)$) com os coeficientes das bombas, ao invés de buscar a raiz utilizando a biblioteca `scipy` em um loop.
Motivo: Degradação massiva de performance (loop aninhado de raízes) que resultava em travamento da interface. O tempo de recomendação caiu de ~30s para *< 10ms*.

## 2026-07-19 — Estrutura de DTO para listagem de bombas
Decisão: Implementação de Data Transfer Objects (DTO) rigorosos como `PumpReadBasic` vs `PumpRead` para endpoints de listagem.
Motivo: A serialização de colunas JSON pesadas (`curve_points`) no modelo antigo (`PumpRead`) travava a Event Loop do FastAPI (I/O Bound) ao carregar mais de 100 bombas na interface. Listas agora carregam apenas metadados (`PumpReadBasic`), enquanto o detalhe pesado é retornado via *Lazy Loading* com chamadas específicas por ID (`GET /pumps/{id}`).

---

## 2026-07-11 — NPSHa via pressão de sucção manual (sem campo separado de elevação)
Decisão: usuário informa pressão de sucção (barg) já incluindo efeito de elevação/coluna de líquido, em vez de campos separados de cota geométrica + pressão de tanque.
Motivo: simplicidade de entrada; o cálculo de coluna líquida é feito manualmente pelo engenheiro usuário, prática comum em projetos de processo.
Trade-off aceito: risco de erro se o fluido mudar (densidade diferente) e o usuário esquecer de recalcular a pressão equivalente. Sem validação cruzada automática.

---

## 2026-07-11 — Adoção de Boas Práticas Estritas e Remoção de Lógica Duplicada
Decisão: Adoção do manual de [BOAS_PRATICAS.md](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/BOAS_PRATICAS.md) contendo as 10 diretrizes de engenharia auditadas.
Motivo: Eliminar duplicação de lógica hidrodinâmica, código morto (`pump_solver.py` / `fluid_dynamics.py`) e garantir rastreabilidade completa dos endpoints via `api.py`.
Trade-off aceito: Maior rigor na verificação de pull requests e obrigatoriedade de revisão de física em linguagem natural antes de aprovar commits no motor de cálculo.
