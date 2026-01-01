import fetch from 'node-fetch'

let handler = async (m, { conn, command, usedPrefix }) => {
  const mentionedJid = Array.isArray(m?.mentionedJid) ? m.mentionedJid : []
  const userId = mentionedJid.length > 0 ? mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender)

  const getDbName = (jid) => global?.db?.data?.users?.[jid]?.name
  const fallbackTag = (jid) => String(jid || '').split('@')[0] || 'Usuario'

  const getNameSafe = async (jid) => {
    const fromDb = getDbName(jid)
    if (typeof fromDb === 'string' && fromDb.trim()) return fromDb.trim()
    try {
      const n = await conn.getName(jid)
      return typeof n === 'string' && n.trim() ? n.trim() : fallbackTag(jid)
    } catch {
      return fallbackTag(jid)
    }
  }

  const from = await getNameSafe(m.sender)
  const who = await getNameSafe(userId)

  let str = ''
  let query = ''

  switch (command) {
    case 'angry':
    case 'enojado':
      str = from === who
        ? `\`${from}\` está enojado/a! (╬ಠ益ಠ)`
        : `\`${from}\` está enojado/a con \`${who}\`! (╬ಠ益ಠ)`
      query = 'anime angry'
      break

    case 'bath':
    case 'bañarse':
      str = from === who
        ? `\`${from}\` se está bañando! (｡•̀ᴗ-)✧`
        : `\`${from}\` está bañando a \`${who}\`! (｡•̀ᴗ-)✧`
      query = 'anime bath'
      break

    case 'bite':
    case 'morder':
      str = from === who
        ? `\`${from}\` se mordió a sí mismo/a! ( •̀ᴗ•́ )و`
        : `\`${from}\` mordió a \`${who}\`! ( •̀ᴗ•́ )و`
      query = 'anime bite'
      break

    case 'bleh':
    case 'lengua':
      str = from === who
        ? `\`${from}\` saca la lengua! ( •̀ㅂ•́ )`
        : `\`${from}\` le sacó la lengua a \`${who}\`! ( •̀ㅂ•́ )`
      query = 'anime bleh'
      break

    case 'blush':
    case 'sonrojarse':
      str = from === who
        ? `\`${from}\` se sonrojó! (⁄ ⁄•⁄ω⁄•⁄ ⁄)`
        : `\`${from}\` se sonrojó por \`${who}\`! (⁄ ⁄•⁄ω⁄•⁄ ⁄)`
      query = 'anime blush'
      break

    case 'bored':
    case 'aburrido':
      str = from === who
        ? `\`${from}\` está aburrido/a! (¬‿¬ )`
        : `\`${from}\` está aburrido/a de \`${who}\`! (¬‿¬ )`
      query = 'anime bored'
      break

    case 'clap':
    case 'aplaudir':
      str = from === who
        ? `\`${from}\` está aplaudiendo! (＾▽＾)ﾉﾞ`
        : `\`${from}\` está aplaudiendo por \`${who}\`! (＾▽＾)ﾉﾞ`
      query = 'anime clap'
      break

    case 'coffee':
    case 'cafe':
    case 'café':
      str = from === who
        ? `\`${from}\` está tomando café! ( ˘▽˘)っ☕`
        : `\`${from}\` está tomando café con \`${who}\`! ( ˘▽˘)っ☕`
      query = 'anime coffee'
      break

    case 'cry':
    case 'llorar':
      str = from === who
        ? `\`${from}\` está llorando! (ಥ﹏ಥ)`
        : `\`${from}\` está llorando por \`${who}\`! (ಥ﹏ಥ)`
      query = 'anime cry'
      break

    case 'cuddle':
    case 'acurrucarse':
      str = from === who
        ? `\`${from}\` se acurrucó con sí mismo/a! (づ｡◕‿‿◕｡)づ`
        : `\`${from}\` se acurrucó con \`${who}\`! (づ｡◕‿‿◕｡)づ`
      query = 'anime cuddle'
      break

    case 'dance':
    case 'bailar':
      str = from === who
        ? `\`${from}\` está bailando! (ノ^_^)ノ`
        : `\`${from}\` está bailando con \`${who}\`! (ノ^_^)ノ`
      query = 'anime dance'
      break

    case 'drunk':
    case 'borracho':
      str = from === who
        ? `\`${from}\` está borracho! (＠_＠;)`
        : `\`${from}\` está borracho con \`${who}\`! (＠_＠;)`
      query = 'anime drunk'
      break

    case 'eat':
    case 'comer':
      // FIX backtick dentro del emoticon
      str = from === who
        ? `\`${from}\` está comiendo! (๑´ڡ´๑)`
        : `\`${from}\` está comiendo con \`${who}\`! (๑´ڡ´๑)`
      query = 'anime eat'
      break

    case 'facepalm':
    case 'palmadacara':
      str = from === who
        ? `\`${from}\` se da una palmada en la cara! (－‸ლ)`
        : `\`${from}\` se frustra por \`${who}\`! (－‸ლ)`
      query = 'anime facepalm'
      break

    case 'happy':
    case 'feliz':
      str = from === who
        ? `\`${from}\` está feliz! (≧▽≦)`
        : `\`${from}\` está feliz por \`${who}\`! (≧▽≦)`
      query = 'anime happy'
      break

    case 'hug':
    case 'abrazar':
      str = from === who
        ? `\`${from}\` se abrazó a sí mismo/a! (づ￣ ³￣)づ`
        : `\`${from}\` abrazó a \`${who}\`! (づ￣ ³￣)づ`
      query = 'anime hug'
      break

    case 'kill':
    case 'matar':
      str = from === who
        ? `\`${from}\` se mató a sí mismo/a! (x_x)`
        : `\`${from}\` mató a \`${who}\`! (x_x)`
      query = 'anime kill'
      break

    case 'kiss':
    case 'muak':
      str = from === who
        ? `\`${from}\` se besó a sí mismo/a! ( ˘ ³˘)♥`
        : `\`${from}\` besó a \`${who}\`! ( ˘ ³˘)♥`
      query = 'anime kiss'
      break

    case 'laugh':
    case 'reirse':
      str = from === who
        ? `\`${from}\` se ríe! (≧∇≦)`
        : `\`${from}\` se está riendo de \`${who}\`! (≧∇≦)`
      query = 'anime laugh'
      break

    case 'lick':
    case 'lamer':
      str = from === who
        ? `\`${from}\` se lamió a sí mismo/a! (￣￢￣)`
        : `\`${from}\` lamió a \`${who}\`! (￣￢￣)`
      query = 'anime lick'
      break

    case 'slap':
    case 'bofetada':
      str = from === who
        ? `\`${from}\` se golpeó a sí mismo/a! (ง'̀-'́)ง`
        : `\`${from}\` le dio una bofetada a \`${who}\`! (ง'̀-'́)ง`
      query = 'anime slap'
      break

    case 'sleep':
    case 'dormir':
      str = from === who
        ? `\`${from}\` está durmiendo profundamente! (－_－) zzZ`
        : `\`${from}\` duerme junto a \`${who}\`! (－_－) zzZ`
      query = 'anime sleep'
      break

    case 'smoke':
    case 'fumar':
      str = from === who
        ? `\`${from}\` está fumando! (￣。￣)y━･~~`
        : `\`${from}\` está fumando con \`${who}\`! (￣。￣)y━･~~`
      query = 'anime smoke'
      break

    case 'spit':
    case 'escupir':
      str = from === who
        ? `\`${from}\` se escupió a sí mismo/a! (｀⌒´メ)`
        : `\`${from}\` escupió a \`${who}\`! (｀⌒´メ)`
      query = 'anime spit'
      break

    case 'step':
    case 'pisar':
      str = from === who
        ? `\`${from}\` se pisó a sí mismo/a! (；￣Д￣)`
        : `\`${from}\` pisó a \`${who}\`! sin piedad (；￣Д￣)`
      query = 'anime step'
      break

    case 'think':
    case 'pensar':
      str = from === who
        ? `\`${from}\` está pensando! (・・ )`
        : `\`${from}\` está pensando en \`${who}\`! (・・ )`
      query = 'anime think'
      break

    case 'love':
    case 'enamorado':
    case 'enamorada':
      str = from === who
        ? `\`${from}\` está enamorado/a de sí mismo/a! (ღ˘⌣˘ღ)`
        : `\`${from}\` está enamorado/a de \`${who}\`! (ღ˘⌣˘ღ)`
      query = 'anime love'
      break

    case 'pat':
    case 'palmadita':
    case 'palmada':
      str = from === who
        ? `\`${from}\` se da palmaditas! (´• ω •\`)ﾉ`
        : `\`${from}\` acaricia a \`${who}\`! (´• ω •\`)ﾉ`
      query = 'anime pat'
      break

    case 'poke':
    case 'picar':
      str = from === who
        ? `\`${from}\` se da un toque curioso! (☞ﾟヮﾟ)☞`
        : `\`${from}\` da un golpecito a \`${who}\`! (☞ﾟヮﾟ)☞`
      query = 'anime poke'
      break

    case 'pout':
    case 'pucheros':
      str = from === who
        ? `\`${from}\` hace pucheros! (￣^￣)`
        : `\`${from}\` hace pucheros por \`${who}\`! (￣^￣)`
      query = 'anime pout'
      break

    case 'punch':
    case 'pegar':
    case 'golpear':
      str = from === who
        ? `\`${from}\` se golpeó a sí mismo/a! (ง •̀_•́)ง`
        : `\`${from}\` golpea a \`${who}\`! (ง •̀_•́)ง`
      query = 'anime punch'
      break

    case 'preg':
    case 'preñar':
    case 'embarazar':
      str = from === who
        ? `\`${from}\` se embarazó solito/a... (⊙_⊙;)`
        : `\`${from}\` le regaló 9 meses a \`${who}\`! (⊙_⊙;)`
      query = 'anime preg'
      break

    case 'run':
    case 'correr':
      str = from === who
        ? `\`${from}\` está corriendo! ᕕ( ᐛ )ᕗ`
        : `\`${from}\` sale corriendo al ver a \`${who}\`! ᕕ( ᐛ )ᕗ`
      query = 'anime run'
      break

    case 'sad':
    case 'triste':
      str = from === who
        ? `\`${from}\` está triste... (｡•́︿•̀｡)`
        : `\`${from}\` está triste por \`${who}\`... (｡•́︿•̀｡)`
      query = 'anime sad'
      break

    case 'scared':
    case 'asustada':
    case 'asustado':
      str = from === who
        ? `\`${from}\` se asusta! (⊙﹏⊙)`
        : `\`${from}\` está aterrorizado/a de \`${who}\`! (⊙﹏⊙)`
      query = 'anime scared'
      break

    case 'seduce':
    case 'seducir':
      str = from === who
        ? `\`${from}\` está seduciendo! ( ͡° ͜ʖ ͡°)`
        : `\`${from}\` seduce a \`${who}\`! ( ͡° ͜ʖ ͡°)`
      query = 'anime seduce'
      break

    case 'shy':
    case 'timido':
    case 'timida':
      str = from === who
        ? `\`${from}\` se pone tímido/a... (〃▽〃)`
        : `\`${from}\` se pone tímido/a con \`${who}\`... (〃▽〃)`
      query = 'anime shy'
      break

    case 'walk':
    case 'caminar':
      str = from === who
        ? `\`${from}\` está caminando! (•‿•)`
        : `\`${from}\` camina con \`${who}\`! (•‿•)`
      query = 'anime walk'
      break

    case 'dramatic':
    case 'drama':
      str = from === who
        ? `\`${from}\` está dramático/a! (T⌓T)`
        : `\`${from}\` hace drama por \`${who}\`! (T⌓T)`
      query = 'anime dramatic'
      break

    case 'kisscheek':
    case 'beso':
      str = from === who
        ? `\`${from}\` se besó la mejilla! (˘⌣˘ )`
        : `\`${from}\` besó la mejilla de \`${who}\`! (˘⌣˘ )`
      query = 'anime kisscheek'
      break

    case 'wink':
    case 'guiñar':
      str = from === who
        ? `\`${from}\` se guiña! (¬‿¬ )`
        : `\`${from}\` le guiña a \`${who}\`! (¬‿¬ )`
      query = 'anime wink'
      break

    case 'cringe':
    case 'avergonzarse':
      str = from === who
        ? `\`${from}\` siente cringe! (；一_一)`
        : `\`${from}\` siente cringe por \`${who}\`! (；一_一)`
      query = 'anime cringe'
      break

    case 'smug':
    case 'presumir':
      str = from === who
        ? `\`${from}\` está presumiendo! (￣▽￣)ゞ`
        : `\`${from}\` presume a \`${who}\`! (￣▽￣)ゞ`
      query = 'anime smug'
      break

    case 'smile':
    case 'sonreir':
      str = from === who
        ? `\`${from}\` está sonriendo! (＾ー＾)`
        : `\`${from}\` le sonrió a \`${who}\`! (＾ー＾)`
      query = 'anime smile'
      break

    case 'highfive':
    case '5':
      str = from === who
        ? `\`${from}\` se chocó los cinco! (•̀ᴗ•́)و ̑̑`
        : `\`${from}\` chocó los cinco con \`${who}\`! (•̀ᴗ•́)و ̑̑`
      query = 'anime highfive'
      break

    case 'handhold':
    case 'mano':
      str = from === who
        ? `\`${from}\` se dio la mano! (っ˘з(˘⌣˘ )`
        : `\`${from}\` le agarró la mano a \`${who}\`! (っ˘з(˘⌣˘ )`
      query = 'anime handhold'
      break

    case 'bullying':
    case 'bully':
      str = from === who
        ? `\`${from}\` se hace bullying solo... (ಠ_ಠ)`
        : `\`${from}\` le hace bullying a \`${who}\`! (ಠ_ಠ)`
      query = 'anime bullying'
      break

    case 'wave':
    case 'hola':
    case 'ola':
      str = from === who
        ? `\`${from}\` saluda! (￣▽￣)ノ`
        : `\`${from}\` saluda a \`${who}\`! (￣▽￣)ノ`
      query = 'anime wave'
      break

    default:
      return
  }


  try {
    const url = `https://api.delirius.store/search/tenor?q=${encodeURIComponent(query)}`
    const res = await fetch(url)

    if (!res.ok) return m.reply('# Error consultando Tenor.')

    const json = await res.json()

    const gifs =
      (Array.isArray(json?.data) && json.data) ||
      (Array.isArray(json?.results) && json.results) ||
      (Array.isArray(json?.result) && json.result) ||
      (Array.isArray(json) && json) ||
      []

    if (!Array.isArray(gifs) || gifs.length === 0) return m.reply('# No se encontraron resultados.')

    const pick = gifs[Math.floor(Math.random() * gifs.length)]
    const randomGif =
      pick?.mp4 ||
      pick?.url ||
      pick?.media?.[0]?.mp4?.url ||
      pick?.media_formats?.mp4?.url ||
      pick?.media_formats?.gif?.url

    if (!randomGif) return m.reply('# No se encontraron resultados.')

    const mentions = userId && userId !== m.sender ? [userId] : []

    await conn.sendMessage(
      m.chat,
      { video: { url: randomGif }, gifPlayback: true, caption: str, mentions },
      { quoted: m }
    )
  } catch (e) {
    return m.reply('⚠︎ *Fetch* Failed')
  }
}

