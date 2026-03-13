'use client'
import { useToast } from '@/components/Toast'
import { useAsync } from '@/components/ErrorBoundary'
import logger from '@/lib/logger'

export default function Home() {
  const toast = useToast()
  const { run, loading, error, data } = useAsync()

  function testLogger() {
    logger.info('Sayfa yüklendi', { page: 'home' })
    logger.warn('Test uyarısı', { test: true })
    toast.success('Logger çalışıyor!')
  }

  async function testError() {
    await run(
      () => fetch('/api/test').then(r => r.json()),
      'API test hatası',
      { endpoint: '/api/test' }
    )
  }

  async function testCrash() {
    await run(
      () => Promise.reject(new Error('Test crash!')),
      'Kasıtlı hata testi',
      { test: true }
    )
    toast.error('Hata yakalandı ve loglandı!')
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>🛡️ LearnConnect</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Hata yönetimi sistemi çalışıyor.</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button onClick={testLogger}
          style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          ✅ Logger Test
        </button>
        <button onClick={testCrash}
          style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          ❌ Hata Test
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderLeft: '4px solid #dc2626', borderRadius: '8px', padding: '12px 16px', color: '#dc2626', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      <p style={{ fontSize: '13px', color: '#888', marginTop: '2rem' }}>
        Sol altta <strong>🪵 DEV</strong> butonuna tıklayarak logları görebilirsiniz.
      </p>
    </main>
  )
}
