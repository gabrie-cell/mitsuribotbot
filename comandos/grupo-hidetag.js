import {
  generateWAMessageFromContent,
  downloadContentFromMessage
} from '@whiskeysockets/baileys'
import fetch from 'node-fetch'

let thumb = null
fetch('https://files.catbox.moe/tx6prq.jpg')
  .then(r => r.arrayBuffer())
  .then(b => thumb = Buffer.from(b))
  .catch(() => null)

function extractQuotedMessage(m) {
  let q =
    m?.quoted?.fakeObj ||
    m?.quoted ||
    m?.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    null

  if (!q) return null

  let msg = q
  for (let i = 0; i < 6; i++) {
    const next =
      msg?.ephemeralMessage?.message ||
      msg?.viewOnceMessage?.message ||
      msg?.viewOnceMessageV2?.message ||
      msg?.viewOnceMessageV2Extension?.message ||
      msg?.documentWithCaptionMessage?.message ||
      null
    if (!next) break
    msg = next
  }

  if (typeof msg === 'string') return { conversation: msg }
  return msg
}

async function downloadMedia(msgContent, type) {
  const stream = await downloadContentFromMessage(msgContent, type)
  let buffer = Buffer.alloc(0)
  for await (const c of stream) buffer = Buffer.concat([buffer, c])
  return buffer
}

const handler = async (m, { conn, args, participants }) => {
  if (!m.isGroup || m.key.fromMe) return

  const users = [...new Set(participants.map(p => p.id))]
  const mentionText = users.map(u => `@${u.split('@')[0]}`).join(' ')
  const textExtra = args.join(' ').trim()

  const fkontak = {
    key: { remoteJid: m.chat, fromMe: false, id: 'Angel' },
    message: {
      locationMessage: {
        name: '𝖧𝗈𝗅𝖺, 𝖲𝗈𝗒 𝖠𝗇𝗀𝖾𝗅 𝖡𝗈𝗍',
        jpegThumbnail: thumb
      }
    },
    participant: '0@s.whatsapp.net'
  }

  await conn.sendMessage(m.chat, {
    react: { text: '🗣️', key: m.key }
  })

  const q = extractQuotedMessage(m)

  // =====================
  // SIN QUOTE
  // =====================
  if (!q) {
    if (!textExtra) return
    return conn.sendMessage(
      m.chat,
      {
        text: `${mentionText}\n\n${textExtra}`,
        mentions: users
      },
      { quoted: fkontak }
    )
  }

  const mtype = Object.keys(q)[0]

  // =====================
  // MEDIA
  // =====================
  if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'].includes(mtype)) {
    const mediaType = mtype.replace('Message', '')
    const buffer = await downloadMedia(q[mtype], mediaType)

    const msg = { mentions: users }

    if (mtype === 'audioMessage') {
      msg.audio = buffer
      msg.mimetype = 'audio/mpeg'
      msg.ptt = false
      return conn.sendMessage(m.chat, msg, { quoted: fkontak })
    }

    if (mtype === 'stickerMessage') {
      msg.sticker = buffer
      return conn.sendMessage(m.chat, msg, { quoted: fkontak })
    }

    if (mtype === 'imageMessage' || mtype === 'videoMessage') {
      const originalCaption = q[mtype]?.caption || ''
      msg[mtype === 'imageMessage' ? 'image' : 'video'] = buffer
      msg.caption =
        `${mentionText}\n\n${originalCaption}${textExtra ? '\n\n' + textExtra : ''}`
      return conn.sendMessage(m.chat, msg, { quoted: fkontak })
    }
  }

  // =====================
  // TEXTO (FIX REAL)
  // =====================
  const originalText =
    q.conversation ||
    q.extendedTextMessage?.text ||
    ''

  const finalText =
    `${mentionText}\n\n${originalText}${textExtra ? '\n\n' + textExtra : ''}`

  return conn.sendMessage(
    m.chat,
    {
      text: finalText,
      mentions: users
    },
    { quoted: fkontak }
  )
}

handler.command = ['n']
handler.group = true
handler.admin = true

export default handler