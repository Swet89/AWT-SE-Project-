const { randomUUID } = require('crypto')

function requestLogger(req, res, next) {
  const requestId = randomUUID()
  const startedAt = process.hrtime.bigint()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6
    const path = req.originalUrl.split('?')[0]
    console.log(`${requestId} ${req.method} ${path} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`)
  })

  next()
}

function containsUnsafeMongoKey(value, depth = 0) {
  if (depth > 20) return true
  if (Array.isArray(value)) return value.some((item) => containsUnsafeMongoKey(item, depth + 1))
  if (!value || typeof value !== 'object') return false

  return Object.entries(value).some(([key, nestedValue]) =>
    key.startsWith('$') || key.includes('.') || containsUnsafeMongoKey(nestedValue, depth + 1),
  )
}

function sanitizeInput(req, res, next) {
  if (containsUnsafeMongoKey(req.body) || containsUnsafeMongoKey(req.query) || containsUnsafeMongoKey(req.params)) {
    return res.status(400).json({
      message: 'Request contains unsupported query keys.',
      requestId: req.requestId,
    })
  }

  return next()
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    message: 'API endpoint not found.',
    requestId: req.requestId,
  })
}

function errorHandler(error, req, res, _next) {
  if (res.headersSent) return res.end()

  const status = error.status || error.statusCode || (
    ['ValidationError', 'CastError'].includes(error.name) ? 400 : 500
  )
  const message = status < 500
    ? error.message || 'The request could not be processed.'
    : 'Something went wrong. Please try again.'

  if (status >= 500) {
    console.error(`${req.requestId || 'no-request-id'} API error:`, error.message)
  }

  return res.status(status).json({ message, requestId: req.requestId })
}

module.exports = { requestLogger, sanitizeInput, notFoundHandler, errorHandler }
