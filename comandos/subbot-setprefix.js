import { setCommandPrefix, getCommandPrefix } from '../biblioteca/settings.js'
import { getSubbotInfo } from '../subbotManager.js'

function hasSpaces(s = '') {
  return /\s/.test(String(s || ''))
}

function tooLong(s = '') {
  return String(s || '').length > 12
}

const handler = async (m, { conn, sender, text, usedPrefix, command }) => {
  const from = m.key?.remoteJid

  if (!conn?.isSubBot) {
    return await conn.sendMessage(
      from,
      { text: '「✦」Este comando solo funciona dentro de tu subbot.' },
      { quoted: m }
    )
  }

  const info = getSubbotInfo(conn)
  if (!info || info.owner !== sender) {
    return await conn.sendMessage(
      from,
      { text: '「✦」Solo el dueño del subbot puede cambiar el prefijo.' },
      { quoted: m }
    )
  }

  const current = getCommandPrefix(String(conn?.subbotId || '').trim()) || usedPrefix
  const raw = String(text || '').trim()

  if (!raw) {
    return await conn.sendMessage(
      from,
      {
        text:
          '「✦」Envía el nuevo prefijo.\n' +
          `> ✐ Actual » *${current}*\n` +
          `> ✐ Ejemplo » *${usedPrefix + command} #*\n` +
          `> ✐ Ejemplo » *${usedPrefix + command} 🔥*\n` +
          `> ✐ Reset » *${usedPrefix + command} default*`
      },
      { quoted: m }
    )
  }

  if (raw.toLowerCase() === 'default' || raw.toLowerCase() === 'reset') {
    setCommandPrefix('', String(conn?.subbotId || '').trim())
    return await conn.sendMessage(
      from,
      { text: `「✦」Prefijo restablecido.\n> ✐ Ahora usa el prefijo por defecto del bot.` },
      { quoted: m }
    )
  }

  if (hasSpaces(raw)) {
    return await conn.sendMessage(
      from,
      { text: '「✦」El prefijo no puede contener espacios.' },
      { quoted: m }
    )
  }

  if (tooLong(raw)) {
    return await conn.sendMessage(
      from,
      { text: '「✦」Prefijo demasiado largo. Máximo 12 caracteres.' },
      { quoted: m }
    )
  }

  setCommandPrefix(raw, String(conn?.subbotId || '').trim())
  return await conn.sendMessage(
    from,
    {
      text:
        '「✦」Prefijo actualizado\n' +
        `> ✐ Nuevo prefijo » *${raw}*\n` +
        `> ✐ Prueba » *${raw}s*`
    },
    { quoted: m }
  )
}

handler.help = ['setprefix']
handler.tags = ['owner']
handler.command = ['setprefix']

export default handler
