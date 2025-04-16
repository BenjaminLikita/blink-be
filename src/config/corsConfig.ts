import { CorsOptions } from "cors";


export const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
} satisfies CorsOptions