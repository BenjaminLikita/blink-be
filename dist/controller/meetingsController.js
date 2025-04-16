"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinMeeting = exports.createMeeting = exports.getMeeting = exports.getMeetings = void 0;
const db_js_1 = require("../config/db.js");
const meeting_dto_js_1 = require("../dto/meeting.dto.js");
const nanoid_1 = require("nanoid");
const http_status_codes_1 = require("http-status-codes");
const getMeetings = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
            return;
        }
        const meetings = await db_js_1.db.meeting.findMany({
            where: {
                OR: [
                    { hostId: user.id },
                    { attendees: { some: { id: user.id } } }
                ]
            }
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: meetings, message: "Meetings fetched successfully" });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${error.message}` });
    }
};
exports.getMeetings = getMeetings;
const getMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Id is required" });
            return;
        }
        const meeting = await db_js_1.db.meeting.findUnique({
            where: { callId: id }
        });
        if (!meeting) {
            res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ success: false, message: "Meeting not found" });
            return;
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: meeting, message: "Meeting fetched successfully" });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${error.message}` });
    }
};
exports.getMeeting = getMeeting;
const createMeeting = async (req, res) => {
    try {
        const { user } = req;
        if (!user) {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
            return;
        }
        const callId = (0, nanoid_1.nanoid)(6);
        const meeting = await db_js_1.db.meeting.create({ data: { hostId: user.id, callId } });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: meeting, message: "Meeting created successfully" });
    }
    catch (error) {
        console.log({ error });
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${error.message}` });
    }
};
exports.createMeeting = createMeeting;
const joinMeeting = async (req, res) => {
    try {
        const { user, body } = req;
        if (!user) {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { success, data, error } = meeting_dto_js_1.joinMeetingSchema.safeParse(body);
        if (!success) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, error: error?.issues.map((issue) => ({ expectedType: issue.expected, fieldName: issue.path[0] })), messsage: "Missing required fields" });
            return;
        }
        const { callId } = data;
        const existingMeeting = await db_js_1.db.meeting.findUnique({ where: { callId } });
        if (!existingMeeting) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Meeting does not exist" });
            return;
        }
        const meeting = await db_js_1.db.meeting.update({ where: { callId }, data: { attendees: { connect: { id: user.id } } } });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: meeting, message: "Meeting joined successfully" });
    }
    catch (error) {
        console.log({ error });
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Something went wrong: ${error.message}` });
    }
};
exports.joinMeeting = joinMeeting;
