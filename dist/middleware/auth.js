"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const clerk_1 = require("../config/clerk");
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    const publicKey = process.env.CLERK_PEM_PUBLIC_KEY;
    try {
        if (!token || !publicKey) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const options = { algorithms: ['RS256'] };
        const decoded = jsonwebtoken_1.default.verify(token, publicKey, options);
        if (!decoded || !decoded.exp || !decoded.nbf || !decoded.sub)
            return;
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime || decoded.nbf > currentTime) {
            throw new Error('Token is expired or not yet valid');
        }
        // Validate the token's authorized party (azp) claim
        // if (decoded.azp && !permittedOrigins.includes(decoded.azp)) {
        //   throw new Error("Invalid 'azp' claim")
        // }
        // const user = await db.user.findUnique({
        //   where: { id: decoded.sub },
        // })
        const user = await clerk_1.clerkClient.users.getUser(decoded.sub);
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.log({ error });
        res.status(401).json({
            error: error.message,
        });
    }
};
exports.authMiddleware = authMiddleware;
