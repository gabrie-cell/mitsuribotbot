import {
  withDbLock,
  loadEconomyDb,
  saveEconomyDb,
  getNameSafe,
  gachaDecor,
  safeUserTag,
  replyText
} from '../biblioteca/economia.js'

import { getWaifuById, rarityMeta } from '../biblioteca/waifuCatalog.js'

const PER_PAGE = 10

const handler = async (m, { conn, args }) => {
  const page = Math.max(1, Math.floor(Number(args?.[0] || 1)))

  await withDbLock('global', async () => {
    const db = loadEconomyDb()
    const userTag = safeUserTag(conn, m)

    const items = Object.values(db.market || {})
      .filter(Boolean)
      .sort((a, b) => Number(b.listedAt || 0) - Number(a.listedAt || 0))

    if (!items.length) {
      const text = gachaDecor({
        title: 'Mercado vacío por ahora.',
        lines: [`> Vende una waifu: *${m.usedPrefix || '.'}venderwaifu <id> <precio>*`],
        userTag
      })
      saveEconomyDb(db)
      return await replyText(conn, m, text)
    }

    const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
    const p = Math.min(page, totalPages)
    const start = (p - 1) * PER_PAGE
    const slice = items.slice(start, start + PER_PAGE)

    const lines = []
    for (let i = 0; i < slice.length; i++) {
      const e = slice[i]
      const w = getWaifuById(e.waifuId)
      const meta = rarityMeta(w?.rarity)
      const sellerName = await getNameSafe(conn, e.seller)
      const pretty = Number(e.price || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      lines.push(
        `> ${(start + i + 1).toString().padStart(2, '0')}. *${w?.name || e.waifuId}* (✰ ${w?.rarity || '?'})\n  └ ID: *${e.waifuId}* • Precio: *¥${pretty}* • Vendedor: *${sellerName}*`
      )
    }

    lines.push('', `✐ Página *${p}*/*${totalPages}*  —  Total: *${items.length}*`, `> Comprar: *${m.usedPrefix || '.'}comprarwaifu <id>*`)

    const text = gachaDecor({
      title: 'Mercado de Waifus',
      lines,
      userTag
    })

    saveEconomyDb(db)
    await replyText(conn, m, text)
  })
}

handler.command = ['haremshop', 'tiendawaifus', 'wshop', 'market', 'mercado']
handler.tags = ['gacha']
handler.help = ['market [página]']

export default handler
