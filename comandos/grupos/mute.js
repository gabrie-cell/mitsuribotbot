import fetch from 'node-fetch'
import { jidNormalizedUser } from '@whiskeysockets/baileys'

const mutedUsers = new Set()

function normalizeJid(jid = '') {
  try {
    return jid ? jidNormalizedUser(jid) : ''
  } catch {
    return String(jid || '')
  }
}

let handler = async (m, { conn, from, command }) => {
  const chat = normalizeJid(from)
  const ctx = m.message?.extendedTextMessage?.contextInfo
  const user = m.mentionedJid?.[0] || ctx?.participant || m.quoted?.sender

  if (!user) {
    await conn.sendMessage(chat, { text: '☁️ Responde o menciona al usuario.' }, { quoted: m })
    return
  }

  if (user === m.sender) {
    await conn.sendMessage(chat, { text: '❌ No puedes mutearte a ti mismo.' }, { quoted: m })
    return
  }

  if (user === conn.user.jid) {
    await conn.sendMessage(chat, { text: '🤖 No puedes mutear al bot.' }, { quoted: m })
    return
  }

  if (global.owner?.includes(user)) {
    await conn.sendMessage(chat, { text: '👑 No puedes mutear a un Owner.' }, { quoted: m })
    return
  }

  const thumbnailUrl = command === 'mute'
    ? 'https://telegra.ph/file/f8324d9798fa2ed2317bc.png'
    : 'https://telegra.ph/file/aea704d0b242b8c41bf15.png'
  const thumbBuffer = await fetch(thumbnailUrl).then(res => res.buffer())

  const preview = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: chat },
    message: { locationMessage: { name: command === 'mute' ? 'Usuario muteado' : 'Usuario desmuteado', jpegThumbnail: thumbBuffer } }
  }

  if (command === 'mute') {
    mutedUsers.add(user)
    await conn.sendMessage(chat, { text: `🔇 Usuario muteado`, mentions: [user] }, { quoted: preview })
  } else {
    mutedUsers.delete(user)
    await conn.sendMessage(chat, { text: `🔊 Usuario desmuteado`, mentions: [user] }, { quoted: preview })
  }
}

handler.before = async (m, { conn }) => {
  if (!m.isGroup || m.fromMe) return
  const chat = m.chat
  const user = m.sender

  if (mutedUsers.has(user)) {
    await conn.sendMessage(chat, { delete: m.key }).catch(() => {})
    return true
  }
}

handler.help = ['mute @usuario', 'unmute @usuario']
handler.tags = ['GRUPOS']
handler.command = ['mute', 'unmute']
handler.group = true
handler.admin = true

export default handler