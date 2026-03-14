export type OnChunk = (chunk: string) => void;
export type OnDone = () => void;
export type OnErr = (err: Error) => void;

export async function callClaude(
  messages: { role: string; content: string }[],
  onChunk: OnChunk,
  onDone: OnDone,
  onErr: OnErr,
  system?: string
): Promise<void> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  
  if (!apiKey) {
    // Simulate response for demo purposes when no API key is available
    const simulatedResponse = "Bu bir demo yanıtıdır. Gerçek API anahtarı olmadan simüle edilmiş yanıt kullanılıyor. / This is a demo response. Using simulated response without a real API key.";
    for (const char of simulatedResponse) {
      onChunk(char);
      await new Promise(r => setTimeout(r, 20));
    }
    onDone();
    return;
  }

  try {
    const body: Record<string, unknown> = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      stream: true,
      messages,
    };
    if (system) body.system = system;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              onChunk(parsed.delta.text);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onErr(err instanceof Error ? err : new Error(String(err)));
  }
}
