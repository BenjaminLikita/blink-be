import { type Request, type Response } from 'express';
export declare const getMeetings: (_req: Request, res: Response) => Promise<void>;
export declare const getMeeting: (req: Request, res: Response) => Promise<void>;
export declare const createMeeting: (req: Request, res: Response) => Promise<void>;
