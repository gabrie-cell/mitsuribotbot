import axios from 'axios'
const {
  proto,
  generateWAMessageFromContent,
  prepareWAMessageMedia
} = (await import("@whiskeysockets/baileys")).default

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get('https://g-mini-ia.vercel.app/api/meme')
    const memeUrl = res.data.url

    if (!memeUrl) {
      return conn.sendMessage(m.chat, { text: '🌾 No se pudo obtener el meme.' }, { quoted: m })
    }

    const mediaMessage = await prepareWAMessageMedia(
      { image: { url: memeUrl } },
      { upload: conn.waUploadToServer }
    )


    const fkontak = {
      key: {
        participants: "0@s.whatsapp.net",
        remoteJid: "status@broadcast",
        fromMe: false,
        id: "Halo"
      },
      message: {
        contactMessage: {
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${m.pushName}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      },
      participant: "0@s.whatsapp.net"
    }

    const interactiveMsg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: {
              body: {
                text: "> ✿ Aquí tienes tu *meme*"
              },
              footer: {
                text: "☃️"
              },
              header: {
                title: "➭ Meme Random",
                subtitle: "",
                hasMediaAttachment: true,
                imageMessage: mediaMessage.imageMessage 
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                      display_text: "✐ Abrir Imagen",
                      url: memeUrl,
                      merchant_url: memeUrl
                    })
                  },
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                      display_text: "⊹ Copiar Enlace",
                      id: "copy_meme",
                      copy_code: memeUrl
                    })
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "Otro",
                      id: ".meme"
                    })
                  }
                ]
              },
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                  title: "🌾 Zona de Diversión",
                  body: "😹 Disfruta de los mejores memes",
                  thumbnailUrl: memeUrl,
                  sourceUrl: memeUrl,
                  mediaType: 1,
                  renderLargerThumbnail: true 
                }
              }
            }
          }
        }
      },
      { quoted: fkontak } 
    )

    await conn.relayMessage(m.chat, interactiveMsg.message, {})

  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { text: ' Hubo un error técnico al generar el mensaje.' }, { quoted: m })
  }
}

handler.command = ['meme']
handler.help = ['meme']
handler.tags = ['fun']

export default handler