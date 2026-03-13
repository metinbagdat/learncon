import React, { useState } from 'react';
import { callClaude } from '../api/claude';

export interface Task {
  id: string;
  day: string;
  topic: string;
  duration: string;
  done: boolean;
}

const DAYS_OF_WEEK = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export const StudyPlanner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [planOutput, setPlanOutput] = useState('');
  const [evalOutput, setEvalOutput] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [evalTopic, setEvalTopic] = useState('');

  const toggleDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = () => {
    const day = DAYS_OF_WEEK[tasks.length % 7];
    const newTask: Task = {
      id: Date.now().toString(),
      day,
      topic: 'Yeni Konu',
      duration: '1 saat',
      done: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id: string, field: keyof Task, value: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const generatePlan = () => {
    if (!subject.trim()) return;
    setPlanOutput('');
    setPlanLoading(true);
    const prompt = `Lütfen "${subject}" dersi için haftalık çalışma planı oluştur. Her gün için ne kadar süre ve hangi konuların çalışılacağını JSON formatında belirt.`;
    callClaude(
      [{ role: 'user', content: prompt }],
      (chunk) => setPlanOutput(prev => prev + chunk),
      () => {
        setPlanLoading(false);
      },
      (err) => {
        setPlanOutput('Hata oluştu: ' + err.message);
        setPlanLoading(false);
      }
    );
  };

  const evaluateTopic = () => {
    if (!evalTopic.trim()) return;
    setEvalOutput('');
    setEvalLoading(true);
    const doneTasks = tasks.filter(t => t.done).map(t => t.topic);
    const prompt = `"${evalTopic}" konusunu değerlendir. Tamamlanan görevler: ${doneTasks.join(', ') || 'yok'}. Bu konuyu ne kadar öğrendim? Eksiklerim neler?`;
    callClaude(
      [{ role: 'user', content: prompt }],
      (chunk) => setEvalOutput(prev => prev + chunk),
      () => {
        setEvalLoading(false);
      },
      (err) => {
        setEvalOutput('Hata oluştu: ' + err.message);
        setEvalLoading(false);
      }
    );
  };

  const completedCount = tasks.filter(t => t.done).length;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>📚 Çalışma Planlayıcı</h2>

      {/* Progress */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <span style={{ color: '#15803d', fontWeight: 'bold' }}>
            {completedCount}/{tasks.length} görev tamamlandı
          </span>
          <div style={{ marginTop: '8px', height: '8px', backgroundColor: '#d1fae5', borderRadius: '4px' }}>
            <div style={{
              height: '100%',
              backgroundColor: '#10b981',
              borderRadius: '4px',
              width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Task List */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#374151' }}>Haftalık Görevler</h3>
          <button
            onClick={addTask}
            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', fontSize: '14px' }}
          >
            + Görev Ekle
          </button>
        </div>
        
        {tasks.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Henüz görev yok. "Görev Ekle" veya AI plan üreticisini kullanın.</p>
        )}

        {tasks.map(task => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: task.done ? '#f0fdf4' : 'white',
              opacity: task.done ? 0.8 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleDone(task.id)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <select
              value={task.day}
              onChange={e => updateTask(task.id, 'day', e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151' }}
            >
              {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
              type="text"
              value={task.topic}
              onChange={e => updateTask(task.id, 'topic', e.target.value)}
              style={{
                flex: 1,
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                textDecoration: task.done ? 'line-through' : 'none',
                color: task.done ? '#94a3b8' : '#374151',
              }}
            />
            <input
              type="text"
              value={task.duration}
              onChange={e => updateTask(task.id, 'duration', e.target.value)}
              style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px', color: '#64748b' }}
            />
            <button
              onClick={() => deleteTask(task.id)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: 'white', color: '#ef4444' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* AI Plan Generator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#fafafa' }}>
          <h3 style={{ margin: '0 0 14px 0', color: '#374151', fontSize: '16px' }}>🤖 Haftalık Plan Üretici</h3>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Ders adını girin (örn. Matematik)"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button
            onClick={generatePlan}
            disabled={planLoading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              cursor: planLoading ? 'not-allowed' : 'pointer',
              backgroundColor: planLoading ? '#94a3b8' : '#8b5cf6',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '12px',
            }}
          >
            {planLoading ? 'Oluşturuluyor...' : 'Plan Oluştur'}
          </button>
          {planOutput && (
            <div style={{
              padding: '12px',
              backgroundColor: '#ede9fe',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#374151',
              maxHeight: '200px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {planOutput}
            </div>
          )}
        </div>

        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#fafafa' }}>
          <h3 style={{ margin: '0 0 14px 0', color: '#374151', fontSize: '16px' }}>🔍 Konu Değerlendirici</h3>
          <input
            type="text"
            value={evalTopic}
            onChange={e => setEvalTopic(e.target.value)}
            placeholder="Değerlendirilecek konuyu girin"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button
            onClick={evaluateTopic}
            disabled={evalLoading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              cursor: evalLoading ? 'not-allowed' : 'pointer',
              backgroundColor: evalLoading ? '#94a3b8' : '#f59e0b',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '12px',
            }}
          >
            {evalLoading ? 'Değerlendiriliyor...' : 'Değerlendir'}
          </button>
          {evalOutput && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#374151',
              maxHeight: '200px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {evalOutput}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
