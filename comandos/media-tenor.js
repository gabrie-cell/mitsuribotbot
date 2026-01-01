import axios from 'axios'

const TENOR_ENDPOINT = 'https://tenor.googleapis.com/v2/search'
const CATBOX_ENDPOINT = 'https://catbox.moe/user/api.php'

function extractTenorTokenFromMediaUrl(u = '') {
  const s = String(u || '')
  const m = s.match(/tenor\.com\/m\/([^/]+)/i)
  return m?.[1] || ''
}

function toTrueGifUrlFromToken(token = '') {
  return token ? `https://c.tenor.com/${token}/tenor.gif` : ''
}

function pickUrls(mf = {}) {
  const gifRaw = mf?.gif?.url || mf?.originalgif?.url || ''
  const token = extractTenorTokenFromMediaUrl(gifRaw)
  const gif = toTrueGifUrlFromToken(token) || gifRaw || ''

  const mp4 = mf?.mp4?.url || mf?.tinymp4?.url || ''
  const webm = mf?.webm?.url || ''

  return { gif, mp4, webm }
}

function normalizeResult(r = {}) {
  const mf = r.media_formats || {}
  const { gif, mp4, webm } = pickUrls(mf)

  return {
    id: String(r.id || ''),
    title: r.title || r.h1_title || r.long_title || '',
    page_url: r.url || r.itemurl || '',
    gif_url: gif,
    mp4_url: mp4,
    webm_url: webm
  }
}

async function tenorSearch(query = '', limit = 50) {
  const params = {
    appversion: 'browser-r20251209-1',
    prettyPrint: 'false',
    key: 'AIzaSyC-P6_qz3FzCoXGLk6tgitZo4jEJ5mLzD8',
    client_key: 'tenor_web',
    locale: 'es_US',
    anon_id: 'AAZHDntgcvcI5Qq9XzSEuQ',
    q: String(query || '').trim(),
    limit: String(Math.max(1, Math.min(50, Number(limit || 50)))),
    contentfilter: 'low',
    media_filter: 'gif,originalgif,gifpreview,mp4,tinymp4,webm',
    fields: [
      'next',
      'results.id',
      'results.media_formats',
      'results.title',
      'results.h1_title',
      'results.long_title',
      'results.itemurl',
      'results.url'
    ].join(','),
    component: 'web_mobile'
  }

  const res = await axios.get(TENOR_ENDPOINT, {
    params,
    timeout: 30000,
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent':
        'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'cache-control': 'no-store'
    },
    validateStatus: (s) => s >= 200 && s < 300
  })

  const data = res.data || {}
  const results = Array.isArray(data.results)
    ? data.results.map(normalizeResult).filter(x => x.gif_url || x.mp4_url || x.webm_url)
    : []

  return { next: data.next || null, results }
}

function pickRandom(arr = []) {
  if (!arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

async function downloadBuffer(url) {
  const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
  return Buffer.from(r.data)
}

async function uploadToCatbox(buffer, filename = 'file.bin') {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', new Blob([buffer]), filename)

  const res = await fetch(CATBOX_ENDPOINT, { method: 'POST', body: form })
  const text = String(await res.text()).trim()

  if (!res.ok) throw new Error(`Catbox HTTP ${res.status}`)
  if (!/^https?:\/\/.+/i.test(text)) throw new Error(`Catbox error: ${text}`)

  return text
}

function extFromUrl(u = '') {
  const s = String(u || '').toLowerCase()
  if (s.includes('.mp4')) return 'mp4'
  if (s.includes('.webm')) return 'webm'
  if (s.includes('.gif')) return 'gif'
  return ''
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q =
    String(text || '').trim() ||
    String(m?.quoted?.text || m?.quoted?.caption || '').trim() ||
    ''

  if (!q) {
    return conn.sendMessage(
      m.chat,
      { text: `「✦」Usa: *${usedPrefix + command}* <búsqueda>\nEj: *${usedPrefix + command}* gato alien meme` },
      { quoted: m }
    )
  }

  try {
    m.react?.('🕒').catch?.(() => {})

    const { results } = await tenorSearch(q, 50)
    const picked = pickRandom(results)

    if (!picked) {
      m.react?.('❌').catch?.(() => {})
      return conn.sendMessage(m.chat, { text: '「✦」No encontré resultados.' }, { quoted: m })
    }

    const caption = picked.title ? `「✦」${picked.title}` : `「✦」${q}`

    if (picked.mp4_url) {
      const buf = await downloadBuffer(picked.mp4_url)
      const catUrl = await uploadToCatbox(buf, `tenor_${picked.id || 'gif'}.mp4`)

      m.react?.('✅').catch?.(() => {})
      return conn.sendMessage(
        m.chat,
        {
          video: { url: catUrl },
          mimetype: 'video/mp4',
          gifPlayback: true,
          caption
        },
        { quoted: m }
      )
    }

    if (picked.gif_url) {
      const buf = await downloadBuffer(picked.gif_url)
      const catUrl = await uploadToCatbox(buf, `tenor_${picked.id || 'gif'}.gif`)

      m.react?.('✅').catch?.(() => {})
      return conn.sendMessage(
        m.chat,
        {
          document: { url: catUrl },
          mimetype: 'image/gif',
          fileName: `tenor_${picked.id || 'gif'}.gif`,
          caption
        },
        { quoted: m }
      )
    }

    if (picked.webm_url) {
      const buf = await downloadBuffer(picked.webm_url)
      const catUrl = await uploadToCatbox(buf, `tenor_${picked.id || 'gif'}.webm`)

      m.react?.('✅').catch?.(() => {})
      return conn.sendMessage(
        m.chat,
        {
          video: { url: catUrl },
          mimetype: 'video/webm',
          caption
        },
        { quoted: m }
      )
    }

    m.react?.('❌').catch?.(() => {})
    return conn.sendMessage(m.chat, { text: '「✦」No encontré un formato válido.' }, { quoted: m })
  } catch (e) {
    m.react?.('❌').catch?.(() => {})
    const err = e?.response?.data || e?.message || String(e)
    await conn.sendMessage(
      m.chat,
      { text: `「✦」Error: ${typeof err === 'string' ? err : JSON.stringify(err)}` },
      { quoted: m }
    )
  }
}

handler.help = ['tenor <texto>']
handler.tags = ['fun', 'downloader']
handler.command = ['tenor']

export default handler