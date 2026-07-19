# 📋 Diário de Bordo Executivo — Pumps SaaS

> Este diário registra a evolução contínua do **Pumps SaaS**, traduzindo entregas técnicas e decisões de arquitetura em **impacto direto de negócio** (confiabilidade, experiência do usuário, escalabilidade e conversão).
> **Papéis do Projeto:** Arquiteto de Software (Usuário) | Executador & Operador de Deploy (Antigravity IA).

---

## 19/07/2026 — Otimização de UI/UX e Alinhamento Preciso do Diagrama do Sistema

### 🎯 O que foi realizado
- **Desacoplamento do Scroll Sticky**: A coluna da direita do Painel do Sistema (Diagrama + Live Metrics) perdeu o travamento `sticky top-20` no layout Grid, resolvendo o problema crônico de "espaço vazio" no topo e permitindo que o bloco se alinhe nativamente à caixa adjacente de Condições do Sistema.
- **Aspect Ratio Tático (900x650)**: O `viewBox` do SVG `SystemSchematic.tsx` foi altamente estendido na vertical e "espremido" nas laterais para empurrar o container inteiro para baixo. Isso garante o alinhamento total do bloco à base do cartão de "Propriedades do Fluido" de maneira simétrica (conforme layout exigido pelo arquiteto).
- **Ziguezague Alternado em Trechos em Série**: Inserimos uma condicional lógica par/ímpar (`cy = idx % 2 === 0 ? 435 : 585`) que desenha as caixas informativas e os dados dos tubos alternadamente **acima** e **abaixo** do eixo do fluxo hidráulico. Conexões tracejadas amarram o rótulo ao respectivo trecho.
- **Escala Textual Agressiva**: Removendo as "margens mortas" do viewBox e dobrando o raio da bomba e as espessuras dos tubos, as caixas de informações saltaram de 90px para 144px de largura, proporcionando fontes muito mais encorpadas.
- **⚠️ MOTOR DE FÍSICA NO DIAGRAMA (CRÍTICO)**: Reescrevemos a inteligência do componente `SystemSchematic.tsx` para abandonar a estimativa cega de divisão de vazão em ramais ($Q_{total} / n$). O frontend agora aplica **engenharia reversa** ($Q = v \times A \times 3600$) lendo a velocidade de fluxo exata resolvida iterativamente pelo **motor de cálculo do backend**. Ramais em paralelo (com perdas e diâmetros distintos) agora renderizam o balanço autêntico de vazão de fluidos na UI.

### 💼 Impacto no Negócio
- **Polimento Perceptível (SaaS Premium)**: Ao forçar o alinhamento das linhas horizontais no grid e abolir sobreposição de textos em tubulações difíceis por meio do "ziguezague", evita-se uma barreira de quebra de confiança visual. O produto sustenta o visual robusto de um software enterprise de alto valor.
- **Acessibilidade Tática (Chão de Fábrica)**: Num ambiente industrial com tablets, o engenheiro bate o olho e enxerga com precisão os valores-chave de Velocidade e Queda de Pressão sem esforço visual.
- **⚠️ Precisão Matemática Irrefutável (Diferencial de Venda)**: A exibição imediata do fluxo hidráulico assimetricamente balanceado eleva o Pumps SaaS do nível de uma "calculadora web" para um **simulador hidrodinâmico real**. Quando o cliente observa o fluido escolhendo logicamente a rede de menor resistência de forma autônoma na tela, a ferramenta passa total autoridade técnica, ajudando a justificar o fechamento de licenças premium para projetistas.

---

## 12/07/2026 (Parte 4) — Checkpoint `v2`: P&ID Autoexplicativo com Diâmetros Nominais Padronizados & Desnível Estático Puro (`ΔZ`)

