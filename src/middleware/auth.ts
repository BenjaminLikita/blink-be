import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../config/db'
import { clerkClient } from '../config/clerk'


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1]
  const publicKey = process.env.CLERK_PEM_PUBLIC_KEY
  try {

    if(!token || !publicKey) {
      res.status(401).json({ success: false, message: "Unauthorized" })
      return
    }
    const options: jwt.VerifyOptions = { algorithms: ['RS256'] }

    const decoded = jwt.verify(token, publicKey, options) as jwt.JwtPayload
    if(!decoded || !decoded.exp || !decoded.nbf || !decoded.sub) return

    const currentTime = Math.floor(Date.now() / 1000)
    if (decoded.exp < currentTime || decoded.nbf > currentTime) {
      throw new Error('Token is expired or not yet valid')
    }

    // Validate the token's authorized party (azp) claim
    // if (decoded.azp && !permittedOrigins.includes(decoded.azp)) {
    //   throw new Error("Invalid 'azp' claim")
    // }
    // const user = await db.user.findUnique({
    //   where: { id: decoded.sub },
    // })
    const user = await clerkClient.users.getUser(decoded.sub)
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" })
      return
    }
    req.user = user
    next()
  } catch (error) {
    console.log({error})
    res.status(401).json({
      error: (error as any).message,
    })
  }
}