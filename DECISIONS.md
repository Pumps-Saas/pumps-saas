# Registro de Decisões Arquiteturais (ADR) — Pumps SaaS

Este documento mantém o histórico de decisões técnicas, premissas de negócio e escolhas de engenharia do projeto **Pumps SaaS**. Para cada decisão relevante, registre os trade-offs aceitos e as justificativas.

---

## 2026-07-12 — Parâmetro de Dias de Operação no Ano (`days_per_year`) configurável no cálculo de LCC
Decisão: Adoção de um campo explícito `days_per_year` (padrão 365) no painel de configuração de energia e custos do Frontend e no payload do Backend (`OperatingPointRequest`).
Motivo: Eliminar a premissa rígida de 365 dias por ano no cálculo do custo de energia (`cost_per_year`), permitindo modelar com precisão regimes industriais sazonais e intermitentes (ex: usinas de cana-de-açúcar que operam em torno de 220 dias na safra).
Trade-off aceito: Adição de mais um campo numérico na interface de entrada, justificado pelo ganho substancial em precisão na projeção financeira de Life Cycle Cost (LCC) para o cliente final.

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
