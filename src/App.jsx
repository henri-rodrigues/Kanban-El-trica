import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ObraHubView } from './components/ObraHubView';
import { KanbanBoard } from './components/KanbanBoard';
import { ChecklistModule } from './components/ChecklistModule';
import { MaterialsModule } from './components/MaterialsModule';
import { ReportsModule } from './components/ReportsModule';
import { ScheduleModule } from './components/ScheduleModule';
import { MinhaAgenda } from './components/MinhaAgenda';
import { lerLink, limparLink } from './services/deeplink';
import { ConnectionBanner } from './components/ConnectionBanner';
import { PrivacyProvider } from './context/PrivacyContext';
import { InfraestruturaModule } from './components/dimensionamento/InfraestruturaModule';
import { FieldReportsModule } from './components/FieldReportsModule';
import { QuadrosModule } from './components/dimensionamento/QuadrosModule';
import { LoginScreenView } from './components/LoginScreenView';
import { UserManagementModal } from './components/UserManagementModal';
import { ObraModal } from './components/ObraModal';
import { FirebaseModal } from './components/FirebaseModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { ObraChatModal } from './components/ObraChatModal';
import { 
  Kanban, Layers, CheckSquare, BarChart3, Grid, Smartphone, Package, 
  Calendar, Wrench, FileText, MoreHorizontal, X, Menu, MessageSquare, Zap, BookOpen, CalendarCheck,
  ShieldCheck, Sun, Moon, LogOut
} from 'lucide-react';

