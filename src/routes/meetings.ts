import { Router } from "express";
import { createMeeting, getMeeting, getMeetings, joinMeeting } from "../controller/meetingsController.js";


const router = Router()

router.route("/")
  .get(getMeetings)
  .post(createMeeting)

router.route("/:id")
  .get(getMeeting)

router.route("/join")
  .get(joinMeeting)

export default router