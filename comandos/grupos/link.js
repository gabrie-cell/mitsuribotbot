async function handler(m, { conn, participants, groupMetadata }) {
  let group = m.chat
  let totalMembers = participants.length

  let code = await conn.groupInviteCode(group)
  let link = 'https://chat.whatsapp.com/' + code

  let text = `*⚡🌩️──『 𝑳𝑰𝑵𝑲 』──🌩️⚡*

📛 *Grupo:* ${groupMetadata.subject}
👥 *Miembros:* ${totalMembers}

🔗 *Enlace mágico:* 
${link}

🐭 ¡Pikachu dice que lo compartas con los mejores entrenadores! ⚡`

  await conn.sendMessage(
    m.chat,
    { text, detectLink: true },
    { quoted: m }
  )
}

handler.help = ['link']
handler.tags = ['grupo']
handler.command = ['link', 'enlace']
handler.group = true
handler.botAdmin = true

export default handler