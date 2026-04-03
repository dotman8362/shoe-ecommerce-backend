import express from "express";
import { Resend } from "resend";

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message, orderNumber } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled.",
      });
    }

    const sentAt = new Date().toLocaleDateString("en-NG", {
      weekday: "long",
      year:    "numeric",
      month:   "long",
      day:     "numeric",
    });

    const sentTime = new Date().toLocaleTimeString("en-NG", {
      hour:   "2-digit",
      minute: "2-digit",
    });

    await resend.emails.send({
      from:    "onboarding@resend.dev",
      to:      ["ajagbejanet2018@gmail.com"],
      replyTo: email,
      subject: `New Enquiry — ${subject}`,

      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Message</title>
        </head>
        <body style="margin:0;padding:0;background-color:#0e0c0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

          <!-- Preheader -->
          <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0e0c0a;">
            New enquiry from ${name} — ${subject}
          </div>

          <!-- Outer -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            style="background-color:#0e0c0a;min-height:100vh;">
            <tr>
              <td align="center" style="padding:48px 16px 64px;">

                <!-- Card -->
                <table role="presentation" width="580" cellspacing="0" cellpadding="0" border="0"
                  style="max-width:580px;width:100%;background-color:#141210;border:1px solid rgba(255,255,255,0.07);">

                  <!-- TOP GOLD RULE -->
                  <tr>
                    <td style="height:1px;background:linear-gradient(90deg,transparent,#c49c68,transparent);font-size:0;line-height:0;">&nbsp;</td>
                  </tr>

                  <!-- ── HEADER ── -->
                  <tr>
                    <td align="center" style="padding:48px 48px 36px;">

                      <!-- Brand -->
                      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;letter-spacing:0.3em;text-transform:uppercase;color:#c49c68;">
                        Jofta Solemates
                      </p>

                      <!-- Icon box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                        style="margin:0 auto 24px;">
                        <tr>
                          <td style="width:56px;height:56px;border:1px solid rgba(196,156,104,0.25);background:rgba(196,156,104,0.05);">
                            <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" valign="middle">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                                      stroke="#c49c68" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <polyline points="22,6 12,13 2,6"
                                      stroke="#c49c68" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Label -->
                      <p style="margin:0 0 8px;font-size:10px;font-weight:400;letter-spacing:0.24em;text-transform:uppercase;color:#c49c68;">
                        New Enquiry
                      </p>

                      <!-- Title -->
                      <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:300;line-height:1.1;letter-spacing:-0.01em;color:#f0ebe3;">
                        You have a new message
                      </h1>

                      <!-- Subtitle -->
                      <p style="margin:0;font-size:13px;font-weight:300;line-height:1.7;color:#8a8178;max-width:360px;">
                        Someone reached out through your contact form. Here are the details.
                      </p>

                      <!-- Hairline -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                        style="margin:28px auto 0;width:40px;">
                        <tr>
                          <td style="height:1px;background:linear-gradient(90deg,#c49c68,transparent);font-size:0;">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- DIVIDER -->
                  <tr>
                    <td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;">&nbsp;</td>
                  </tr>

                  <!-- ── SENDER DETAILS ── -->
                  <tr>
                    <td style="padding:32px 48px;">
                      <p style="margin:0 0 18px;font-size:10px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#c49c68;">
                        Sender Details
                      </p>

                      <!-- Details grid -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                        style="border:1px solid rgba(255,255,255,0.07);">

                        <!-- Name -->
                        <tr>
                          <td style="padding:13px 18px;width:90px;border-bottom:1px solid rgba(255,255,255,0.07);vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:#4a4540;">Name</p>
                          </td>
                          <td style="padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.07);border-left:1px solid rgba(255,255,255,0.07);vertical-align:top;">
                            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:300;color:#f0ebe3;letter-spacing:0.01em;">${name}</p>
                          </td>
                        </tr>

                        <!-- Email -->
                        <tr>
                          <td style="padding:13px 18px;width:90px;border-bottom:1px solid rgba(255,255,255,0.07);vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:#4a4540;">Email</p>
                          </td>
                          <td style="padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.07);border-left:1px solid rgba(255,255,255,0.07);vertical-align:top;">
                            <a href="mailto:${email}" style="font-size:13px;font-weight:300;color:#c49c68;text-decoration:none;letter-spacing:0.03em;">${email}</a>
                          </td>
                        </tr>

                        <!-- Subject -->
                        <tr>
                          <td style="padding:13px 18px;width:90px;border-bottom:${orderNumber ? "1px solid rgba(255,255,255,0.07)" : "none"};vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:#4a4540;">Subject</p>
                          </td>
                          <td style="padding:13px 18px;border-bottom:${orderNumber ? "1px solid rgba(255,255,255,0.07)" : "none"};border-left:1px solid rgba(255,255,255,0.07);vertical-align:top;">
                            <p style="margin:0;font-size:13px;font-weight:300;color:#8a8178;letter-spacing:0.03em;">${subject}</p>
                          </td>
                        </tr>

                        ${orderNumber ? `
                        <!-- Order number -->
                        <tr>
                          <td style="padding:13px 18px;width:90px;vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:#4a4540;">Order No.</p>
                          </td>
                          <td style="padding:13px 18px;border-left:1px solid rgba(255,255,255,0.07);vertical-align:top;">
                            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:300;color:#c49c68;letter-spacing:0.06em;">${orderNumber}</p>
                          </td>
                        </tr>
                        ` : ""}

                      </table>
                    </td>
                  </tr>

                  <!-- DIVIDER -->
                  <tr>
                    <td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;">&nbsp;</td>
                  </tr>

                  <!-- ── MESSAGE ── -->
                  <tr>
                    <td style="padding:32px 48px;">
                      <p style="margin:0 0 16px;font-size:10px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#c49c68;">
                        Message
                      </p>

                      <!-- Message block with left bar -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="width:2px;background:linear-gradient(to bottom,#c49c68,transparent);vertical-align:top;">&nbsp;</td>
                          <td style="padding:4px 0 4px 20px;">
                            <p style="margin:0;font-size:14px;font-weight:300;line-height:1.85;color:#8a8178;letter-spacing:0.02em;white-space:pre-line;">${message}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- DIVIDER -->
                  <tr>
                    <td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;">&nbsp;</td>
                  </tr>

                  <!-- ── REPLY CTA ── -->
                  <tr>
                    <td align="center" style="padding:28px 48px 36px;">
                      <p style="margin:0 0 18px;font-size:12px;font-weight:300;color:#4a4540;letter-spacing:0.04em;">
                        Reply directly to this message to respond to ${name}.
                      </p>
                      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}"
                        style="display:inline-block;padding:13px 40px;background:#c49c68;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;font-weight:400;letter-spacing:0.2em;text-transform:uppercase;color:#0e0c0a;text-decoration:none;border-radius:1px;">
                        Reply to ${name}
                      </a>
                    </td>
                  </tr>

                  <!-- BOTTOM GOLD RULE -->
                  <tr>
                    <td style="height:1px;background:linear-gradient(90deg,transparent,#c49c68,transparent);font-size:0;line-height:0;">&nbsp;</td>
                  </tr>

                </table>
                <!-- /Card -->

                <!-- ── FOOTER ── -->
                <table role="presentation" width="580" cellspacing="0" cellpadding="0" border="0"
                  style="max-width:580px;width:100%;margin-top:24px;">
                  <tr>
                    <td align="center" style="padding:0 16px;">
                      <p style="margin:0 0 5px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:300;font-style:italic;color:#4a4540;letter-spacing:0.04em;">
                        Premium footwear for the discerning sole
                      </p>
                      <p style="margin:0;font-size:10px;font-weight:300;letter-spacing:0.12em;color:#2a2620;text-transform:uppercase;">
                        Received ${sentAt} at ${sentTime}
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
          <!-- /Outer -->

        </body>
        </html>
      `,
    });

    res.json({ success: true, message: "Message sent successfully." });

  } catch (error) {
    console.error("Resend Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again.",
    });
  }
});

export default router;