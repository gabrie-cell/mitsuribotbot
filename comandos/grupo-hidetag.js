import { generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

let thumb = null
fetch('https://files.catbox.moe/tx6prq.jpg')
.then(r => r.arrayBuffer())
.then(b => thumb = Buffer.from(b))
.catch(() => null)

function unwrap(m = {}) {
  let n = m
  while (
    n?.viewOnceMessage?.message ||
    n?.viewOnceMessageV2?.message ||
    n?.viewOnceMessageV2Extension?.message ||
    n?.ephemeralMessage?.message
  ) {
    n =
      n.viewOnceMessage?.message ||
      n.viewOnceMessageV2?.message ||
      n.viewOnceMessageV2Extension?.message ||
      n.ephemeralMessage?.message
  }
  return n
}

function ownText(msg) {
  const m = unwrap(msg.message)
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    ''
  )
}

async function downloadMedia(msg, type) {
  try {
    const stream = await downloadContentFromMessage(msg, type)
    let buf = Buffer.alloc(0)
    for await (const c of stream) buf = Buffer.concat([buf, c])
    return buf
  } catch {
    return null
  }
}

const handler = async (m, { conn, participants }) => {

  if (!m.isGroup || m.key.fromMe) return

  const fkontak = {
    key: {
      remoteJid: m.chat,
      fromMe: false,
      id: 'Angel'
    },
    message: {
      locationMessage: {
        name: '𝖧𝗈𝗅𝖺, 𝖲𝗈𝗒 𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍',
        jpegThumbnail: thumb
      }
    },
    participant: '0@s.whatsapp.net'
  }

  const users = [...new Set(participants.map(p => p.id))]

  const text = ownText(m).replace(/^\.?n(\s|$)/i, '').trim()

  const q = m.quoted ? unwrap(m.quoted.message) : null
  const mtype = q ? Object.keys(q)[0] : null

  const isMedia = [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'stickerMessage'
  ].includes(mtype)

  await conn.sendMessage(m.chat, { react: { text: '🗣️', key: m.key } })

  if (isMedia && q[mtype]) {

    const detected = mtype.replace('Message', '').toLowerCase()
    const buffer = await downloadMedia(q[mtype], detected)

    if (!buffer) return

    const msg = { mentions: users }

    if (mtype === 'imageMessage') {
      msg.image = buffer
      msg.caption = text || '🔊 Notificación'
    } else if (mtype === 'videoMessage') {
      msg.video = buffer
      msg.caption = text || '🔊 Notificación'
      msg.mimetype = 'video/mp4'
    } else if (mtype === 'stickerMessage') {
      msg.sticker = buffer
    } else if (mtype === 'audioMessage') {
      msg.audio = buffer
      msg.mimetype = 'audio/mpeg'
      msg.ptt = false
    }

    return await conn.sendMessage(m.chat, msg, { quoted: fkontak })
  }

  return await conn.sendMessage(
    m.chat,
    {
      text: text || '🔊 Notificación',
      mentions: users
    },
    { quoted: fkontak }
  )
}

handler.help = ['𝖭𝗈𝗍𝗂𝖿𝗒']
handler.tags = ['𝖦𝖱𝖴𝖯𝖮𝖲']
handler.command = ['n']
handler.group = true
handler.admin = true

export default handler