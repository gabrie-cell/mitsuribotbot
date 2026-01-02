let handler = async (m, { conn, from, participants }) => {

  const ctx = m.message?.extendedTextMessage?.contextInfo
  const target =
    m.mentionedJid?.[0] ||
    ctx?.participant ||
    m.quoted?.sender

  if (!target) {
    return conn.sendMessage(from, {
      text: '*🗡️ 𝙼𝚎𝚗𝚌𝚒𝚘𝚗𝚊 𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎 𝚊𝚕 𝚞𝚜𝚞𝚊𝚛𝚒𝚘 𝚚𝚞𝚎 𝚍𝚎𝚜𝚎𝚊𝚜 𝚎𝚕𝚒𝚖𝚒𝚗𝚊𝚛*'
    }, { quoted: m })
  }

  const member = participants.find(p => p.id === target)

  if (!member) return

  await conn.groupParticipantsUpdate(from, [target], 'remove')

  await conn.sendMessage(from, {
    text: '*🗡️ 𝚄𝚂𝚄𝙰𝚁𝙸𝙾 𝙴𝙻𝙸𝙼𝙸𝙽𝙰𝙳𝙾*'
  }, { quoted: m })
}

handler.command = ['kick']
handler.useradm = true
handler.botadm = true
export default handler