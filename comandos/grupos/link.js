import { jidNormalizedUser } from '@whiskeysockets/baileys'

function normalizeJid(jid = '') {
  try {
    return jid ? jidNormalizedUser(jid) : ''
  } catch {
    return String(jid || '')
  }
}

export default async function handler(m, ctx) {
  const { conn, from, isGroup } = ctx

  if (!isGroup) {
    await conn.sendMessage(from, { text: '「✦」Este comando solo funciona en grupos.' }, { quoted: m })
    return
  }

  try {
    const code = await conn.groupInviteCode(from)
    const link = `https://chat.whatsapp.com/${code}`
    await conn.sendMessage(from, { text: `「✿」Link del grupo\n> ${link}` }, { quoted: m })
  } catch {
    await conn.sendMessage(from, { text: '「✦」No pude obtener el link.' }, { quoted: m })
  }
}

handler.command = ['linkgc', 'link', 'grouplink']
handler.tags = ['group']
handler.help = ['linkgc']
handler.botadm = true