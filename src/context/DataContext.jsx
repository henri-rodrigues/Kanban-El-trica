import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  saveFirestoreDoc, 
  subscribeFirestoreCollection, 
  isFirebaseActive 
} from '../services/firebase';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { users } = useAuth();

  const [obras, setObras] = useState(() => {
    const saved = localStorage.getItem('omnifield_obras_clean');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedObraId, setSelectedObraId] = useState(() => {
    return localStorage.getItem('omnifield_selected_obra_clean') || null;
  });

  const [quadros, setQuadros] = useState(() => {
    const saved = localStorage.getItem('omnifield_quadros_clean');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedQuadroId, setSelectedQuadroId] = useState(null);

  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('omnifield_cards_clean');
    return saved ? JSON.parse(saved) : [];
  });

  const [checklists, setChecklists] = useState(() => {
    const saved = localStorage.getItem('omnifield_checklists_clean');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('omnifield_obras_clean', JSON.stringify(obras)); }, [obras]);
  useEffect(() => { if (selectedObraId) localStorage.setItem('omnifield_selected_obra_clean', selectedObraId); }, [selectedObraId]);
  useEffect(() => { localStorage.setItem('omnifield_quadros_clean', JSON.stringify(quadros)); }, [quadros]);
  useEffect(() => { localStorage.setItem('omnifield_cards_clean', JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem('omnifield_checklists_clean', JSON.stringify(checklists)); }, [checklists]);

  // Real-time synchronization with Firestore when Firebase is configured
  useEffect(() => {
    if (isFirebaseActive()) {
      const unsubObras = subscribeFirestoreCollection('obras', (data) => {
        setObras(data);
        if (data.length && !selectedObraId) setSelectedObraId(data[0].id);
      });
      const unsubQuadros = subscribeFirestoreCollection('quadros', (data) => setQuadros(data));
      const unsubCards = subscribeFirestoreCollection('cards', (data) => setCards(data));
      const unsubChecklists = subscribeFirestoreCollection('checklists', (data) => setChecklists(data));

      return () => {
        unsubObras();
        unsubQuadros();
        unsubCards();
        unsubChecklists();
      };
    }
  }, []);

  const activeObra = obras.find(o => o.id === selectedObraId) || obras[0] || null;
  const activeQuadros = selectedObraId ? quadros.filter(q => q.obraId === selectedObraId) : [];
  const activeQuadro = quadros.find(q => q.id === selectedQuadroId);

  const getObraLaborCostsAndDays = (obraId) => {
    if (!obraId) return { totalLaborCost: 0, daysSpent: 0, totalHours: 0 };
    const obraCards = cards.filter(c => c.obraId === obraId);
    let totalLaborCost = 0;
    let totalHours = 0;

    obraCards.forEach(c => {
      (c.workedDays || []).forEach(w => {
        const user = users.find(u => u.id === w.operatorId || u.name === w.operatorName);
        const dailyRate = user?.dailyRate || 250;
        const hours = w.hours || 8;
        const dayCost = (hours / 8) * dailyRate;
        totalLaborCost += dayCost;
        totalHours += hours;
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
    if (isFirebaseActive()) saveFirestoreDoc('obras', newObra.id, newObra);
  };

  const updateObraFinancials = (obraId, financialData) => {
    setObras(prev => prev.map(o => {
      if (o.id === obraId) {
        const updated = { ...o, ...financialData };
        if (isFirebaseActive()) saveFirestoreDoc('obras', obraId, updated);
        return updated;
      }
      return o;
    }));
  };

  const addQuadro = (quadroData) => {
    if (!selectedObraId) return;
    const newQuadro = {
      id: `qd-${Date.now()}`,
      obraId: selectedObraId,
      status: 'Em Teste',
      ...quadroData
    };
    setQuadros(prev => [...prev, newQuadro]);
    setSelectedQuadroId(newQuadro.id);
    if (isFirebaseActive()) saveFirestoreDoc('quadros', newQuadro.id, newQuadro);
  };

  const addCard = (cardData) => {
    if (!selectedObraId) return;
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
    if (isFirebaseActive()) saveFirestoreDoc('cards', newCard.id, newCard);
  };

  const updateCardStatus = (cardId, newColumn) => {
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const updated = { ...c, column: newColumn };
        if (isFirebaseActive()) saveFirestoreDoc('cards', cardId, updated);
        return updated;
      }
      return c;
    }));
  };

  const updateCard = (cardId, updatedFields) => {
    setCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const updated = { ...c, ...updatedFields };
        if (isFirebaseActive()) saveFirestoreDoc('cards', cardId, updated);
        return updated;
      }
      return c;
    }));
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
        const updated = {
          ...c,
          workedDays: [...(c.workedDays || []), newLog]
        };
        if (isFirebaseActive()) saveFirestoreDoc('cards', cardId, updated);
        return updated;
      }
      return c;
    }));
  };

  const updateChecklistStatus = (checkId, status, notes, evidenceImage, user) => {
    setChecklists(prev => prev.map(item => {
      if (item.id === checkId) {
        const updated = {
          ...item,
          status,
          notes: notes !== undefined ? notes : item.notes,
          evidenceImage: evidenceImage !== undefined ? evidenceImage : item.evidenceImage,
          testedBy: user ? user.name : item.testedBy,
          testedDate: new Date().toISOString().split('T')[0]
        };
        if (isFirebaseActive()) saveFirestoreDoc('checklists', checkId, updated);
        return updated;
      }
      return item;
    }));
  };

  const addChecklistItem = (itemData) => {
    if (!selectedObraId) return;
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
    if (isFirebaseActive()) saveFirestoreDoc('checklists', newItem.id, newItem);
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
