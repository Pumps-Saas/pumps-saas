# Boas Práticas de Desenvolvimento — Pumps SaaS

> Este documento orienta decisões técnicas recorrentes no desenvolvimento do Pumps SaaS com apoio de IA (Antigravity). Nasceu de uma auditoria técnica que identificou código duplicado, código morto e premissas de negócio hardcoded. Objetivo: evitar recorrência.

---

## 1. Não duplicar lógica de física/cálculo

Antes de criar uma nova função ou arquivo para um cálculo de engenharia (perda de carga, NPSH, potência, etc.), verifique se já existe implementação equivalente em `backend/app/services/`.

- Se for melhorar um cálculo existente → **edite o arquivo atual**, não crie uma versão paralela.
- Se decidir substituir uma implementação por uma abordagem nova → **delete a antiga no mesmo commit** e atualize todos os pontos que a importavam.
- Caso real já identificado: `pump_solver.py`/`fluid_dynamics.py` (não usados) coexistindo com `optimization.py`/`fluid_mechanics.py` (usados em produção) — mesma física, dois arquivos.

## 2. Toda funcionalidade precisa estar rastreável a partir do roteador principal

`backend/app/api/api.py` é a fonte da verdade sobre quais endpoints estão ativos.

- Nenhum arquivo de serviço (`services/*.py`) deve existir "solto" sem ser importado por um endpoint registrado ali.
- Ao final de cada feature, pergunte: **"este código é alcançável a partir de uma requisição HTTP real?"**
- Para auditar isso no futuro (sem precisar programar): peça ao Antigravity para listar, a partir de `api.py`, toda a árvore de imports até os arquivos de serviço — e comparar com a lista de arquivos existentes na pasta `services/`. Qualquer arquivo fora da árvore é candidato a código morto.

## 3. Auditoria periódica de código morto

- A cada 3-5 features entregues, rode uma varredura de imports não utilizados (ferramenta `vulture` para Python é um bom candidato).
- Arquivos identificados como não utilizados devem ser removidos, não apenas ignorados.

## 4. Registro de decisões arquiteturais (ADR)

Mantenha um arquivo `DECISIONS.md` com entradas curtas: data, decisão tomada, alternativas consideradas, motivo, trade-offs aceitos.

Exemplo:
```
## 2026-07-11 — NPSHa via pressão de sucção manual (sem campo separado de elevação)
Decisão: usuário informa pressão de sucção (barg) já incluindo efeito de elevação/coluna
de líquido, em vez de campos separados de cota geométrica + pressão de tanque.
Motivo: simplicidade de entrada; o cálculo de coluna líquida é feito manualmente pelo
engenheiro usuário, prática comum em projetos de processo.
Trade-off aceito: risco de erro se o fluido mudar (densidade diferente) e o usuário
esquecer de recalcular a pressão equivalente. Sem validação cruzada automática.
```

Isso evita que, daqui a 6 meses, você (ou o Antigravity) esqueça por que uma escolha foi feita e tente "corrigir" algo que era intencional.

## 5. Não fixar premissas de negócio no código de cálculo

Tarifas de energia, dias de operação por ano, fatores de segurança devem ser **parâmetros configuráveis**, nunca valores fixos no meio da lógica.

- Exemplo já corrigido: `cost_per_year` usa `request.energy_cost_per_kwh` (correto).
- Exemplo já corrigido: Custo anual (`cost_per_year`) agora utiliza `request.days_per_year` configurável no frontend e backend, permitindo refletir regimes de safra ou operação intermitente (ex: ~220 dias/ano para usinas).

## 6. Extrapolação e validação de dados de entrada

- Todo resultado que dependa de extrapolação de curva (fora da faixa de dados fornecida) deve ser sinalizado explicitamente ao usuário, idealmente com o percentual de desvio.
- Diferencie o comportamento entre modos **assistidos por IA sem julgamento humano no loop** (ex: Auto-Select — deve ter limites rígidos, ex: rejeitar >25% de extrapolação) e modos **manuais com o engenheiro no controle** (pode extrapolar com aviso claro, mas nunca silenciosamente).

