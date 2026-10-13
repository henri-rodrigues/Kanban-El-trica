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

## ☁️ Nuvem (Firebase) — configuração única

O app sincroniza com o Firestore do projeto `omnifield-pro` e autentica com **Firebase Authentication
(e-mail/senha)**. Sem os passos abaixo, o app continua funcionando só no navegador (modo local).

1. **Authentication → Vamos começar → Sign-in method → E-mail/senha → Ativar.**
2. **Firestore Database → Regras:** cole o conteúdo de [`firestore.rules`](firestore.rules) e clique em **Publicar**
   (ou, com o Firebase CLI: `firebase deploy --only firestore:rules`).
3. **Logo em seguida**, entre no app com a conta de administrador **no mesmo navegador onde estão os dados**:
   - usuário antigo (ex.: `admin@omnifield.com`) → o app pede uma **nova senha** (mínimo 6 caracteres);
   - esse primeiro acesso cria o perfil de administrador na nuvem e **envia os dados locais** para o Firestore.
4. Demais usuários: entram com a senha antiga (o app migra a conta) e ficam **pendentes** até o administrador
   aprovar em *Gestão de Usuários*. Novos usuários usam *Solicitar Cadastro*.

> **Faça o passo 3 antes de divulgar o link.** Enquanto nenhum administrador existir na nuvem, o primeiro
> administrador a entrar assume o sistema (documento `config/bootstrap`, criado uma única vez).

### Como funciona
- Senhas ficam no Firebase Authentication (nunca mais em texto puro no banco).
- Perfil e permissões em `users/{uid}`: `role` (`administrador` | `usuario`) e `status` (`pending_approval` | `approved` | `rejected`).
- Só perfis `approved` leem/gravam; `obras` e `purchase_orders` só o administrador grava.
- A sincronização **não apaga** dados locais: o que existe só no dispositivo é enviado à nuvem; o que já esteve na
  nuvem e foi removido por outro usuário também é removido localmente.
- Excluir um usuário na tela de gestão remove o perfil; a conta de login pode ser removida em
  *Authentication → Users* no console.