function MainLayout() {
  const { currentUser, isAdmin, authReady, theme, toggleTheme, logout, users } = useAuth();
  const { obras, quadros, selectedObraId, setSelectedObraId, setSelectedQuadroId, activeObra, unreadNotifsCount } = useData();
  const [avisoLink, setAvisoLink] = useState('');
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

  // Link direto (etiqueta QR do quadro): abre a pasta do quadro assim que a obra estiver carregada.
  useEffect(() => {
    if (!currentUser) return undefined;
    const link = lerLink();
    if (!link) return undefined;
    const obra = obras.find((o) => o.id === link.obraId);
    const quadro = quadros.find((q) => q.id === link.quadroId && q.obraId === link.obraId);
    if (obra && quadro) {
      setSelectedObraId(obra.id);
      setSelectedQuadroId(quadro.id);
      setActiveTab('quadros');
      limparLink();
      return undefined;
    }
    // Ainda carregando do banco: espera um pouco antes de concluir que não há acesso.
    const t = setTimeout(() => {
      if (!lerLink()) return;
      setAvisoLink('Este quadro não foi encontrado ou você não tem acesso à obra dele. Peça ao administrador para incluir você na obra.');
      limparLink();
    }, 8000);
    return () => clearTimeout(t);
  }, [currentUser, obras, quadros]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aguarda o Firebase informar se há sessão salva (evita piscar a tela de login)
  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Conectando…
      </div>
    );
  }

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
      case 'kanban': return 'Visão Geral da Obra';
      case 'quadros': return 'Quadros';
      case 'checklist': return 'Checklist HVAC';
      case 'materials': return 'Controle de Materiais & PDF';
      case 'agenda': return 'Escala de Viagens';
      case 'personal_agenda': return 'Minha Agenda Pessoal';
      case 'infra': return 'Infraestrutura';
      case 'field_reports': return 'Diário de Campo & Mídias';
      case 'reports': return 'Relatórios Financeiros';
      default: return 'Visão Geral';
    }
  };

  // Which tabs are shown in the "More" menu
  const moreMenuTabs = [
    { id: 'checklist', icon: <CheckSquare size={16} />, label: 'Checklist HVAC' },
    { id: 'quadros', icon: <Zap size={16} />, label: 'Quadros' },
    { id: 'agenda', icon: <Calendar size={16} />, label: 'Escala de Viagens' },
    { id: 'infra', icon: <Wrench size={16} />, label: 'Infraestrutura' },
    { id: 'field_reports', icon: <FileText size={16} />, label: 'Diário de Campo' },
  ];

  if (isAdmin) {
    moreMenuTabs.push(
      { id: 'materials', icon: <Package size={16} />, label: 'Controle Materiais' },
      { id: 'reports', icon: <BarChart3 size={16} />, label: 'Relatórios' }
    );
  }

  const isMoreTabActive = moreMenuTabs.some(t => t.id === activeTab);

  const showSidebar = (!!selectedObraId && activeTab !== 'hub') || activeTab === 'personal_agenda';

  return (
    <div className="app-container">
      <Navbar 
        onOpenObraModal={handleOpenObraModal} 
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        onGoToHub={() => setActiveTab('hub')}
        onOpenPersonalAgenda={() => setActiveTab('personal_agenda')}
        onOpenChatModal={() => setIsChatModalOpen(true)}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      <ConnectionBanner />

      {avisoLink && (
        <div className="dq-alert" role="alert" style={{ margin: '0.75rem 1rem 0', background: 'var(--wash-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ flex: 1 }}>{avisoLink}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAvisoLink('')}>Fechar</button>
        </div>
      )}

      <div className="app-main">
        {showSidebar && (
          <div className="desktop-sidebar">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onOpenObraModal={handleOpenObraModal} 
            />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          <main className="content-body">
            {activeTab === 'hub' && (
              <ObraHubView 
                onSelectObra={handleSelectObraFromHub}
                onOpenObraModal={handleOpenObraModal}
              />
            )}

            {activeTab === 'kanban' && (
              <KanbanBoard onOpenObraModal={handleOpenObraModal} onNavigate={setActiveTab} />
            )}

            {activeTab === 'quadros' && (
              <QuadrosModule onOpenObraModal={handleOpenObraModal} onNavigate={setActiveTab} />
            )}

            {activeTab === 'checklist' && (
              <ChecklistModule onNavigate={setActiveTab} />
            )}

            {activeTab === 'agenda' && (
              <ScheduleModule defaultViewMode="obra" />
            )}

            {activeTab === 'personal_agenda' && (
              <MinhaAgenda onNavigate={setActiveTab} />
            )}

            {activeTab === 'infra' && (
              <InfraestruturaModule onNavigate={setActiveTab} />
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

            <button type="button" className="drawer-item" onClick={() => handleMobileTabSwitch('hub')}>
              <Grid size={16} /> Todas as obras
            </button>

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

            <div className="drawer-conta">
              {isAdmin && (
                <button type="button" className="drawer-item" onClick={() => { setIsMobileDrawerOpen(false); setIsUserManagementModalOpen(true); }}>
                  <ShieldCheck size={16} /> Gestão de usuários
                  {users.filter((u) => u.status === 'pending_approval').length > 0 && (
                    <b className="mobile-nav-badge static">{users.filter((u) => u.status === 'pending_approval').length}</b>
                  )}
                </button>
              )}
              <button type="button" className="drawer-item" onClick={() => { setIsMobileDrawerOpen(false); setIsPwaModalOpen(true); }}>
                <Smartphone size={16} /> Instalar na tela inicial
              </button>
              <button type="button" className="drawer-item" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Tema {theme === 'dark' ? 'claro' : 'escuro'}
              </button>
              <button type="button" className="drawer-item perigo" onClick={logout}>
                <LogOut size={16} /> Sair ({currentUser?.name?.split(' ')[0]})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {[
          ['kanban', Kanban, 'Visão geral', true],
          ['quadros', Layers, 'Quadros', true],
          ['field_reports', BookOpen, 'Diário', true],
          ['personal_agenda', CalendarCheck, 'Agenda', false]
        ].map(([id, Icone, rotulo, precisaObra]) => (
          <button
            key={id}
            type="button"
            onClick={() => handleMobileTabSwitch(precisaObra && !selectedObraId ? 'hub' : id)}
            className={`mobile-nav-item ${activeTab === id ? 'active' : ''}`}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icone size={20} />
            <span>{rotulo}</span>
            {id === 'personal_agenda' && unreadNotifsCount > 0 && <b className="mobile-nav-badge">{unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}</b>}
          </button>
        ))}
        <button type="button" onClick={() => setIsMobileDrawerOpen(true)} className={`mobile-nav-item ${isMobileDrawerOpen ? 'active' : ''}`}>
          <Menu size={20} />
          <span>Menu</span>
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
        <PrivacyProvider>
          <MainLayout />
        </PrivacyProvider>
      </DataProvider>
    </AuthProvider>
  );
}
