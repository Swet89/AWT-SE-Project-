const { ensureMongoRunning, findMongodBinary } = require('../utils/ensureMongo')

async function main() {
  console.log('Checking local MongoDB status...')
  console.log('MongoDB executable candidate:', findMongodBinary())
  await ensureMongoRunning('mongodb://127.0.0.1:27017/odyssey')
  console.log('MongoDB is ready to accept connections on 127.0.0.1:27017.')
}

main().catch((err) => {
  console.error('Failed to prepare MongoDB:', err)
  process.exit(1)
})
