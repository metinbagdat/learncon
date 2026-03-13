import React, { useState, useEffect, useRef } from 'react';
import { callClaude } from '../api/claude';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Language = 'tr' | 'en';

const SYSTEM_MESSAGES: Record<Language, string> = {
  tr: 'Sen bir öğrenme asistanısın. Öğrencilerin ders konularını anlamasına yardım ediyorsun. Türkçe cevap ver. Açıklamalarını kısa, net ve anlaşılır tut.',
  en: 'You are a learning assistant helping students understand their course material. Keep explanations short, clear and understandable.',
};

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<Language>('tr');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // useEffect for scroll-to-bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const systemPrompt = SYSTEM_MESSAGES[language];

    callClaude(
      newMessages,
      (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], content: updated[lastIdx].content + chunk };
          }
          return updated;
        });
      },
      () => {
        setLoading(false);
      },
      (err) => {
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], content: 'Hata: ' + err.message };
          }
          return updated;
        });
        setLoading(false);
      },
      systemPrompt
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>💬 AI Sohbet</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#64748b' }}>Dil:</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
          >
            <option value="tr">🇹🇷 Türkçe</option>
            <option value="en">🇬🇧 English</option>
          </select>
          <button
            onClick={clearChat}
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: 'white', color: '#64748b', fontSize: '14px' }}
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <p>{language === 'tr' ? 'Merhaba! Ders konularında sana yardımcı olabilirim.' : 'Hello! I can help you with your course topics.'}</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: msg.role === 'user' ? '#3b82f6' : 'white',
                color: msg.role === 'user' ? 'white' : '#1e293b',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
              }}
            >
              {msg.content || (loading && idx === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={language === 'tr' ? 'Sorunuzu yazın... (Enter ile gönderin)' : 'Type your question... (Press Enter to send)'}
          rows={2}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            resize: 'none',
            fontFamily: 'sans-serif',
            lineHeight: '1.5',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            backgroundColor: loading || !input.trim() ? '#94a3b8' : '#3b82f6',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            alignSelf: 'flex-end',
          }}
        >
          Gönder
        </button>
      </div>
    </div>
  );
};
