/**
 * LearnConnect — Claude API Proxy
 * API key sunucu tarafında kalır, tarayıcıya açılmaz.
 *
 * Vercel'de Environment Variable ekleyin:
 *   ANTHROPIC_API_KEY = sk-ant-...
 */

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: 'API anahtarı tanımlanmamış. Vercel Environment Variables kontrol edin.' },
      { status: 500 }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const { messages, system, max_tokens = 1000 } = body

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: 'messages alanı gerekli.' }, { status: 400 })
  }

  try {
    const payload = {
      model:      'claude-sonnet-4-20250514',
      max_tokens,
      messages,
    }
    if (system) payload.system = system

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || 'Claude API hatası.' },
        { status: res.status }
      )
    }

    return Response.json(data)
  } catch (err) {
    return Response.json(
      { error: 'Sunucu hatası: ' + err.message },
      { status: 500 }
    )
  }
}
