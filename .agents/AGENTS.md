# Regras Locais do Agente (PumpsSaaS)

As regras listadas aqui são injetadas automaticamente no prompt de sistema de todos os assistentes de IA (Antigravity) que operam neste repositório. Siga-as rigorosamente.

## 1. Regra de Extração de Histórico de Conversas
Sempre que o usuário der por encerrada uma sessão de desenvolvimento, você DEVE extrair o histórico completo da conversa e salvá-lo na pasta `historico_conversas/`.
- Use a ferramenta `run_command` com Python para ler o seu próprio arquivo de log em `<appDataDir>\brain\<conversation-id>\.system_generated\logs\transcript_full.jsonl`.
- Converta o JSONL para um formato legível em Markdown (`.md`), mapeando o texto do usuário e as suas próprias respostas de maneira organizada.
- Salve o documento resultante em `historico_conversas/HISTORICO_COMPLETO_DD_MM_AAAA.md` (com a data atual).
- Adicione o arquivo extraído aos commits do repositório para preservação contínua.
