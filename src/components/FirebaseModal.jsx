import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { getStoredFirebaseConfig, initFirebase } from '../services/firebase';
import { X, Download, Upload, Database, Globe, Check, Sparkles, Flame } from 'lucide-react';

export const FirebaseModal = ({ isOpen, onClose }) => {
  const { obras, quadros, cards, checklists } = useData();

  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredFirebaseConfig();
    if (stored) {
      setApiKey(stored.apiKey || '');
      setAuthDomain(stored.authDomain || '');
      setProjectId(stored.projectId || '');
      setStorageBucket(stored.storageBucket || '');
      setMessagingSenderId(stored.messagingSenderId || '');
      setAppId(stored.appId || '');
    }
  }, [isOpen]);

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
    const config = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    };

    localStorage.setItem('omnifield_firebase_config', JSON.stringify(config));
    initFirebase(config);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      window.location.reload();
    }, 1500);
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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          position: 'relative'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Flame size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Conectar Banco de Dados Firebase (Grátis)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sincronize em tempo real entre celular e computador</p>
          </div>
        </div>

        {/* Firebase Config Form */}
        <form onSubmit={handleSaveFirebaseConfig} style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            🔥 Chaves de Conexão do seu Projeto Firebase
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div className="form-group">
              <label>apiKey *</label>
              <input type="text" required placeholder="AIzaSy..." className="form-control" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>

            <div className="form-group">
              <label>projectId *</label>
              <input type="text" required placeholder="omnifield-pro-123" className="form-control" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            </div>

            <div className="form-group">
              <label>authDomain</label>
              <input type="text" placeholder="projeto.firebaseapp.com" className="form-control" value={authDomain} onChange={(e) => setAuthDomain(e.target.value)} />
            </div>

            <div className="form-group">
              <label>appId</label>
              <input type="text" placeholder="1:123456:web:abcd" className="form-control" value={appId} onChange={(e) => setAppId(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
            {isSaved ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={14} /> Firebase conectado com sucesso!
              </span>
            ) : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Insira os dados do Console do Firebase</span>}

            <button type="submit" className="btn btn-primary btn-sm">
              <Flame size={14} /> Conectar Firebase
            </button>
          </div>
        </form>

        {/* JSON Export / Import Section */}
        <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={15} className="text-blue" /> Backup Local em JSON
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Faça download dos seus dados ou carregue um arquivo salvo anteriormente sem precisar de internet.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleExportJSON} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Download size={14} /> Exportar JSON
            </button>
            <label className="btn btn-secondary btn-sm" style={{ flex: 1, cursor: 'pointer' }}>
              <Upload size={14} /> Importar JSON
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
