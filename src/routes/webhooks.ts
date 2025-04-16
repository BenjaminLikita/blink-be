import { Router } from 'express';
import { clerkController } from '../controller/webhooksController.js';

const router = Router()

router.post("/clerk", clerkController)


export default router