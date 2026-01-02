const handler = async (m, { conn, from }) => {

  await conn.sendMessage(from, {
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

    const code = await conn.groupInviteCode(from).catch(() => null)

    const link = code
      ? `https://chat.whatsapp.com/${code}`
      : 'Sin enlace disponible'

    const fallback = 'https://files.catbox.moe/xr2m6u.jpg'
    let ppBuffer = null

    try {
      const url = await conn.profilePictureUrl(from, 'image').catch(() => null)
      if (url && url !== 'not-authorized' && url !== 'not-exist') {
        ppBuffer = await safeFetch(url, 6000)
      }
    } catch {}

    if (!ppBuffer) {
      ppBuffer = await safeFetch(fallback)
    }

    await conn.sendMessage(from, {
      image: ppBuffer,
      caption: `*Link del grupo*\n${link}`
    }, { quoted: m })

  } catch {
    await conn.sendMessage(from, {
      text: '❌ Ocurrió un error al generar el enlace.'
    }, { quoted: m })
  }
}

handler.command = ['link']
handler.botadm = true;
export default handler