import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, ImagePlus, X, Check, Save, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  SECOES_CHECKLIST, TOTAL_ITENS_CHECKLIST, chaveItem, MAX_FOTOS_POR_ITEM, LIMITE_BYTES_LAUDO
} from '../../constants/checklistQuadros';
import { AssinaturaPad } from './AssinaturaPad';
import { comprimirImagem, estatisticas, pendenciasDe } from './utils';

const agoraParaInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const isoParaInput = (iso) => {
  if (!iso) return agoraParaInput();
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// Estado de cada item a partir de um laudo salvo (ou vazio).
const itensIniciais = (laudo) => {
  const out = {};
  SECOES_CHECKLIST.forEach((sec) => {
    sec.itens.forEach((it, idx) => {
      const k = chaveItem(sec.id, idx);
      const dado = laudo?.itens?.[k];
      out[k] = { status: dado?.status ?? null, motivo: dado?.motivo ?? '', fotos: dado?.fotos ?? [] };
    });
  });
  return out;
};

/** Botões para anexar fotos (câmera ou arquivos). */
const Anexos = ({ fotos, onAdd, onRemove, max, rotulo = 'Anexar foto' }) => {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const escolher = async (ev) => {
    const arquivos = [...(ev.target.files || [])];
    ev.target.value = '';
    if (!arquivos.length) return;
    setErro('');
    setCarregando(true);
    try {
      const vagas = max - fotos.length;
      const novas = await Promise.all(arquivos.slice(0, Math.max(0, vagas)).map((a) => comprimirImagem(a)));
      if (arquivos.length > vagas) setErro(`Limite de ${max} fotos por campo.`);
      if (novas.length) onAdd(novas);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="ck-anexos">
      <div className="ck-fotos">
        {fotos.map((f, i) => (
          <span className="ck-foto" key={i}>
            <img src={f} alt={`Foto ${i + 1}`} />
            <button type="button" aria-label="Remover foto" onClick={() => onRemove(i)}><X size={12} /></button>
          </span>
        ))}
      </div>
      {fotos.length < max && (
        <div className="ck-anexo-botoes">
          <label className="btn btn-secondary btn-sm">
            <Camera size={13} /> {carregando ? 'Processando…' : `${rotulo} (câmera)`}
            <input type="file" accept="image/*" capture="environment" onChange={escolher} hidden />
          </label>
          <label className="btn btn-secondary btn-sm">
            <ImagePlus size={13} /> Escolher arquivo
            <input type="file" accept="image/*" multiple onChange={escolher} hidden />
          </label>
        </div>
      )}
      {erro && <span className="ck-erro-inline">{erro}</span>}
    </div>
  );
};

export const LaudoForm = ({ obra, obraQuadros, laudo, quadroFixoId, onSalvo, onCancelar }) => {
  const { saveLaudo } = useData();
  const { users, currentUser } = useAuth();

  const quadroInicial = laudo?.quadroId ?? quadroFixoId ?? '';
  const [quadroId, setQuadroId] = useState(quadroInicial);
  const [quadroLivre, setQuadroLivre] = useState(
    laudo && !laudo.quadroId ? laudo.quadroNome : ''
  );
  const [dataHora, setDataHora] = useState(isoParaInput(laudo?.dataHora));
  const [inspetor, setInspetor] = useState(laudo?.inspetor ?? currentUser?.name ?? '');
  const [itens, setItens] = useState(() => itensIniciais(laudo));
  const [observacoes, setObservacoes] = useState(laudo?.observacoes ?? '');
  const [fotosObs, setFotosObs] = useState(laudo?.fotosObservacoes ?? []);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const padRef = useRef(null);

  const equipe = useMemo(() => {
    const nomes = users.filter((u) => u.status === 'approved').map((u) => u.name);
    if (inspetor && !nomes.includes(inspetor)) nomes.unshift(inspetor);
    return nomes;
  }, [users, inspetor]);

  const est = estatisticas(itens);
  const verificados = est.conformes + est.naoConformes;
  const pct = Math.round((verificados / TOTAL_ITENS_CHECKLIST) * 100);

  const mudarItem = (k, parcial) => setItens((prev) => ({ ...prev, [k]: { ...prev[k], ...parcial } }));

  const marcarSecao = (secao) =>
    setItens((prev) => {
      const novo = { ...prev };
      secao.itens.forEach((_, idx) => {
        const k = chaveItem(secao.id, idx);
        if (novo[k].status !== 'nao_conforme') novo[k] = { ...novo[k], status: 'conforme' };
      });
      return novo;
    });

  const salvar = (ev) => {
    ev.preventDefault();
    setErro('');

    const quadro = obraQuadros.find((q) => q.id === quadroId);
    const quadroNome = (quadro?.name || quadroLivre).trim();
    if (!quadroNome) return setErro('Informe o quadro conferido (escolha da obra ou digite o nome).');
    if (!inspetor.trim()) return setErro('Informe o inspetor responsável.');

    // Não conformidade exige justificativa e foto.
    for (const sec of SECOES_CHECKLIST) {
      for (let idx = 0; idx < sec.itens.length; idx += 1) {
        const k = chaveItem(sec.id, idx);
        const it = itens[k];
        if (it.status === 'nao_conforme') {
          const alvo = `${sec.titulo} — ${sec.itens[idx].titulo}`;
          if (!it.motivo.trim()) {
            document.getElementById(`ck-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return setErro(`Descreva a não conformidade do item: ${alvo}.`);
          }
          if (it.fotos.length === 0) {
            document.getElementById(`ck-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return setErro(`Anexe ao menos uma foto do item não conforme: ${alvo}.`);
          }
        }
      }
    }

    const itensSalvar = {};
    SECOES_CHECKLIST.forEach((sec) => {
      sec.itens.forEach((it, idx) => {
        const k = chaveItem(sec.id, idx);
        const dado = itens[k];
        itensSalvar[k] = {
          secao: sec.titulo,
          item: it.titulo,
          status: dado.status,
          motivo: dado.status === 'nao_conforme' ? dado.motivo.trim() : '',
          fotos: dado.status === 'nao_conforme' ? dado.fotos : []
        };
      });
    });

    const doc = {
      id: laudo?.id,
      quadroId: quadro?.id ?? null,
      quadroNome,
      inspetor: inspetor.trim(),
      dataHora: new Date(dataHora).toISOString(),
      itens: itensSalvar,
      observacoes: observacoes.trim(),
      fotosObservacoes: fotosObs,
      assinatura: padRef.current?.obter() ?? '',
      estatisticas: estatisticas(itensSalvar),
      pendencias: pendenciasDe(itensSalvar)
    };

    const tamanho = JSON.stringify(doc).length;
    if (tamanho > LIMITE_BYTES_LAUDO) {
      return setErro(
        `O laudo ficou pesado demais (${(tamanho / 1024).toFixed(0)} KB; limite ${(LIMITE_BYTES_LAUDO / 1024).toFixed(0)} KB) por causa das fotos. Remova algumas fotos ou use menos por item.`
      );
    }

    setSalvando(true);
    const salvo = saveLaudo(obra.id, doc);
    setSalvando(false);
    if (salvo) onSalvo(salvo);
  };

  return (
    <form className="ck-wrap" onSubmit={salvar}>
      <div className="ck-barra">
        <button type="button" className="btn btn-secondary" onClick={onCancelar}><ArrowLeft size={15} /> Voltar</button>
        <h2>{laudo ? `Editar relatório Nº ${laudo.numero}` : 'Novo checklist de quadro'}</h2>
        <span className="ck-espaco" />
        <button type="submit" className="btn btn-primary" disabled={salvando}><Save size={15} /> Salvar laudo</button>
      </div>

      <div className="ck-card ck-progresso">
        <div className="ck-progresso-topo">
          <strong>{verificados} de {TOTAL_ITENS_CHECKLIST} itens verificados ({pct}%)</strong>
          <span>
            <b className="ck-ok">{est.conformes}</b> conformes · <b className="ck-nok">{est.naoConformes}</b> não conformes
          </span>
        </div>
        <div className="ck-barra-prog"><i style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="ck-card">
        <h3>Identificação</h3>
        <div className="ck-grade">
          <label className="ck-campo">
            <span>Obra</span>
            <input className="form-control" value={obra.name} disabled />
          </label>
          <label className="ck-campo">
            <span>Quadro conferido *</span>
            {obraQuadros.length > 0 ? (
              <select className="form-control" value={quadroId} onChange={(e) => setQuadroId(e.target.value)} disabled={!!quadroFixoId}>
                <option value="">Outro / quadro geral (digitar)</option>
                {obraQuadros.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
              </select>
            ) : (
              <span className="ck-dica">Nenhum quadro cadastrado na obra: digite o nome abaixo.</span>
            )}
          </label>
          {!quadroId && (
            <label className="ck-campo">
              <span>Nome / TAG do quadro</span>
              <input className="form-control" placeholder="Ex.: QGBT-01, QC-CHILLER" value={quadroLivre} onChange={(e) => setQuadroLivre(e.target.value)} />
            </label>
          )}
          <label className="ck-campo">
            <span>Data e hora</span>
            <input className="form-control" type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          </label>
          <label className="ck-campo">
            <span>Inspetor responsável *</span>
            <select className="form-control" value={inspetor} onChange={(e) => setInspetor(e.target.value)}>
              <option value="">Selecione…</option>
              {equipe.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </div>

      {SECOES_CHECKLIST.map((sec) => (
        <div className="ck-card" key={sec.id}>
          <div className="ck-secao-topo">
            <div>
              <h3>{sec.titulo}</h3>
              <p className="ck-dica">{sec.descricao}</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => marcarSecao(sec)}>
              <Check size={13} /> Marcar todos conformes
            </button>
          </div>

          {sec.itens.map((it, idx) => {
            const k = chaveItem(sec.id, idx);
            const dado = itens[k];
            const nc = dado.status === 'nao_conforme';
            return (
              <div id={`ck-${k}`} key={k} className={`ck-item ${nc ? 'ck-item-nc' : ''} ${dado.status === 'conforme' ? 'ck-item-ok' : ''}`}>
                <div className="ck-item-topo">
                  <div className="ck-item-texto">
                    <strong>{idx + 1}. {it.titulo}</strong>
                    <span>{it.criterio}</span>
                  </div>
                  <div className="ck-opcoes" role="radiogroup" aria-label={it.titulo}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={dado.status === 'conforme'}
                      className={`ck-opcao ck-opcao-ok ${dado.status === 'conforme' ? 'ativo' : ''}`}
                      onClick={() => mudarItem(k, { status: 'conforme' })}
                    >Conforme</button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={nc}
                      className={`ck-opcao ck-opcao-nok ${nc ? 'ativo' : ''}`}
                      onClick={() => mudarItem(k, { status: 'nao_conforme' })}
                    >Não conforme</button>
                  </div>
                </div>

                {nc && (
                  <div className="ck-nc">
                    <label className="ck-campo">
                      <span><AlertTriangle size={12} /> Descreva a não conformidade *</span>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="O que foi encontrado e onde"
                        value={dado.motivo}
                        onChange={(e) => mudarItem(k, { motivo: e.target.value })}
                      />
                    </label>
                    <span className="ck-rotulo">Foto comprobatória * (até {MAX_FOTOS_POR_ITEM})</span>
                    <Anexos
                      fotos={dado.fotos}
                      max={MAX_FOTOS_POR_ITEM}
                      onAdd={(novas) => mudarItem(k, { fotos: [...dado.fotos, ...novas] })}
                      onRemove={(i) => mudarItem(k, { fotos: dado.fotos.filter((_, n) => n !== i) })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="ck-card">
        <h3>Observações gerais</h3>
        <textarea
          className="form-control"
          rows={3}
          placeholder="Detalhes técnicos, observações de segurança ou recomendações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
        <span className="ck-rotulo" style={{ marginTop: '0.75rem' }}>Fotos complementares (até 4)</span>
        <Anexos
          fotos={fotosObs}
          max={4}
          rotulo="Adicionar foto"
          onAdd={(novas) => setFotosObs((p) => [...p, ...novas])}
          onRemove={(i) => setFotosObs((p) => p.filter((_, n) => n !== i))}
        />
      </div>

      <div className="ck-card">
        <h3>Assinatura do inspetor</h3>
        <AssinaturaPad ref={padRef} inicial={laudo?.assinatura ?? ''} />
      </div>

      {erro && <div className="ck-erro" role="alert">{erro}</div>}

      <div className="ck-barra" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={salvando}><Save size={15} /> Salvar laudo</button>
      </div>
    </form>
  );
};
