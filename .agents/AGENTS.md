# Regras Locais do Agente (PumpsSaaS)

As regras listadas aqui são injetadas automaticamente no prompt de sistema de todos os assistentes de IA (Antigravity) que operam neste repositório. Siga-as rigorosamente.

## 1. Procedimento Padrão de Fim de Sessão
Sempre que o usuário usar comandos como "vamos finalizar por hoje", "encerrar as melhorias" ou der por encerrada uma sessão, você DEVE executar as 3 etapas abaixo de forma proativa, sem precisar de aprovação:

1. **Atualizar o DIARIO_DE_BORDO.md**: Resuma detalhadamente as melhorias e correções feitas no dia, focando no impacto no negócio, nas regras de engenharia e na arquitetura.
2. **Atualizar o DECISIONS.md**: Registre qualquer decisão de design, trade-offs e escolhas de arquitetura significativas feitas durante a sessão.
3. **Extrair Histórico de Conversas**:
   - Use a ferramenta `run_command` com Python para ler o seu próprio arquivo de log em `<appDataDir>\brain\<conversation-id>\.system_generated\logs\transcript_full.jsonl`.
   - Converta o JSONL para um formato legível em Markdown (`.md`), mapeando o texto do usuário e as suas próprias respostas de maneira organizada.
   - Salve o documento resultante na pasta `historico_conversas/HISTORICO_COMPLETO_DD_MM_AAAA.md` (com a data atual).

Após executar os passos acima, faça o commit com as mensagens adequadas e dê um git push.
