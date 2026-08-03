import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Users, 
  Image, 
  Video, 
  Mic, 
  Calendar, 
  Clock, 
  X, 
  Send, 
  Building2, 
  Check, 
  AlertCircle,
  Play
} from 'lucide-react';

export const FieldReportsModule = () => {
  const { isAdmin, users, currentUser } = useAuth();
  const { activeObra, fieldReports, addFieldReport, deleteFieldReport } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [involvedUserIds, setInvolvedUserIds] = useState([]);
  
  // Media Files (Base64 or Object URLs)
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [audios, setAudios] = useState([]);

  if (!activeObra) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <AlertCircle size={48} className="text-amber" style={{ marginBottom: '1rem' }} />
        <h3>Nenhuma Obra Selecionada</h3>
        <p style={{ color: 'var(--text-muted)' }}>Selecione uma obra na vitrine para visualizar e publicar relatórios e diários de campo.</p>
      </div>
    );
  }

  // Filter reports for this Obra
  const obraReports = fieldReports.filter(r => r.obraId === activeObra.id);

  const toggleUserInvolvement = (userId) => {
    setInvolvedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // File Upload Handlers (Images, Videos, Audios)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAudioUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudios(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDescription.trim()) return;

    addFieldReport(activeObra.id, {
      title: reportTitle,
      description: reportDescription,
      involvedUserIds: involvedUserIds.length > 0 ? involvedUserIds : [currentUser.id],
      images,
      videos,
      audios,
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    setReportTitle('');
    setReportDescription('');
    setInvolvedUserIds([]);
    setImages([]);
    setVideos([]);
    setAudios([]);
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
              <span className="badge badge-blue">Diário de Campo & Registros</span>
              <span className="badge badge-emerald">Obra: {activeObra.name}</span>
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Relatórios de Campo com Fotos, Vídeos e Áudio
            </h1>
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
          <Plus size={16} /> Adicionar Relatório de Campo
        </button>
      </div>

      {/* Reports Timeline List */}
      {obraReports.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {obraReports.map((report) => (
            <div key={report.id} className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {report.title}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span>👤 Publicado por <strong>{report.authorName}</strong></span>
                    <span>•</span>
                    <span>📅 {report.date} às {report.timestamp || '12:00'}</span>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir relatório "${report.title}"?`)) {
                        deleteFieldReport(activeObra.id, report.id);
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    title="Excluir Relatório"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Involved Users */}
              {report.involvedUserIds && report.involvedUserIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Equipe Envolvida:</span>
                  {report.involvedUserIds.map(uid => {
                    const u = users.find(usr => usr.id === uid);
                    if (!u) return null;
                    return (
                      <span key={uid} className="badge badge-purple" style={{ fontSize: '0.675rem' }}>
                        👤 {u.name}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Text Description */}
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '1rem', whiteSpace: 'pre-wrap', background: 'var(--bg-main)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                {report.description}
              </div>

              {/* Photo Gallery */}
              {report.images && report.images.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Image size={14} className="text-blue" /> Fotos Anexadas ({report.images.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                    {report.images.map((img, idx) => (
                      <div key={idx} style={{ height: '90px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={img} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Gallery */}
              {report.videos && report.videos.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Video size={14} className="text-amber" /> Vídeos Anexados ({report.videos.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                    {report.videos.map((vid, idx) => (
                      <div key={idx} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
                        <video controls src={vid} style={{ width: '100%', maxHeight: '180px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audios Player */}
              {report.audios && report.audios.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mic size={14} className="text-emerald" /> Áudios Anexados ({report.audios.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {report.audios.map((aud, idx) => (
                      <div key={idx} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <audio controls src={aud} style={{ width: '100%', height: '36px' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <FileText size={48} className="text-blue" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>Nenhum Relatório de Campo Registrado</h3>
          <p style={{ color: 'var(--text-muted)' }}>Clique no botão acima para cadastrar um relatório com descrição, foto, vídeo e áudio.</p>
        </div>
      )}

      {/* Modal: Novo Relatório de Campo */}
      {isModalOpen && (
        <div className="mobile-modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-panel mobile-modal-content" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} className="text-blue" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Novo Relatório de Campo</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Título do Relatório *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ex: Conclusão do Lançamento de Barramentos no QTA"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Descrição Detalhada do Apontamento *</label>
                <textarea
                  required
                  className="form-control"
                  rows={4}
                  placeholder="Descreva as atividades executadas em campo, pendências ou observações técnicas..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                />
              </div>

              {/* Involved Users Selector */}
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} className="text-blue" /> Usuários / Equipe Envolvida
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  {users.map(u => {
                    const isSelected = involvedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUserInvolvement(u.id)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '16px',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'var(--bg-main)',
                          color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        👤 {u.name} {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Media Attachments Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  📎 Anexar Mídias ao Relatório
                </div>

                {/* Upload Photos */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--accent-blue)' }}>
                    <Image size={14} /> Selecionar Fotos (JPG, PNG)
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  {images.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                      ✓ {images.length} foto(s) anexada(s)
                    </div>
                  )}
                </div>

                {/* Upload Videos */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--accent-amber)' }}>
                    <Video size={14} /> Selecionar Vídeos (MP4, MOV)
                    <input type="file" accept="video/*" multiple onChange={handleVideoUpload} style={{ display: 'none' }} />
                  </label>
                  {videos.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                      ✓ {videos.length} vídeo(s) anexado(s)
                    </div>
                  )}
                </div>

                {/* Upload Audios */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--accent-emerald)' }}>
                    <Mic size={14} /> Selecionar Áudios / Gravações de Voz (MP3, WAV, M4A)
                    <input type="file" accept="audio/*" multiple onChange={handleAudioUpload} style={{ display: 'none' }} />
                  </label>
                  {audios.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                      ✓ {audios.length} áudio(s) anexado(s)
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  <Send size={15} /> Publicar Relatório de Campo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
