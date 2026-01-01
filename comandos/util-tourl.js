import FormData from 'form-data'
import fetch from 'node-fetch'
import * as baileys from '@whiskeysockets/baileys'

const { downloadContentFromMessage, generateWAMessageFromContent, proto } = baileys

const UA =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36'

function pickQuotedMessage(m) {
  const q =
    m?.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    m?.message?.imageMessage ||
    m?.message?.videoMessage ||
    m?.message?.audioMessage ||
    m?.message?.documentMessage ||
    m?.message?.stickerMessage ||
    m?.message ||
    null
  return q
}

function detectType(msg) {
  if (!msg || typeof msg !== 'object') return null
  const keys = Object.keys(msg)
  const candidates = [
    'documentMessage',
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'stickerMessage'
  ]
  for (const k of candidates) if (keys.includes(k)) return k
  return keys[0] || null
}

function typeToStreamKind(type) {
  const t = String(type || '').replace('Message', '')
  return t
}

function guessFileName(content, type) {
  const c = content || {}
  const name =
    c.fileName ||
    c.title ||
    c.caption ||
    (type === 'stickerMessage' ? 'sticker.webp' : '') ||
    'file'
  const safe = String(name).trim() || 'file'
  return safe.length > 80 ? safe.slice(0, 80) : safe
}

async function streamToBuffer(stream) {
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer
}

async function uploadCatbox(buffer, filename = 'file') {
  const form = new FormData()
  form.append('fileToUpload', buffer, filename)
  form.append('reqtype', 'fileupload')

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form,
    headers: {
      ...form.getHeaders(),
      'User-Agent': UA
    }
  })

  const text = await res.text()
  const url = String(text || '').trim()
  if (!url.startsWith('http')) throw new Error(`Catbox respondió inválido: ${url}`)
  return url
}

function extractUrlLoose(text = '') {
  const m = String(text || '').match(/https?:\/\/[^\s"'<>]+/g)
  return m?.[0] || null
}

async function uploadRussell(buffer, filename = 'file') {
  const endpoint = 'https://cdn.russellxz.click/upload.php'
  const fieldNames = ['file', 'fileToUpload', 'upload', 'archivo', 'media']

  let lastErr = null

  for (const field of fieldNames) {
    try {
      const form = new FormData()
      form.append(field, buffer, filename)

      const res = await fetch(endpoint, {
        method: 'POST',
        body: form,
        headers: {
          ...form.getHeaders(),
          'User-Agent': UA,
          Referer: 'https://cdn.russellxz.click/'
        }
      })

      const ctype = String(res.headers.get('content-type') || '').toLowerCase()

      if (ctype.includes('application/json')) {
        const j = await res.json().catch(() => null)
        const maybe =
          j?.url ||
          j?.link ||
          j?.download ||
          j?.direct ||
          (Array.isArray(j?.files) ? j.files?.[0]?.url : null)
        if (maybe && String(maybe).startsWith('http')) return String(maybe)
      }

      const text = await res.text().catch(() => '')
      const url = extractUrlLoose(text)
      if (url) return url

      lastErr = new Error(`Russell respondió sin link (campo ${field}): ${String(text).slice(0, 120)}`)
    } catch (e) {
      lastErr = e
    }
  }

  throw lastErr || new Error('No se pudo subir a Russell')
}

async function sendWithCopyButtons(conn, jid, quotedMsg, text, catboxUrl, russellUrl) {
  const buttons = []
  if (catboxUrl) {
    buttons.push({
      name: 'cta_copy',
      buttonParamsJson: JSON.stringify({
        display_text: '★ Copiar URL [𝟭]',
        copy_code: catboxUrl
      })
    })
  }
  if (russellUrl) {
    buttons.push({
      name: 'cta_copy',
      buttonParamsJson: JSON.stringify({
        display_text: '★ Copiar URL [𝟮]',
        copy_code: russellUrl
      })
    })
  }

  if (!buttons.length) {
    return await conn.sendMessage(jid, { text }, { quoted: quotedMsg })
  }

  try {
    const msg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({ text }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons
              })
            })
          }
        }
      },
      { quoted: quotedMsg }
    )
    await conn.relayMessage(jid, msg.message, { messageId: msg.key.id })
  } catch {
    await conn.sendMessage(jid, { text }, { quoted: quotedMsg })
  }
}

let handler = async (m, { conn }) => {
  const from = m.key.remoteJid
  const quoted = pickQuotedMessage(m)

  if (!quoted) {
    return await conn.sendMessage(
      from,
      { text: '「✦」Responde a un *archivo/media* para subir.' },
      { quoted: m }
    )
  }

  const type = detectType(quoted)
  if (!type || !quoted[type]) {
    return await conn.sendMessage(
      from,
      { text: '「✦」No pude detectar el archivo/media. Responde a un *documento*, *imagen*, *video*, *audio* o *sticker*.' },
      { quoted: m }
    )
  }

  try {
    const content = quoted[type]
    const filename = guessFileName(content, type)
    const stream = await downloadContentFromMessage(content, typeToStreamKind(type))
    const buffer = await streamToBuffer(stream)

    const results = await Promise.allSettled([
      uploadCatbox(buffer, filename),
      uploadRussell(buffer, filename)
    ])

    const catboxUrl = results[0].status === 'fulfilled' ? results[0].value : null
    const russellUrl = results[1].status === 'fulfilled' ? results[1].value : null

    if (!catboxUrl && !russellUrl) throw new Error('Fallaron ambas subidas')

    const lines = ['「✦」Archivo subido correctamente.']
    if (catboxUrl) lines.push(`> 🜸 Catbox » ${catboxUrl}`)
    if (russellUrl) lines.push(`> 🜸 Russell » ${russellUrl}`)

    await sendWithCopyButtons(conn, from, m, lines.join('\n'), catboxUrl, russellUrl)
  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      from,
      { text: '「✦」Error al subir.\n> ✐ Intenta nuevamente.' },
      { quoted: m }
    )
  }
}

handler.help = ['tourl']
handler.tags = ['utility']
handler.command = ['tourl']

export default handler
