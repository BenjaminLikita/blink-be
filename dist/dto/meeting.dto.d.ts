import { z } from "zod";
export declare const createMeetingSchema: z.ZodObject<{
    hostId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    hostId?: string;
}, {
    name?: string;
    hostId?: string;
}>;
