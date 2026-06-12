import jwt from 'jsonwebtoken'

const cookieName = 'taskcal_token'

function requireAuth(req, res, next) {
  try {
    const token = req.cookies[cookieName]

    if (!token) return res.status(401).json({ message: 'Not authenticated' })

    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Not authenticated' })
  }
}

export default requireAuth