handler.help = [
  'angry', 'enojado', 'bath', 'bañarse', 'bite', 'morder', 'bleh', 'lengua',
  'blush', 'sonrojarse', 'bored', 'aburrido', 'clap', 'aplaudir', 'coffee', 'cafe', 'café',
  'cry', 'llorar', 'cuddle', 'acurrucarse', 'dance', 'bailar', 'drunk', 'borracho',
  'eat', 'comer',
  'facepalm', 'palmadacara',
  'happy', 'feliz', 'hug', 'abrazar', 'kill', 'matar',
  'kiss', 'muak', 'laugh', 'reirse', 'lick', 'lamer', 'slap', 'bofetada', 'sleep', 'dormir',
  'smoke', 'fumar', 'spit', 'escupir', 'step', 'pisar', 'think', 'pensar', 'love', 'enamorado',
  'enamorada', 'pat', 'palmadita', 'palmada',
  'poke', 'picar', 'pout', 'pucheros', 'punch',
  'pegar', 'golpear', 'preg', 'preñar', 'embarazar', 'run', 'correr', 'sad', 'triste',
  'scared', 'asustada', 'asustado', 'seduce', 'seducir', 'shy', 'timido', 'timida',
  'walk', 'caminar', 'dramatic', 'drama', 'kisscheek', 'beso', 'wink', 'guiñar', 'cringe',
  'avergonzarse', 'smug', 'presumir', 'smile', 'sonreir', 'highfive', '5', 'bully', 'bullying',
  'mano', 'handhold', 'ola', 'wave', 'hola'
]

handler.tags = ['anime']

handler.command = handler.help

export default handler