### 🎯 O que foi realizado
- **Tradução Nativa de Diâmetros (`SystemSchematic.tsx`)**: O diagrama 2D foi integrado diretamente à tabela padronizada de diâmetros do banco de referência (`useReferenceStore.getState().diameters`) via função `getNominalLabel`. Em vez de exibir milímetros puros na legenda (ex: `DN102`), os cards e legendas de redução exibem exatamente as polegadas ou diâmetro nominal escolhido pelo engenheiro no formulário (ex: `DN 4" · 10m` ou `R3: DN 2"` ou `Redução DN 6"→DN 4"`).
- **Eliminação da Divisão Fictícia de Altura Estática (`hs` / `hd`)**: Remoção da divisão arbitrária de 20%/80% (`hs` / `hd`) que estimava valores não informados pelo usuário na sucção e recalque. O diagrama agora desenha uma única cota clara no recalque exibindo exatamente o **Desnível Estático (`ΔZ`)** inserido no campo de entrada (`static_head`).
- **Desenho Físico de Cones de Redução e Bifurcações**: A renderização SVG segmenta trechos em série exibindo cones na cor âmbar na transição de diâmetro e desenha o coletor e ramais paralelos verticais independentes.
- **Registro do Checkpoint `v2`**: Salvo no Git (branch `v2-nocturne-redesign`, tag `v2`) e copiado em `backups/v2-nocturne-redesign/` para garantir segurança e ponto de partida exato para a próxima rodada de evoluções.

### 💼 Impacto no Negócio
- **Consistência Cognitiva Absoluta**: As legendas no diagrama P&ID agora são idênticas às opções dos menus suspensos de entrada de dados, eliminando qualquer dúvida interpretativa durante dimensionamentos rápidos.
- **Fidelidade Hidráulica Sem Suposições**: A remoção de `hs` / `hd` artificiais reforça a confiabilidade da plataforma como ferramenta técnica precisa, exibindo estritamente os parâmetros que o engenheiro definiu no modelo.

---

## 12/07/2026 (Parte 3) — Checkpoint `v1`: Refinamento Ergonômico de Interface (Nocturne) & Diagrama Dinâmico 2D

### 🎯 O que foi realizado
- **Cards de KPIs no Topo (`ResultsDisplay.tsx`)**: Atualizados para exibir `AMT (mca)`, `NPSH Disp. (m)`, `Vazão (m³/h)` e `Potência (kW)`, enquanto as velocidades de sucção e recalque passam a ser lidas de forma nativa e contextual no próprio diagrama da rede.
- **Diagrama 2D Hidrodinâmico Integral (`SystemSchematic.tsx`)**: O diagrama agora reflete dinamicamente **todos os trechos e ramais** cadastrados pelo engenheiro: trechos de sucção, recalque antes da junção, badge interativo de bifurcação (`X Ramais em Paralelo`) na subida vertical e recalque final após junção.
- **Saneamento e Foco Ergonômico na Aba `Novo Cálculo`**: Remoção de inputs redundantes (*Curva Hidráulica* e *Operação & Energia*) da tela principal de cálculo. A configuração da Bomba permanece na aba `Bombas` (`pumps`) e toda a parametrização de OPEX/Energia (`days_per_year`, `hours_per_day`, `efficiency_motor`, tarifa) foi centralizada na aba `Finanças` (`EconomicDashboard.tsx`).
- **Registro do Checkpoint `v1`**: Salvo no Git (`commit 203b69c`, branch `v1-nocturne-redesign`, tag `v1`) e copiado em `backups/v1-nocturne-redesign/` para garantia total de reversibilidade e comparação de histórico.

### 💼 Impacto no Negócio
- **Clareza Operacional & Redução de Carga Cognitiva**: O engenheiro cliente agora tem uma tela de cálculo limpa, exclusiva para a modelagem física da tubulação, evitando erros de digitação cruzada ou informações espalhadas.
- **Rastreabilidade Visual Absoluta**: A visualização de ramais em paralelo e trechos segmentados no diagrama 2D transmite confiança e precisão no diagnóstico de velocidades em cada trecho da rede.

---

