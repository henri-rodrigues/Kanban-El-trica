# OmniField Pro - Gestão Corporativa & Comissionamento

Aplicação web corporativa de alta performance desenvolvida com React, Vite, Lucide Icons e Recharts, inspirada no Azure DevOps Boards e Miro.

## 🚀 Recursos
- **Kanban em 2 Níveis**: Post-its Gerais da Obra e Post-its Específicos por Quadro.
- **Autenticação com 2 Níveis**: Administrador (acesso aos relatórios financeiros) e Usuário (acesso operacional).
- **Checklists HVAC**: Testes de TAB, pressurização, chillers e intertravamento.
- **Gestão Financeira & Mão de Obra**: Cálculo dinâmico de diárias de operadores, materiais e verbas adicionais.
- **PWA & Deploy GitHub Pages**: Suporte a PWA e deploy estático para o GitHub Pages.

## 🛠️ Como rodar o projeto localmente
```bash
npm install
npm run dev
```

## 🌐 Deploy no GitHub Pages
```bash
npm run deploy
```

## ☁️ Nuvem (Firebase) — configuração

O app sincroniza com o Firestore do projeto `omnifield-pro` e autentica com **Firebase Authentication
(e-mail/senha)**. Todo cadastro novo fica **pendente** até o administrador aceitar.

### Configuração única no console
1. **Authentication → Sign-in method → E-mail/senha → Ativar.**
2. **Firestore Database → Regras:** cole o conteúdo de [`firestore.rules`](firestore.rules) e **Publique**
   (ou `firebase deploy --only firestore:rules`).

### Começar sem usuários (mantendo os dados)
- **Authentication → Users:** selecione todos e exclua.
- **Firestore → Data:** exclua **somente** as coleções `users` e `config`. As demais (`obras`, `quadros`, `cards`,
  `checklists`, `purchase_orders`, `notifications`, `chat_messages`, `field_reports`, `dimensionamentos`,
  `calculos_quadros`) **permanecem**.
- Em cada navegador, usuários e sessão locais são removidos automaticamente, uma única vez, na primeira abertura
  desta versão (`EPOCH` em `src/services/resetData.js`); os dados locais são mantidos.
- Obras com equipe definida (`assignedUserIds`) referenciam usuários antigos: o administrador pode reatribuir a equipe
  em *Editar Obra*.

### Fluxo de acesso
1. A pessoa abre **Solicitar Cadastro** e informa nome, e-mail e senha.
2. O cadastro é criado e a **solicitação vai direto** para o administrador (sem confirmação de e-mail).
3. O administrador vê a solicitação em *Gestão de Usuários* → **Aceitar como usuário** ou **Recusar**.
4. Aceita, a pessoa entra normalmente com e-mail e senha. Só o dono do sistema promove alguém a administrador.

### Dono do sistema
O dono é a conta `eletrica@3darcondicionado.com.br` (definido em `firestore.rules` e `src/services/firebase.js`).
Ele entra como administrador automaticamente.

> **Importante:** como não há confirmação de e-mail, **cadastre o e-mail do dono antes de divulgar o sistema**.
> Quem criar primeiro a conta com esse e-mail controla a conta de administrador. Se ao cadastrar aparecer
> "e-mail já possui conta" e não foi você, use *Esqueci minha senha* para retomar a conta.

### Como funciona
- Senhas ficam no Firebase Authentication (nunca em texto puro no banco).
- Perfil e permissões em `users/{uid}`: `role` (`administrador` | `usuario`) e `status`
  (`pending_approval` | `approved` | `rejected`). Só perfis `approved` leem/gravam; `obras` e `purchase_orders`
  só o administrador grava. Só o dono concede ou retira o perfil de administrador.
- A sincronização **não apaga** dados locais: o que existe só no dispositivo é enviado à nuvem; o que já esteve na
  nuvem e foi removido por outro usuário também é removido localmente.
- Excluir um usuário na tela de gestão remove o perfil; a conta de login pode ser removida em
  *Authentication → Users*.

## 🔔 Push, e-mail e resumo semanal (Cloud Functions)

Estes recursos rodam no servidor do Firebase e precisam de uma configuração única:

1. **Plano Blaze** — Firebase Console → ⚙️ Uso e faturamento → mudar para Blaze (pago por uso; no volume atual o custo fica em R$ 0, dentro da cota gratuita). Recomenda-se criar um alerta de orçamento.
2. **Chave VAPID (push)** — Configurações do projeto → Cloud Messaging → *Certificados push da Web* → **Gerar par de chaves**. Copie a chave pública para `VAPID_KEY` em `src/services/firebase.js` e publique o site.
3. **E-mail (extensão Trigger Email)** — Console → Extensions → instalar **Trigger Email from Firestore** com:
   - Coleção: `mail`
   - SMTP: `smtps://eletrica%403darcondicionado.com.br@smtp.gmail.com:465` (ou o SMTP da empresa) e a **senha de app** gerada na conta Google (Segurança → Senhas de app).
   - Remetente padrão: `Gestão Elétrica <eletrica@3darcondicionado.com.br>`
4. **Publicar regras e funções** (na pasta do projeto, com a [Firebase CLI](https://firebase.google.com/docs/cli) instalada):
   ```bash
   npm install --prefix functions
   firebase login
   firebase deploy --only firestore:rules,functions
   ```

O que cada função faz:
- `enviarAviso` — a cada aviso do sistema (tarefa atribuída, viagem, menção, chat, diário) envia **push** para os aparelhos da pessoa e, para tarefa/viagem/menção, **e-mail** (cada pessoa liga/desliga em *Minha agenda → Avisos*).
- `resumoSemanal` — todo **domingo às 18h** envia aos administradores o resumo de cada obra: o que avançou, o que está parado há mais de 7 dias e as pendências. O mesmo resumo pode ser gerado a qualquer momento em *Relatórios → Resumo da semana*.

No iPhone, o push só funciona com o sistema **instalado na tela inicial** (Compartilhar → Adicionar à Tela de Início).

## 📴 Modo offline

Com a sessão aberta, o sistema funciona sem internet: diário, checklist, post-its e apontamentos ficam guardados no aparelho e são enviados quando o sinal volta (a faixa no topo mostra o estado). Entrar com uma conta nova exige internet.

## 🔒 Sigilo dos valores

Verbas e custos das obras (`obras_fin`), diárias (`users_fin`) e pedidos de compra (`purchase_orders`) ficam em áreas do banco que **só administradores leem**; usuários comuns não recebem esses dados no aparelho. Na tela, os valores aparecem como `R$ •••••` até o admin tocar no **olho** do topo (ou no próprio valor, por 5 s) e voltam a ficar ocultos ao sair do app ou após 5 min parado.

Ao atualizar: **o administrador deve abrir o sistema uma vez com a versão nova** (isso move os valores antigos para as áreas restritas) e **só depois** publicar as regras (`firebase deploy --only firestore:rules` ou colar `firestore.rules` no console).
