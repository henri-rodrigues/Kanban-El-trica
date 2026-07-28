import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { X, Download, Upload, Database, Globe, Check, Sparkles } from 'lucide-react';

export const FirebaseModal = ({ isOpen, onClose }) => {
  const { obras, quadros, cards, checklists } = useData();

  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const fullBackup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      obras,
      quadros,
      cards,
      checklists
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `omnifield-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.obras) localStorage.setItem('omnifield_obras_v2', JSON.stringify(parsed.obras));
          if (parsed.quadros) localStorage.setItem('omnifield_quadros_v2', JSON.stringify(parsed.quadros));
          if (parsed.cards) localStorage.setItem('omnifield_cards_v2', JSON.stringify(parsed.cards));
          if (parsed.checklists) localStorage.setItem('omnifield_checklists_v2', JSON.stringify(parsed.checklists));
          alert('Backup importado com sucesso! Recarregando a página...');
          window.location.reload();
        } catch (err) {
          alert('Erro ao importar arquivo JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('omnifield_firebase_config', JSON.stringify({ firebaseApiKey, firebaseProjectId }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          position: 'relative'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Globe size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Deploy GitHub Pages & Firebase Sync</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backup local em JSON e sincronização em nuvem sem custo</p>
          </div>
        </div>

        {/* JSON Export / Import Section */}
        <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={15} className="text-blue" /> Exportar / Importar Dados em JSON (Gratuito)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Baixe um backup estático dos seus dados para salvar no GitHub Pages ou restaurar em qualquer computador.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleExportJSON} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
              <Download size={14} /> Baixar Backup JSON
            </button>
            <label className="btn btn-secondary btn-sm" style={{ flex: 1, cursor: 'pointer' }}>
              <Upload size={14} /> Importar Backup
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Optional Firebase Config */}
        <form onSubmit={handleSaveFirebaseConfig} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)' }}>
            🔥 Configuração Opcional Firebase Firestore (Nuvem Grátis)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Para sincronização em tempo real entre múltiplos celulares/desktops no GitHub Pages:
          </p>

          <div className="form-group">
            <label>Firebase API Key</label>
            <input type="text" placeholder="AIzaSy..." className="form-control" value={firebaseApiKey} onChange={(e) => setFirebaseApiKey(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Firebase Project ID</label>
            <input type="text" placeholder="omnifield-pro" className="form-control" value={firebaseProjectId} onChange={(e) => setFirebaseProjectId(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            {isSaved ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={14} /> Configurações salvas!
              </span>
            ) : <span />}

            <button type="submit" className="btn btn-secondary btn-sm">
              Salvar Conexão Firebase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
