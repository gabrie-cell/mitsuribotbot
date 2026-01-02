const handler = async (m, { conn, from }) => {

  const ctx =
    m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo ||
    m.message?.documentMessage?.contextInfo ||
    m.message?.audioMessage?.contextInfo ||
    null

  if (!ctx?.stanzaId) {
    return conn.sendMessage(from, {
      text: '☁️ *Responde al mensaje que deseas eliminar*.'
    }, { quoted: m })
  }

  try {
    await conn.sendMessage(from, {
      delete: {
        remoteJid: from,
        fromMe: false,
        id: ctx.stanzaId,
        participant: ctx.participant
      }
    })

    await conn.sendMessage(from, {
      delete: {
        remoteJid: from,
        fromMe: m.key.fromMe || false,
        id: m.key.id,
        participant: m.key.participant || undefined
      }
    })

  } catch (e) {
    console.error('[DELETE]', e)
    await conn.sendMessage(from, {
      text: '❌ No se pudo eliminar el mensaje.'
    }, { quoted: m })
  }
}

handler.help = ['delete']
handler.tags = ['group']
handler.command = ['del', 'delete']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler