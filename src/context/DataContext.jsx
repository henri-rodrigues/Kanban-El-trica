import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const INITIAL_OBRAS = [
  {
    id: 'ob-1',
    name: 'Hospital Central - Edifício Anexo',
    code: 'OBR-2026-HC',
    location: 'São Paulo, SP',
    client: 'Rede Saúde Alfa',
    initialBudget: 1500000,
    addedBudget: 350000, // Verbas Adicionais
    materialCosts: 720000, // Custos com Materiais
    plannedDays: 120, // Dias Planejados
    startDate: '2026-01-15',
    endDate: '2026-09-30',
    status: 'Em Andamento',
    progress: 68
  },
  {
    id: 'ob-2',
    name: 'Data Center Alpha - HVAC & Automação',
    code: 'OBR-2026-DC',
    location: 'Barueri, SP',
    client: 'CloudTech Telecom',
    initialBudget: 3000000,
    addedBudget: 400000,
    materialCosts: 1850000,
    plannedDays: 180,
    startDate: '2025-11-01',
    endDate: '2026-08-15',
    status: 'Comissionamento',
    progress: 88
  },
  {
    id: 'ob-3',
    name: 'Torre Comercial Horizon',
    code: 'OBR-2026-TH',
    location: 'Rio de Janeiro, RJ',
    client: 'Horizon Empreendimentos',
    initialBudget: 900000,
    addedBudget: 80000,
    materialCosts: 140000,
    plannedDays: 90,
    startDate: '2026-03-01',
    endDate: '2026-11-20',
    status: 'Planejamento',
    progress: 25
  }
];

const INITIAL_QUADROS = [
  {
    id: 'qd-101',
    obraId: 'ob-1',
    name: 'CAG-01 - Central de Água Gelada',
    category: 'HVAC Chiller',
    location: 'Subsolo 2 - Casa de Máquinas',
    status: 'Em Comissionamento',
    description: 'Chillers de parafuso 350 TR e conjunto de bombas primárias/secundárias.'
  },
  {
    id: 'qd-102',
    obraId: 'ob-1',
    name: 'AHU-UTI - Unidade Tratamento de Ar UTI',
    category: 'Filtragem & Ar Limpo',
    location: '4º Andar - Bloco Cirúrgico',
    status: 'Em Teste',
    description: 'Filtragem HEPA H14, controle estrito de pressão positiva e umidade.'
  },
  {
    id: 'qd-103',
    obraId: 'ob-1',
    name: 'QTA-EMERG - Transferência Automática',
    category: 'Painel Elétrico',
    location: 'Subsolo 1 - Sala Elétrica',
    status: 'Concluído',
    description: 'Quadro de comutação rede/gerador para alimentação crítica.'
  }
];

const INITIAL_CARDS = [
  {
    id: 'c-1',
    obraId: 'ob-1',
    quadroId: null,
    level: 'obra',
    title: 'Desenvolvimento da Programação & Vistoria de Dutos',
    description: 'Ajustar rotinas de controle Modbus e inspecionar alinhamento e isolamento térmico nos andares 1 a 4.',
    fieldNotes: 'O que falta fazer: concluir rotina de trip de emergência e ajustar ganhos PID da malha de temperatura.',
    column: 'in_progress',
    assignedUserId: 'usr-1',
    assignedUserName: 'Eng. Ricardo Silva',
    userColor: '#2563eb',
    priority: 'Alta',
    subtasks: [
      { id: 'st-1', title: 'Teste de pressão nos dutos do 3º andar', completed: true },
      { id: 'st-2', title: 'Ajuste de ganho PID do sensor de temperatura', completed: false },
      { id: 'st-3', title: 'Validação da rotina Modbus no supervisório', completed: false }
    ],
    images: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80'
    ],
    workedDays: [
      { id: 'w-1', date: '2026-07-24', hours: 8, operatorId: 'usr-2', operatorName: 'Carlos Eduardo', notes: 'Inspeção visual dos dutos no 3º e 4º pavimento concluída.' },
      { id: 'w-2', date: '2026-07-25', hours: 8, operatorId: 'usr-3', operatorName: 'Mariana Costa', notes: 'Teste de pressão preliminar na prumada principal.' }
    ],
    createdAt: '2026-07-20'
  },
  {
    id: 'c-2',
    obraId: 'ob-1',
    quadroId: 'qd-101',
    level: 'quadro',
    title: 'Teste TAB de Vazão d\'Água Gelada nas Bombas',
    description: 'Ajustar balanceamento hidráulico de acordo com a planilha de projeto (120 m³/h).',
    fieldNotes: 'Medição realizada com manômetro diferencial calibrado.',
    column: 'commissioning',
    assignedUserId: 'usr-2',
    assignedUserName: 'Carlos Eduardo',
    userColor: '#d97706',
    priority: 'Alta',
    subtasks: [],
    images: [],
    workedDays: [
      { id: 'w-4', date: '2026-07-26', hours: 8, operatorId: 'usr-2', operatorName: 'Carlos Eduardo', notes: 'Ajuste de válvulas de balanceamento estático.' }
    ],
    createdAt: '2026-07-23'
  }
];

