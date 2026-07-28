import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  saveFirestoreDoc, 
  subscribeFirestoreCollection, 
  isFirebaseActive 
} from '../services/firebase';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { currentUser, isAdmin, users } = useAuth();

  const [rawObras, setRawObras] = useState(() => {
    const saved = localStorage.getItem('omnifield_obras_v7');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedObraId, setSelectedObraId] = useState(() => {
    return localStorage.getItem('omnifield_selected_obra_v7') || null;
  });

  const [quadros, setQuadros] = useState(() => {
    const saved = localStorage.getItem('omnifield_quadros_v7');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedQuadroId, setSelectedQuadroId] = useState(null);

  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('omnifield_cards_v7');
    return saved ? JSON.parse(saved) : [];
  });

  const [checklists, setChecklists] = useState(() => {
    const saved = localStorage.getItem('omnifield_checklists_v7');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    const saved = localStorage.getItem('omnifield_purchase_orders_v7');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter Obras based on User Access Control List (ACL)
  const obras = rawObras.filter(o => {
    if (isAdmin) return true; // Admin sees all Obras
    if (!currentUser) return false;
    if (!o.assignedUserIds || o.assignedUserIds.length === 0) return true;
    return o.assignedUserIds.includes(currentUser.id);
  });

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('omnifield_obras_v7', JSON.stringify(rawObras)); }, [rawObras]);
  useEffect(() => { if (selectedObraId) localStorage.setItem('omnifield_selected_obra_v7', selectedObraId); }, [selectedObraId]);
  useEffect(() => { localStorage.setItem('omnifield_quadros_v7', JSON.stringify(quadros)); }, [quadros]);
  useEffect(() => { localStorage.setItem('omnifield_cards_v7', JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem('omnifield_checklists_v7', JSON.stringify(checklists)); }, [checklists]);
  useEffect(() => { localStorage.setItem('omnifield_purchase_orders_v7', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);

  // Automatic Real-time Synchronization with Firestore
  useEffect(() => {
    if (isFirebaseActive()) {
      const unsubObras = subscribeFirestoreCollection('obras', (data) => setRawObras(data));
      const unsubQuadros = subscribeFirestoreCollection('quadros', (data) => setQuadros(data));
      const unsubCards = subscribeFirestoreCollection('cards', (data) => setCards(data));
      const unsubChecklists = subscribeFirestoreCollection('checklists', (data) => setChecklists(data));
      const unsubPOs = subscribeFirestoreCollection('purchase_orders', (data) => setPurchaseOrders(data));

      return () => {
        unsubObras();
        unsubQuadros();
        unsubCards();
        unsubChecklists();
        unsubPOs();
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

  // Add Purchase Order & Auto-Deduct Total from Obra's Material Costs / Verba
  const addPurchaseOrder = (obraId, poData) => {
    if (!isAdmin || !obraId) return;
    const newPO = {
      id: `po-${Date.now()}`,
      obraId,
      createdAt: new Date().toISOString(),
      ...poData
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    if (isFirebaseActive()) saveFirestoreDoc('purchase_orders', newPO.id, newPO);

    // Auto-update Obra's materialCosts with PO total value (deducting from Obra Verba)
    const poValue = parseFloat(newPO.totalValue) || 0;
    setRawObras(prev => prev.map(o => {
      if (o.id === obraId) {
        const currentMatCost = parseFloat(o.materialCosts) || 0;
        const updatedMatCost = currentMatCost + poValue;
        const updatedObra = { ...o, materialCosts: updatedMatCost };
        if (isFirebaseActive()) saveFirestoreDoc('obras', obraId, updatedObra);
        return updatedObra;
      }
      return o;
    }));
  };

  // Toggle item status between 'Já Chegou' and 'Falta Chegar'
  const updatePOItemStatus = (orderId, itemId, newStatus) => {
    if (!isAdmin) return;
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === orderId) {
        const updatedItems = (po.items || []).map(itm => {
          if (itm.id === itemId) {
            return {
              ...itm,
              status: newStatus,
              quantityReceived: newStatus === 'Já Chegou' ? itm.quantityOrdered : 0
            };
          }
          return itm;
        });

        const updatedPO = { ...po, items: updatedItems };
        if (isFirebaseActive()) saveFirestoreDoc('purchase_orders', orderId, updatedPO);
        return updatedPO;
      }
      return po;
    }));
  };

  // Add Obra (Admin Only)
  const addObra = (obraData) => {
    if (!isAdmin) return;
    const newObra = {
      id: `ob-${Date.now()}`,
      progress: 0,
      initialBudget: parseFloat(obraData.initialBudget) || 1000000,
      addedBudget: parseFloat(obraData.addedBudget) || 0,
      materialCosts: parseFloat(obraData.materialCosts) || 0,
      plannedDays: parseInt(obraData.plannedDays) || 90,
      assignedUserIds: obraData.assignedUserIds || [],
      ...obraData
    };
    setRawObras(prev => [newObra, ...prev]);
    setSelectedObraId(newObra.id);
    if (isFirebaseActive()) saveFirestoreDoc('obras', newObra.id, newObra);
  };

  const updateObra = (obraId, updatedFields) => {
    if (!isAdmin) return;
    setRawObras(prev => prev.map(o => {
      if (o.id === obraId) {
        const updated = { ...o, ...updatedFields };
        if (isFirebaseActive()) saveFirestoreDoc('obras', obraId, updated);
        return updated;
      }
      return o;
    }));
  };

  const updateObraFinancials = (obraId, financialData) => {
    if (!isAdmin) return;
    setRawObras(prev => prev.map(o => {
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
        purchaseOrders,
        getObraLaborCostsAndDays,
        addPurchaseOrder,
        updatePOItemStatus,
        addObra,
        updateObra,
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
