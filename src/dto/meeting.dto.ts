import * as z from "zod";


export const joinMeetingSchema = z.object({
  callId: z.string().nonempty("Name is required"),
})