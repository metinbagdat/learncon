/**
 * LearnConnect — Merkezi Logger
 * Console + localStorage + isteğe bağlı remote endpoint
 * Sıfır bağımlılık, sıfır maliyet.
 */

const MAX_LOGS    = 500;
const STORAGE_KEY = 'lc_logs';
const VERSION     = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const ENDPOINT    = process.env.NEXT_PUBLIC_LOG_ENDPOINT || null;

// Seviyeler: düşük sayı = daha az önemli
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

// Development'ta debug logları da görünür, production'da sadece warn+
const MIN_LEVEL = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

// ── Yardımcılar ───────────────────────────────────────────────

function buildEntry(level, message, error, context) {
  return {
    id:        Math.random().toString(36).slice(2, 10),
    level,
    message,
    context:   context || null,
    error:     error
      ? { name: error.name, message: error.message, stack: error.stack }
      : null,
    ts:        new Date().toISOString(),
    version:   VERSION,
    url:       typeof window !== 'undefined' ? window.location.pathname : 'server',
  };
}

// ── localStorage ──────────────────────────────────────────────

function readLogs() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
  } catch {
    // localStorage dolu — eski kayıtların yarısını sil
    try {
      const half = readLogs().slice(Math.floor(MAX_LOGS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...half, ...logs]));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

// ── Remote gönderim (toplu, 2 sn gecikme) ────────────────────

let _queue = [];
let _timer = null;

function flushRemote() {
  if (!ENDPOINT || _queue.length === 0) return;
  const batch = [..._queue];
  _queue = [];
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs: batch }),
    keepalive: true, // sayfa kapanırken de gönder
  }).catch(() => {}); // sessizce geç
}

function scheduleRemote(entry) {
  if (!ENDPOINT || LEVELS[entry.level] < LEVELS['warn']) return;
  _queue.push(entry);
  clearTimeout(_timer);
  _timer = setTimeout(flushRemote, 2000);
}

// ── Ana log fonksiyonu ────────────────────────────────────────

function log(level, message, errorOrContext, context) {
  if (LEVELS[level] < LEVELS[MIN_LEVEL]) return;

  // İkinci parametre: Error nesnesi mi, context mi?
  let err = null;
  let ctx = context;
  if (errorOrContext instanceof Error) {
    err = errorOrContext;
  } else if (errorOrContext && typeof errorOrContext === 'object') {
    ctx = errorOrContext;
  }

  const entry = buildEntry(level, message, err, ctx);

  // ── Console çıktısı ──────────────────────────────────────────
  if (typeof window !== 'undefined') {
    // Browser: renkli stil
    const STYLE = {
      debug: 'color:#94a3b8',
      info:  'color:#06b6d4',
      warn:  'color:#f59e0b;font-weight:bold',
      error: 'color:#ef4444;font-weight:bold',
    };
    const tag = `%c[${level.toUpperCase()}]%c ${message}`;

    if (level === 'error') {
      console.group(tag, STYLE[level], 'color:inherit');
      if (ctx)  console.log('Context →', ctx);
      if (err)  console.error(err);
      console.groupEnd();
    } else if (level === 'warn') {
      console.group(tag, STYLE[level], 'color:inherit');
      if (ctx) console.log('Context →', ctx);
      console.groupEnd();
    } else {
      console.log(tag, STYLE[level], 'color:inherit', ...(ctx ? [ctx] : []));
    }
  } else {
    // Server (API routes)
    const line = `[${level.toUpperCase()}] ${entry.ts.slice(11,23)} ${message}`;
    if (level === 'error') console.error(line, ctx || '', err || '');
    else if (level === 'warn') console.warn(line, ctx || '');
    else console.log(line, ctx || '');
  }

  // ── localStorage kaydet ──────────────────────────────────────
  if (typeof window !== 'undefined') {
    writeLogs([...readLogs(), entry]);
  }

  // ── Remote gönder ────────────────────────────────────────────
  scheduleRemote(entry);

  return entry;
}

// ── Public API ────────────────────────────────────────────────

const logger = {
  /** Seviyeye göre log yaz */
  debug: (msg, ctx)      => log('debug', msg, ctx),
  info:  (msg, ctx)      => log('info',  msg, ctx),
  warn:  (msg, ctx)      => log('warn',  msg, ctx),
  error: (msg, err, ctx) => log('error', msg, err, ctx),

  /** Tüm localStorage loglarını döndür (isteğe bağlı seviye filtresi) */
  getLogs: (level) => {
    const all = readLogs();
    return level ? all.filter(e => e.level === level) : all;
  },

  /** Logları temizle */
  clearLogs: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  },

  /** Logları JSON dosyası olarak indir */
  downloadLogs: () => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(readLogs(), null, 2)], { type: 'application/json' });
    const a    = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(blob),
      download: `lc-logs-${Date.now()}.json`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /** Bekleyen logları hemen remote'a gönder */
  flush: flushRemote,
};

export default logger;
