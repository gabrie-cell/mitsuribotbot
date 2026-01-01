import {
  withDbLock,
  loadEconomyDb,
  saveEconomyDb,
  getUser,
  getWaifuState,
  setMarketEntry,
  normalizeUserJid,
  getNameSafe,
  gachaDecor,
  safeUserTag,
  formatMoney,
  replyText
} from '../biblioteca/economia.js'

import { getWaifuById, rarityMeta } from '../biblioteca/waifuCatalog.js'

const handler = async (m, { conn, args }) => {
  const buyerJid = normalizeUserJid(m?.sender)
  let waifuId = String(args?.[0] || '').trim()

  await withDbLock('global', async () => {
    const db = loadEconomyDb()
    const buyer = getUser(db, buyerJid)
    const userTag = safeUserTag(conn, m)

    if (!waifuId) {
      const text = gachaDecor({
        title: 'Uso: comprarwaifu <id>',
        lines: [`> Ej: *${m.usedPrefix || '.'}comprarwaifu w010*`],
        userTag
      })
      saveEconomyDb(db)
      return await replyText(conn, m, text)
    }
    if (waifuId && !db.market?.[waifuId]) {
      const q = waifuId.toLowerCase()
      const ids = Object.keys(db.market || {})
      const hit = ids.find((id) => {
        const w = getWaifuById(id)
        if (!w?.name) return false
        return w.name.toLowerCase() === q
      }) || ids.find((id) => {
        const w = getWaifuById(id)
        if (!w?.name) return false
        return w.name.toLowerCase().includes(q)
      })
      if (hit) waifuId = hit
    }

    const entry = db.market?.[waifuId]
    if (!entry) {
      const text = gachaDecor({
        title: 'Esa waifu no está en venta.',
        lines: [`> Ver mercado: *${m.usedPrefix || '.'}market*`],
        userTag
      })
      saveEconomyDb(db)
      return await replyText(conn, m, text)
    }

    if (normalizeUserJid(entry.seller) === buyerJid) {
      const text = gachaDecor({
        title: 'No puedes comprarte a ti mismo.',
        lines: [`> Si quieres quitarla, usa *${m.usedPrefix || '.'}cancelarventa ${waifuId}*`],
        userTag
      })
      saveEconomyDb(db)
      return await replyText(conn, m, text)
    }

    const price = Math.max(0, Math.floor(Number(entry.price || 0)))
    if (buyer.wallet < price) {
      const text = gachaDecor({
        title: 'No te alcanza el dinero en la wallet.',
        lines: [
          `> Precio: *${formatMoney(price)}*`,
          `> Tu wallet: *${formatMoney(buyer.wallet)}*`,
          `> Deposita/retira si necesitas: *${m.usedPrefix || '.'}retirar all*`
        ],
        userTag
      })
      saveEconomyDb(db)
      return await replyText(conn, m, text)
    }

    const seller = getUser(db, entry.seller)
    
    buyer.wallet -= price
    seller.wallet += price

    const state = getWaifuState(db, waifuId)
    state.owner = buyerJid
    state.claimedAt = Date.now()

    seller.waifus = Array.isArray(seller.waifus) ? seller.waifus.filter((x) => x !== waifuId) : []
    buyer.waifus = Array.isArray(buyer.waifus) ? buyer.waifus : []
    if (!buyer.waifus.includes(waifuId)) buyer.waifus.push(waifuId)

    setMarketEntry(db, waifuId, null)

    const w = getWaifuById(waifuId)
    const meta = rarityMeta(w?.rarity)
    const sellerName = await getNameSafe(conn, entry.seller)

    const text = gachaDecor({
      title: '¡Compra realizada!',
      lines: [
        `> Compraste *${w?.name || waifuId}* (✰ ${w?.rarity || '?'})`,
        `> ❏ ID » *${waifuId}*`,
        `> Vendedor » *${sellerName}*`,
        `> Pagaste » *${formatMoney(price)}*`,
        '',
        `✐ Ver tu inventario: *${m.usedPrefix || '.'}waifus*`
      ],
      userTag
    })

    saveEconomyDb(db)
    await replyText(conn, m, text)
  })
}

handler.command = ['buycharacter', 'buychar', 'buyc', 'comprarwaifu', 'buywaifu', 'buy']
handler.tags = ['gacha']
handler.help = ['comprarwaifu <id>']

export default handler
