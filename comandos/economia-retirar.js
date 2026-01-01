import {
  withDbLock,
  loadEconomyDb,
  saveEconomyDb,
  getSubbotId,
  getUser,
  parseAmount,
  formatMoney,
  economyDecor,
  safeUserTag,
  replyText
} from '../biblioteca/economia.js'

const handler = async (m, { conn, args }) => {
  const subbotId = getSubbotId(conn)
  const userJid = m?.sender
  const input = args?.[0]

  await withDbLock(subbotId, async () => {
    const db = loadEconomyDb()
    const user = getUser(db, subbotId, userJid)

    const amount = parseAmount(input, user.bank)
    const userTag = safeUserTag(conn, m)

    if (!amount || amount <= 0) {
      const text = economyDecor({
        title: 'Uso: with all | with <cantidad>',
        lines: [
          `> Billetera » *${formatMoney(user.wallet)}*`,
          `> Banco » *${formatMoney(user.bank)}*`
        ],
        userTag
      })
      saveEconomyDb(db)
      return await replyText(conn, m, text)
    }

    if (user.bank < amount) {
      const text = economyDecor({
        title: 'No tienes suficiente en el banco.',
        lines: [`> Te faltan » *${formatMoney(amount - user.bank)}*`],
        userTag
      })
      saveEconomyDb(db)
      return await replyText(conn, m, text)
    }

    user.bank -= amount
    user.wallet += amount

    const text = economyDecor({
      title: `Has retirado *${formatMoney(amount)}* del banco.`,
      lines: [
        `> Billetera » *${formatMoney(user.wallet)}*`,
        `> Banco » *${formatMoney(user.bank)}*`
      ],
      userTag
    })

    saveEconomyDb(db)
    await replyText(conn, m, text)
  })
}

handler.command = ['withdraw', 'with', 'retirar', 'ret', 'wd']
handler.tags = ['economy']
handler.help = ['with all', 'with 50000', 'retirar 50k']

export default handler
      
