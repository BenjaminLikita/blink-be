"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meetingsController_js_1 = require("../controller/meetingsController.js");
const router = (0, express_1.Router)();
router.route("/")
    .get(meetingsController_js_1.getMeetings)
    .post(meetingsController_js_1.createMeeting);
router.route("/:id")
    .get(meetingsController_js_1.getMeeting);
router.route("/join")
    .get(meetingsController_js_1.joinMeeting);
exports.default = router;
