import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Webhook payload received:", payload)

    // The webhook payload contains the 'record' (the updated or inserted row)
    const guest = payload.record

    // Only send if the booking is confirmed
    if (guest.booking_status !== 'confirmed') {
      return new Response(JSON.stringify({ message: "Not a confirmed booking. Skipped." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // Construct the email body
    const emailBody = `
      <h1>Booking Confirmed!</h1>
      <p>Dear ${guest.guest_name},</p>
      <p>Your booking with Coxcargill Glamps is confirmed.</p>
      <ul>
        <li><strong>Confirmation Number:</strong> ${guest.confirmation_number}</li>
        <li><strong>Check-in:</strong> ${guest.check_in_date}</li>
        <li><strong>Check-out:</strong> ${guest.check_out_date}</li>
        <li><strong>Guests:</strong> ${guest.number_of_packs} Adults, ${guest.number_of_kids} Kids</li>
      </ul>
      <p>Please bring a valid ID. We look forward to hosting you!</p>
      <p>Best Regards,<br/>Coxcargill Glamps Team</p>
    `;

    // Send the email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Coxcargill Glamps <onboarding@resend.dev>', // Use info@yourdomain.com when you verify a domain in Resend
        to: guest.email,
        subject: `Booking Confirmed: ${guest.confirmation_number}`,
        html: emailBody,
      }),
    })

    const resData = await res.json()

    if (res.ok) {
      console.log("Email sent successfully", resData)
      return new Response(JSON.stringify(resData), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    } else {
      console.error("Error from Resend:", resData)
      return new Response(JSON.stringify({ error: resData }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      })
    }

  } catch (err) {
    console.error(err)
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})