## 12/07/2026 (Parte 2) — Flexibilização do Regime de Safra no Motor de Cálculo LCC (`days_per_year`)

### 🎯 O que foi realizado
- Adição do campo **Days/Year** no painel *Energy & Cost Configuration* ([SystemDashboard.tsx](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/frontend/src/features/calculator/SystemDashboard.tsx)), permitindo que o usuário informe exatamente os dias de operação anual da bomba (padrão 365, com suporte perfeito a usinas e operações sazonais por volta de 220 dias).
- Substituição da constante `365` hardcoded no motor financeiro do Backend ([calculate.py](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/backend/app/api/v1/calculate.py)) e no painel de LCC do Frontend ([EconomicDashboard.tsx](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/frontend/src/features/calculator/EconomicDashboard.tsx)) pela variável dinâmica `days_per_year`.
- Criação e aprovação de teste automatizado `test_days_per_year_cost_calculation` validando a fórmula `cost_per_year = power_kw * hours_per_day * days_per_year * energy_cost_per_kwh`.

### 💼 Impacto no Negócio
- **Projeção Financeira Realista (LCC):** Para usinas e indústrias com regime intermitente (safra/entresafra), o custo anual estimado de energia elétrica agora reflete a realidade da planta em vez de superestimar custos em 65%, aumentando a precisão das análises de viabilidade e justificativas de compra de novas bombas na plataforma.

---

## 12/07/2026 — Institucionalização de Governança Estrita, Papéis e Segurança Funcional

### 🎯 O que foi discutido e decidido
- Formalização dos papéis no projeto: O Usuário atua como **Arquiteto de Software** (definindo visão de produto e direção arquitetural), enquanto a IA assume toda a **Execução Técnica e Operação de CI/CD** (Git, Render, Vercel).
- Estabelecimento do protocolo de **Testes Locais para Mudanças Drásticas**: garantia de que inovações profundas não impactem a rede de usuários finais sem antes passarem por um ciclo fechado de teste local no ambiente do Arquiteto.
- Criação do **Guardião de Regressão (Diretriz #13)**: a IA é instruída a atuar como um filtro ativo, paralisando e questionando imediatamente caso uma nova ordem entre em contradição com regras ou melhorias de negócio já estabelecidas.

### 💼 Impacto no Negócio
- **Blindagem Operacional:** Protege o produto SaaS em produção contra regressões funcionais, evitando que funcionalidades maduras sejam acidentalmente reescritas ou quebradas em atualizações futuras.
- **Agilidade com Governança:** O Arquiteto ganha velocidade de experimentação local com risco zero para a base de clientes ativos.

---

## 11/07/2026 — Saneamento Estrutural, Auditoria e Trindade de Padrões (13 Mandamentos)

### 🎯 O que foi realizado
- Adoção oficial das **13 Diretrizes de Boas Práticas (`BOAS_PRATICAS.md`)** e criação do **Registro de Decisões (`DECISIONS.md`)**.
- Auditoria e remoção de motores de cálculo duplicados/ociosos (`pump_solver.py` e `fluid_dynamics.py`), mantendo uma única fonte da verdade matemática (`optimization.py` e `fluid_mechanics.py`).
- Correção de todas as pendências de tipagem TypeScript no Frontend (dados de LCC Analysis: `pump_cost`, `installation_cost`, `maintenance_rate`), resultando em build 100% limpo em 10 segundos.
- Atualização estrita de segurança no `.gitignore` contra vazamento de arquivos de banco de dados ou scripts temporários.

### 💼 Impacto no Negócio
- **Confiabilidade de Cálculos de Engenharia:** Elimina o risco de o sistema responder com fórmulas divergentes para o mesmo problema hidrodinâmico, garantindo que o engenheiro cliente tenha confiança absoluta no resultado entregue pela plataforma.
- **Eficiência de Manutenção e Deploy:** Com um build rápido e sem alertas de compilação, o tempo para colocar novas funcionalidades no ar via Vercel e Render é drasticamente reduzido.
