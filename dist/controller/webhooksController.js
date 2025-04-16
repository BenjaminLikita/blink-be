"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clerkController = void 0;
const svix_1 = require("svix");
const db_js_1 = require("../config/db.js");
const clerkController = async (req, res) => {
    const SIGNING_SECRET = process.env.SIGNING_SECRET;
    if (!SIGNING_SECRET) {
        throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local');
    }
    const wh = new svix_1.Webhook(SIGNING_SECRET);
    const headerPayload = req.headers;
    const svix_id = headerPayload['svix-id'];
    const svix_timestamp = headerPayload['svix-timestamp'];
    const svix_signature = headerPayload['svix-signature'];
    if (!svix_id || !svix_timestamp || !svix_signature) {
        res.status(400).send('Error: Missing Svix headers');
    }
    const payload = req.body;
    const body = JSON.stringify(payload);
    let _evt;
    try {
        if (!svix_id || !svix_timestamp || !svix_signature) {
            throw new Error('Error: Invalid Svix headers');
        }
        _evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    }
    catch (err) {
        res.status(400).send('Webhook verification failed');
    }
    const { id } = payload.data;
    await db_js_1.db.user.create({
        data: { id }
    });
    // const { email_addresses, first_name, last_name, profile_image_url, id } = payload.data
    // await db.user.create({
    //   data: {
    //     email: email_addresses[0]!.email_address,
    //     firstName: first_name,
    //     lastName: last_name,
    //     profileImage: profile_image_url,
    //     id
    //   }
    // })
    res.status(200).send('User created');
};
exports.clerkController = clerkController;