const INITIAL_CHECKLISTS = [
  {
    id: 'chk-1',
    obraId: 'ob-1',
    quadroId: 'qd-101',
    category: 'HVAC - Balanço & TAB',
    title: 'Medição de Pressão Diferencial no Evaporador do Chiller',
    description: 'Verificar se a queda de pressão d\'água está conforme a curva do fabricante.',
    status: 'pass',
    evidenceImage: null,
    testedBy: 'Carlos Eduardo',
    testedDate: '2026-07-26',
    notes: 'Queda de pressão aferida: 45 kPa. Aprovado.'
  }
];

export const DataProvider = ({ children }) => {
  const { users } = useAuth();

  const [obras, setObras] = useState(() => {
    const saved = localStorage.getItem('omnifield_obras_v2');
    return saved ? JSON.parse(saved) : INITIAL_OBRAS;
  });

  const [selectedObraId, setSelectedObraId] = useState(() => {
    return localStorage.getItem('omnifield_selected_obra_v2') || 'ob-1';
  });

  const [quadros, setQuadros] = useState(() => {
    const saved = localStorage.getItem('omnifield_quadros_v2');
    return saved ? JSON.parse(saved) : INITIAL_QUADROS;
  });

  const [selectedQuadroId, setSelectedQuadroId] = useState(null);

  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('omnifield_cards_v2');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [checklists, setChecklists] = useState(() => {
    const saved = localStorage.getItem('omnifield_checklists_v2');
    return saved ? JSON.parse(saved) : INITIAL_CHECKLISTS;
  });

  useEffect(() => { localStorage.setItem('omnifield_obras_v2', JSON.stringify(obras)); }, [obras]);
  useEffect(() => { localStorage.setItem('omnifield_selected_obra_v2', selectedObraId); }, [selectedObraId]);
  useEffect(() => { localStorage.setItem('omnifield_quadros_v2', JSON.stringify(quadros)); }, [quadros]);
  useEffect(() => { localStorage.setItem('omnifield_cards_v2', JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem('omnifield_checklists_v2', JSON.stringify(checklists)); }, [checklists]);

  const activeObra = obras.find(o => o.id === selectedObraId) || obras[0];
  const activeQuadros = quadros.filter(q => q.obraId === selectedObraId);
  const activeQuadro = quadros.find(q => q.id === selectedQuadroId);

  // Calculate dynamic labor costs & total days spent for an Obra
  const getObraLaborCostsAndDays = (obraId) => {
    const obraCards = cards.filter(c => c.obraId === obraId);
    let totalLaborCost = 0;
    const uniqueDaysSet = new Set();
    let totalHours = 0;

    obraCards.forEach(c => {
      (c.workedDays || []).forEach(w => {
        const user = users.find(u => u.id === w.operatorId || u.name === w.operatorName);
        const dailyRate = user?.dailyRate || 250;
        const hours = w.hours || 8;
        const dayCost = (hours / 8) * dailyRate;
        totalLaborCost += dayCost;
        totalHours += hours;

        if (w.date) {
          uniqueDaysSet.add(`${w.date}-${w.operatorName}`);
        }
      });
    });

    const daysSpent = Math.round((totalHours / 8) * 10) / 10;
    return { totalLaborCost, daysSpent, totalHours };
  };

  const addObra = (obraData) => {
    const newObra = {
      id: `ob-${Date.now()}`,
      progress: 0,
      initialBudget: parseFloat(obraData.initialBudget) || 1000000,
      addedBudget: parseFloat(obraData.addedBudget) || 0,
      materialCosts: parseFloat(obraData.materialCosts) || 0,
      plannedDays: parseInt(obraData.plannedDays) || 90,
      ...obraData
    };
    setObras(prev => [newObra, ...prev]);
    setSelectedObraId(newObra.id);
  };

  const updateObraFinancials = (obraId, financialData) => {
    setObras(prev => prev.map(o => o.id === obraId ? { ...o, ...financialData } : o));
  };

  const addQuadro = (quadroData) => {
    const newQuadro = {
      id: `qd-${Date.now()}`,
      obraId: selectedObraId,
      status: 'Em Teste',
      ...quadroData
    };
    setQuadros(prev => [...prev, newQuadro]);
    setSelectedQuadroId(newQuadro.id);
  };

  const addCard = (cardData) => {
    const newCard = {
      id: `c-${Date.now()}`,
      obraId: selectedObraId,
      quadroId: selectedQuadroId,
      level: selectedQuadroId ? 'quadro' : 'obra',
      column: 'todo',
      fieldNotes: cardData.fieldNotes || '',
      subtasks: cardData.subtasks || [],
      images: cardData.images || [],
      workedDays: cardData.workedDays || [],
      createdAt: new Date().toISOString().split('T')[0],
      ...cardData
    };
    setCards(prev => [newCard, ...prev]);
  };

  const updateCardStatus = (cardId, newColumn) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, column: newColumn } : c));
  };

  const updateCard = (cardId, updatedFields) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updatedFields } : c));
  };

  const deleteCard = (cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  };

  const addWorkLogToCard = (cardId, log) => {
    const newLog = {
      id: `w-${Date.now()}`,
      ...log
    };
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          workedDays: [...(c.workedDays || []), newLog]
        };
      }
      return c;
    }));
  };

  const updateChecklistStatus = (checkId, status, notes, evidenceImage, user) => {
    setChecklists(prev => prev.map(item => {
      if (item.id === checkId) {
        return {
          ...item,
          status,
          notes: notes !== undefined ? notes : item.notes,
          evidenceImage: evidenceImage !== undefined ? evidenceImage : item.evidenceImage,
          testedBy: user ? user.name : item.testedBy,
          testedDate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));
  };

  const addChecklistItem = (itemData) => {
    const newItem = {
      id: `chk-${Date.now()}`,
      obraId: selectedObraId,
      quadroId: selectedQuadroId || activeQuadros[0]?.id || null,
      status: 'pending',
      evidenceImage: null,
      testedBy: null,
      testedDate: null,
      notes: '',
      ...itemData
    };
    setChecklists(prev => [...prev, newItem]);
  };

  return (
    <DataContext.Provider
      value={{
        obras,
        selectedObraId,
        setSelectedObraId,
        activeObra,
        quadros,
        activeQuadros,
        selectedQuadroId,
        setSelectedQuadroId,
        activeQuadro,
        cards,
        checklists,
        getObraLaborCostsAndDays,
        addObra,
        updateObraFinancials,
        addQuadro,
        addCard,
        updateCardStatus,
        updateCard,
        deleteCard,
        addWorkLogToCard,
        updateChecklistStatus,
        addChecklistItem
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
