let handler = async (m, { conn, args, participants }) => {
  try {
    if (!m.isGroup)
      return m.reply('⚠️ Este comando solo funciona en grupos.')

    const textExtra = args.join(' ').trim()
    const mentions = participants.map(p => p.id)
    const invisible = '\u200e'
    const mentionText = mentions.map(() => '@' + invisible).join('')

    let q =
      m?.quoted?.fakeObj ||
      m?.quoted ||
      m?.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      null

    if (q) {
      for (let i = 0; i < 6; i++) {
        const next =
          q?.ephemeralMessage?.message ||
          q?.viewOnceMessage?.message ||
          q?.viewOnceMessageV2?.message ||
          q?.viewOnceMessageV2Extension?.message ||
          q?.documentWithCaptionMessage?.message ||
          null
        if (!next) break
        q = next
      }

      const type = Object.keys(q)[0]

      // ===== TEXTO =====
      if (type === 'conversation' || type === 'extendedTextMessage') {
        const txt =
          q.conversation ||
          q.extendedTextMessage?.text ||
          ''

        await conn.sendMessage(
          m.chat,
          {
            text: txt + '\n' + mentionText,
            mentions
          },
          { quoted: m }
        )
      }

      // ===== MEDIA =====
      else {
        const media = q[type]
        const key = type.replace('Message', '')

        await conn.sendMessage(
          m.chat,
          {
            [key]: media,
            caption: (media.caption || '') + '\n' + mentionText,
            mentions
          },
          { quoted: m }
        )
      }

      if (textExtra) {
        await conn.sendMessage(
          m.chat,
          {
            text: textExtra + '\n' + mentionText,
            mentions
          },
          { quoted: m }
        )
      }

      return
    }

    if (textExtra) {
      await conn.sendMessage(
        m.chat,
        {
          text: textExtra + '\n' + mentionText,
          mentions
        },
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