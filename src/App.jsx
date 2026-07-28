import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Breadcrumb } from './components/Breadcrumb';
import { ObraHubView } from './components/ObraHubView';
import { KanbanBoard } from './components/KanbanBoard';
import { QuadrosView } from './components/QuadrosView';
import { ChecklistModule } from './components/ChecklistModule';
import { ReportsModule } from './components/ReportsModule';
import { LoginModal } from './components/LoginModal';
import { ObraModal } from './components/ObraModal';
import { FirebaseModal } from './components/FirebaseModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { Kanban, Layers, CheckSquare, BarChart3, Grid, Smartphone } from 'lucide-react';

function MainLayout() {
  const { obras, selectedObraId, setSelectedObraId, activeObra } = useData();
  const [activeTab, setActiveTab] = useState('hub');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [obraModalType, setObraModalType] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('Service Worker skipped:', err);
      });
    }
  }, []);

  const handleSelectObraFromHub = (obraId) => {
    setSelectedObraId(obraId);
    setActiveTab('kanban');
  };

  const handleOpenObraModal = (type) => {
    setObraModalType(type);
  };

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'hub': return 'Vitrine de Obras';
      case 'kanban': return 'Kanban & Post-its';
      case 'quadros': return 'Subníveis & Quadros';
      case 'checklist': return 'Checklist HVAC';
      case 'reports': return 'Relatórios Financeiros';
      default: return 'Visão Geral';
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        onOpenObraModal={handleOpenObraModal} 
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        onGoToHub={() => setActiveTab('hub')}
      />

      <div className="app-main">
        {activeTab !== 'hub' && (
          <div className="desktop-sidebar">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onOpenObraModal={handleOpenObraModal} 
            />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Location Breadcrumb Bar */}
          <Breadcrumb activeTabName={getTabLabel(activeTab)} />

          <main className="content-body">
            {activeTab === 'hub' && (
              <ObraHubView 
                onSelectObra={handleSelectObraFromHub}
                onOpenObraModal={handleOpenObraModal}
              />
            )}

            {activeTab === 'kanban' && (
              <KanbanBoard onOpenObraModal={handleOpenObraModal} />
            )}

            {activeTab === 'quadros' && (
              <QuadrosView onOpenObraModal={handleOpenObraModal} />
            )}

            {activeTab === 'checklist' && (
              <ChecklistModule />
            )}

            {activeTab === 'reports' && (
              <ReportsModule />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button onClick={() => setActiveTab('hub')} className={`mobile-nav-item ${activeTab === 'hub' ? 'active' : ''}`}>
          <Grid size={18} />
          <span>Obras</span>
        </button>
        <button onClick={() => setActiveTab('kanban')} className={`mobile-nav-item ${activeTab === 'kanban' ? 'active' : ''}`}>
          <Kanban size={18} />
          <span>Kanban</span>
        </button>
        <button onClick={() => setActiveTab('quadros')} className={`mobile-nav-item ${activeTab === 'quadros' ? 'active' : ''}`}>
          <Layers size={18} />
          <span>Quadros</span>
        </button>
        <button onClick={() => setIsPwaModalOpen(true)} className="mobile-nav-item">
          <Smartphone size={18} />
          <span>Atalho App</span>
        </button>
      </nav>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      <ObraModal 
        isOpen={!!obraModalType} 
        type={obraModalType} 
        onClose={() => setObraModalType(null)} 
      />

      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}
