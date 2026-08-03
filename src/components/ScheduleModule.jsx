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
  ChevronRight
} from 'lucide-react';

export const ScheduleModule = () => {
  const { isAdmin, users, currentUser } = useAuth();
  const { activeObra, addScheduledTrip, deleteScheduledTrip } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!activeObra) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
        <AlertCircle size={48} className="text-amber" style={{ marginBottom: '1rem' }} />
        <h3>Nenhuma Obra Selecionada</h3>
        <p style={{ color: 'var(--text-muted)' }}>Selecione uma obra na vitrine para visualizar e gerenciar a agenda de viagens da equipe.</p>
      </div>
    );
  }

  const scheduledTrips = activeObra.scheduledTrips || [];
  const distanceKm = parseFloat(activeObra.distanceKm) || 0;
  const tripCostCalc = distanceKm * 1.5;

  const totalTravelSpent = scheduledTrips.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);

  // Available users for this obra
  const assignedUsers = users.filter(u => (activeObra.assignedUserIds || []).includes(u.id));

  const handleOpenAddModal = (dateStr) => {
    if (!isAdmin) return;
    if (dateStr) {
      setStartDate(dateStr);
      setEndDate(dateStr);
    }
    if (assignedUsers.length > 0) {
      setSelectedUserId(assignedUsers[0].id);
    }
    setIsModalOpen(true);
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserId || !startDate || !endDate) return;

    const userObj = users.find(u => u.id === selectedUserId);

    addScheduledTrip(activeObra.id, {
      userId: selectedUserId,
      userName: userObj?.name || 'Operador',
      userColorTag: userObj?.userColorTag || 'var(--accent-blue)',
      startDate,
      endDate,
      distanceKm,
      cost: tripCostCalc,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
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
              <span className="badge badge-blue">Agenda & Escala de Viagens</span>
              <span className="badge badge-amber"><MapPin size={12} /> {distanceKm} km (R$ 1,50/km)</span>
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Agenda de Alocação de Equipe - {activeObra.name}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Custos com Viagens</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {formatBRL(totalTravelSpent)}
            </div>
          </div>

          {isAdmin && (
            <button onClick={() => handleOpenAddModal(null)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Agendar Nova Viagem
            </button>
          )}
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
                    {dayTrips.map(trip => (
                      <div
                        key={trip.id}
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          borderRadius: '3px',
                          padding: '1px 3px',
                          background: trip.userColorTag || 'var(--accent-blue)',
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={`${trip.userName}: ${trip.notes} (R$ ${trip.cost})`}
                      >
                        ✈️ {trip.userName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trips List Panel */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plane size={18} className="text-blue" /> Lista de Viagens Agendadas ({scheduledTrips.length})
          </h3>

          {scheduledTrips.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '500px' }}>
              {scheduledTrips.map(trip => (
                <div
                  key={trip.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${trip.userColorTag || 'var(--accent-blue)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      👤 {trip.userName}
                    </strong>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancelar agendamento de viagem de ${trip.userName}?`)) {
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
                    <div>📅 <strong>Ida:</strong> {trip.startDate} | <strong>Volta:</strong> {trip.endDate}</div>
                    <div>🚘 <strong>Custo Estimado:</strong> <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{formatBRL(trip.cost)}</span> ({distanceKm} km x R$ 1,50)</div>
                    {trip.notes && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                        "{trip.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              Nenhuma viagem agendada até o momento.
            </div>
          )}
        </div>
      </div>

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
          <div className="glass-panel mobile-modal-content" style={{ width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
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
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Selecione o Integrante da Obra *</label>
                <select 
                  className="form-control" 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'admin' ? 'Admin' : 'Operador'})
                    </option>
                  ))}
                </select>
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

              {/* Travel Cost Card Info */}
              <div style={{ padding: '0.65rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', fontSize: '0.775rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>Custo Calculado de Viagem (R$ 1,50/km):</div>
                <strong style={{ fontSize: '1rem', color: 'var(--accent-amber)' }}>
                  {formatBRL(tripCostCalc)} ({distanceKm} km ida e volta)
                </strong>
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
                  <Send size={15} /> Agendar & Notificar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
