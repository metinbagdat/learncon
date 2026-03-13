import React, { useState } from 'react';
import { callClaude } from '../api/claude';

export interface Unit {
  name: string;
  status: 'new' | 'progress' | 'done';
}

export interface Course {
  id: string;
  name: string;
  category: string;
  description: string;
  units: Unit[];
}

const COURSES_DATA: Course[] = [
  {
    id: 'math101',
    name: 'Calculus I',
    category: 'Matematik',
    description: 'Tek değişkenli kalkülüs: limitler, türevler ve integral.',
    units: [
      { name: 'Limitler', status: 'done' },
      { name: 'Türevler', status: 'progress' },
      { name: 'Türev Uygulamaları', status: 'new' },
      { name: 'İntegral', status: 'new' },
    ],
  },
  {
    id: 'phys101',
    name: 'Fizik I',
    category: 'Fizik',
    description: 'Mekanik: kinematik, dinamik, enerji ve momentum.',
    units: [
      { name: 'Kinematik', status: 'done' },
      { name: 'Newton Yasaları', status: 'done' },
      { name: 'Enerji ve İş', status: 'progress' },
      { name: 'Momentum', status: 'new' },
    ],
  },
  {
    id: 'chem101',
    name: 'Genel Kimya',
    category: 'Kimya',
    description: 'Atom yapısı, periyodik tablo, kimyasal bağlar.',
    units: [
      { name: 'Atom Yapısı', status: 'done' },
      { name: 'Periyodik Tablo', status: 'progress' },
      { name: 'Kimyasal Bağlar', status: 'new' },
      { name: 'Stokiyometri', status: 'new' },
    ],
  },
  {
    id: 'cs101',
    name: 'Programlamaya Giriş',
    category: 'Bilgisayar',
    description: 'Python ile programlamanın temelleri.',
    units: [
      { name: 'Değişkenler ve Tipler', status: 'done' },
      { name: 'Kontrol Akışı', status: 'done' },
      { name: 'Fonksiyonlar', status: 'done' },
      { name: 'Veri Yapıları', status: 'progress' },
    ],
  },
];

const STATUS_CYCLE: Record<string, 'new' | 'progress' | 'done'> = {
  new: 'progress',
  progress: 'done',
  done: 'new',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Yeni',
  progress: 'Devam',
  done: 'Tamamlandı',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#94a3b8',
  progress: '#f59e0b',
  done: '#10b981',
};

export const CourseBrowser: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tümü');
  const [selected, setSelected] = useState<Course | null>(COURSES_DATA[0]);
  const [unitStatus, setUnitStatus] = useState<Record<string, 'new' | 'progress' | 'done'>>({});
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const categories = ['Tümü', ...Array.from(new Set(COURSES_DATA.map(c => c.category)))];

  const filteredCourses = COURSES_DATA.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Tümü' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getUnitStatus = (courseId: string, unitName: string): 'new' | 'progress' | 'done' => {
    const key = `${courseId}-${unitName}`;
    return unitStatus[key] ?? (COURSES_DATA.find(c => c.id === courseId)?.units.find(u => u.name === unitName)?.status ?? 'new');
  };

  const toggleUnitStatus = (courseId: string, unitName: string) => {
    const key = `${courseId}-${unitName}`;
    const current = getUnitStatus(courseId, unitName);
    const next = STATUS_CYCLE[current];
    setUnitStatus(prev => ({ ...prev, [key]: next }));
  };

  const getAiSuggestion = () => {
    if (!selected) return;
    setAiOutput('');
    setAiLoading(true);

    const unitSummary = selected.units
      .map(u => {
        const status = getUnitStatus(selected.id, u.name);
        return `${u.name}: ${STATUS_LABELS[status]}`;
      })
      .join(', ');

    const prompt = `"${selected.name}" dersi için ünite durumlarım: ${unitSummary}. Bu duruma göre hangi üniteye odaklanmalıyım? Kısa ve pratik öneriler ver.`;

    callClaude(
      [{ role: 'user', content: prompt }],
      (chunk) => setAiOutput(prev => prev + chunk),
      () => setAiLoading(false),
      (err) => {
        setAiOutput('Hata: ' + err.message);
        setAiLoading(false);
      }
    );
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>🎓 Ders Tarayıcı</h2>
      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        
        {/* Left Panel */}
        <div style={{
          width: '280px',
          flexShrink: 0,
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <input
              type="text"
              placeholder="Ders ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    backgroundColor: categoryFilter === cat ? '#3b82f6' : '#e2e8f0',
                    color: categoryFilter === cat ? 'white' : '#374151',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredCourses.map(course => (
              <div
                key={course.id}
                onClick={() => setSelected(course)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  backgroundColor: selected?.id === course.id ? '#eff6ff' : 'white',
                  borderLeft: selected?.id === course.id ? '3px solid #3b82f6' : '3px solid transparent',
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>{course.name}</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{course.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'auto', backgroundColor: 'white', padding: '20px' }}>
          {!selected ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '60px' }}>Bir ders seçin</p>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '22px' }}>{selected.name}</h3>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  backgroundColor: '#eff6ff',
                  color: '#3b82f6',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  {selected.category}
                </span>
                <p style={{ color: '#64748b', marginTop: '10px', fontSize: '14px' }}>{selected.description}</p>
              </div>

              <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Üniteler</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {selected.units.map(unit => {
                  const status = getUnitStatus(selected.id, unit.name);
                  return (
                    <div
                      key={unit.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <span style={{ fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>{unit.name}</span>
                      <button
                        onClick={() => toggleUnitStatus(selected.id, unit.name)}
                        style={{
                          padding: '4px 14px',
                          borderRadius: '20px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: STATUS_COLORS[status],
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>🤖 AI Ders Önerisi</h4>
                <button
                  onClick={getAiSuggestion}
                  disabled={aiLoading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    backgroundColor: aiLoading ? '#94a3b8' : '#6366f1',
                    color: 'white',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                  }}
                >
                  {aiLoading ? 'Analiz ediliyor...' : 'Öneri Al'}
                </button>
                {aiOutput && (
                  <div style={{
                    padding: '14px',
                    backgroundColor: '#eef2ff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                  }}>
                    {aiOutput}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
