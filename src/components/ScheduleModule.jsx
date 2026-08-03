import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  Send, 
  Check, 
  X, 
  AlertCircle, 
  Plane, 
  Car, 
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Briefcase,
  Building2,
  Info
} from 'lucide-react';

export const ScheduleModule = ({ defaultViewMode = 'obra' }) => {
  const { isAdmin, users, currentUser } = useAuth();
  const { obras, activeObra, addScheduledTrip, deleteScheduledTrip } = useData();

  const [activeViewMode, setActiveViewMode] = useState(defaultViewMode); // 'obra' | 'personal'

  React.useEffect(() => {
    if (defaultViewMode) {
      setActiveViewMode(defaultViewMode);
    }
  }, [defaultViewMode]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedPersonalTripDetail, setSelectedPersonalTripDetail] = useState(null);

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!activeObra && activeViewMode === 'obra') {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <AlertCircle size={48} className="text-amber" style={{ marginBottom: '1rem' }} />
        <h3>Nenhuma Obra Selecionada</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Selecione uma obra na vitrine para gerenciar a escala da equipe da obra ou acesse sua Agenda Pessoal abaixo.
        </p>
        <button onClick={() => setActiveViewMode('personal')} className="btn btn-primary">
          <UserCheck size={16} /> Ver Minha Agenda Pessoal
        </button>
      </div>
    );
  }

  const scheduledTrips = activeObra?.scheduledTrips || [];
  const distanceKm = parseFloat(activeObra?.distanceKm) || 0;
  const baseTripCost = distanceKm * 1.5;

  const totalTravelSpent = scheduledTrips.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);

  // Available users for this obra
  const assignedUsers = users.filter(u => (activeObra?.assignedUserIds || []).includes(u.id));

  const handleOpenAddModal = (dateStr) => {
    if (!isAdmin) return;
    if (dateStr) {
      setStartDate(dateStr);
      setEndDate(dateStr);
    }
    if (users.length > 0) {
      const defaultUser = assignedUsers[0] || users[0];
      setSelectedUserIds([defaultUser.id]);
    }
    setIsModalOpen(true);
  };

  const handleToggleUserSelection = (userId) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Cost calculation for selected collaborators in modal
  const modalColabCount = selectedUserIds.length || 1;
  const modalIsDoubleCar = modalColabCount > 4;
  const modalCalculatedCost = modalIsDoubleCar ? baseTripCost * 2 : baseTripCost;

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserIds.length || !startDate || !endDate || !activeObra) return;

    const selectedUsersObj = users.filter(u => selectedUserIds.includes(u.id));
    const userNames = selectedUsersObj.map(u => u.name);

    addScheduledTrip(activeObra.id, {
      userIds: selectedUserIds,
      userNames: userNames,
      userName: userNames.join(', '),
      userColorTag: selectedUsersObj[0]?.userColorTag || 'var(--accent-blue)',
      startDate,
      endDate,
      distanceKm,
      cost: modalCalculatedCost,
      isDoubleCar: modalIsDoubleCar,
      notes: notes || `Viagem de serviço para ${activeObra.name}`
    });

    setIsModalOpen(false);
    setNotes('');
  };

  // Infinite Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Build calendar month grid for selected month
  const today = new Date();
  const currentYear = currentCalendarDate.getFullYear();
  const currentMonth = currentCalendarDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Collect personal trips for current user across ALL obras
  const myPersonalTrips = [];
  if (currentUser) {
    obras.forEach(obra => {
      (obra.scheduledTrips || []).forEach(trip => {
        const isUserIncluded = (trip.userIds && trip.userIds.includes(currentUser.id)) || trip.userId === currentUser.id;
        if (isUserIncluded) {
          myPersonalTrips.push({
            ...trip,
            obraId: obra.id,
            obraName: obra.name,
            obraCode: obra.code || 'N/A',
            obraClient: obra.client || 'Cliente'
          });
        }
      });
    });
  }

  // Count distinct obras user is traveling to
  const personalObrasCount = new Set(myPersonalTrips.map(t => t.obraId)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* View Switcher Bar: Obra Agenda vs Minha Agenda Pessoal */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {activeObra && (
            <button
              type="button"
              onClick={() => setActiveViewMode('obra')}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: activeViewMode === 'obra' ? 'var(--accent-blue)' : 'transparent',
                color: activeViewMode === 'obra' ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <CalendarIcon size={15} /> Agenda da Obra ({activeObra?.name || 'Geral'})
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveViewMode('personal')}
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeViewMode === 'personal' ? 'var(--accent-purple)' : 'transparent',
              color: activeViewMode === 'personal' ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <UserCheck size={15} /> 📅 Minha Agenda Pessoal ({myPersonalTrips.length} viagens em {personalObrasCount} obras)
          </button>
        </div>

        {activeViewMode === 'obra' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Custo Total de Viagens</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {formatBRL(totalTravelSpent)}
              </div>
            </div>

            {isAdmin && (
              <button onClick={() => handleOpenAddModal(null)} className="btn btn-primary btn-sm">
                <Plus size={16} /> Agendar Viagem
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: AGENDA DA OBRA ATIVA */}
      {activeViewMode === 'obra' && activeObra && (
        <>
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
                <CalendarIcon size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                  <span className="badge badge-blue">Escala de Viagens de Equipe</span>
                  <span className="badge badge-amber"><MapPin size={12} /> {distanceKm} km (R$ 1,50/km)</span>
                  <span className="badge badge-purple"><Car size={12} /> Acima de 4 pessoas = 2 Carros</span>
                </div>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  Agenda de Alocação - {activeObra.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Main Grid: Calendar + Trips List */}
          <div className="schedule-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            {/* Calendar Grid */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button 
                    type="button" 
                    onClick={handlePrevMonth} 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem' }}
                    title="Mês Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    📅 {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <button 
                    type="button" 
                    onClick={handleNextMonth} 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem' }}
                    title="Próximo Mês"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isAdmin ? 'Clique em um dia para agendar equipe' : 'Modo de Visualização para Operadores'}
                </span>
              </div>

              {/* Day of Week Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>

              {/* Days Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {/* Empty slots before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="calendar-cell" style={{ height: '75px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }} />
                ))}

                {daysArray.map(day => {
                  const dayFormatted = day < 10 ? `0${day}` : `${day}`;
                  const monthFormatted = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
                  const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

                  // Find trips on this day
                  const dayTrips = scheduledTrips.filter(t => dateStr >= t.startDate && dateStr <= t.endDate);

                  const isToday = day === today.getDate();

                  return (
                    <div
                      key={day}
                      className="calendar-cell"
                      onClick={() => isAdmin && handleOpenAddModal(dateStr)}
                      style={{
                        height: '75px',
                        borderRadius: '6px',
                        border: isToday ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        background: dayTrips.length > 0 ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-main)',
                        padding: '4px',
                        cursor: isAdmin ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'border-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => isAdmin && (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                      onMouseLeave={(e) => isAdmin && (e.currentTarget.style.borderColor = isToday ? 'var(--accent-blue)' : 'var(--border-color)')}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isToday ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                        {day}
                      </div>

                      {/* Badges of booked users */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                        {dayTrips.map(trip => {
                          const colabNames = trip.userNames ? trip.userNames.join(', ') : (trip.userName || 'Equipe');
                          return (
                            <div
                              key={trip.id}
                              style={{
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                borderRadius: '3px',
                                padding: '1px 3px',
                                background: trip.isDoubleCar ? 'var(--accent-amber)' : (trip.userColorTag || 'var(--accent-blue)'),
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={`${colabNames}: ${trip.notes} (${trip.isDoubleCar ? '2 carros' : '1 carro'} - R$ ${trip.cost})`}
                            >
                              ✈️ {colabNames.split(',')[0]} {trip.isDoubleCar ? '🚘🚘' : '🚘'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trips List Panel */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plane size={18} className="text-blue" /> Viagens Agendadas ({scheduledTrips.length})
              </h3>

              {scheduledTrips.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '500px' }}>
                  {scheduledTrips.map(trip => {
                    const colabsList = trip.userNames ? trip.userNames : [trip.userName || 'Operador'];
                    return (
                      <div
                        key={trip.id}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          borderLeft: `4px solid ${trip.isDoubleCar ? 'var(--accent-amber)' : (trip.userColorTag || 'var(--accent-blue)')}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            👥 {colabsList.join(', ')}
                          </strong>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Cancelar agendamento de viagem da equipe?`)) {
                                  deleteScheduledTrip(activeObra.id, trip.id);
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                              title="Excluir Viagem"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div>📅 <strong>Período:</strong> {trip.startDate} até {trip.endDate}</div>
                          <div>
                            {trip.isDoubleCar ? (
                              <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>🚘🚘 2 Carros (Mais de 4 pessoas - Custo Dobrado): {formatBRL(trip.cost)}</span>
                            ) : (
                              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>🚘 1 Carro: {formatBRL(trip.cost)}</span>
                            )}
                          </div>
                          {trip.notes && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                              "{trip.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  Nenhuma viagem agendada até o momento.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: MINHA AGENDA PESSOAL (VISUAL CALENDAR GRID + PERSONAL TRIPS LIST) */}
      {activeViewMode === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Banner */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                  <span className="badge badge-purple">Minha Agenda Pessoal de Campo</span>
                  <span className="badge badge-blue">🏢 {personalObrasCount} Obra(s) Programada(s)</span>
                  <span className="badge badge-emerald">✈️ {myPersonalTrips.length} Viagem(ns) no Total</span>
                </div>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  Agenda de Viagens de {currentUser?.name || 'Usuário'}
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Calendário mensal unificado com todas as suas viagens agendadas em todas as obras.
                </p>
              </div>
            </div>
          </div>

          {/* Main Grid: Personal Visual Calendar + Personal Trips List */}
          <div className="schedule-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
            {/* Visual Calendar Grid for Personal Agenda */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button 
                    type="button" 
                    onClick={handlePrevMonth} 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem' }}
                    title="Mês Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    📅 {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <button 
                    type="button" 
                    onClick={handleNextMonth} 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem' }}
                    title="Próximo Mês"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Minhas Viagens por Obra
                </span>
              </div>

              {/* Day of Week Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>

              {/* Days Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {/* Empty slots before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-p-${idx}`} className="calendar-cell" style={{ height: '80px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }} />
                ))}

                {daysArray.map(day => {
                  const dayFormatted = day < 10 ? `0${day}` : `${day}`;
                  const monthFormatted = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
                  const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

                  // Find user personal trips on this day across all obras
                  const dayTrips = myPersonalTrips.filter(t => dateStr >= t.startDate && dateStr <= t.endDate);

                  const isToday = day === today.getDate();

                  return (
                    <div
                      key={day}
                      className="calendar-cell"
                      style={{
                        height: '80px',
                        borderRadius: '6px',
                        border: isToday ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                        background: dayTrips.length > 0 ? 'rgba(124, 58, 237, 0.12)' : 'var(--bg-main)',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isToday ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
                        {day}
                      </div>

                      {/* Badges of user's personal trips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                        {dayTrips.map(trip => (
                          <div
                            key={trip.id}
                            onClick={() => setSelectedPersonalTripDetail(trip)}
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              borderRadius: '3px',
                              padding: '2px 4px',
                              background: trip.isDoubleCar ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #7c3aed, #0284c7)',
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }}
                            title={`Obra: ${trip.obraName} | ${trip.notes}`}
                          >
                            🏢 {trip.obraName.split(' ')[0]} {trip.isDoubleCar ? '🚘🚘' : '🚘'}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of Personal Trips Side Panel */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={18} className="text-purple" /> Minhas Viagens ({myPersonalTrips.length})
              </h3>

              {myPersonalTrips.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '520px' }}>
                  {myPersonalTrips.map(trip => (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedPersonalTripDetail(trip)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        borderLeft: `4px solid ${trip.isDoubleCar ? 'var(--accent-amber)' : 'var(--accent-purple)'}`,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          <Building2 size={11} /> {trip.obraName}
                        </span>
                        <span className={`badge ${trip.isDoubleCar ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>
                          {trip.isDoubleCar ? '🚘🚘 2 Carros' : '🚘 1 Carro'}
                        </span>
                      </div>

                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                        ✈️ Viagem de Serviço
                      </strong>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div>📅 <strong>Período:</strong> {trip.startDate} até {trip.endDate}</div>
                        <div>👥 <strong>Equipe:</strong> {trip.userNames ? trip.userNames.join(', ') : (trip.userName || currentUser?.name)}</div>
                        {trip.notes && (
                          <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            "{trip.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <Plane size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <div>Nenhuma viagem agendada para você nas obras ativas.</div>
                </div>
              )}
            </div>
          </div>

          {/* Modal / Card Details for Personal Trip Click */}
          {selectedPersonalTripDetail && (
            <div className="mobile-modal-overlay" style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: '1rem'
            }}>
              <div className="glass-panel mobile-modal-content" style={{ width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plane size={20} className="text-purple" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Detalhes da Viagem de Campo</h3>
                  </div>
                  <button onClick={() => setSelectedPersonalTripDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid var(--accent-purple)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 800, textTransform: 'uppercase' }}>Obra de Destino</div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{selectedPersonalTripDetail.obraName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cliente: {selectedPersonalTripDetail.obraClient}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Data de Ida</div>
                      <strong>📅 {selectedPersonalTripDetail.startDate}</strong>
                    </div>
                    <div style={{ padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Data de Volta</div>
                      <strong>📅 {selectedPersonalTripDetail.endDate}</strong>
                    </div>
                  </div>

                  <div style={{ padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Transporte Alocado</div>
                    <strong style={{ color: selectedPersonalTripDetail.isDoubleCar ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {selectedPersonalTripDetail.isDoubleCar ? '🚘🚘 2 Carros (Mais de 4 pessoas - Custo Dobrado)' : '🚘 1 Carro de Passeio / Utilitário'}
                    </strong>
                  </div>

                  <div style={{ padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Equipe Integrante</div>
                    <div>👥 {selectedPersonalTripDetail.userNames ? selectedPersonalTripDetail.userNames.join(', ') : selectedPersonalTripDetail.userName}</div>
                  </div>

                  {selectedPersonalTripDetail.notes && (
                    <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Objetivo / Observações</div>
                      <div style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>"{selectedPersonalTripDetail.notes}"</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button onClick={() => setSelectedPersonalTripDetail(null)} className="btn btn-secondary">
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Agendar Nova Viagem (Admin Only) */}
      {isModalOpen && (
        <div className="mobile-modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-panel mobile-modal-content" style={{ width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-lg)', padding: '1.5rem', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plane size={20} className="text-blue" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Agendar Viagem de Equipe (Admin)</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Multi-Collaborator Selector */}
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Selecione os Colaboradores da Viagem *</span>
                  <span style={{ color: 'var(--accent-blue)' }}>{selectedUserIds.length} Selecionado(s)</span>
                </label>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {users.map(u => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleToggleUserSelection(u.id)}
                        className="btn btn-sm"
                        style={{
                          background: isSelected ? 'var(--accent-blue)' : 'var(--bg-main)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)',
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.6rem'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '}{u.name} ({u.role === 'admin' ? 'Admin' : 'Op'})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Data de Ida *</label>
                  <input type="date" required className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Data de Volta *</label>
                  <input type="date" required className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              {/* Dynamic Multi-Car Travel Cost Card Info */}
              <div style={{ 
                padding: '0.85rem', 
                borderRadius: '8px', 
                background: modalIsDoubleCar ? 'rgba(245, 158, 11, 0.12)' : 'rgba(2, 132, 199, 0.12)', 
                border: `1px solid ${modalIsDoubleCar ? 'var(--accent-amber)' : 'var(--accent-blue)'}`, 
                fontSize: '0.8rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: modalIsDoubleCar ? 'var(--accent-amber)' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Car size={16} /> {modalIsDoubleCar ? '🚘🚘 Irão em 2 Carros (Mais de 4 Pessoas)' : '🚘 Irão em 1 Carro (Até 4 Pessoas)'}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {modalIsDoubleCar ? 'Como há mais de 4 pessoas, o custo do combustível é dobrado.' : 'Custo normal para 1 veículo de transporte.'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Custo Calculado:</div>
                    <strong style={{ fontSize: '1.1rem', color: modalIsDoubleCar ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {formatBRL(modalCalculatedCost)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Observações / Objetivo da Viagem</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Ex: Montagem no cliente e comissionamento..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  <Send size={15} /> Agendar & Notificar Operadores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
