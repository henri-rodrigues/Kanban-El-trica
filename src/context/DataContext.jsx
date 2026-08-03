import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  saveFirestoreDoc, 
  deleteFirestoreDoc,
  subscribeFirestoreCollection, 
  isFirebaseActive 
} from '../services/firebase';

const DataContext = createContext();

const safeParseJSON = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : (parsed || fallback);
  } catch (err) {
    console.error(`Error parsing ${key} from localStorage:`, err);
    return fallback;
  }
};

export const DataProvider = ({ children }) => {
  const { currentUser, isAdmin, users } = useAuth();

  const [rawObras, setRawObras] = useState(() => safeParseJSON('omnifield_obras_v7', []));
  const [selectedObraId, setSelectedObraId] = useState(() => localStorage.getItem('omnifield_selected_obra_v7') || null);
  const [quadros, setQuadros] = useState(() => safeParseJSON('omnifield_quadros_v7', []));
  const [selectedQuadroId, setSelectedQuadroId] = useState(null);
  const [cards, setCards] = useState(() => safeParseJSON('omnifield_cards_v7', []));
  const [checklists, setChecklists] = useState(() => safeParseJSON('omnifield_checklists_v7', []));
  const [purchaseOrders, setPurchaseOrders] = useState(() => safeParseJSON('omnifield_purchase_orders_v7', []));
  const [notifications, setNotifications] = useState(() => safeParseJSON('gestao_eletrica_notifications_v1', []));
  const [chatMessages, setChatMessages] = useState(() => safeParseJSON('gestao_eletrica_chat_v1', []));
  const [fieldReports, setFieldReports] = useState(() => safeParseJSON('gestao_eletrica_field_reports_v1', []));

  const getCardEvolutionPct = (column) => {
    switch (column) {
      case 'completed': return 100;
      case 'on_hold': return 66;
      case 'in_progress': return 33;
      default: return 0;
    }
  };

  // Filter Obras based on User Access Control List (ACL) and calculate dynamic completion progress (%) based on 4 stages
  const obras = rawObras.filter(o => {
    if (isAdmin) return true; // Admin sees all Obras
    if (!currentUser) return false;
    if (!o.assignedUserIds || o.assignedUserIds.length === 0) return true;
    return o.assignedUserIds.includes(currentUser.id);
  }).map(o => {
    const obraCards = cards.filter(c => c.obraId === o.id);
    const totalCards = obraCards.length;

    let totalEvolutionSum = 0;
    obraCards.forEach(c => {
      totalEvolutionSum += getCardEvolutionPct(c.column);
    });

    const calcProgress = totalCards > 0 ? Math.round(totalEvolutionSum / totalCards) : (o.progress || 0);

    return {
      ...o,
      progress: calcProgress
    };
  });

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('omnifield_obras_v7', JSON.stringify(rawObras)); }, [rawObras]);
  useEffect(() => { if (selectedObraId) localStorage.setItem('omnifield_selected_obra_v7', selectedObraId); }, [selectedObraId]);
  useEffect(() => { localStorage.setItem('omnifield_quadros_v7', JSON.stringify(quadros)); }, [quadros]);
  useEffect(() => { localStorage.setItem('omnifield_cards_v7', JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem('omnifield_checklists_v7', JSON.stringify(checklists)); }, [checklists]);
  useEffect(() => { localStorage.setItem('omnifield_purchase_orders_v7', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('gestao_eletrica_notifications_v1', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('gestao_eletrica_chat_v1', JSON.stringify(chatMessages)); }, [chatMessages]);
  useEffect(() => { localStorage.setItem('gestao_eletrica_field_reports_v1', JSON.stringify(fieldReports)); }, [fieldReports]);

  // Automatic Real-time Synchronization with Firestore
  useEffect(() => {
    if (isFirebaseActive()) {
      const unsubObras = subscribeFirestoreCollection('obras', (data) => setRawObras(data));
      const unsubQuadros = subscribeFirestoreCollection('quadros', (data) => setQuadros(data));
      const unsubCards = subscribeFirestoreCollection('cards', (data) => setCards(data));
      const unsubChecklists = subscribeFirestoreCollection('checklists', (data) => setChecklists(data));
      const unsubPOs = subscribeFirestoreCollection('purchase_orders', (data) => setPurchaseOrders(data));
      const unsubNotifs = subscribeFirestoreCollection('notifications', (data) => setNotifications(data));
      const unsubChat = subscribeFirestoreCollection('chat_messages', (data) => setChatMessages(data));
      const unsubReports = subscribeFirestoreCollection('field_reports', (data) => setFieldReports(data));

      return () => {
        unsubObras();
        unsubQuadros();
        unsubCards();
        unsubChecklists();
        unsubPOs();
        unsubNotifs();
        unsubChat();
        unsubReports();
      };
    }
  }, []);

  const addFieldReport = (obraId, reportData) => {
    if (!obraId) return;
    const newReport = {
      id: `fr-${Date.now()}`,
      obraId,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      authorId: currentUser?.id,
      authorName: currentUser?.name || 'Operador',
      images: [],
      videos: [],
      audios: [],
      assignedUserIds: [],
      ...reportData
    };

    setFieldReports(prev => [newReport, ...prev]);
    if (isFirebaseActive()) saveFirestoreDoc('field_reports', newReport.id, newReport);
  };

  const deleteFieldReport = (obraId, reportId) => {
    if (!isAdmin) return;
    setFieldReports(prev => prev.filter(r => r.id !== reportId));
  };

  const activeObra = obras.find(o => o.id === selectedObraId) || obras[0] || null;
  const activeQuadros = activeObra ? quadros.filter(q => q.obraId === activeObra.id) : [];
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

    // Auto-update Obra's materialCosts or infraSpentCost with PO total value based on destination
    const poValue = parseFloat(newPO.totalValue) || 0;
    const dest = newPO.destination || 'quadros';

    setRawObras(prev => prev.map(o => {
      if (o.id === obraId) {
        let updatedObra;
        if (dest === 'infraestrutura') {
          const currentInfraCost = parseFloat(o.infraSpentCost) || 0;
          updatedObra = { ...o, infraSpentCost: currentInfraCost + poValue };
        } else {
          const currentMatCost = parseFloat(o.materialCosts) || 0;
          updatedObra = { ...o, materialCosts: currentMatCost + poValue };
        }
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
    const materialsB = parseFloat(obraData.materialsBudget) || 0;
    const indirectsB = parseFloat(obraData.indirectsBudget) || 0;
    const infraB = parseFloat(obraData.infraBudget) || 0;
    const laborB = parseFloat(obraData.laborBudget) || 0;
    const totalCalc = materialsB + indirectsB + infraB + laborB;

    const newObra = {
      id: `ob-${Date.now()}`,
      progress: 0,
      materialsBudget: materialsB,
      indirectsBudget: indirectsB,
      infraBudget: infraB,
      laborBudget: laborB,
      addedBudget: parseFloat(obraData.addedBudget) || 0,
      materialCosts: parseFloat(obraData.materialCosts) || 0,
      plannedDays: parseInt(obraData.plannedDays) || 90,
      distanceKm: parseFloat(obraData.distanceKm) || 0,
      assignedUserIds: obraData.assignedUserIds || [],
      scheduledTrips: [],
      ...obraData,
      initialBudget: totalCalc > 0 ? totalCalc : (parseFloat(obraData.initialBudget) || 1000000)
    };
    setRawObras(prev => [newObra, ...prev]);
    setSelectedObraId(newObra.id);
    if (isFirebaseActive()) saveFirestoreDoc('obras', newObra.id, newObra);
  };

  const updateObra = (obraId, updatedFields) => {
    if (!isAdmin) return;
    setRawObras(prev => prev.map(o => {
      if (o.id === obraId) {
        const materialsB = updatedFields.materialsBudget !== undefined ? parseFloat(updatedFields.materialsBudget) || 0 : (o.materialsBudget || 0);
        const indirectsB = updatedFields.indirectsBudget !== undefined ? parseFloat(updatedFields.indirectsBudget) || 0 : (o.indirectsBudget || 0);
        const infraB = updatedFields.infraBudget !== undefined ? parseFloat(updatedFields.infraBudget) || 0 : (o.infraBudget || 0);
        const laborB = updatedFields.laborBudget !== undefined ? parseFloat(updatedFields.laborBudget) || 0 : (o.laborBudget || 0);
        const totalSum = materialsB + indirectsB + infraB + laborB;

        const updated = { 
          ...o, 
          ...updatedFields,
          materialsBudget: materialsB,
          indirectsBudget: indirectsB,
          infraBudget: infraB,
          laborBudget: laborB,
          initialBudget: totalSum > 0 ? totalSum : (updatedFields.initialBudget || o.initialBudget)
        };
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

  const addScheduledTrip = (obraId, tripData) => {
    if (!isAdmin) return;
    setRawObras(prev => prev.map(o => {
      if (o.id === obraId) {
        const currentTrips = o.scheduledTrips || [];
        const distKm = parseFloat(tripData.distanceKm || o.distanceKm || 0) || 0;
        const targetUserIds = tripData.userIds || (tripData.userId ? [tripData.userId] : []);
        const numColabs = targetUserIds.length || 1;
        const isDoubleCar = numColabs > 4;
        const baseCost = distKm * 1.5;
        const tripCost = tripData.cost !== undefined ? tripData.cost : (isDoubleCar ? baseCost * 2 : baseCost);

        const newTrip = {
          id: `trip-${Date.now()}`,
          cost: tripCost,
          userIds: targetUserIds,
          userNames: tripData.userNames || [tripData.userName || 'Operador'],
          isDoubleCar,
          createdAt: new Date().toISOString().split('T')[0],
          ...tripData
        };
        const updatedTrips = [...currentTrips, newTrip];
        const updated = {
          ...o,
          scheduledTrips: updatedTrips
        };
        if (isFirebaseActive()) saveFirestoreDoc('obras', obraId, updated);

        // Notify all booked users
        targetUserIds.forEach(targetId => {
          if (currentUser && targetId !== currentUser.id) {
            addNotification({
              recipientUserId: targetId,
              senderUserId: currentUser.id,
              senderName: currentUser.name,
              type: 'travel_schedule',
              title: `🛫 Viagem Agendada!`,
              message: `${currentUser.name} agendou sua viagem para a Obra "${o.name}" (${tripData.startDate} a ${tripData.endDate}). Total: ${numColabs} colaboradores (${isDoubleCar ? '2 carros - custo dobrado' : '1 carro'}).`,
              obraId: obraId
            });
          }
        });

        return updated;
      }
      return o;
    }));
  };

  const deleteScheduledTrip = (obraId, tripId) => {
    if (!isAdmin) return;
    setRawObras(prev => prev.map(o => {
      if (o.id === obraId) {
        const updatedTrips = (o.scheduledTrips || []).filter(t => t.id !== tripId);
        const updated = { ...o, scheduledTrips: updatedTrips };
        if (isFirebaseActive()) saveFirestoreDoc('obras', obraId, updated);
        return updated;
      }
      return o;
    }));
  };

  const STANDARD_QUADRO_POSTITS = [
    'Verificar orçamento e serviço vendido',
    'Verificar verbas',
    'kickoff-01',
    'Levantamento de cargas',
    'Topologia de comunicação e comando',
    'Levantamento de materiais',
    'Requisições dos materiais',
    'Projeto Elétrico',
    'Projeto de Automação',
    'Validação do Projeto Elétrico',
    'Validação do Projeto de Automação',
    'kickoff-02',
    'Conferência dos Pedidos de Compra',
    'Recebimento do material Elétrico',
    'Conferência do Material',
    'Montagem do Quadro',
    'Conferência da montagem',
    'Validação da Montagem',
    'Teste do Quadro',
    'Desenvolver Software CLP',
    'Desenvolver Software IHM',
    'Desenvolver Software Supervisório',
    'Teste de Automação',
    'Teste do Quadro',
    'Identificação Geral do Quadro',
    'Embalagem e Despacho do Quadro'
  ];

  const addQuadro = (quadroData) => {
    if (!selectedObraId) return;
    const newQuadroId = `qd-${Date.now()}`;
    const newQuadro = {
      id: newQuadroId,
      obraId: selectedObraId,
      status: 'Em Teste',
      ...quadroData
    };
    setQuadros(prev => [...prev, newQuadro]);
    setSelectedQuadroId(newQuadroId);
    if (isFirebaseActive()) saveFirestoreDoc('quadros', newQuadroId, newQuadro);

    // Auto-create 26 standard post-its for this new Quadro
    const autoCards = STANDARD_QUADRO_POSTITS.map((titleText, index) => {
      const cardId = `c-${Date.now()}-${index}`;

      // Etapa 1 (até Kickoff-01): AZUL (cyan)
      // Etapa 2 (entre Kickoff-01 e Kickoff-02): LARANJA (amber)
      // Etapa 3 (após Kickoff-02): VERDE (emerald)
      let autoGradientId = 'cyan'; // AZUL
      if (index >= 3 && index <= 11) {
        autoGradientId = 'amber'; // LARANJA
      } else if (index >= 12) {
        autoGradientId = 'emerald'; // VERDE
      }

      return {
        id: cardId,
        obraId: selectedObraId,
        quadroId: newQuadroId,
        level: 'quadro',
        column: 'todo',
        title: titleText,
        description: `Etapa padronizada ${index + 1}: ${titleText}`,
        priority: 'Média',
        gradientId: autoGradientId,
        stagePhase: index <= 2 ? 'pre-kickoff-01' : (index <= 11 ? 'mid-kickoff' : 'post-kickoff-02'),
        subtasks: [],
        images: [],
        workedDays: [],
        createdAt: new Date().toISOString().split('T')[0]
      };
    });

    setCards(prev => [...autoCards, ...prev]);
    if (isFirebaseActive()) {
      autoCards.forEach(c => saveFirestoreDoc('cards', c.id, c));
    }
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
    if (isFirebaseActive()) deleteFirestoreDoc('cards', cardId);
  };

  const deleteObra = (obraId) => {
    if (!isAdmin || !obraId) return;
    
    setRawObras(prev => prev.filter(o => o.id !== obraId));
    if (selectedObraId === obraId) {
      setSelectedObraId(null);
    }
    if (isFirebaseActive()) deleteFirestoreDoc('obras', obraId);

    // Cascade delete quadros, cards, checklists & purchase orders for this obra
    const obraQuadros = quadros.filter(q => q.obraId === obraId);
    obraQuadros.forEach(q => {
      if (isFirebaseActive()) deleteFirestoreDoc('quadros', q.id);
    });
    setQuadros(prev => prev.filter(q => q.obraId !== obraId));

    const obraCards = cards.filter(c => c.obraId === obraId);
    obraCards.forEach(c => {
      if (isFirebaseActive()) deleteFirestoreDoc('cards', c.id);
    });
    setCards(prev => prev.filter(c => c.obraId !== obraId));

    const obraChecklists = checklists.filter(chk => chk.obraId === obraId);
    obraChecklists.forEach(chk => {
      if (isFirebaseActive()) deleteFirestoreDoc('checklists', chk.id);
    });
    setChecklists(prev => prev.filter(chk => chk.obraId !== obraId));

    const obraPOs = purchaseOrders.filter(po => po.obraId === obraId);
    obraPOs.forEach(po => {
      if (isFirebaseActive()) deleteFirestoreDoc('purchase_orders', po.id);
    });
    setPurchaseOrders(prev => prev.filter(po => po.obraId !== obraId));
  };

  const deleteQuadro = (quadroId) => {
    if (!isAdmin || !quadroId) return;

    setQuadros(prev => prev.filter(q => q.id !== quadroId));
    if (selectedQuadroId === quadroId) {
      setSelectedQuadroId(null);
    }
    if (isFirebaseActive()) deleteFirestoreDoc('quadros', quadroId);

    // Cascade delete cards and checklists for this quadro
    const quadroCards = cards.filter(c => c.quadroId === quadroId);
    quadroCards.forEach(c => {
      if (isFirebaseActive()) deleteFirestoreDoc('cards', c.id);
    });
    setCards(prev => prev.filter(c => c.quadroId !== quadroId));

    const quadroChecklists = checklists.filter(chk => chk.quadroId === quadroId);
    quadroChecklists.forEach(chk => {
      if (isFirebaseActive()) deleteFirestoreDoc('checklists', chk.id);
    });
    setChecklists(prev => prev.filter(chk => chk.quadroId !== quadroId));
  };

  const deletePurchaseOrder = (orderId) => {
    if (!isAdmin || !orderId) return;

    const targetPO = purchaseOrders.find(po => po.id === orderId);
    if (targetPO) {
      const poValue = parseFloat(targetPO.totalValue) || 0;
      const dest = targetPO.destination || 'quadros';

      setRawObras(prev => prev.map(o => {
        if (o.id === targetPO.obraId) {
          let updatedObra;
          if (dest === 'infraestrutura') {
            const currentInfraCost = parseFloat(o.infraSpentCost) || 0;
            const updatedInfraCost = Math.max(0, currentInfraCost - poValue);
            updatedObra = { ...o, infraSpentCost: updatedInfraCost };
          } else {
            const currentMatCost = parseFloat(o.materialCosts) || 0;
            const updatedMatCost = Math.max(0, currentMatCost - poValue);
            updatedObra = { ...o, materialCosts: updatedMatCost };
          }
          if (isFirebaseActive()) saveFirestoreDoc('obras', o.id, updatedObra);
          return updatedObra;
        }
        return o;
      }));
    }

    setPurchaseOrders(prev => prev.filter(po => po.id !== orderId));
    if (isFirebaseActive()) deleteFirestoreDoc('purchase_orders', orderId);
  };

  const updatePurchaseOrderCategory = (orderId, newDestination) => {
    if (!isAdmin || !orderId) return;

    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === orderId) {
        const oldDest = po.destination || 'quadros';
        if (oldDest === newDestination) return po;

        const poValue = parseFloat(po.totalValue) || 0;
        setRawObras(rawPrev => rawPrev.map(o => {
          if (o.id === po.obraId) {
            let updatedObra = { ...o };
            if (oldDest === 'infraestrutura') {
              updatedObra.infraSpentCost = Math.max(0, (parseFloat(o.infraSpentCost) || 0) - poValue);
            } else {
              updatedObra.materialCosts = Math.max(0, (parseFloat(o.materialCosts) || 0) - poValue);
            }

            if (newDestination === 'infraestrutura') {
              updatedObra.infraSpentCost = (parseFloat(updatedObra.infraSpentCost) || 0) + poValue;
            } else {
              updatedObra.materialCosts = (parseFloat(updatedObra.materialCosts) || 0) + poValue;
            }

            if (isFirebaseActive()) saveFirestoreDoc('obras', o.id, updatedObra);
            return updatedObra;
          }
          return o;
        }));

        const updatedPO = { ...po, destination: newDestination };
        if (isFirebaseActive()) saveFirestoreDoc('purchase_orders', orderId, updatedPO);
        return updatedPO;
      }
      return po;
    }));
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

  // Filter notifications for current logged in user
  const myNotifications = notifications.filter(n => n.recipientUserId === currentUser?.id);
  const unreadNotifsCount = myNotifications.filter(n => !n.read).length;

  const addNotification = (notifData) => {
    if (!notifData || !notifData.recipientUserId) return;
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notifData
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (isFirebaseActive()) saveFirestoreDoc('notifications', newNotif.id, newNotif);
  };

  const markNotificationAsRead = (notifId) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === notifId) {
        const updated = { ...n, read: true };
        if (isFirebaseActive()) saveFirestoreDoc('notifications', notifId, updated);
        return updated;
      }
      return n;
    }));
  };

  const clearAllNotifications = () => {
    if (!currentUser) return;
    const targetNotifs = notifications.filter(n => n.recipientUserId === currentUser.id);
    setNotifications(prev => prev.filter(n => n.recipientUserId !== currentUser.id));
    targetNotifs.forEach(n => {
      if (isFirebaseActive()) deleteFirestoreDoc('notifications', n.id);
    });
  };

  const sendChatMessage = (obraId, text) => {
    if (!currentUser || !obraId || !text || !text.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      obraId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderTitle: currentUser.title || 'Técnico',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newMsg]);
    if (isFirebaseActive()) saveFirestoreDoc('chat_messages', newMsg.id, newMsg);

    // Notify other authorized members of the Obra about the message
    const obra = rawObras.find(o => o.id === obraId);
    const memberIds = obra?.assignedUserIds && obra.assignedUserIds.length > 0
      ? obra.assignedUserIds
      : users.map(u => u.id);

    memberIds.forEach(recipientId => {
      if (recipientId !== currentUser.id) {
        addNotification({
          recipientUserId: recipientId,
          senderUserId: currentUser.id,
          senderName: currentUser.name,
          type: 'chat',
          title: `Nova mensagem no Chat da Obra`,
          message: `${currentUser.name}: "${text.trim().substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          obraId
        });
      }
    });
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
        notifications,
        myNotifications,
        unreadNotifsCount,
        addNotification,
        markNotificationAsRead,
        clearAllNotifications,
        chatMessages,
        sendChatMessage,
        getObraLaborCostsAndDays,
        addPurchaseOrder,
        updatePurchaseOrderCategory,
        updatePOItemStatus,
        deletePurchaseOrder,
        addObra,
        updateObra,
        deleteObra,
        updateObraFinancials,
        addQuadro,
        deleteQuadro,
        addCard,
        updateCardStatus,
        updateCard,
        deleteCard,
        addWorkLogToCard,
        updateChecklistStatus,
        addChecklistItem,
        addScheduledTrip,
        deleteScheduledTrip,
        getCardEvolutionPct,
        fieldReports,
        addFieldReport,
        deleteFieldReport
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
