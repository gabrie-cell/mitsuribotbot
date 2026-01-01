import {
  withDbLock,
  loadEconomyDb,
  saveEconomyDb,
  getNameSafe,
  gachaDecor,
  replyText,
  resolveUserJid
} from '../biblioteca/economia.js'

import { getWaifuById, rarityMeta } from '../biblioteca/waifuCatalog.js'

function fmt(n) {
  const x = Math.floor(Number(n) || 0)
  return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const handler = async (m, { conn }) => {
  await withDbLock('global', async () => {
    const db = loadEconomyDb()

    const owners = new Map()
    const waifuStates = db.waifus || {}

    for (const [id, st] of Object.entries(waifuStates)) {
      const owner = String(st?.owner || '').trim()
      if (!owner) continue

      const w = getWaifuById(id)
      if (!w) continue

      const meta = rarityMeta(w?.rarity)
      const value = Number(w?.value) || Number(meta?.value) || 0

      const cur = owners.get(owner) || { count: 0, value: 0 }
      cur.count += 1
      cur.value += value
      owners.set(owner, cur)
    }

    const list = Array.from(owners.entries())
      .map(([jid, v]) => ({ jid, ...v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    if (!list.length) {
      const t = gachaDecor({
        title: 'Aún no hay waifus reclamadas.',
        lines: [`> Usa *${m.usedPrefix || '.'}rw* y *${m.usedPrefix || '.'}claim* para empezar.`]
      })
      saveEconomyDb(db)
      return replyText(conn, m, t)
    }

    const lines = []
    for (let i = 0; i < list.length; i++) {
      const row = list[i]

      let name = ''
      try {
        const resolvedOwner = await resolveUserJid(conn, row.jid)
        name = await getNameSafe(conn, resolvedOwner || row.jid)
      } catch {}

      if (!name) {
        const num = String(row.jid || '').split('@')[0].replace(/[^\d]/g, '')
        name = num ? `+${num}` : String(row.jid || '')
      }

      lines.push(
        `> ${(i + 1).toString().padStart(2, '0')}. *${name}*\n  └ ♡ Valor total: *¥${fmt(row.value)}* • Waifus: *${row.count}*`
      )
    }

    const t = gachaDecor({
      title: 'Top Coleccionistas (*Gacha*)',
      lines
    })

    saveEconomyDb(db)
    return replyText(conn, m, t)
  })
}

handler.command = ['topcoleccionistas', 'topcollectors', 'gachatop', 'colecciontop']
handler.tags = ['gacha']
handler.help = ['topwaifus']

export default handler