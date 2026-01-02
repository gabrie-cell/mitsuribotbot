let handler = async (m, { conn, args }) => {
  try {
    if (!m.isGroup)
      return m.reply('⚠️ Este comando solo funciona en grupos.')

    const text = args.join(' ').trim()

    const meta = await conn.groupMetadata(m.chat)
    const botId =
      conn.user?.id ||
      conn.user?.jid ||
      conn.user?.lid

    const mentions = meta.participants
      .map(p => p.id || p.jid)
      .filter(jid => jid && jid !== botId)

    const quoted = extractQuotedMessage(m)

    // 📣 aviso
    await conn.sendMessage(
      m.chat,
      {
        text: '📣 *Notificación:* mensaje reenviado',
        mentions
      },
      { quoted: m }
    )

    // 🔁 reenviar TODO
    if (quoted) {
      await forwardAnyMessage(conn, m.chat, quoted)

      if (text) {
        await conn.sendMessage(
          m.chat,
          { text },
          { quoted: m }
        )
      }
      return
    }

    // 📝 solo texto
    if (text) {
      await conn.sendMessage(
        m.chat,
        { text },
        { quoted: m }
      )
      return
    }

    await m.reply('❌ No hay nada para reenviar.')

  } catch (err) {
    console.error('Error en .n:', err)
    await m.reply('❌ Error:\n' + err.message)
  }
}

handler.command = ['n']
export default handler