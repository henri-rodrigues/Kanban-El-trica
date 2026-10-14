import React from 'react';
import { ArrowLeft, Pencil, Printer, Download, Trash2, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataHora } from '../dimensionamento/helpers';
import { SECOES_CHECKLIST } from '../../constants/checklistQuadros';
import { estatisticas, itensOrdenados, imprimirLaudo, baixarLaudoCsv } from './utils';

export const LaudoDetalhe = ({ laudo, obra, onVoltar, onEditar, onExcluir }) => {
  const { isAdmin, currentUser } = useAuth();
  const est = laudo.estatisticas || estatisticas(laudo.itens || {});
  const linhas = itensOrdenados(laudo);
  const naoConformes = linhas.filter((l) => l.status === 'nao_conforme');
  const podeExcluir = isAdmin || laudo.criadoPor === currentUser?.name;

  return (
    <div className="ck-wrap">
      <div className="ck-barra">
        <button type="button" className="btn btn-secondary" onClick={onVoltar}><ArrowLeft size={15} /> Relatórios</button>
        <div style={{ minWidth: 0 }}>
          <h2>Relatório Nº {laudo.numero} — {laudo.quadroNome}</h2>
          <span className="ck-dica">{dataHora(laudo.dataHora)} · {laudo.inspetor}</span>
        </div>
        <span className="ck-espaco" />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => baixarLaudoCsv(laudo, obra)}><Download size={13} /> Planilha</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => imprimirLaudo(laudo, obra)}><Printer size={13} /> Imprimir / PDF</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onEditar}><Pencil size={13} /> Editar</button>
        {podeExcluir && <button type="button" className="btn btn-danger btn-sm" onClick={onExcluir}><Trash2 size={13} /> Excluir</button>}
      </div>

      <div className="ck-kpis">
        <div className="ck-kpi"><span>Conformidade</span><strong>{est.percentualConformidade}%</strong></div>
        <div className="ck-kpi ck-kpi-ok"><span>Conformes</span><strong>{est.conformes}</strong></div>
        <div className={`ck-kpi ${est.naoConformes ? 'ck-kpi-nok' : ''}`}><span>Não conformes</span><strong>{est.naoConformes}</strong></div>
        <div className="ck-kpi"><span>Sem resposta</span><strong>{est.naoPreenchidos}</strong></div>
      </div>

      {naoConformes.length > 0 && (
        <div className="ck-card">
          <h3>Não conformidades ({naoConformes.length})</h3>
          {naoConformes.map((n) => (
            <div className="ck-pendencia" key={n.chave}>
              <strong>{n.secao} · {n.item}</strong>
              <p>{n.motivo}</p>
              {n.fotos.length > 0 && (
                <div className="ck-fotos">
                  {n.fotos.map((f, i) => <a key={i} href={f} target="_blank" rel="noreferrer" className="ck-foto"><img src={f} alt={`Foto ${i + 1}`} /></a>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {SECOES_CHECKLIST.map((sec) => (
        <div className="ck-card" key={sec.id}>
          <h3>{sec.titulo}</h3>
          <div className="ck-lista">
            {linhas.filter((l) => l.secao === sec.titulo).map((l) => (
              <div key={l.chave} className="ck-linha">
                <span className="ck-linha-icone">
                  {l.status === 'conforme' && <CheckCircle2 size={16} className="ck-ok" />}
                  {l.status === 'nao_conforme' && <XCircle size={16} className="ck-nok" />}
                  {!l.status && <MinusCircle size={16} className="ck-nulo" />}
                </span>
                <span className="ck-linha-texto">
                  {l.item}
                  <small>{l.criterio}</small>
                </span>
                <span className={`ck-selo ${l.status === 'conforme' ? 'ck-selo-ok' : l.status === 'nao_conforme' ? 'ck-selo-nok' : ''}`}>
                  {l.status === 'conforme' ? 'Conforme' : l.status === 'nao_conforme' ? 'Não conforme' : 'Não verificado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="ck-card">
        <h3>Observações gerais</h3>
        <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{laudo.observacoes || 'Nenhuma observação complementar.'}</p>
        {laudo.fotosObservacoes?.length > 0 && (
          <div className="ck-fotos">
            {laudo.fotosObservacoes.map((f, i) => <a key={i} href={f} target="_blank" rel="noreferrer" className="ck-foto"><img src={f} alt={`Foto ${i + 1}`} /></a>)}
          </div>
        )}
      </div>

      <div className="ck-card" style={{ textAlign: 'center' }}>
        {laudo.assinatura ? <img src={laudo.assinatura} alt="Assinatura do inspetor" style={{ maxHeight: 90, maxWidth: '100%' }} /> : <span className="ck-dica">Sem assinatura.</span>}
        <div style={{ borderTop: '1px solid var(--border-highlight)', maxWidth: 280, margin: '0.5rem auto 0', paddingTop: '0.3rem', fontWeight: 700, fontSize: '0.85rem' }}>
          {laudo.inspetor}
        </div>
        <span className="ck-dica">Inspetor responsável</span>
      </div>
    </div>
  );
};
