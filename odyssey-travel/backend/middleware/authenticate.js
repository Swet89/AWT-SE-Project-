const jwt = require('jsonwebtoken')

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || ''

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Sign in is required.' })
  }

  const token = authorization.slice('Bearer '.length)

  try {
    
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    if (typeof payload.sub !== 'string' || payload.type !== 'access') {
      return res.status(401).json({ message: 'Invalid access token.' })
    }


  
