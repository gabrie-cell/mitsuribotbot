//Quedó más grande el código Si, Conservando las mismas funciones, (Únicamente es visual) te puede servir para el futuro si decides hacer una modificación 

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

import './config.js'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, {
  readdirSync,
  statSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  watch
} from 'fs'
import yargs from 'yargs'
import { spawn, execSync } from 'child_process'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import pino from 'pino'
import Pino from 'pino'
import path, { join, dirname } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'
import pkg from 'google-libphonenumber'
import readline from 'readline'
import NodeCache from 'node-cache'

const { proto } = (await import('@whiskeysockets/baileys')).default
const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser
} = await import('@whiskeysockets/baileys')

const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

let { say } = cfonts

console.log(chalk.magentaBright('\n⚽ Iniciando...'))

say('Isago Bot', {
  font: 'simple',
  align: 'left',
  gradient: ['green', 'white']
})

say('Made Dev-gabrie-cell', {
  font: 'console',
  align: 'center',
  colors: ['cyan', 'magenta', 'yellow']
})

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix
    ? /file:\/\//.test(pathURL)
      ? fileURLToPath(pathURL)
      : pathURL
    : pathToFileURL(pathURL).toString()
}

global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true))
}

global.__require = function require(dir = import.meta.url) {
  return createRequire(dir)
}

global.timestamp = { start: new Date() }

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(
  yargs(process.argv.slice(2)).exitProcess(false).parse()
)

global.prefix = new RegExp('^[#!./-]')

global.db = new Low(
  /https?:\/\//.test(opts['db'] || '')
    ? new cloudDBAdapter(opts['db'])
    : new JSONFile('database.json')
)

global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise(resolve =>
      setInterval(async function () {
        if (!global.db.READ) {
          clearInterval(this)
          resolve(
            global.db.data == null
              ? global.loadDatabase()
              : global.db.data
          )
        }
      }, 1000)
    )
  }

  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null

  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    ...(global.db.data || {})
  }

  global.db.chain = chain(global.db.data)
}

await loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)

const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })

const { version } = await fetchLatestBaileysVersion()

let phoneNumber = global.botNumber

const methodCodeQR = process.argv.includes('qr')
const methodCode = !!phoneNumber || process.argv.includes('code')
const MethodMobile = process.argv.includes('mobile')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = txt =>
  new Promise(resolve => rl.question(txt, resolve))

let opcion

if (methodCodeQR) opcion = '1'

if (
  !methodCodeQR &&
  !methodCode &&
  !fs.existsSync(`./${sessions}/creds.json`)
) {
  do {
    opcion = await question(
      chalk.bold.white('Seleccione una opción:\n') +
        chalk.blueBright('1. Con código QR\n') +
        chalk.cyan('2. Con código de texto de 8 dígitos\n--> ')
    )

    if (!/^[1-2]$/.test(opcion)) {
      console.log(
        chalk.bold.redBright(
          'No se permiten números fuera de 1 o 2.'
        )
      )
    }
  } while (
    (opcion !== '1' && opcion !== '2') ||
    fs.existsSync(`./${sessions}/creds.json`)
  )
}

console.info = () => {}

const connectionOptions = {
  logger: pino({ level: 'silent' }),
  printQRInTerminal: opcion === '1' || methodCodeQR,
  mobile: MethodMobile,
  browser: ['MacOs', 'Safari'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      Pino({ level: 'fatal' }).child({ level: 'fatal' })
    )
  },
  markOnlineOnConnect: false,
  generateHighQualityLinkPreview: true,
  syncFullHistory: false,
  getMessage: async key => {
    try {
      let jid = jidNormalizedUser(key.remoteJid)
      let msg = await store.loadMessage(jid, key.id)
      return msg?.message || ''
    } catch {
      return ''
    }
  },
  msgRetryCounterCache,
  userDevicesCache,
  defaultQueryTimeoutMs: undefined,
  cachedGroupMetadata: jid => globalThis.conn.chats[jid] ?? {},
  version,
  keepAliveIntervalMs: 55000,
  maxIdleTimeMs: 60000
}

global.conn = makeWASocket(connectionOptions)
conn.ev.on('creds.update', saveCreds)

if (!fs.existsSync(`./${sessions}/creds.json`)) {
  if (opcion === '2' || methodCode) {
    opcion = '2'
    if (!conn.authState.creds.registered) {
      let addNumber

      if (phoneNumber) {
        addNumber = phoneNumber.replace(/\D/g, '')
      } else {
        do {
          phoneNumber = await question(
            chalk.bgBlack(
              chalk.bold.greenBright(
                '[ ☕ ] Por favor, ingrese el número de WhatsApp:\n---> '
              )
            )
          )
          phoneNumber = phoneNumber.replace(/\D/g, '')
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = `+${phoneNumber}`
          }
        } while (!(await isValidPhoneNumber(phoneNumber)))

        rl.close()
        addNumber = phoneNumber.replace(/\D/g, '')
      }

      setTimeout(async () => {
        let codeBot = await conn.requestPairingCode(addNumber)
        codeBot = codeBot.match(/.{1,4}/g)?.join('-') || codeBot
        console.log(
          chalk.bold.white(
            chalk.bgMagenta('[ ⚽ ] Código:')
          ),
          chalk.bold.white(codeBot)
        )
      }, 3000)
    }
  }
}