## 7. Nenhum arquivo de banco de dados, debug ou scratch versionado

- Confirme que `.gitignore` cobre `*.db`, `*.log`, `debug_*.py`, `tmp_*.py`, screenshots de debug.
- Se algum desses já foi commitado, remova do **histórico** do Git (não apenas do commit atual) — especialmente relevante em repositório público com produto pago (dados de teste podem ter vazado).

## 8. Testes de regressão com casos reais (golden dataset)

- Monte 5-10 casos de teste com dados reais de catálogo de fabricante (ITAP, KSB, Sulzer etc.) e resultado esperado conhecido (calculado à mão ou por outra ferramenta confiável).
- Rode esses casos sempre que o motor de cálculo for alterado, para garantir que uma mudança não quebrou silenciosamente outro cenário.

## 9. Revisão em linguagem natural antes de aceitar mudanças no motor de cálculo

Para qualquer alteração em `services/fluid_mechanics.py`, `services/optimization.py`, `api/v1/calculate.py`: peça ao Antigravity um resumo em português, em linguagem de engenharia (não código), do que mudou fisicamente/matematicamente — antes de aceitar o commit. Isso permite auditoria mesmo sem ler código linha a linha.

## 10. Nomenclatura sem ambiguidade entre schemas paralelos

Hoje existem `PipeSection`/`FluidProperties` (usado) e `PipeSegmentDefinition`/`Fluid` (não usado) representando conceitualmente a mesma coisa. Ao consolidar código morto (item 1), padronize também os nomes de schema para eliminar essa ambiguidade — reduz a chance de um novo desenvolvedor (humano ou IA) reintroduzir duplicação por não perceber que já existe um schema equivalente.

## 11. Diário de Bordo Executivo e de Impacto no Negócio (`DIARIO_DE_BORDO.md`)

Mantenha um registro contínuo e resumido de todas as conversas e avanços do projeto no arquivo `DIARIO_DE_BORDO.md`.
- **Linguagem Executiva:** O foco principal do diário não é listar detalhes de sintaxe ou código, mas sim traduzir cada avanço técnico para o seu **impacto real no negócio** (ex: ganho de confiabilidade para o engenheiro usuário, redução de erros de especificação, melhoria na conversão/retenção do SaaS).
- Deve ser atualizado ao final de cada marco de trabalho relevante.

## 12. Papéis Claros: Usuário como Arquiteto / IA como Executora e Operadora de Deploy

- **O Usuário é exclusivamente o Arquiteto de Software:** é quem dá a direção, toma as decisões de produto e valida as premissas de engenharia.
- **O Antigravity (IA) é o Executador Técnico e Operador de CI/CD:** responsável por implementar o código com rigor, realizar build/validação e conduzir todo o processo operacional de subir atualizações no **GitHub**, bem como acionar e verificar os deploys na **Render** (Backend) e **Vercel** (Frontend).
- **Protocolo de Teste Local em Mudanças Drásticas:** Quando alterações profundas ou arriscadas forem solicitadas, o Arquiteto sinalizará com *"Vamos fazer uns testes locais antes de subir a atualização para rede de usuários..."*. Nesse cenário, toda a execução e testes (via `npm run dev` / Uvicorn local) permanecerão estritamente no ambiente local. O push para produção só será efetuado após a validação e liberação explícita do Arquiteto.

## 13. Guardião de Regressão e Contradições Funcionais

- Se uma nova solicitação, refatoração ou funcionalidade proposta entrar em **contradição** com melhorias, regras de negócio ou modelos matemáticos já estabelecidos e aplicados anteriormente, o Antigravity tem a obrigação de **parar, questionar o Arquiteto e apontar o conflito antes de prosseguir com qualquer código**.

---

*Última atualização: 12/07/2026 — consolidado com as diretrizes executivas do Arquiteto do projeto.*
