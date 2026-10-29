const net = require('net')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

function checkPort(port, host = '127.0.0.1', timeout = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(timeout)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, host)
  })
}

function findMongodBinary() {
  const cacheDir = path.resolve(__dirname, '..', 'node_modules', '.cache', 'mongodb-memory-server')
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir)
    const exe = files.find((f) => f.startsWith('mongod') && f.endsWith('.exe'))
    if (exe) return path.join(cacheDir, exe)
  }

  const candidates = [
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }

  return 'mongod'
}

async function ensureMongoRunning(uri = process.env.MONGODB_URI) {
  const isLocal = !uri || uri.includes('127.0.0.1') || uri.includes('localhost')
  if (!isLocal) return

  const portMatch = uri.match(/:(\d+)\/?/)
  const port = portMatch ? parseInt(portMatch[1], 10) : 27017

  const isUp = await checkPort(port)
  if (isUp) {
    return
  }

  console.log(`MongoDB is not running on port ${port}. Auto-starting local MongoDB instance...`)
  const mongodPath = findMongodBinary()
  const dbPath = path.resolve(__dirname, '..', 'data', 'db')

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true })
  }

  try {
    const child = spawn(mongodPath, ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    child.unref()

    const startTime = Date.now()
    while (Date.now() - startTime < 20000) {
      await new Promise((r) => setTimeout(r, 600))
      if (await checkPort(port)) {
        console.log(`Local MongoDB daemon started successfully on port ${port}.`)
        return
      }
    }
    console.warn(`MongoDB process spawned; proceeding with connection attempt.`)
  } catch (err) {
    console.warn(`Could not auto-start MongoDB daemon: ${err.message}`)
  }
}

module.exports = { ensureMongoRunning, checkPort, findMongodBinary }
