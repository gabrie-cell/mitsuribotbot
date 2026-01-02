import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

const handler = async (m, { conn }) => {
  const chat = m.chat

  // Reacción
  await conn.sendMessage(chat, {
    react: { text: '🔗', key: m.key }
  })

  try {
    const safeFetch = async (url, timeout = 5000) => {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      try {
        const res = await fetch(url, { signal: controller.signal })
        return res.ok ? Buffer.from(await res.arrayBuffer()) : null
      } catch {
        return null
      } finally {
        clearTimeout(id)
      }
    }

    const [meta, code] = await Promise.all([
      conn.groupMetadata(chat),
      conn.groupInviteCode(chat).catch(() => null)
    ])

    const groupName = meta.subject || 'Grupo'
    if (!code) throw new Error('Sin enlace')

    const link = `https://chat.whatsapp.com/${code}`

    // Foto del grupo
    let ppBuffer = null
    const fallback = 'https://files.catbox.moe/xr2m6u.jpg'

    try {
      const url = await conn.profilePictureUrl(chat, 'image').catch(() => null)
      if (url && !['not-authorized', 'not-exist'].includes(url)) {
        ppBuffer = await safeFetch(url, 6000)
      }
    } catch {}

    if (!ppBuffer) ppBuffer = await safeFetch(fallback)

    /* =============================
       1️⃣ MENSAJE PREMIUM (IMAGEN)
       ============================= */
    await conn.sendMessage(
      chat,
      {
        image: ppBuffer,
        caption:
          `*${groupName}*\n\n` +
          `🔗 Enlace del grupo:\n${link}`
      },
      { quoted: m }
    )

    /* =============================
       2️⃣ BOTÓN COPIAR (SIN MEDIA)
       ============================= */
    const copyMsg = generateWAMessageFromContent(
      chat,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: {
                text: `📋 *Copiar enlace del grupo*\n\n${groupName}`
              },
              footer: { text: 'Toca el botón para copiar' },
              header: {
                title: '🔗 Enlace del Grupo',
                subtitle: 'WhatsApp',
                hasMediaAttachment: false
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                      display_text: '📋 Copiar enlace',
                      id: 'copy_group_link',
                      copy_code: link
                    })
                  }
                ]
              }
            }
          }
        }
      },
      { quoted: m }
    )

    await conn.relayMessage(chat, copyMsg.message, {
      messageId: copyMsg.key.id
    })

  } catch (err) {
    await conn.sendMessage(
      chat,
      { text: '❌ No se pudo generar el enlace del grupo.' },
      { quoted: m }
    )
  }
}

handler.command = ['link']
handler.useradm = true
handler.botadm = true

export default handler