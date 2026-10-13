// Limpeza única de USUÁRIOS e SESSÃO deste navegador ("sem nenhum user").
// Os DADOS (obras, quadros, cards, checklists, dimensionamentos...) permanecem.
// Mude EPOCH quando for preciso desconectar/zerar os usuários locais de novo.
const EPOCH = 'sem-usuarios-2026-10-13';
const CHAVES_DE_USUARIO = ['omnifield_users_approval_v5', 'omnifield_active_user_v5'];

let zerouNestaCarga = false;

/** Remove usuários e sessão locais uma única vez por navegador. Chamar antes de renderizar o app. */
export function resetarDadosLocaisUmaVez() {
  try {
    if (localStorage.getItem('omnifield_epoch') === EPOCH) return;

    CHAVES_DE_USUARIO.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    localStorage.setItem('omnifield_epoch', EPOCH);
    zerouNestaCarga = true;
  } catch (err) {
    console.error('Falha ao limpar usuários locais:', err);
  }
}

/** true uma única vez, se a sessão local foi zerada nesta carga (para encerrar a sessão antiga na nuvem). */
export function consumirFlagDeReset() {
  const v = zerouNestaCarga;
  zerouNestaCarga = false;
  return v;
}
