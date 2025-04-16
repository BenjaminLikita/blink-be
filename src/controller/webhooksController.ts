import { type Request, type Response } from 'express';
import { Webhook } from "svix"
import { db } from '../config/db.js';

export const clerkController = async (req: Request, res: Response) => {
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local')
  }

  const wh = new Webhook(SIGNING_SECRET)

  const headerPayload = req.headers
  const svix_id = headerPayload['svix-id'] as string | undefined
  const svix_timestamp = headerPayload['svix-timestamp'] as string | undefined
  const svix_signature = headerPayload['svix-signature'] as string | undefined


  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).send('Error: Missing Svix headers')
  }

  const payload = req.body
  const body = JSON.stringify(payload)

  let _evt

  try {
    if (!svix_id || !svix_timestamp || !svix_signature) {
      throw new Error('Error: Invalid Svix headers')
    }

    _evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    res.status(400).send('Webhook verification failed')
  }

  const { id } = payload.data
  await db.user.create({
    data: { id }
  })
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

  res.status(200).send('User created')
}