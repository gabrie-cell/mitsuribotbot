import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { setBotEnabled, isBotEnabled } from '../biblioteca/settings.js'

function normalizeJid(jid = '') {
  return jid ? jidNormalizedUser(jid) : ''
}

export default async function handler(m, ctx) {
  const { conn, from, isGroup, command, isOwner, userIsAdmin, sender, isSubBot } = ctx
  if (!isGroup) {
    await conn.sendMessage(from, { text: '「✦」Este comando solo funciona en grupos.' }, { quoted: m })
    return
  }

  const subOwner = isSubBot ? normalizeJid(conn?.subbotOwner || '') : ''
  const isSubOwner = subOwner && normalizeJid(sender) === subOwner

  if (!isOwner && !userIsAdmin && !isSubOwner) {
    await conn.sendMessage(from, { text: '「✦」Solo admins del grupo o owner pueden usar esto.' }, { quoted: m })
    return
  }

  const subbotId = isSubBot ? String(conn?.subbotId || '').trim() : ''
  if (command === 'banchat') {
    setBotEnabled(from, false, subbotId)
    await conn.sendMessage(from, { text: '「✦」Bot desactivado en este grupo.' }, { quoted: m })
    return
  }

  if (command === 'unbanchat') {
    setBotEnabled(from, true, subbotId)
    await conn.sendMessage(from, { text: '「✦」Bot activado en este grupo.' }, { quoted: m })
    return
  }
}

handler.command = ['banchat', 'unbanchat']
