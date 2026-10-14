// Tabelas com a classe `tabela-cartoes` viram cartões no celular: cada célula ganha o
// nome da coluna (data-label), que o CSS mostra ao lado do valor. Roda sozinho para
// qualquer tabela que aparecer na tela, sem precisar marcar célula por célula.

const rotular = (tabela) => {
  const titulos = [...tabela.querySelectorAll('thead th')].map((th) => th.textContent.trim());
  if (!titulos.length) return;
  tabela.querySelectorAll('tbody tr').forEach((tr) => {
    let col = 0;
    [...tr.children].forEach((td) => {
      const rotulo = titulos[col] || '';
      if (td.getAttribute('data-label') !== rotulo) td.setAttribute('data-label', rotulo);
      col += Number(td.getAttribute('colspan') || 1);
    });
  });
};

export function iniciarTabelasCartoes() {
  if (typeof window === 'undefined' || !window.MutationObserver) return;
  let agendado = false;
  const varrer = () => {
    agendado = false;
    document.querySelectorAll('table.tabela-cartoes').forEach(rotular);
  };
  const agendar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(varrer);
  };
  new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true });
  agendar();
}
