import { useState } from 'react';
import { ExamTracker } from './components/ExamTracker';
import { StudyPlanner } from './components/StudyPlanner';
import { CourseBrowser } from './components/CourseBrowser';
import { AIChat } from './components/AIChat';

type Tab = 'exams' | 'planner' | 'courses' | 'chat';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'exams', label: 'Sınav Takibi', icon: '📅' },
  { id: 'planner', label: 'Çalışma Planı', icon: '📚' },
  { id: 'courses', label: 'Ders Tarayıcı', icon: '🎓' },
  { id: 'chat', label: 'AI Sohbet', icon: '💬' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('exams');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ padding: '14px 0', marginRight: '20px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#1e293b' }}>🎯 LearnCon</span>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '8px' }}>Öğrenme Platformu</span>
        </div>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 18px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ padding: '24px' }}>
        {activeTab === 'exams' && <ExamTracker />}
        {activeTab === 'planner' && <StudyPlanner />}
        {activeTab === 'courses' && <CourseBrowser />}
        {activeTab === 'chat' && <AIChat />}
      </div>
    </div>
  );
}

export default App;