conn.isInit = false
conn.well = false

if (!opts['test']) {
  if (global.db)
    setInterval(async () => {
      if (global.db.data) await global.db.write()
    }, 30 * 1000)
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update
  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  const code =
    lastDisconnect?.error?.output?.statusCode ||
    lastDisconnect?.error?.output?.payload?.statusCode

  if (
    code &&
    code !== DisconnectReason.loggedOut &&
    conn?.ws.socket == null
  ) {
    await global.reloadHandler(true).catch(console.error)
    global.timestamp.connect = new Date()
  }

  if (global.db.data == null) loadDatabase()

  if ((update.qr && opcion === '1') || methodCodeQR) {
    console.log(
      chalk.green.bold('[ ✨ ] Escanea este código QR')
    )
  }

  if (connection === 'open') {
    const userJid = jidNormalizedUser(conn.user.id)
    const userName =
      conn.user.name ||
      conn.user.verifiedName ||
      'Desconocido'

    await joinChannels(conn)

    console.log(
      chalk.green.bold(
        `[ ⚙ ] Conectado a: ${userName}`
      )
    )
  }

  if (connection === 'close') {
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode

    if ([401, 440, 428, 405].includes(reason)) {
      console.log(
        chalk.red(
          `→ (${code}) › Cierra la sesión principal.`
        )
      )
    }

    console.log(
      chalk.yellow('→ Reconectando el Bot Principal...')
    )

    await global.reloadHandler(true).catch(console.error)
  }
}

process.on('uncaughtException', console.error)

let isInit = true
let handler = await import('./handler.js')

global.reloadHandler = async function (restartConn) {
  try {
    const Handler = await import(
      `./handler.js?update=${Date.now()}`
    ).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (e) {
    console.error(e)
  }

  if (restartConn) {
    const oldChats = global.conn.chats
    try {
      global.conn.ws.close()
    } catch {}
    conn.ev.removeAllListeners()
    global.conn = makeWASocket(connectionOptions, { chats: oldChats })
    isInit = true
  }

  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler)
    conn.ev.off('connection.update', conn.connectionUpdate)
    conn.ev.off('creds.update', conn.credsUpdate)
  }

  conn.handler = handler.handler.bind(global.conn)
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  conn.ev.on('messages.upsert', conn.handler)
  conn.ev.on('connection.update', conn.connectionUpdate)
  conn.ev.on('creds.update', conn.credsUpdate)

  isInit = false
  return true
}

process.on('unhandledRejection', reason => {
  console.error('Rechazo no manejado:', reason)
})

const pluginFolder = global.__dirname(
  join(__dirname, './plugins/index')
)

const pluginFilter = filename => /\.js$/.test(filename)

global.plugins = {}

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}

await filesInit()

global.reload = async (_, filename) => {
  if (!pluginFilter(filename)) return

  const dir = global.__filename(
    join(pluginFolder, filename),
    true
  )

  if (filename in global.plugins) {
    if (!existsSync(dir)) {
      delete global.plugins[filename]
      return
    }
  }

  const err = syntaxerror(readFileSync(dir), filename, {
    sourceType: 'module',
    allowAwaitOutsideFunction: true
  })

  if (err) {
    conn.logger.error(err)
  } else {
    try {
      const module = await import(
        `${global.__filename(dir)}?update=${Date.now()}`
      )
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
    }
  }
}

Object.freeze(global.reload)
watch(pluginFolder, global.reload)

await global.reloadHandler()

async function quickTest() {
  const test = await Promise.all(
    [
      spawn('ffmpeg'),
      spawn('ffprobe'),
      spawn('convert'),
      spawn('magick'),
      spawn('gm'),
      spawn('find', ['--version'])
    ].map(p =>
      Promise.race([
        new Promise(resolve =>
          p.on('close', code => resolve(code !== 127))
        ),
        new Promise(resolve => p.on('error', () => resolve(false)))
      ])
    )
  )

  const [ffmpeg, ffprobe, convert, magick, gm, find] = test
  global.support = { ffmpeg, ffprobe, convert, magick, gm, find }
  Object.freeze(global.support)
}

setInterval(() => {
  const tmpDir = join(__dirname, 'tmp')
  try {
    for (const file of readdirSync(tmpDir)) {
      unlinkSync(join(tmpDir, file))
    }
  } catch {}
}, 30 * 1000)

quickTest().catch(console.error)

async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '')
    if (number.startsWith('+521')) {
      number = number.replace('+521', '+52')
    }
    const parsed = phoneUtil.parseAndKeepRawInput(number)
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}

async function joinChannels(sock) {
  for (const value of Object.values(global.ch || {})) {
    if (typeof value === 'string' && value.endsWith('@newsletter')) {
      await sock.newsletterFollow(value).catch(() => {})
    }
  }
}