function safeStr(v) {
  if (v === null || v === undefined) return ''
  return String(v)
}

const MARKERS = ['「✦」', '「✿」', '《✧》', '「✧」', '「❀」', '『', '【']

function alreadyDecorated(text) {
  const t = safeStr(text).trimStart()
  return MARKERS.some((m) => t.startsWith(m))
}

function normalizeSpaces(s) {
  return safeStr(s).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function pickMarker(text, hint = '') {
  const t = safeStr(text).toLowerCase()
  const h = safeStr(hint).toLowerCase()

  // Cooldowns / ya reclamaste / espera
  if (
    /ya\s+has\s+reclamado|ya\s+reclamaste|cooldown|espera\s+\d|vuelve\s+en|puedes\s+reclamarlo\s+de\s+nuevo/.test(t)
  ) {
    return '《✧》'
  }

  if (/has\s+reclamado|recompensa|completad|éxito|exito|ganaste|recibiste|se\s+realiz[oó]/.test(t) || h === 'success') {
    return '「✿」'
  }

  if (/descargando|cargando|procesando|buscando|convirtiendo|generando/.test(t) || h === 'loading') {
    return '「✦」'
  }

  if (/error|fall[oó]|inv[aá]lido|no\s+se\s+pudo|denegad|necesit|solo\s+admins|solo\s+administradores/.test(t) || h === 'warn') {
    return '「✦」'
  }

  return '「✦」'
}

function decorateLines(text, marker) {
  const raw = normalizeSpaces(text)
  const lines = raw.split('\n')
  const out = []

  const first = safeStr(lines.shift() || '').trim()
  if (first) out.push(`${marker}${first}`)
  else out.push(`${marker}`)

  for (const line of lines) {
    const l = safeStr(line)
    if (!l.trim()) {
      out.push('')
      continue
    }
    const trimmed = l.trimStart()
    if (
      trimmed.startsWith('>') ||
      trimmed.startsWith('「') ||
      trimmed.startsWith('《') ||
      ['╭', '╰', '│', '┊', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼', '═', '─'].some((c) => trimmed.startsWith(c))
    ) {
      out.push(l)
    } else {
      out.push(`> ${trimmed}`)
    }
  }

  return out.join('\n').trimEnd()
}

export function decorateText(text, { hint } = {}) {
  const t = safeStr(text)
  if (!t.trim()) return ''
  if (alreadyDecorated(t)) return normalizeSpaces(t)
  const marker = pickMarker(t, hint)
  return decorateLines(t, marker)
}

export function createDecoratedSock(sock, { defaultHint = '' } = {}) {
  if (!sock || typeof sock !== 'object') return sock
  const handler = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (prop !== 'sendMessage' || typeof value !== 'function') return value

      return async function sendMessageDecorated(jid, content = {}, options = {}) {
        try {
          const isTextOnly = content && typeof content === 'object' && typeof content.text === 'string'
          const hasMedia =
            content?.image ||
            content?.video ||
            content?.audio ||
            content?.document ||
            content?.sticker ||
            content?.contacts ||
            content?.location ||
            content?.poll

          const noDecor = Boolean(content?.noDecor || options?.noDecor)
          const hint = content?.decorHint || options?.decorHint || defaultHint

          if (isTextOnly && !hasMedia && !noDecor) {
            const decorated = decorateText(content.text, { hint })
            content = { ...content, text: decorated }
          }
        } catch {

        }
        return value.call(target, jid, content, options)
      }
    }
  }

  return new Proxy(sock, handler)
}
