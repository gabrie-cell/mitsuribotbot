import {
  withDbLock,
  loadEconomyDb,
  saveEconomyDb,
  getUser,
  getWaifuState,
  normalizeUserJid,
  gachaDecor,
  safeUserTag,
  replyText
} from '../biblioteca/economia.js'

import { getWaifuById } from '../biblioteca/waifuCatalog.js'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const userJid = normalizeUserJid(m?.sender)
  const id = String(args?.[0] || '').trim()

  await withDbLock('global', async () => {
    const db = loadEconomyDb()
    const user = getUser(db, userJid)
    const userTag = safeUserTag(conn, m)

    if (!id) {
      const t = gachaDecor({
        title: 'Uso:',
        lines: [`> *${usedPrefix || '.'}${command} <id>*`, `> Ej: *${usedPrefix || '.'}${command} w005*`],
        userTag
      })
      saveEconomyDb(db)
      return replyText(conn, m, t)
    }

    if (!user.waifus?.includes(id)) {
      const t = gachaDecor({
        title: 'No tienes ese personaje.',
        lines: [`> Revisa tu inventario: *${usedPrefix || '.'}waifus*`],
        userTag
      })
      saveEconomyDb(db)
      return replyText(conn, m, t)
    }

    const st = getWaifuState(db, id)
    if (String(st?.owner || '') !== String(userJid)) {
      const t = gachaDecor({
        title: 'No eres el dueño actual.',
        lines: [`> Ese personaje figura a nombre de otra persona.`],
        userTag
      })
      saveEconomyDb(db)
      return replyText(conn, m, t)
    }

    if (db.market?.[id]) delete db.market[id]
l
    if (db.waifus?.[id]) delete db.waifus[id]

    user.waifus = (user.waifus || []).filter((x) => x !== id)

    if (String(user.favWaifu || '') === id) user.favWaifu = ''

    const w = getWaifuById(id)
    saveEconomyDb(db)

    const t = gachaDecor({
      title: 'Personaje eliminado.',
      lines: [`> Eliminaste *${w?.name || id}* (ID *${id}*) de tu harem.`],
      userTag
    })
    return replyText(conn, m, t)
  })
}

handler.command = ['deletewaifu', 'delwaifu', 'delchar']
handler.tags = ['gacha']
handler.help = ['delwaifu <id>']

export default handler
