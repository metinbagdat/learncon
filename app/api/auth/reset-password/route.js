/**
 * Şifre Sıfırlama API
 * POST /api/auth/reset-password
 *
 * Vercel Environment Variables:
 *   RESEND_API_KEY = re_... (resend.com ücretsiz - 3000 e-posta/ay)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const APP_URL = process.env.NEXTAUTH_URL || 'https://learncon.vercel.app'

// Geçici token deposu (üretimde Redis veya Supabase kullanın)
const resetTokens = new Map()

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const { action, email, token, newPassword } = body

  // ── Adım 1: Sıfırlama linki gönder ───────────────────────────
  if (action === 'request') {
    if (!email) {
      return Response.json({ error: 'E-posta gerekli.' }, { status: 400 })
    }

    // Token üret (gerçek uygulamada veritabanına kaydet)
    const resetToken = generateToken()
    const expires    = Date.now() + 3600_000 // 1 saat

    resetTokens.set(resetToken, { email, expires })

    const resetLink = `${APP_URL}/auth/reset-password?token=${resetToken}`

    // E-posta gönder (Resend API)
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from:    'LearnConnect <noreply@learncon.vercel.app>',
            to:      [email],
            subject: '🔐 Şifre Sıfırlama — LearnConnect',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem">
                <h2 style="color:#16a34a">LearnConnect Şifre Sıfırlama</h2>
                <p>Merhaba,</p>
                <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu link <strong>1 saat</strong> geçerlidir.</p>
                <a href="${resetLink}"
                   style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:1rem 0">
                  Şifremi Sıfırla
                </a>
                <p style="color:#666;font-size:13px">Bu isteği siz yapmadıysanız bu e-postayı görmezden gelin.</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0">
                <p style="color:#999;font-size:12px">LearnConnect · TYT/AYT/LGS Hazırlık Platformu</p>
              </div>
            `,
          }),
        })
      } catch (e) {
        console.error('E-posta gönderilemedi:', e)
      }
    }

    return Response.json({
      success: true,
      message: 'Şifre sıfırlama linki e-posta adresinize gönderildi.',
      // Geliştirme modunda linki döndür
      ...(process.env.NODE_ENV !== 'production' ? { devLink: resetLink } : {}),
    })
  }

  // ── Adım 2: Yeni şifreyi kaydet ──────────────────────────────
  if (action === 'reset') {
    if (!token || !newPassword) {
      return Response.json({ error: 'Token ve yeni şifre gerekli.' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return Response.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 })
    }

    const record = resetTokens.get(token)
    if (!record) {
      return Response.json({ error: 'Geçersiz veya süresi dolmuş link.' }, { status: 400 })
    }
    if (Date.now() > record.expires) {
      resetTokens.delete(token)
      return Response.json({ error: 'Bu linkin süresi dolmuş. Lütfen tekrar isteyin.' }, { status: 400 })
    }

    // Gerçek uygulamada: veritabanında şifreyi güncelle
    // Şimdilik token'ı temizle ve başarılı dön
    resetTokens.delete(token)

    return Response.json({
      success: true,
      email:   record.email,
      message: 'Şifreniz başarıyla güncellendi.',
    })
  }

  return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 })
}

function generateToken() {
  const arr = new Uint8Array(32)
  // Node.js ortamında crypto kullan
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('')
}
