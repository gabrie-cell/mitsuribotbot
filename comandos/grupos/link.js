async function handler(m, { conn }) {
  let code = await conn.groupInviteCode(m.chat)
  let link = 'https://chat.whatsapp.com/' + code

  await conn.sendMessage(m.chat, {
    text: link,
    contextInfo: {
      externalAdReply: {
        title: '⚡ LINK DEL GRUPO ⚡',
        body: 'Únete al grupo oficial',
        thumbnailUrl: 'https://files.catbox.moe/xr2m6u.jpg',
        sourceUrl: link,
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: false
      }
    }
  }, { quoted: m })
}

handler.command = ['link']
handler.group = true
handler.botAdmin = true

export default handler