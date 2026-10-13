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
(e-mail/senha) com confirmação de e-mail obrigatória** e aprovação manual pelo administrador.

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
2. O sistema envia o **link de confirmação por e-mail**; ela confirma e entra no sistema.
3. A solicitação aparece para o **Administrador** em *Gestão de Usuários* → **Aceitar** ou **Recusar**.
   Cadastros que ainda não confirmaram o e-mail ficam em "Aguardando confirmação de e-mail".
4. Aceita, a pessoa passa a entrar normalmente.

O **Administrador** é o e-mail `eletrica@3darcondicionado.com.br`: cadastre-se com ele, confirme o e-mail e entre
(definido em `firestore.rules` e `src/services/firebase.js`).

### Como funciona
- Senhas ficam no Firebase Authentication (nunca em texto puro no banco). Contas com e-mail não confirmado
  não entram e as regras do Firestore também exigem `email_verified`.
- Perfil e permissões em `users/{uid}`: `role` (`administrador` | `usuario`) e `status`
  (`pending_approval` | `approved` | `rejected`). Só perfis `approved` leem/gravam; `obras` e `purchase_orders`
  só o administrador grava.
- A sincronização **não apaga** dados locais: o que existe só no dispositivo é enviado à nuvem; o que já esteve na
  nuvem e foi removido por outro usuário também é removido localmente.
- Excluir um usuário na tela de gestão remove o perfil; a conta de login pode ser removida em
  *Authentication → Users*.
