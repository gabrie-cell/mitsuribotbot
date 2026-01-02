import { generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys'
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
  return msg
}

async function downloadMedia(msgContent, type) {
  const stream = await downloadContentFromMessage(msgContent, type)
  let buffer = Buffer.alloc(0)
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer
}

const handler = async (m, { conn, args, participants }) => {
  try {
    if (!m.isGroup || m.key.fromMe) return

    const users = [...new Set(participants.map(p => p.id))]
    const textExtra = args.join(' ').trim()

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

    await conn.sendMessage(m.chat, { react: { text: '🗣️', key: m.key } })

    let q = extractQuotedMessage(m)

    if (!q && !textExtra) {
      return m.reply('❌ No hay nada para notificar.')
    }

    if (q) {
      const mtype = Object.keys(q)[0]

      let text =
        textExtra ||
        q?.conversation ||
        q?.extendedTextMessage?.text ||
        q?.message?.conversation ||
        q?.message?.extendedTextMessage?.text ||
        ''

      if (!text && m.quoted) {
        text =
          m.quoted.text ||
          m.quoted.msg?.text ||
          m.quoted.msg?.conversation ||
          ''
      }

      const isMedia = [
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'stickerMessage'
      ].includes(mtype)

      if (isMedia) {
        const buffer = await downloadMedia(q[mtype], mtype.replace('Message', ''))

        const msg = { mentions: users }

        if (mtype === 'imageMessage') {
          msg.image = buffer
          msg.caption = text
        } else if (mtype === 'videoMessage') {
          msg.video = buffer
          msg.caption = text
          msg.mimetype = 'video/mp4'
        } else if (mtype === 'audioMessage') {
          msg.audio = buffer
          msg.mimetype = 'audio/mpeg'
          msg.ptt = false
        } else if (mtype === 'stickerMessage') {
          msg.sticker = buffer
        }

        return await conn.sendMessage(m.chat, msg, { quoted: fkontak })
      }

      const newMsg = conn.cMod(
        m.chat,
        generateWAMessageFromContent(
          m.chat,
          { extendedTextMessage: { text } },
          { quoted: fkontak, userJid: conn.user.id }
        ),
        text,
        conn.user.jid,
        { mentions: users }
      )

      return await conn.relayMessage(
        m.chat,
        newMsg.message,
        { messageId: newMsg.key.id }
      )
    }

    return await conn.sendMessage(
      m.chat,
      { text: textExtra, mentions: users },
      { quoted: fkontak }
    )

  } catch (err) {
    console.error('Error en .nall:', err)
    await conn.sendMessage(
      m.chat,
      { text: '🔊 Notificación', mentions: participants.map(p => p.id) }
    )
  }
}

handler.help = ['nall']
handler.tags = ['grupos']
handler.command = ['n']
handler.group = true
handler.admin = true

export default handler