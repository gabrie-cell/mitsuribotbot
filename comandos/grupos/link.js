async function handler(m, { conn }) {
  let chat = m.chat
  let code = await conn.groupInviteCode(chat)
  let link = 'https://chat.whatsapp.com/' + code

  await conn.sendMessage(chat, {
    text: link,
    contextInfo: {
      externalAdReply: {
        title: 'Invitación a grupo de WhatsApp',
        body: 'Toca para unirte',
        sourceUrl: link,
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: false
      }
    }
  }, { quoted: m })
}

handler.command = ['link']
handler.group = true
handler.botAdmin = true

export default handler