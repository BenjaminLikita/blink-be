"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhooksController_js_1 = require("../controller/webhooksController.js");
const router = (0, express_1.Router)();
router.post("/clerk", webhooksController_js_1.clerkController);
exports.default = router;
