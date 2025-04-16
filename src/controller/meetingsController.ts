import { type Request, type Response } from 'express';
import { db } from '../config/db.js';
import { joinMeetingSchema } from '../dto/meeting.dto.js';
import { nanoid } from 'nanoid';
import { StatusCodes } from 'http-status-codes';

export const getMeetings = async (req: Request, res: Response) => {
  
  try {
    const user = req.user
    if(!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" })
      return
    }

    const meetings = await db.meeting.findMany({
      where: {
        OR: [
          { hostId: user.id },
          { attendees: { some: { id: user.id } } }
        ]
      }
    })
    res.status(StatusCodes.OK).json({ success: true, data: meetings, message: "Meetings fetched successfully" })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${(error as any).message}` })
  }
}

export const getMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    if(!id) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Id is required" })
      return
    }

    const meeting = await db.meeting.findUnique({
      where: { callId: id }
    })
    if(!meeting) {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Meeting not found" })
      return
    }

    res.status(StatusCodes.OK).json({ success: true, data: meeting, message: "Meeting fetched successfully" })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${(error as any).message}` })
  }
}

export const createMeeting = async (req: Request, res: Response) => {
  try {
    const { user } = req

    if(!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" })
      return
    }
    
    const callId = nanoid(6)
    const meeting = await db.meeting.create({ data: { hostId: user.id, callId } })

    res.status(StatusCodes.OK).json({ success: true, data: meeting, message: "Meeting created successfully" })
  } catch (error) {
    console.log({error})
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${(error as any).message}` })
  }
}

export const joinMeeting = async (req: Request, res: Response) => {
  try {
    const { user, body } = req

    if(!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" })
      return
    }

    const { success, data, error } = joinMeetingSchema.safeParse(body)

    if(!success) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, error: error?.issues.map((issue: any) => ({ expectedType: issue.expected, fieldName: issue.path[0] }) ), messsage: "Missing required fields" })
      return
    }
    
    const { callId } = data
    const existingMeeting = await db.meeting.findUnique({ where: { callId } })
    if(!existingMeeting) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Meeting does not exist" })
      return
    }
    const meeting = await db.meeting.update({ where: { callId }, data: { attendees: { connect: { id: user.id } } } })

    res.status(StatusCodes.OK).json({ success: true, data: meeting, message: "Meeting joined successfully" })
  } catch (error) {
    console.log({error})
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${(error as any).message}` })
  }
}