// import { User } from "@prisma/client";

import { User } from "@clerk/backend";


declare global {
  namespace Express {
    interface Request {
      // user?: { id: string } | null;
      user?: User | null;
    }
  }
}