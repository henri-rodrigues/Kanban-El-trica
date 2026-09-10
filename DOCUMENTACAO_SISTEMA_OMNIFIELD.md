# 📘 OmniField Pro - Documentação Detalhada da Proposta do Sistema e Módulos (Telas)

> **Sistema de Gestão Corporativa, Comissionamento HVAC & Engenharia Elétrica**
> **Versão:** 5.0 (PWA & Nuvem Híbrida)  
> **Tecnologias Core:** React, Vite, Lucide Icons, Recharts, Firebase Firestore, PWA (Service Worker), PDF.js parser.

---

## 📑 Sumário

1. [Visão Geral e Proposta de Valor](#1-visão-geral-e-proposta-de-valor)
2. [Arquitetura Tecnológica e Diferenciais](#2-arquitetura-tecnológica-e-diferenciais)
3. [Modelo de Segurança e Níveis de Acesso (RBAC)](#3-modelo-de-segurança-e-níveis-de-acesso-rbac)
4. [Mapeamento e Detalhamento Extremamente Detalhado das Telas](#4-mapeamento-e-detalhamento-extremamente-detalhado-das-telas)
   - [4.1. Tela de Autenticação, Cadastro e Login](#41-tela-de-autenticação-cadastro-e-login)
   - [4.2. Vitrine de Obras (Hub Principal)](#42-vitrine-de-obras-hub-principal)
   - [4.3. Kanban Principal de Obra & Post-its Específicos](#43-kanban-principal-de-obra--post-its-específicos)
   - [4.4. Modal de Detalhes do Post-it & Apontamento de Diárias/Horas](#44-modal-de-detalhes-do-post-it--apontamento-de-diáriashoras)
   - [4.5. Subníveis & Quadros Específicos por Equipamento](#45-subníveis--quadros-específicos-por-equipamento)
   - [4.6. Módulo de Checklist de Comissionamento HVAC & Elétrica](#46-módulo-de-checklist-de-comissionamento-hvac--elétrica)
   - [4.7. Módulo de Controle de Materiais & Parser Automático de PDF](#47-módulo-de-controle-de-materiais--parser-automático-de-pdf)
   - [4.8. Módulo de Agenda & Escala de Viagens (Geral & Pessoal)](#48-módulo-de-agenda--escala-de-viagens-geral--pessoal)
   - [4.9. Kanban de Infraestrutura Elétrica e Civil](#49-kanban-de-infraestrutura-elétrica-e-civil)
   - [4.10. Diário de Campo multimídia (Fotos, Vídeos e Áudios)](#410-diário-de-campo-multimídia-fotos-vídeos-e-áudios)
   - [4.11. Módulo de Relatórios Financeiros & BI Orçamentário](#411-módulo-de-relatórios-financeiros--bi-orçamentário)
   - [4.12. Modal de Gestão de Usuários e Aprovação de Acessos](#412-modal-de-gestão-de-usuários-e-aprovação-de-acessos)
   - [4.13. Modal de Sincronização em Nuvem (Firebase Cloud)](#413-modal-de-sincronização-em-nuvem-firebase-cloud)
   - [4.14. Central de Chat Corporativo por Obra](#414-central-de-chat-corporativo-por-obra)
   - [4.15. Modal e Banner de Instalação PWA (Mobile/Desktop)](#415-modal-e-banner-de-instalação-pwa-mobiledesktop)
5. [Fluxo de Dados e Ciclo de Vida da Obra](#5-fluxo-de-dados-e-ciclo-de-vida-da-obra)
6. [Resumo da Proposta Executiva](#6-resumo-da-proposta-executiva)

---

## 1. Visão Geral e Proposta de Valor

O **OmniField Pro** (anteriormente chamado de *Kanban Elétrica*) é uma solução de software corporativo de alta performance desenvolvida especificamente para resolver os desafios críticos na **gestão de obras de engenharia elétrica, automação predial, montagem de quadros e comissionamento HVAC** (Aquecimento, Ventilação e Ar Condicionado).

### 🎯 Proposta Central do Sistema

1. **Gestão Visual Intuitiva em Tempo Real**: Inspirado nas melhores práticas de ferramentas consolidadas como *Azure DevOps Boards* e *Miro*, o sistema substitui planilhas descentralizadas por quadros digitais altamente visuais, com notas adesivas (post-its com gradientes), drag-and-drop, subtarefas e indicadores visuais instantâneos.
2. **Controle Financeiro de Ponta a Ponta**: Acompanhamento rigoroso de 4 pilares orçamentários (*Mão de Obra*, *Materiais*, *Infraestrutura* e *Custos Indiretos*). O sistema calcula automaticamente o impacto de cada diária de técnico trabalhada e compara o gasto real acumulado em relação ao orçamento inicial e à margem de lucro projetada.
3. **Garantia de Qualidade & Comissionamento Normatizado**: Protocolos padronizados de teste no campo para sistemas HVAC (Testes TAB, Pressurização de Dutos, Chillers, Intertravamento), garantindo entrega sem pendências técnicas e emissão de laudos com fotos.
4. **Automação de Suprimentos com Inteligência de PDF**: Extração automática de dados de ordens de compra e relatórios em PDF (quantidade, fornecedor, itens e valores BRL) para controle automatizado de recebimento de materiais no canteiro de obras.
5. **Logística de Equipes e Escala de Viagens**: Módulo de mobilização de pessoal que calcula diárias devidas por viagem, meio de transporte (aéreo, terrestre), datas de permanência e agenda individual por técnico.
6. **Conectividade Total (Offline-First + Cloud Realtime)**: Funciona 100% offline em canteiros de obras sem conectividade à internet através do cache PWA e LocalStorage, sincronizando automaticamente com o Firebase Firestore assim que o sinal de rede é restabelecido.

---

## 2. Arquitetura Tecnológica e Diferenciais

| Camada | Tecnologias | Descrição / Papel no Sistema |
| :--- | :--- | :--- |
| **Interface (Frontend)** | React 18, Vite, Lucide Icons | Aplicação de página única (SPA) reativa com renderização ultrarrápida e iconografia padronizada. |
| **Estilização & UX** | CSS Moderno, Glassmorphism, Dark/Light Mode | Design System exclusivo com neomorfismo, transparências de vidro, gradientes vibrantes HSL e alternador de tema. |
| **Visualização de Dados** | Recharts | Dashboards interativos de BI com gráficos de pizza, barras e evolução temporal orçamentária. |
| **Parsing de PDF** | PDF.js (`pdfjs-dist`) | Leitura e conversão inteligente de documentos PDF de ordens de compra para estrutura JSON de materiais. |
| **Nuvem & Tempo Real** | Firebase Firestore API | Banco de dados NoSQL reativo em tempo real para sincronização entre múltiplos dispositivos e usuários simultâneos. |
| **PWA & Offline** | Service Worker customizado, LocalStorage | Suporte a instalação como aplicativo nativo no Android/iOS/Windows/Mac com atualização contínua e sem dependência de rede. |

---

## 3. Modelo de Segurança e Níveis de Acesso (RBAC)

O sistema possui um controle rigoroso de acessos baseado em papéis (**Role-Based Access Control**), dividindo os usuários em dois grandes perfis:

```
                          ┌──────────────────────────┐
                          │   Tela de Login / PWA    │
                          └────────────┬─────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │     ADMINISTRADOR     │             │  USUÁRIO OPERACIONAL  │
        │(Gerente/Eng. Chefe)   │             │  (Técnico/Campo)      │
        └───────────┬───────────┘             └───────────┬───────────┘
                    │                                     │
    ├─ Gestão de Obras (Criar/Editar/Excluir)             ├─ Visualizar Obras & Kanban
    ├─ Painel Financeiro & Margem R$                      ├─ Mudar Status de Post-its
    ├─ Leitura de PDF & Gestão Materiais                  ├─ Registrar Diárias e Horas
    ├─ Gestão de Usuários & Aprovações                    ├─ Preencher Checklists HVAC
    ├─ Alteração de Valores de Diárias (R$)               ├─ Postar Diário de Campo Multimídia
    └─ Configuração da Nuvem Firebase                     └─ Acessar Agenda Pessoal
```

1. **Administrador Geral (Gerente de Comissionamento / Gestor de Projetos)**:
   - Acesso irrestrito a **todos** os módulos e dados financeiros sensíveis.
   - Capacidade de criar, editar e excluir obras, tabelas financeiras e orçamentos.
   - Leitura e importação de PDFs de suprimentos e aprovação de fornecedores.
   - Gestão de usuários: aprovação de cadastros pendentes, alteração de senhas, alteração de cargos e definição dos valores das diárias técnicas ($R\$/dia$).
   - Acesso exclusivo aos dashboards de BI financeiros e margem de lucro executiva.
2. **Usuário Operacional (Técnico HVAC / Eletricista / Engenheiro de Campo)**:
   - Acesso focado na operação diária de campo.
   - Movimentação de post-its/cards nos quadros Kanban e inserção de apontamentos de horas.
   - Execução de testes e preenchimento de checklists de qualidade com fotos.
   - Envio de diários de campo multimídia (fotos, áudios e vídeos do canteiro).
   - Visualização da sua Agenda Pessoal de viagens e escalas.
   - Ocultamento automático de informações estratégicas/financeiras confidenciais.

---

## 4. Mapeamento e Detalhamento Extremamente Detalhado das Telas

### 4.1. Tela de Autenticação, Cadastro e Login (`LoginScreenView.jsx` / `LoginModal.jsx`)

* **Objetivo**: Garantir a entrada segura de usuários autorizados e prover um fluxo simples de solicitação de acesso para novos profissionais de campo.
* **Componentes e Recursos Visuais**:
  - Formulário moderno em painel de vidro (*glassmorphism*) com opções de alternar entre **Login** e **Solicitar Acesso**.
  - Seleção visual de foto/avatar com gradientes coloridos customizados.
  - Seleção rápida de usuários de teste (Atalho para "Administrador" e "Operador").
  - Botão alternador de tema Claro / Escuro.
* **Campos e Ações**:
  - *Identificação*: E-mail ou Nome de usuário.
  - *Senha*: Campo seguro de caracteres mascarados.
  - *Solicitação de Cadastro*: Nome completo, e-mail, senha desejada e escolha da tag de cor do perfil.
  - *Fluxo de Aprovação*: Quando um novo usuário se cadastra, ele entra automaticamente no estado `pending_approval` e é notificado de que deve aguardar a liberação do Administrador.

---

### 4.2. Vitrine de Obras - Hub Principal (`ObraHubView.jsx`)

* **Objetivo**: Funcionar como a central de controle inicial (Dashboard de Obras), onde o gestor ou técnico pode visualizar todas as obras sob sua responsabilidade.
* **Componentes e Recursos Visuais**:
  - Cards em formato de vitrine premium para cada obra cadastrada.
  - Barra de progresso visual percentual calculada dinamicamente com base nas tarefas e checklists concluídos.
  - Badges coloridos indicando o status da obra: `Em Andamento`, `Concluída`, `Atrasada` ou `Pendente`.
  - Estatísticas rápidas de cada obra: quantidade de post-its, checklists aprovados e valor do orçamento geral.
* **Funcionalidades e Ações**:
  - *Filtragem e Pesquisa*: Campo de busca instantânea por nome da obra ou cliente, e filtros por status.
  - *Criar Nova Obra (Admin)*: Botão para abrir o modal de cadastro de obra.
  - *Entrar na Obra*: Ao clicar em uma obra, a aplicação abre o menu lateral e direciona o usuário diretamente para o Kanban da obra escolhida.

---

### 4.3. Kanban Principal de Obra & Post-its Específicos (`KanbanBoard.jsx`)

* **Objetivo**: Prover a gestão visual de post-its e tarefas no estilo Miro / Azure DevOps em nível geral da obra.
* **Estrutura dos Quadros**:
  - Colunas padrão do processo: **A Fazer** ➔ **Em Progresso** ➔ **Impedimento / Bloqueado** ➔ **Concluído**.
  - Suporte a arrastar e soltar (Drag-and-Drop) ou botões de movimentação rápida.
* **Características Únicas dos Post-its**:
  - *Gradientes de Cores*: Escolha de temas visuais (Cyan, Emerald, Amber, Rose, Purple, Indigo).
  - *Níveis de Prioridade*: Baixa, Média, Alta e Crítica (com cores e ícones de alerta).
  - *Indicador de Subtarefas*: Barra de progresso interna mostrando subtarefas concluídas (ex: $3/5$).
  - *Marcação de Usuários (`@Menção`)*: Permite marcar técnicos responsáveis no post-it, gerando notificações instantâneas para o usuário mencionado.
  - *Atribuição de Mão de Obra*: Exibição das fotos/iniciais dos técnicos alocados no post-it.

---

### 4.4. Modal de Detalhes do Post-it & Apontamento de Diárias/Horas (`CardDetailModal.jsx`)

* **Objetivo**: Exibir e editar em profundidade todas as informações de um post-it específico, além de registrar as diárias e horas trabalhadas na tarefa.
* **Abas e Seções Internas**:
  1. *Informações Básicas*: Edição de Título, Descrição detalhada e Anotações Técnicas de Campo.
  2. *Customização Visual*: Alteração dinâmica da cor/gradiente do post-it e nível de prioridade.
  3. *Checklist de Subtarefas*: Adição de subitens com caixas de seleção (checkboxes) que atualizam o percentual de conclusão em tempo real.
  4. *Marcações (`@mentions`)*: Seletor de membros da equipe para notificar outros técnicos sobre atualizações na tarefa.
  5. *Apontamento de Horas & Mão de Obra (Work Log)*:
     - Form para lançamento de horas (ex: 8 horas).
     - Data do trabalho executado.
     - Seleção do operador/técnico que realizou o serviço.
     - Cálculo automático do custo da diária com base na taxa estipulada no perfil do usuário (ex: $R\$ 250,00/dia$).
     - Histórico completo de lançamentos de horas com opção de exclusão.

---

### 4.5. Subníveis & Quadros Específicos por Equipamento (`QuadrosView.jsx`)

* **Objetivo**: Permitir a segmentação da obra em quadros técnicos específicos, tratando sub-sistemas isoladamente sem poluir o Kanban geral.
* **Exemplos de Quadros por Equipamento**:
  - Quadro de Montagem da Subestação Abridora (13.8 kV).
  - Quadro do Chiller de Água Gelada 01 & 02.
  - Quadro Elétrico de Distribuição Geral (QTA).
  - Central de Tratamento de Ar (CTA) - Área Limpa.
* **Funcionalidades**:
  - Criação de novos sub-quadros com nome e cor representativa.
  - Inserção de post-its exclusivos do sub-quadro.
  - Acompanhamento do progresso isolado daquele sub-sistema.

---

### 4.6. Módulo de Checklist de Comissionamento HVAC & Elétrica (`ChecklistModule.jsx`)

* **Objetivo**: Padronizar e registrar os testes normatizados de comissionamento de campo, garantindo que o sistema atenda aos requisitos técnicos exigidos pelas normas de engenharia (ASHRAE, ABNT, SMACNA).
* **Protocolos e Testes Suportados**:
  - **Teste TAB (Teste, Ajuste e Balanceamento)**: Medição de vazão de ar, pressão estática e balanceamento hidrônico.
  - **Pressurização de Dutos de Ar**: Ensaio de estanqueidade e vazamento de dutos.
  - **Teste Funcional de Chillers & FanCoils**: Leitura de temperaturas de entrada/saída de água, corrente dos compressores e superaquecimento.
  - **Intertravamento de Segurança & Automação**: Validação de alarmes de incêndio, pressostatos e desligamento de emergência.
* **Recursos do Módulo**:
  - Status individual por item: `Pendente`, `Em Teste`, `Aprovado` (verde) ou `Reprovado` (vermelho).
  - Inserção de fotos de evidência do instrumento de medição (ex: foto do Anemômetro ou Manômetro).
  - Campo para parecer técnico do engenheiro responsável.
  - Barra de progresso geral de comissionamento da obra.

---

### 4.7. Módulo de Controle de Materiais & Parser Automático de PDF (`MaterialsModule.jsx`)

> *Nota: Módulo disponível exclusivamente para usuários com papel de **Administrador**.*

* **Objetivo**: Controlar o ciclo de vida dos suprimentos e materiais comprados para a obra, desde a emissão do pedido de compra até a entrega física no canteiro.
* **Importador Inteligente de PDF (`pdfParser.js`)**:
  - Permite arrastar e soltar (Drag-and-Drop) documentos em PDF de ordens de compra ou requisições.
  - O leitor extrai automaticamente: Número da Requisição, Nome do Fornecedor, Valor Total ($R\$) e Lista Completa de Itens com quantidades.
  - Classificação direta de destino: *Materiais da Obra* ou *Infraestrutura/Equipamentos*.
* **Recursos de Gestão**:
  - Modal para inserção manual de requisições ou colagem direta de texto de e-mails/pedidos.
  - Tabela interativa de rastreamento de entregas item por item com status: `Pendente de Chegada` (amarelo) vs `Já Chegou no Canteiro` (verde).
  - Cálculo percentual do índice de recebimento da obra (ex: $85\%$ dos materiais já recebidos na obra).
  - Filtro instantâneo por fornecedor.

---

### 4.8. Módulo de Agenda & Escala de Viagens (`ScheduleModule.jsx`)

* **Objetivo**: Planejar e controlar a logística de deslocamento, hospedagem e viagens dos técnicos de comissionamento entre diferentes cidades e canteiros de obra.
* **Dualidade de Visões**:
  1. **Visão da Obra (Escala Geral)**: O gestor visualiza todas as viagens programadas para a obra selecionada, os técnicos alocados em cada trecho, os meios de transporte (Avião, Carro da Empresa, Ônibus) e o custo total estimado em diárias.
  2. **Minha Agenda Pessoal**: O técnico logado visualiza exclusivamente suas próprias viagens, trechos, datas de partida e chegada, com cartões informativos detalhados e status de sua mobilização.
* **Cálculos Automáticos**:
  - Duração em dias de cada viagem.
  - Projeção de diárias a serem pagas a cada colaborador envolvido.

---

### 4.9. Kanban de Infraestrutura Elétrica e Civil (`InfraKanbanView.jsx`)

* **Objetivo**: Gerenciar as etapas físicas de infraestrutura bruta que antecedem a montagem dos equipamentos elétricos e ar condicionado.
* **Foco Técnico**:
  - Montagem de leitos de cabos, eletrocalhas e perfilados.
  - Lançamento e cabeamento de média e baixa tensão.
  - Construção de bases de concreto para chillers e transformadores.
  - Fechamento de alvenaria e shafts de passagem.
* **Visualização**: Quadro Kanban otimizado para o acompanhamento dos serviços de infraestrutura pesada, integrado com as medições financeiras de infraestrutura da obra.

---

### 4.10. Diário de Campo multimídia (`FieldReportsModule.jsx`)

* **Objetivo**: Permitir que a equipe de campo registre formalmente o diário de obra (*Relatório Diário de Obra - RDO*) acompanhado de evidências multimídia ricas.
* **Tipos de Mídia Suportados**:
  - **Fotografias de Campo**: Upload ou captura de fotos do avanço físico, não-conformidades ou detalhes de montagem.
  - **Vídeos da Operação**: Registro de testes dinâmicos, partida de motores e funcionamento de chillers.
  - **Gravação de Áudios de Voz**: Envio de notas de voz curtas descrevendo ocorrências ou orientações técnicas.
* **Recursos**:
  - Data, horário e autor da publicação.
  - Vínculo de técnicos presentes no canteiro no dia do relato.
  - Alimentação imediata da linha do tempo da obra.

---

### 4.11. Módulo de Relatórios Financeiros & BI Orçamentário (`ReportsModule.jsx`)

> *Nota: Módulo exclusivo para o papel de **Administrador**.*

* **Objetivo**: Prover uma visão executiva completa da saúde financeira da obra, comparando o planejado versus realizado e apontando desvios de custo.
* **Indicadores Chave (KPIs Financeiros)**:
  - **Orçamento Geral Aprovado**: Valor total contratado com o cliente.
  - **Gastos Realizados Acumulados**: Soma de (Mão de Obra + Materiais + Infraestrutura + Custos Indiretos).
  - **Margem de Lucro Projetada ($R\$$ e $\%$)**: Cálculo em tempo real da rentabilidade atual da obra.
  - **Total de Diárias & Horas Apontadas**: Custo consolidado da equipe de campo.
* **Gráficos Dinâmicos (Recharts)**:
  - *Gráfico de Rosca/Pizza*: Distribuição percentual do orçamento entre as 4 categorias de custo.
  - *Gráfico de Barras Comparativo*: Orçamento Previsto vs. Custo Realizado por categoria.
  - *Gráfico de Evolução Orçamentária*: Linha de tendência de consumo de verba ao longo do tempo.
* **Recursos de Exportação**:
  - **Gerador de Relatório PDF**: Geração de documento de impressão formatado com logotipo, tabelas e parecer executivo.
  - **Exportação Excel (.CSV)**: Download dos dados financeiros em formato de planilha para auditoria externa.

---

### 4.12. Modal de Gestão de Usuários e Aprovação de Acessos (`UserManagementModal.jsx`)

> *Nota: Acessível apenas ao **Administrador**.*

* **Objetivo**: Controlar quem pode acessar o sistema, quais permissões possuem e quanto custa a diária de cada colaborador.
* **Funcionalidades**:
  - **Painel de Aprovações Pendentes**: Lista de novos técnicos que solicitaram cadastro. O administrador pode clicar em **Aprovar** ou **Recusar**.
  - **Tabela de Usuários Ativos**:
    - Alteração de Nível de Acesso (`Administrador` vs `Usuário`).
    - Definição do Título / Cargo (ex: *Gerente de Comissionamento*, *Técnico HVAC Senior*).
    - Definição do Valor da Diária ($R\$/dia$), que é utilizado pelo sistema para calcular automaticamente o custo da mão de obra nos post-its.
    - Exclusão e bloqueio de usuários.

---

### 4.13. Modal de Sincronização em Nuvem - Firebase Cloud (`FirebaseModal.jsx`)

* **Objetivo**: Permitir que a empresa conecte o sistema à sua própria instância da nuvem Google Firebase Firestore para sincronização em tempo real entre dispositivos.
* **Recursos**:
  - Formulário para inserção da chave de API e credenciais do projeto Firebase Firestore (`apiKey`, `authDomain`, `projectId`, etc.).
  - Indicador visual do estado da conexão em tempo real: `🟢 Conectado em Nuvem (Sincronizando)` ou `🟡 Modo Local (Offline LocalStorage)`.
  - Botão para testar conexão e salvar configurações no ambiente.

---

### 4.14. Central de Chat Corporativo por Obra (`ObraChatModal.jsx`)

* **Objetivo**: Prover um canal direto de comunicação instantânea entre a gestão no escritório e os engenheiros/técnicos no canteiro de obras.
* **Recursos**:
  - Mensagens separadas e indexadas por obra.
  - Identificação visual do remetente (Nome, Avatar colorido e horário do envio).
  - Notificação de novas mensagens não lidas.

---

### 4.15. Modal e Banner de Instalação PWA (`PwaInstallModal.jsx` / `PwaInstallBanner.jsx`)

* **Objetivo**: Facilitar a instalação do **OmniField Pro** como aplicativo nativo em smartphones (Android/iOS) e computadores (Windows/Mac/Linux).
* **Recursos**:
  - Banner discreto no rodapé notificando a disponibilidade de instalação.
  - Modal explicativo passo-a-passo mostrando como adicionar à Tela Inicial.
  - Notificação de atualizações automáticas via Service Worker sem necessidade de re-instalação.

---

## 5. Fluxo de Dados e Ciclo de Vida da Obra

O diagrama abaixo sintetiza como as informações trafegam dentro do **OmniField Pro** durante o ciclo de vida completo de uma obra:

```
[ Hub de Obras ] ──> Cadastro da Obra & Definição dos Orçamentos (Admin)
        │
        ├───> [ Logística & Agenda ] ──> Mobilização de Técnicos & Viagens
        │
        ├───> [ Módulo Materiais ] ──> Importação de PDF de Compras & Entrega
        │
        ├───> [ Kanban & Quadros ] ──> Apontamento de Diárias, Post-its & Subtarefas
        │
        ├───> [ Checklists HVAC ] ──> Testes TAB, Pressurização & Chillers com Fotos
        │
        ├───> [ Diário de Campo ] ──> Upload de Ocorrências com Fotos, Vídeo e Áudio
        │
        └───> [ Relatórios BI ] ──> Apuração do Custo Real, Margem R$ e Exportação PDF
```

---

## 6. Resumo da Proposta Executiva

O **OmniField Pro** entrega uma solução completa de governança para empresas de engenharia e comissionamento:

1. **Eliminação de Erros Orçamentários**: Apuração automática e precisa dos custos com mão de obra e compras em tempo real.
2. **Redução de Retrabalho no Campo**: Guias visuais e checklists padronizados impedem a entrega de sistemas sem testes normatizados.
3. **Agilidade no Canteiro de Obras**: Funciona em qualquer lugar (mesmo sem internet) com interface rápida otimizada para smartphones e tablets.
4. **Transparência para Clientes Executivos**: Emissão imediata de relatórios financeiros e técnicos de progresso em PDF.

---
*Documento gerado para especificação completa e mapeamento funcional do sistema OmniField Pro.*
