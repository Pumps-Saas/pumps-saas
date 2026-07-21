# 🛡️ Padronização, Organização e Instruções de Processos - PumpsSaaS

Este documento estabelece as diretrizes arquiteturais, normas de organização de pastas e arquivos, regras de higiene de código e instruções operacionais do **PumpsSaaS**. Ele serve como guia definitivo tanto para a equipe de engenharia quanto para assistentes de inteligência artificial (IA) que atuarem no repositório, garantindo consistência, escalabilidade e qualidade contínua.

---

## 1. Visão Geral e Governança (Quarteto Documental)

O **PumpsSaaS** é uma plataforma de engenharia de alta precisão que combina cálculos hidrodinâmicos avançados e catálogos inteligentes com uma interface web de última geração. 

A governança do projeto é suportada pelo **Quarteto Documental** na raiz do repositório:
1. [BOAS_PRATICAS.md](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/BOAS_PRATICAS.md): A carta fundamental com as **13 Diretrizes de Engenharia e Negócio** (papéis de Arquiteto vs Executador, proibição de duplicação, protocolo de teste local e guardião de regressão).
2. [DECISIONS.md](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/DECISIONS.md): O **Registro de Decisões Arquiteturais (ADR)** para justificativas de trade-offs técnicos e premissas de projeto.
3. [DIARIO_DE_BORDO.md](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/DIARIO_DE_BORDO.md): O **Diário Executivo do Projeto**, traduzindo todos os avanços técnicos em impacto real no valor e negócio da aplicação.
4. [PADRONIZACAO_E_PROCESSOS.md](file:///c:/Users/pedro/OneDrive/Documentos/Antigravity/Pumps/PADRONIZACAO_E_PROCESSOS.md) *(este documento)*: O **Manual Operacional e Estrutural** contendo as normas de pastas, validação pré-commit e scripts de execução local.

---

## 2. Padrões de Estrutura e Organização de Código

O repositório é segmentado em domínios de responsabilidade estritamente isolados:

```
Pumps/
├── backend/                  # API REST FastAPI e motor de cálculo hidrodinâmico
│   ├── app/                  # Código-fonte principal da API
│   │   ├── api/v1/           # Endpoints versionados (pumps, projects, calculate, etc.)
│   │   ├── core/             # Configurações globais, segurança, DB e e-mail
│   │   ├── models.py         # Modelos de dados SQLModel e Pydantic
│   │   └── services/         # Lógica de negócios (solvers hidráulicos e otimização)
│   ├── scripts/              # Utilitários de banco, seeds e scripts de manutenção permanente
│   ├── tests/                # Testes automatizados de backend (pytest)
│   └── backups/              # Snapshots e checkpoints históricos do banco de dados (SQLite)
│
├── frontend/                 # Interface Web em React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/                  # Código-fonte da aplicação web
│   │   ├── components/       # Componentes visuais genéricos e de layout
│   │   ├── features/         # Módulos funcionais (calculator, admin, projects, auth)
│   │   └── types/            # Definições globais de tipagem TypeScript
│   └── dist/                 # Artefatos de compilação estática de produção (ignorado pelo Git)
│
├── reference/                # Documentação técnica, catálogos originais e normas de referência
└── PADRONIZACAO_E_PROCESSOS.md # Este manual de padronização e processos
```

### 2.1. Regra de Ouro: Organização da Raiz (`/`)
A raiz do repositório deve conter **apenas** diretórios estruturais e arquivos de configuração globais essenciais do ecossistema:
* **Permitidos na Raiz:** `frontend/`, `backend/`, `reference/`, `package.json`, `package-lock.json`, `render.yaml`, `start_app.bat`, `HISTORICO_DO_REDESIGN.md`, `PADRONIZACAO_E_PROCESSOS.md` e `.gitignore`.
* **Estritamente Proibido na Raiz:** Scripts temporários (`debug_*.py`, `tmp_*.py`), imagens de teste de tela (`*.png`), arquivos de saída ou logs (`*.txt`, `*.log`) ou bancos de dados temporários.

### 2.2. Onde Salvar Scripts, Testes e Utilitários?
* **Scripts de Validação Rápida / Depuração da IA:** Se um script for criado temporariamente para verificar uma hipótese ou testar um endpoint local durante uma sessão de desenvolvimento, ele deve ser **excluído imediatamente após o uso**. Não deve ser commitado no Git nem deixado na raiz.
* **Scripts de Manutenção/Deploy:** Devem ser salvos dentro de `backend/scripts/` (para o backend) ou em uma pasta `scripts/` correspondente, devidamente tipados e documentados.
* **Testes de Regressão / Validação:** Testes de ponta a ponta ou testes unitários permanentes devem ser colocados em `backend/tests/` (ou `frontend/tests/`).

---

## 3. Padrões de Arquitetura e UI/UX

### 3.1. Padrões do Frontend (`/frontend`)
* **Linguagem e Tipagem:** **TypeScript estrito**. É proibido o uso de `any` em novos componentes. As interfaces de payloads e respostas de API devem estar centralizadas em `src/types/` ou nos arquivos de serviço da feature.
* **Sistema de Estilos e UI/UX:**
  * Uso de **Tailwind CSS puro** (sem bibliotecas de componentes externas pesadas como Material-UI ou Bootstrap).
  * Manutenção do padrão visual premium com gradientes suaves, glassmorphism sutil, dark mode nativo e micro-animações interativas.
  * **Layout Split-Screen:** O painel de cálculos e resultados (`SystemDashboard.tsx`) utiliza um *Cockpit Sticky* (`sticky top-6`) na coluna da direita que mantém os KPIs visíveis durante toda a navegação, combinando com abas inferiores dinâmicas (*Curva do Sistema*, *Perdas* e *Memorial de Cálculo*).
  * **Renderização 3D:** Representações esquemáticas do sistema hidráulico utilizam renderização vetorial em **SVG Isométrico 3D** (`SystemSchematic.tsx`), sem dependências pesadas de Three.js ou WebGL salvo aprovação expressa.
* **Relatório em PDF (`pdfGenerator.ts`):** A geração do relatório em PDF deve respeitar o limite de **5 páginas estruturadas** e incorporar todos os avisos legais e selos de conformidade técnica do software.
* **Configuração do Vite:** O arquivo oficial de configuração do Vite é **apenas o `vite.config.ts`**. É proibido gerar ou manter arquivos `.js` ou `.d.ts` duplicados na raiz do frontend.

### 3.2. Padrões do Backend (`/backend`)
* **Linguagem e Framework:** Python 3.11+, FastAPI e SQLModel (Pydantic + SQLAlchemy).
* **Isolamento de Lógica Hidrodinâmica:** 
  * Os cálculos de mecânica dos fluidos (Reynolds, Colebrook-White, Darcy-Weisbach, NPSH, etc.) devem ser encapsulados de forma pura e determinística dentro de `backend/app/services/fluid_dynamics.py` e `backend/app/services/pump_solver.py`.
  * As rotas da API (`routers/` ou `api/v1/`) não devem conter fórmulas matemáticas complexas embutidas; elas apenas validam a entrada, chamam o serviço hidrodinâmico e retornam os esquemas Pydantic formatados.

---

## 4. Política de Limpeza e Higiene do Repositório (Cleanup)

Para manter o repositório leve, limpo e profissional, aplicamos uma política contínua de eliminação de resíduo técnico de desenvolvimento ("lixo de depuração").

### 4.1. Checklist de Limpeza de Arquivos Temporários
Os seguintes tipos de arquivo não devem fazer parte do controle de versão oficial na branch `main`:
1. **Scripts de Depuração e Patches One-Off:** `debug_console.py`, `tmp_patch2.py`, `verify_frontend.py`, `open_browser.py`, etc.
2. **Logs de Execução:** `frontend_logs.txt`, `tsc_errors.log`, arquivos `inpi_hash_output.txt` (exceto quando arquivados como documentação oficial em `reference/`).
3. **Screenshots de Diagnóstico:** `debug_screenshot.png`, `frontend_verification.png`.
4. **Artefatos Intermediários de Compilação TS/Vite:** `vite.config.js`, `vite.config.d.ts`, `*.tsbuildinfo`.

> **Regra de Contenção de Resíduos:** A IA ou o desenvolvedor que gerar arquivos de teste durante a resolução de um bug tem a obrigação de limpá-los (`rm` / `git rm`) antes de finalizar a tarefa ou solicitar revisão.

### 4.2. Extração de Histórico de Sessões (Backup da IA)
Esta regra foi absorvida pela Diretriz 6 (Fechamento de Sessão de Melhorias), que automatiza completamente este processo.

---

## 5. Instruções Operacionais e Melhoria de Processos

Para garantir velocidade no desenvolvimento local sem comprometer a estabilidade do deploy contínuo nas plataformas em nuvem (**Vercel** e **Render**), adote o fluxo de trabalho abaixo:

### 5.1. Execução Rápida (Ambiente Local)
Para iniciar os servidores Backend e Frontend em modo de desenvolvimento simultâneo:
```cmd
start_app.bat
```
*(Inicia a API FastAPI com hot-reload em `http://localhost:8000` e o Vite em `http://localhost:5173`).*

Para depuração detalhada em terminais separados:
* **Terminal 1 (Backend):**
  ```bash
  cd backend
  ..\.venv\Scripts\activate
  uvicorn main:app --reload --port 8000
  ```
* **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```

### 5.2. Validação Obrigatória Pré-Commit (Processo de Qualidade)
Nunca execute um `git commit` ou `git push` sem antes rodar a verificação de compilação estática no frontend. Isso evita que commits quebrados por erro de tipagem TypeScript cheguem à Vercel:

```bash
cd frontend
npm run build
```
*Se `npm run build` concluir sem erros (código de saída 0), a interface está validada e pronta para commit.*

### 5.3. Fluxo de Publicação e CI/CD
1. **Verificação de Status:** Verifique se não há arquivos temporários untracked/modificados indevidamente:
   ```bash
   git status
   ```
2. **Commit Semântico:**
   ```bash
   git add .
   git commit -m "feat(calculator): descrição clara do recurso ou correção aplicada"
   ```
3. **Publicação na Nuvem:**
   ```bash
   git push origin main
   ```
   *O push aciona automaticamente o pipeline de build estático na Vercel para o Frontend e o build do contêiner Docker/Python no Render para o Backend.*

### 5.4. Como Trabalhar com a IA para Melhorar Nossos Processos
* Sempre que solicitar à IA uma nova funcionalidade ou refatoração, instrua ou confirme que ela siga o manual `PADRONIZACAO_E_PROCESSOS.md`.
* Se a IA criar arquivos de teste para inspecionar o DOM ou verificar comportamentos locais via Playwright, exija que ela exclua esses arquivos temporários ao terminar.
* Ao introduzir um novo módulo ou serviço, garanta que a documentação técnica ou variáveis de ambiente sejam atualizadas nos respectivos arquivos `reference/` e `.env.example`.


## 6. Fechamento de Sessão de Melhorias (Encerramento de Turno)
Ao final do dia, quando você solicitar o encerramento da sessão de trabalho ou disser "vamos finalizar por hoje", a Inteligência Artificial foi programada via Customizações Globais (`AGENTS.md`) para realizar automaticamente um backup de atividades. As seguintes ações acontecerão em cadeia, sem necessidade de lembretes manuais:
1. **Registro no `DIARIO_DE_BORDO.md`**: O agente redigirá as anotações do dia com o foco no impacto e nas entregas alcançadas (UX, UI, Banco de Dados, Backend).
2. **Registro de Decisões no `DECISIONS.md`**: O agente listará os prós e contras e *trade-offs* de cada arquitetura nova implantada (ex. novos middlewares, remoções de dependências pesadas, lógicas físicas customizadas).
3. **Backup de Conversas**: O robô extrairá todo o histórico de transcrições do sistema para a pasta de backup (ex: `historico_conversas/HISTORICO_COMPLETO_DD_MM_AAAA.md`).
4. **Submissão Automática para Git**: Todas as novas atualizações de relatórios e documentações serão adicionadas (`git add .`), enviadas a um commit e "pusheadas" diretamente para a nuvem.

*Você pode conferir essa regra a qualquer momento analisando o arquivo `.agents/AGENTS.md`.*
