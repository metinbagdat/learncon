import React, { useState, useMemo } from 'react';

export interface Exam {
  id: string;
  subject: string;
  date: string; // ISO date string YYYY-MM-DD
  notes: string;
}

const EXAMS_INIT: Exam[] = [
  { id: '1', subject: 'Matematik', date: '2026-03-25', notes: 'Türev ve integral konuları' },
  { id: '2', subject: 'Fizik', date: '2026-04-02', notes: 'Elektromanyetizma' },
  { id: '3', subject: 'Kimya', date: '2026-04-15', notes: 'Organik kimya bölümü 3-5' },
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDayColor(days: number): string {
  if (days <= 3) return '#ef4444'; // urgent - red
  if (days <= 10) return '#f59e0b'; // ok - amber
  return '#22c55e'; // far - green
}

function getDayLabel(days: number): string {
  if (days < 0) return 'Geçti';
  if (days === 0) return 'Bugün!';
  if (days <= 3) return `${days} gün (Acil!)`;
  if (days <= 10) return `${days} gün`;
  return `${days} gün`;
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS_TR = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

export const ExamTracker: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>(EXAMS_INIT);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showModal, setShowModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const [form, setForm] = useState({ subject: '', date: '', notes: '' });

  const handleAddExam = () => {
    if (!form.subject || !form.date) return;
    const newExam: Exam = {
      id: crypto.randomUUID(),
      subject: form.subject,
      date: form.date,
      notes: form.notes,
    };
    setExams(prev => [...prev, newExam]);
    setForm({ subject: '', date: '', notes: '' });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  // useMemo to compute calendar cells
  const calendarCells = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells: { day: number | null; exams: Exam[] }[] = [];
    
    // Empty cells before month start
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, exams: [] });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayExams = exams.filter(e => e.date === dateStr);
      cells.push({ day: d, exams: dayExams });
    }
    
    return cells;
  }, [calendarDate, exams]);

  const prevMonth = () => {
    setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>📅 Sınav Takibi</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'list' ? '#3b82f6' : '#e2e8f0',
              color: viewMode === 'list' ? 'white' : '#475569',
              fontWeight: viewMode === 'list' ? 'bold' : 'normal',
            }}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'calendar' ? '#3b82f6' : '#e2e8f0',
              color: viewMode === 'calendar' ? 'white' : '#475569',
              fontWeight: viewMode === 'calendar' ? 'bold' : 'normal',
            }}
          >
            Takvim
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            + Sınav Ekle
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {exams.length === 0 && (
            <p style={{ color: '#94a3b8', textAlign: 'center' }}>Henüz sınav eklenmedi.</p>
          )}
          {exams.map(exam => {
            const days = daysUntil(exam.date);
            const color = getDayColor(days);
            return (
              <div
                key={exam.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: `2px solid ${color}`,
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{exam.subject}</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>{exam.date}</div>
                  {exam.notes && <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{exam.notes}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: color,
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}>
                    {getDayLabel(days)}
                  </span>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      color: '#ef4444',
                      fontSize: '16px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button onClick={prevMonth} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: 'white' }}>‹</button>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>
              {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </span>
            <button onClick={nextMonth} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: 'white' }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {DAYS_TR.map(d => (
              <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b', padding: '8px', fontSize: '13px' }}>{d}</div>
            ))}
            {calendarCells.map((cell, idx) => (
              <div
                key={idx}
                style={{
                  minHeight: '80px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px',
                  backgroundColor: cell.day ? 'white' : '#f8fafc',
                }}
              >
                {cell.day && (
                  <>
                    <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '14px', marginBottom: '4px' }}>{cell.day}</div>
                    {cell.exams.map(e => {
                      const days = daysUntil(e.date);
                      const color = getDayColor(days);
                      return (
                        <div
                          key={e.id}
                          style={{
                            backgroundColor: color,
                            color: 'white',
                            fontSize: '11px',
                            borderRadius: '3px',
                            padding: '2px 4px',
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={e.subject}
                        >
                          {e.subject}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '28px',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Yeni Sınav Ekle</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>Ders Adı *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="örn. Matematik"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>Sınav Tarihi *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Çalışılacak konular..."
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  onClick={() => { setShowModal(false); setForm({ subject: '', date: '', notes: '' }); }}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}
                >
                  İptal
                </button>
                <button
                  onClick={handleAddExam}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
