import React, { useMemo, useState } from 'react';
import { Camera, ImagePlus, Video as VideoIcon, FileAudio, X, Send, Users, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ModalShell } from '../dimensionamento/ModalShell';
import { comprimirImagem } from '../checklist/utils';
import { GravadorAudio } from './GravadorAudio';
import { TIPOS_REGISTRO, LIMITES, hojeIso, arquivoParaDataUrl, tamanhoKB } from './utils';

const dataBr = (iso) => {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

export const RegistroForm = ({ obra, quadros, registro, onFechar }) => {
  const { users, currentUser } = useAuth();
  const { addFieldReport, updateFieldReport, addNotification } = useData();

  const editando = !!registro;
  const [titulo, setTitulo] = useState(registro?.title ?? '');
  const [tipo, setTipo] = useState(registro?.tipo ?? 'atividade');
  const [dataRegistro, setDataRegistro] = useState(registro?.dataRegistro ?? hojeIso());
  const [quadroId, setQuadroId] = useState(registro?.quadroId ?? '');
  const [descricao, setDescricao] = useState(registro?.description ?? '');
  const [envolvidos, setEnvolvidos] = useState(
    registro?.involvedUserIds?.length ? registro.involvedUserIds : [currentUser?.id].filter(Boolean)
  );
  const [fotos, setFotos] = useState(registro?.images ?? []);
  const [audios, setAudios] = useState(registro?.audios ?? []);
  const [videos, setVideos] = useState(registro?.videos ?? []);
  const [linksTxt, setLinksTxt] = useState((registro?.links ?? []).join('\n'));
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const equipe = useMemo(() => users.filter((u) => u.status === 'approved' || u.status === undefined), [users]);

  const alternar = (id) => setEnvolvidos((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const adicionarFotos = async (ev) => {
    const arquivos = [...(ev.target.files || [])];
    ev.target.value = '';
    if (!arquivos.length) return;
    setErro('');
    setOcupado(true);
    try {
      const vagas = LIMITES.fotos - fotos.length;
      const novas = await Promise.all(arquivos.slice(0, Math.max(0, vagas)).map((a) => comprimirImagem(a)));
      if (arquivos.length > vagas) setErro(`Limite de ${LIMITES.fotos} fotos por registro.`);
      setFotos((p) => [...p, ...novas]);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const adicionarAudioArquivo = async (ev) => {
    const arquivo = ev.target.files?.[0];
    ev.target.value = '';
    if (!arquivo) return;
    setErro('');
    if (audios.length >= LIMITES.audios) return setErro(`Limite de ${LIMITES.audios} áudios por registro.`);
    if (arquivo.size > LIMITES.bytesAudio) {
      return setErro(`Áudio muito grande (${Math.round(arquivo.size / 1024)} KB; limite ${LIMITES.bytesAudio / 1024} KB). Grave um áudio curto direto aqui pelo botão "Gravar áudio".`);
    }
    const dataUrl = await arquivoParaDataUrl(arquivo);
    setAudios((p) => [...p, dataUrl]);
  };

  const adicionarGravacao = (dataUrl, bytes) => {
    setErro('');
    if (audios.length >= LIMITES.audios) return setErro(`Limite de ${LIMITES.audios} áudios por registro.`);
    if (bytes > LIMITES.bytesAudio) return setErro('Gravação muito longa para caber no registro. Grave um trecho menor.');
    setAudios((p) => [...p, dataUrl]);
  };

  const adicionarVideo = async (ev) => {
    const arquivo = ev.target.files?.[0];
    ev.target.value = '';
    if (!arquivo) return;
    setErro('');
    if (videos.length >= LIMITES.videos) return setErro(`Limite de ${LIMITES.videos} vídeo por registro.`);
    if (arquivo.size > LIMITES.bytesVideo) {
      return setErro(`Vídeo grande demais para ser guardado no registro (${(arquivo.size / 1024 / 1024).toFixed(1)} MB; limite ${LIMITES.bytesVideo / 1024} KB). Envie o vídeo para o Drive/YouTube e cole o link no campo "Links".`);
    }
    const dataUrl = await arquivoParaDataUrl(arquivo);
    setVideos((p) => [...p, dataUrl]);
  };

  const salvar = (ev) => {
    ev.preventDefault();
    setErro('');
    if (!titulo.trim() || !descricao.trim()) return setErro('Informe o título e a descrição do registro.');

    const quadro = quadros.find((q) => q.id === quadroId);
    const ids = envolvidos.length ? envolvidos : [currentUser?.id].filter(Boolean);
    const links = linksTxt.split('\n').map((l) => l.trim()).filter(Boolean);

    const dados = {
      title: titulo.trim(),
      description: descricao.trim(),
      tipo,
      dataRegistro,
      date: dataBr(dataRegistro),
      quadroId: quadro?.id ?? null,
      quadroNome: quadro?.name ?? null,
      involvedUserIds: ids,
      nomesEnvolvidos: users.filter((u) => ids.includes(u.id)).map((u) => u.name),
      images: fotos,
      videos,
      audios,
      links
    };
    if (!editando) {
      dados.timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    const kb = tamanhoKB(dados);
    if (kb * 1024 > LIMITES.bytesRegistro) {
      return setErro(`O registro ficou pesado demais (${kb} KB; limite ${Math.round(LIMITES.bytesRegistro / 1024)} KB). Remova algumas fotos, áudios ou o vídeo.`);
    }

    if (editando) {
      updateFieldReport(registro.id, dados);
    } else {
      addFieldReport(obra.id, dados);
      // Avisa as pessoas marcadas (menos quem está registrando).
      ids.filter((id) => id !== currentUser?.id).forEach((id) =>
        addNotification({
          recipientUserId: id,
          senderUserId: currentUser?.id,
          senderName: currentUser?.name,
          type: 'field_report',
          title: '📝 Novo registro no diário de campo',
          message: `${currentUser?.name} registrou "${dados.title}" na obra ${obra.name}.`,
          obraId: obra.id
        })
      );
    }
    onFechar();
  };

  const TipoBotao = ({ t }) => (
    <button type="button" className={`dr-tipo dr-${t.tom} ${tipo === t.id ? 'ativo' : ''}`} onClick={() => setTipo(t.id)}>
      {t.rotulo}
    </button>
  );

  return (
    <ModalShell title={editando ? 'Editar registro' : 'Novo registro de campo'} onClose={onFechar} maxWidth={640}>
      <form onSubmit={salvar} className="dr-form">
        <div className="dr-tipos">{TIPOS_REGISTRO.map((t) => <TipoBotao key={t.id} t={t} />)}</div>

        <label className="dq-field">
          <span>Título *</span>
          <input className="form-control" required autoFocus placeholder="Ex.: Conclusão do lançamento dos cabos do QTA" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>

        <div className="dq-grid">
          <label className="dq-field">
            <span>Data do registro</span>
            <input className="form-control" type="date" max={hojeIso()} value={dataRegistro} onChange={(e) => setDataRegistro(e.target.value)} />
          </label>
          <label className="dq-field">
            <span>Quadro relacionado (opcional)</span>
            <select className="form-control" value={quadroId} onChange={(e) => setQuadroId(e.target.value)}>
              <option value="">Nenhum / geral da obra</option>
              {quadros.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </label>
        </div>

        <label className="dq-field">
          <span>Descrição *</span>
          <textarea className="form-control" rows={4} required placeholder="O que foi feito, pendências, observações técnicas…" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </label>

        <div className="dq-field">
          <span><Users size={12} /> Equipe envolvida (será avisada)</span>
          <div className="dr-pessoas">
            {equipe.map((u) => {
              const marcado = envolvidos.includes(u.id);
              return (
                <button key={u.id} type="button" className={`dr-pessoa ${marcado ? 'ativo' : ''}`} onClick={() => alternar(u.id)}>
                  {u.name.split(' ')[0]} {marcado && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="dr-midias">
          <strong>Anexos</strong>

          <div className="dr-fotos">
            {fotos.map((f, i) => (
              <span className="dr-foto" key={i}>
                <img src={f} alt={`Foto ${i + 1}`} />
                <button type="button" aria-label="Remover foto" onClick={() => setFotos((p) => p.filter((_, n) => n !== i))}><X size={12} /></button>
              </span>
            ))}
          </div>

          <div className="dr-botoes">
            {fotos.length < LIMITES.fotos && (
              <>
                <label className="btn btn-secondary btn-sm">
                  <Camera size={13} /> Tirar foto
                  <input type="file" accept="image/*" capture="environment" hidden onChange={adicionarFotos} />
                </label>
                <label className="btn btn-secondary btn-sm">
                  <ImagePlus size={13} /> Fotos ({fotos.length}/{LIMITES.fotos})
                  <input type="file" accept="image/*" multiple hidden onChange={adicionarFotos} />
                </label>
              </>
            )}
            <GravadorAudio onGravado={adicionarGravacao} desabilitado={audios.length >= LIMITES.audios} />
            <label className="btn btn-secondary btn-sm">
              <FileAudio size={13} /> Arquivo de áudio
              <input type="file" accept="audio/*" hidden onChange={adicionarAudioArquivo} />
            </label>
            <label className="btn btn-secondary btn-sm">
              <VideoIcon size={13} /> Vídeo curto
              <input type="file" accept="video/*" hidden onChange={adicionarVideo} />
            </label>
          </div>

          {audios.map((a, i) => (
            <div className="dr-audio" key={i}>
              <audio controls src={a} />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setAudios((p) => p.filter((_, n) => n !== i))}><X size={12} /></button>
            </div>
          ))}
          {videos.map((v, i) => (
            <div className="dr-audio" key={i}>
              <video controls src={v} style={{ maxHeight: 120 }} />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setVideos((p) => p.filter((_, n) => n !== i))}><X size={12} /></button>
            </div>
          ))}

          <span className="dr-dica">
            Fotos são reduzidas automaticamente. Áudio até {LIMITES.bytesAudio / 1024} KB (≈ 1 min gravado aqui) e vídeo até {LIMITES.bytesVideo / 1024} KB; para vídeos maiores, use o campo de links.
          </span>
        </div>

        <label className="dq-field">
          <span>Links (vídeos grandes, pastas do Drive, documentos) — um por linha</span>
          <textarea className="form-control" rows={2} placeholder="https://…" value={linksTxt} onChange={(e) => setLinksTxt(e.target.value)} />
        </label>

        {erro && <div className="dr-erro" role="alert">{erro}</div>}

        <div className="dr-acoes">
          <button type="button" className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={ocupado}>
            <Send size={15} /> {editando ? 'Salvar alterações' : 'Publicar registro'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
