'use client'

/**
 * LearnConnect — Tam Auth Sayfası
 * /auth/login?mode=login|register|forgot|reset|change
 *
 * Özellikler:
 *   - E-posta + Şifre (localStorage tabanlı)
 *   - Google ile Giriş (NextAuth)
 *   - Apple ile Giriş (NextAuth / macOS)
 *   - Şifre Göster/Gizle
 *   - Şifremi Unuttum → E-posta ile sıfırlama
 *   - Şifre Sıfırlama sayfası (?token=...)
 *   - Şifre Değiştirme (oturum açıkken)
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// ── Sabit stiller ──────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f3ee',
    padding: '1.5rem',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e0d8',
    borderRadius: '16px',
    padding: '2.2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  logo: {
    fontFamily: 'serif',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '1.6rem',
    textAlign: 'center',
  },
  logoAccent: { color: '#16a34a' },
  title: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '.3rem',
  },
  sub: {
    fontSize: '.83rem',
    color: '#64748b',
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '.75rem',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    marginBottom: '.3rem',
  },
  input: {
    width: '100%',
    background: '#f9f9f7',
    border: '1px solid #e5e0d8',
    borderRadius: '8px',
    padding: '.6rem .9rem',
    fontSize: '.9rem',
    color: '#1a1a2e',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  group: { marginBottom: '.9rem' },
  passWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
    padding: '0 2px',
  },
  btnPrimary: {
    width: '100%',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '11px',
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: '.9rem',
    cursor: 'pointer',
    marginTop: '.4rem',
  },
  btnGoogle: {
    width: '100%',
    background: '#fff',
    color: '#1a1a2e',
    border: '1.5px solid #e5e0d8',
    borderRadius: '8px',
    padding: '10px',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: '.88rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  btnApple: {
    width: '100%',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: '.88rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '1.2rem 0',
    fontSize: '.75rem',
    color: '#94a3b8',
  },
  divLine: { flex: 1, height: '1px', background: '#e5e0d8' },
  err: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderLeft: '3px solid #dc2626',
    borderRadius: '7px',
    padding: '8px 12px',
    fontSize: '.82rem',
    color: '#dc2626',
    marginBottom: '.9rem',
  },
  ok: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderLeft: '3px solid #16a34a',
    borderRadius: '7px',
    padding: '8px 12px',
    fontSize: '.82rem',
    color: '#15803d',
    marginBottom: '.9rem',
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '.83rem',
    fontFamily: 'inherit',
    padding: 0,
  },
  footer: {
    textAlign: 'center',
    fontSize: '.82rem',
    color: '#64748b',
    marginTop: '1.2rem',
  },
}

// ── Yardımcılar ────────────────────────────────────────────────
function getUsers() {
  try { return JSON.parse(localStorage.getItem('lc_users') || '[]') } catch { return [] }
}
function saveUsers(users) { localStorage.setItem('lc_users', JSON.stringify(users)) }
function setCurrentUser(user) { localStorage.setItem('lc_user', JSON.stringify(user)) }

// ── Şifre göster/gizle ────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false)
  return (
    <div style={S.passWrap}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder || ''}
        style={{ ...S.input, paddingRight: '2.5rem' }}
      />
      <button
        type="button"
        style={S.eyeBtn}
        onClick={() => setShow(s => !s)}
        title={show ? 'Gizle' : 'Göster'}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  )
}

// ── OAuth butonları ───────────────────────────────────────────
function OAuthButtons() {
  function signInGoogle() {
    // NextAuth kullanıyor musunuz? → signIn('google') çağrısı
    // Kurulum yoksa sayfaya yönlendir
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/signin/google'
    }
  }
  function signInApple() {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/signin/apple'
    }
  }

  return (
    <>
      <div style={S.divider}>
        <div style={S.divLine}/><span>veya</span><div style={S.divLine}/>
      </div>
      <button type="button" style={S.btnGoogle} onClick={signInGoogle}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.9 2.3 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.5 13.3 17.8 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.8-2.2 5.2-4.7 6.8l7.3 5.7c4.3-4 6.8-9.9 6.8-16.5z"/>
          <path fill="#FBBC05" d="M10.6 28.5c-.5-1.5-.8-3-.8-4.5s.3-3 .8-4.5L2.7 13.3C1 16.4 0 19.9 0 23.5s1 7.1 2.7 10.2l7.9-6.2z"/>
          <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-7.3-5.7c-2 1.4-4.7 2.2-8.7 2.2-6.2 0-11.5-3.8-13.4-9.3l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/>
        </svg>
        Google ile Giriş Yap
      </button>
      <button type="button" style={S.btnApple} onClick={signInApple}>
        <svg width="16" height="16" viewBox="0 0 814 1000" fill="white">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.1 268.1-317.1 70.2 0 128.9 46.4 173.1 46.4 42.8 0 109.9-49.5 190.3-49.5 30.2 0 133.6 2.6 198.4 99.2z"/>
          <path d="M554.1 158.4c22.5-26.4 38.5-63.2 38.5-100s-2-38.5-3.2-48.5C540.5 12.5 485.2 39.8 451.5 76c-19.8 21.4-38.2 58.8-38.2 95.6 0 3.8.6 7.7 1.3 11.6 2.6.7 6.4.7 9.7.7 33.3 0 73.8-21.4 129.8-25.5z"/>
        </svg>
        Apple ile Giriş Yap
      </button>
    </>
  )
}

// ── Ana Bileşen ───────────────────────────────────────────────
export default function AuthPage() {
  const searchParams  = useSearchParams()
  const initialMode   = searchParams?.get('mode') || 'login'
  const resetToken    = searchParams?.get('token') || ''

  const [mode, setMode]       = useState(resetToken ? 'reset' : initialMode)
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [pass, setPass]       = useState('')
  const [pass2, setPass2]     = useState('')
  const [oldPass, setOldPass] = useState('')
  const [msg, setMsg]         = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  const err = (text) => setMsg({ type: 'err', text })
  const ok  = (text) => setMsg({ type: 'ok',  text })
  const clear = ()   => setMsg({ type: '', text: '' })

  // ── Giriş ────────────────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault(); clear()
    if (!email || !pass) return err('E-posta ve şifre girin.')
    const users = getUsers()
    const found = users.find(u => u.email === email && u.pass === pass)
    if (!found) return err('E-posta veya şifre hatalı.')
    setCurrentUser({ id: found.id, name: found.name, email: found.email })
    window.location.href = '/'
  }

  // ── Kayıt ────────────────────────────────────────────────────
  function handleRegister(e) {
    e.preventDefault(); clear()
    if (!name.trim()) return err('Ad Soyad gerekli.')
    if (!email) return err('E-posta gerekli.')
    if (pass.length < 6) return err('Şifre en az 6 karakter.')
    if (pass !== pass2) return err('Şifreler eşleşmiyor.')
    const users = getUsers()
    if (users.find(u => u.email === email)) return err('Bu e-posta zaten kayıtlı.')
    const user = { id: Date.now(), name: name.trim(), email, pass, createdAt: new Date().toISOString() }
    saveUsers([...users, user])
    setCurrentUser({ id: user.id, name: user.name, email: user.email })
    window.location.href = '/'
  }

  // ── Şifre Sıfırlama İsteği ────────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault(); clear()
    if (!email) return err('E-posta adresinizi girin.')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      })
      const data = await res.json()
      if (!res.ok) return err(data.error || 'Hata oluştu.')
      ok('Şifre sıfırlama linki e-postanıza gönderildi. Lütfen gelen kutunuzu kontrol edin.')
      if (data.devLink) console.log('Dev reset link:', data.devLink)
    } catch {
      err('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  // ── Şifre Sıfırlama (token ile) ───────────────────────────────
  async function handleReset(e) {
    e.preventDefault(); clear()
    if (pass.length < 6) return err('Şifre en az 6 karakter.')
    if (pass !== pass2) return err('Şifreler eşleşmiyor.')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', token: resetToken, newPassword: pass }),
      })
      const data = await res.json()
      if (!res.ok) return err(data.error || 'Hata oluştu.')
      // Şifreyi localStorage'da da güncelle
      if (data.email) {
        const users = getUsers()
        const idx   = users.findIndex(u => u.email === data.email)
        if (idx !== -1) { users[idx].pass = pass; saveUsers(users) }
      }
      ok('Şifreniz güncellendi! Şimdi giriş yapabilirsiniz.')
      setTimeout(() => setMode('login'), 2000)
    } catch {
      err('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  // ── Şifre Değiştirme (oturum açıkken) ─────────────────────────
  function handleChangePassword(e) {
    e.preventDefault(); clear()
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('lc_user') || 'null') } catch { return null } })()
    if (!currentUser) return err('Lütfen önce giriş yapın.')
    const users = getUsers()
    const found = users.find(u => u.id === currentUser.id)
    if (!found) return err('Kullanıcı bulunamadı.')
    if (found.pass !== oldPass) return err('Mevcut şifreniz hatalı.')
    if (pass.length < 6) return err('Yeni şifre en az 6 karakter.')
    if (pass !== pass2) return err('Yeni şifreler eşleşmiyor.')
    found.pass = pass
    saveUsers(users)
    ok('Şifreniz başarıyla değiştirildi!')
    setOldPass(''); setPass(''); setPass2('')
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>Learn<span style={S.logoAccent}>Connect</span></div>

        {/* Hata / Başarı mesajı */}
        {msg.text && (
          <div style={msg.type === 'ok' ? S.ok : S.err}>{msg.text}</div>
        )}

        {/* ── GİRİŞ ─────────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={S.title}>Hoş Geldiniz</div>
            <div style={S.sub}>Hesabınıza giriş yapın</div>

            <div style={S.group}>
              <label style={S.label}>E-posta</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={S.input} placeholder="ornek@email.com"/>
            </div>
            <div style={S.group}>
              <label style={S.label}>Şifre</label>
              <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} placeholder="Şifreniz"/>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '.6rem' }}>
              <button type="button" style={S.link} onClick={() => { clear(); setMode('forgot') }}>
                Şifremi Unuttum
              </button>
            </div>
            <button type="submit" style={S.btnPrimary}>Giriş Yap</button>

            <OAuthButtons />

            <div style={S.footer}>
              Hesabınız yok mu?{' '}
              <button type="button" style={S.link} onClick={() => { clear(); setMode('register') }}>
                Ücretsiz Kayıt
              </button>
            </div>
          </form>
        )}

        {/* ── KAYIT ──────────────────────────────────────────────── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={S.title}>Ücretsiz Kayıt</div>
            <div style={S.sub}>Hesap oluşturun ve başlayın</div>

            <div style={S.group}>
              <label style={S.label}>Ad Soyad</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} style={S.input} placeholder="Adınız Soyadınız"/>
            </div>
            <div style={S.group}>
              <label style={S.label}>E-posta</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={S.input} placeholder="ornek@email.com"/>
            </div>
            <div style={S.group}>
              <label style={S.label}>Şifre</label>
              <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} placeholder="En az 6 karakter"/>
            </div>
            <div style={S.group}>
              <label style={S.label}>Şifre Tekrar</label>
              <PasswordInput value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Şifrenizi tekrar girin"/>
            </div>
            <button type="submit" style={S.btnPrimary}>Kayıt Ol</button>

            <OAuthButtons />

            <div style={S.footer}>
              Zaten hesabınız var mı?{' '}
              <button type="button" style={S.link} onClick={() => { clear(); setMode('login') }}>
                Giriş Yap
              </button>
            </div>
          </form>
        )}

        {/* ── ŞİFREMİ UNUTTUM ───────────────────────────────────── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <div style={S.title}>Şifremi Unuttum</div>
            <div style={S.sub}>E-posta adresinize sıfırlama linki göndereceğiz</div>

            <div style={S.group}>
              <label style={S.label}>E-posta</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={S.input} placeholder="ornek@email.com"/>
            </div>
            <button type="submit" style={S.btnPrimary} disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
            </button>

            <div style={S.footer}>
              <button type="button" style={S.link} onClick={() => { clear(); setMode('login') }}>
                ← Giriş'e Dön
              </button>
            </div>
          </form>
        )}

        {/* ── ŞİFRE SIFIRLAMA (token ile) ───────────────────────── */}
        {mode === 'reset' && (
          <form onSubmit={handleReset}>
            <div style={S.title}>Yeni Şifre Belirle</div>
            <div style={S.sub}>En az 6 karakter içeren güçlü bir şifre seçin</div>

            <div style={S.group}>
              <label style={S.label}>Yeni Şifre</label>
              <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} placeholder="En az 6 karakter"/>
            </div>
            <div style={S.group}>
              <label style={S.label}>Yeni Şifre Tekrar</label>
              <PasswordInput value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Yeni şifrenizi tekrar girin"/>
            </div>
            <button type="submit" style={S.btnPrimary} disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        )}

        {/* ── ŞİFRE DEĞİŞTİRME (oturum açıkken) ────────────────── */}
        {mode === 'change' && (
          <form onSubmit={handleChangePassword}>
            <div style={S.title}>Şifre Değiştir</div>
            <div style={S.sub}>Mevcut şifrenizi doğrulayın ve yeni şifre belirleyin</div>

            <div style={S.group}>
              <label style={S.label}>Mevcut Şifre</label>
              <PasswordInput value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Mevcut şifreniz"/>
            </div>
            <div style={S.group}>
              <label style={S.label}>Yeni Şifre</label>
              <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} placeholder="En az 6 karakter"/>
            </div>
            <div style={S.group}>
              <label style={S.label}>Yeni Şifre Tekrar</label>
              <PasswordInput value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Yeni şifrenizi tekrar girin"/>
            </div>
            <button type="submit" style={S.btnPrimary}>Şifremi Değiştir</button>

            <div style={S.footer}>
              <button type="button" style={S.link} onClick={() => { clear(); setMode('login') }}>
                ← Giriş Sayfasına Dön
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
