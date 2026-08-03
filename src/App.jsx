import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Breadcrumb } from './components/Breadcrumb';
import { ObraHubView } from './components/ObraHubView';
import { KanbanBoard } from './components/KanbanBoard';
import { QuadrosView } from './components/QuadrosView';
import { ChecklistModule } from './components/ChecklistModule';
import { MaterialsModule } from './components/MaterialsModule';
import { ReportsModule } from './components/ReportsModule';
import { ScheduleModule } from './components/ScheduleModule';
import { InfraKanbanView } from './components/InfraKanbanView';
import { FieldReportsModule } from './components/FieldReportsModule';
import { LoginScreenView } from './components/LoginScreenView';
import { UserManagementModal } from './components/UserManagementModal';
import { ObraModal } from './components/ObraModal';
import { FirebaseModal } from './components/FirebaseModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { ObraChatModal } from './components/ObraChatModal';
import { 
  Kanban, Layers, CheckSquare, BarChart3, Grid, Smartphone, Package, 
  Calendar, Wrench, FileText, MoreHorizontal, X, Menu, MessageSquare
} from 'lucide-react';

function MainLayout() {
  const { currentUser, isAdmin } = useAuth();
  const { obras, selectedObraId, setSelectedObraId, activeObra } = useData();
  const [activeTab, setActiveTab] = useState('hub');
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [obraModalType, setObraModalType] = useState(null);
  const [editingObraData, setEditingObraData] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then((registration) => {
        // Force immediate check for new deployments on GitHub Pages
        registration.update();

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nova versão detectada! Limpando cache e atualizando...');
                if (window.caches) {
                  caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
                    window.location.reload();
                  });
                } else {
                  window.location.reload();
                }
              }
            });
          }
        });
      }).catch(err => {
        console.log('Service Worker skipped:', err);
      });
    }
  }, []);

  if (!currentUser) {
    return <LoginScreenView />;
  }

  const handleSelectObraFromHub = (obraId) => {
    setSelectedObraId(obraId);
    setActiveTab('kanban');
  };

  const handleOpenObraModal = (type, obraData = null) => {
    setObraModalType(type);
    setEditingObraData(obraData);
  };

  const handleMobileTabSwitch = (tab) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
    setIsMobileDrawerOpen(false);
  };

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'hub': return 'Vitrine de Obras';
      case 'kanban': return 'Kanban & Post-its';
      case 'quadros': return 'Subníveis & Quadros';
      case 'checklist': return 'Checklist HVAC';
      case 'materials': return 'Controle de Materiais & PDF';
      case 'agenda': return 'Agenda & Escala de Viagens';
      case 'infra': return 'Kanban de Infraestrutura';
      case 'field_reports': return 'Diário de Campo & Mídias';
      case 'reports': return 'Relatórios Financeiros';
      default: return 'Visão Geral';
    }
  };

  // Which tabs are shown in the "More" menu
  const moreMenuTabs = [
    { id: 'checklist', icon: <CheckSquare size={16} />, label: 'Checklist HVAC' },
    { id: 'agenda', icon: <Calendar size={16} />, label: 'Agenda & Viagens' },
    { id: 'infra', icon: <Wrench size={16} />, label: 'Kanban Infraestrutura' },
    { id: 'field_reports', icon: <FileText size={16} />, label: 'Diário de Campo' },
  ];

  if (isAdmin) {
    moreMenuTabs.push(
      { id: 'materials', icon: <Package size={16} />, label: 'Controle Materiais' },
      { id: 'reports', icon: <BarChart3 size={16} />, label: 'Relatórios' }
    );
  }

  const isMoreTabActive = moreMenuTabs.some(t => t.id === activeTab);

  return (
    <div className="app-container">
      <Navbar 
        onOpenObraModal={handleOpenObraModal} 
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        onGoToHub={() => setActiveTab('hub')}
        onOpenChatModal={() => setIsChatModalOpen(true)}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
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
              <QuadrosView onOpenObraModal={handleOpenObraModal} setActiveTab={setActiveTab} />
            )}

            {activeTab === 'checklist' && (
              <ChecklistModule />
            )}

            {activeTab === 'agenda' && (
              <ScheduleModule />
            )}

            {activeTab === 'infra' && (
              <InfraKanbanView />
            )}

            {activeTab === 'field_reports' && (
              <FieldReportsModule />
            )}

            {activeTab === 'materials' && (
              <MaterialsModule />
            )}

            {activeTab === 'reports' && (
              <ReportsModule />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Drawer (Slide-out menu for 100% desktop parity) */}
      {isMobileDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileDrawerOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-blue)' }}>
                <Menu size={18} /> Menu Principal
              </div>
              <button onClick={() => setIsMobileDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileDrawerOpen(false);
                }} 
                onOpenObraModal={(type, data) => {
                  handleOpenObraModal(type, data);
                  setIsMobileDrawerOpen(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button onClick={() => handleMobileTabSwitch('hub')} className={`mobile-nav-item ${activeTab === 'hub' ? 'active' : ''}`}>
          <Grid size={18} />
          <span>Obras</span>
        </button>
        <button onClick={() => setIsMobileDrawerOpen(true)} className={`mobile-nav-item ${isMobileDrawerOpen ? 'active' : ''}`}>
          <Menu size={18} />
          <span>Menu</span>
        </button>
        <button onClick={() => handleMobileTabSwitch('kanban')} className={`mobile-nav-item ${activeTab === 'kanban' ? 'active' : ''}`}>
          <Kanban size={18} />
          <span>Kanban</span>
        </button>
        <button onClick={() => handleMobileTabSwitch('quadros')} className={`mobile-nav-item ${activeTab === 'quadros' ? 'active' : ''}`}>
          <Layers size={18} />
          <span>Quadros</span>
        </button>
        <button onClick={() => setIsChatModalOpen(true)} className="mobile-nav-item">
          <MessageSquare size={18} />
          <span>Chat</span>
        </button>
      </nav>

      {/* More Menu Popover (Mobile Only) */}
      {showMoreMenu && (
        <>
          <div 
            onClick={() => setShowMoreMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          />
          <div className="mobile-more-menu">
            {moreMenuTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleMobileTabSwitch(tab.id)}
                className={activeTab === tab.id ? 'active' : ''}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
      />

      <ObraModal 
        isOpen={!!obraModalType} 
        type={obraModalType} 
        editingObra={editingObraData}
        onClose={() => {
          setObraModalType(null);
          setEditingObraData(null);
        }} 
      />

      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />

      <ObraChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
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
