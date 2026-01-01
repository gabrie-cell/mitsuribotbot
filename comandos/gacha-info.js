import {
  withDbLock,
  loadEconomyDb,
  saveEconomyDb,
  getUser,
  normalizeUserJid,
  msToHuman,
  gachaDecor,
  safeUserTag,
  replyText
} from '../biblioteca/economia.js'

import { getWaifuById, rarityMeta } from '../biblioteca/waifuCatalog.js'

const CLAIM_WINDOW = 5 * 60 * 1000

const handler = async (m, { conn, usedPrefix }) => {
  const userJid = normalizeUserJid(m?.sender)

  await withDbLock('global', async () => {
    const db = loadEconomyDb()
    const user = getUser(db, userJid)
    const userTag = safeUserTag(conn, m)

    const inv = Array.isArray(user.waifus) ? user.waifus : []
    const favId = String(user.favWaifu || '').trim()
    const fav = favId ? getWaifuById(favId) : null

    const last = user.lastRoll || { id: '', at: 0 }
    const id = String(last.id || '').trim()
    const at = Number(last.at || 0)
    const remain = id && at ? Math.max(0, CLAIM_WINDOW - (Date.now() - at)) : 0

    const lines = [
      `> Personajes en harem » *${inv.length}*`,
      favId ? `> Favorita » *${fav?.name || favId}* (ID *${favId}*)` : `> Favorita » *—*`,
      '',
      id ? `> Último roll » *${id}*` : `> Último roll » *—*`,
      id && at ? `> Tiempo para reclamar » *${msToHuman(remain)}*` : '',
      '',
      user.claimMsg ? `> ClaimMsg » *Activo*` : `> ClaimMsg » *Por defecto*`,
      '',
      `✐ Inventario: *${usedPrefix || '.'}waifus*`,
      `✐ Mercado: *${usedPrefix || '.'}market*`,
      `✐ Personalizar claim: *${usedPrefix || '.'}setclaimmsg*`
    ].filter(Boolean)

    const t = gachaDecor({
      title: 'Tu información de Gacha',
      lines,
      userTag
    })

    saveEconomyDb(db)
    return replyText(conn, m, t)
  })
}

handler.command = ['gachainfo', 'ginfo', 'infogacha']
handler.tags = ['gacha']
handler.help = ['gachainfo']

export default handler
