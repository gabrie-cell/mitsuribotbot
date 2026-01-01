import {
  withDbLock,
  loadEconomyDb,
  saveEconomyDb,
  gachaDecor,
  safeUserTag,
  replyText
} from '../biblioteca/economia.js'

import { getWaifuById, searchWaifus, rarityMeta } from '../biblioteca/waifuCatalog.js'
import { getWaifuImageUrl } from '../biblioteca/waifuImages.js'

const VIDEO_RE = /\.(mp4|mov|webm)$/i
const GIF_RE = /\.(gif)$/i

function pick(arr = []) {
  const list = Array.isArray(arr) ? arr.filter(Boolean).map(String) : []
  if (!list.length) return null
  return list[Math.floor(Math.random() * list.length)] || null
}

function resolveWaifu(query = '') {
  const q = String(query || '').trim()
  if (!q) return null
  const direct = getWaifuById(q)
  if (direct) return direct
  const hit = searchWaifus(q, 1)?.[0]
  return hit || null
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = String(text || '').trim()

  await withDbLock('global', async () => {
    const db = loadEconomyDb()
    const userTag = safeUserTag(conn, m)

    if (!q) {
      const t = gachaDecor({
        title: 'Uso:',
        lines: [
          `> *${usedPrefix || '.'}${command} <id|nombre>*`,
          `> Ej: *${usedPrefix || '.'}${command} w005*`
        ],
        userTag
      })
      saveEconomyDb(db)
      return replyText(conn, m, t)
    }

    const w = resolveWaifu(q)
    if (!w) {
      const t = gachaDecor({
        title: 'No se encontró el personaje.',
        lines: [`> Prueba con *${usedPrefix || '.'}buscarwaifu <texto>*.`],
        userTag
      })
      saveEconomyDb(db)
      return replyText(conn, m, t)
    }

    const meta = rarityMeta(w.rarity)
    const caption = gachaDecor({
      title: `Video/Media: ${w.name}`,
      lines: [
        `> ❏ ID » *${w.id}*`,
        `> ✰ Rareza » *${meta.name} (${w.rarity})*`,
        `> ❐ Origen » *${w.source}*`
      ],
      userTag
    })

   
    let url = pick(w.vid || w.video || [])
    
    if (!url) url = pick(w.img || w.images || [])
    if (!url) url = await getWaifuImageUrl(w, null).catch(() => null)

    saveEconomyDb(db)

    if (!url) return replyText(conn, m, caption)

    const u = String(url)
    try {
      if (VIDEO_RE.test(u)) {
        await conn.sendMessage(m.chat, { video: { url: u }, caption }, { quoted: m })
        return
      }
      if (GIF_RE.test(u)) {
        await conn.sendMessage(m.chat, { video: { url: u }, gifPlayback: true, caption }, { quoted: m })
        return
      }
      await conn.sendMessage(m.chat, { image: { url: u }, caption }, { quoted: m })
      return
    } catch {
      return replyText(conn, m, caption)
    }
  })
}

handler.command = ['charvideo', 'waifuvideo', 'cvideo', 'wvideo']
handler.tags = ['gacha']
handler.help = ['charvideo <id|nombre>']

export default handler
