import express from "express";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/send-order-email", async (req, res) => {
  const { shipping, cart, total, email } = req.body;

  if (!shipping || !cart || typeof total !== "number") {
    return res.status(400).json({ message: "Missing order data" });
  }

  if (!email) {
    return res.status(400).json({ message: "Missing email" });
  }

  // Format cart items for email
  const cartItemsHtml = cart
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e9ecef;">
      <td style="padding: 16px 0; color: #2d3748; font-size: 15px;">${item.name}</td>
      <td style="padding: 16px 0; text-align: center; color: #4a5568; font-size: 15px;">${item.quantity}</td>
      <td style="padding: 16px 0; text-align: right; color: #2d3748; font-weight: 500; font-size: 15px;">₦${item.price.toFixed(2)}</td>
      <td style="padding: 16px 0; text-align: right; color: #2d3748; font-weight: 600; font-size: 15px;">₦${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  const orderDate = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    await resend.emails.send({
      from:"Jofta Solemates <orders@joftasolemates.com.ng>",  
      to: email,
      subject: `Order Confirmation - ₦${total.toFixed(2)}`,
      html: `
         <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Order Confirmed — Jofta Solemates</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
 
      <body style="margin:0;padding:0;background-color:#0e0c0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
 
        <!-- Preheader (hidden) -->
        <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0e0c0a;">
          Your Jofta Solemates order has been confirmed. Thank you, ${shipping.name}.
        </div>
 
        <!-- Outer wrapper -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="background-color:#0e0c0a;min-height:100vh;">
          <tr>
            <td align="center" style="padding:48px 16px 64px;">
 
              <!-- Inner card -->
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
                style="max-width:600px;width:100%;background-color:#141210;border:1px solid rgba(255,255,255,0.07);">
 
                <!-- TOP GOLD RULE -->
                <tr>
                  <td style="height:1px;background:linear-gradient(90deg,transparent,#c49c68,transparent);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
 
                <!-- ── HEADER ── -->
                <tr>
                  <td align="center" style="padding:56px 48px 48px;">
 
                    <!-- Brand wordmark -->
                    <p style="margin:0 0 32px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;letter-spacing:0.32em;text-transform:uppercase;color:#c49c68;">
                      Jofta Solemates
                    </p>
 
                    <!-- Check circle -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                      style="margin:0 auto 28px;">
                      <tr>
                        <td style="width:64px;height:64px;border:1px solid rgba(122,171,138,0.3);background:rgba(122,171,138,0.05);">
                          <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td align="center" valign="middle">
                                <span style="font-size:48px; color:#7aab8a;">✓</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
 
                    <!-- Confirm label -->
                    <p style="margin:0 0 10px;font-size:10px;font-weight:400;letter-spacing:0.26em;text-transform:uppercase;color:#7aab8a;">
                      Order Confirmed
                    </p>
 
                    <!-- Main heading -->
                    <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:300;line-height:1.1;letter-spacing:-0.01em;color:#f0ebe3;">
                      Thank you, ${shipping.name.split(" ")[0]}
                    </h1>
 
                    <!-- Subheading -->
                    <p style="margin:0;font-size:14px;font-weight:300;line-height:1.75;color:#8a8178;max-width:380px;">
                      Your order has been received and is now being processed.
                      You will be contacted with shipping details shortly.
                    </p>
 
                    <!-- Hairline -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                      style="margin:32px auto 0;width:40px;">
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
 
                <!-- ── ORDER TRACKING ── -->
                <tr>
                  <td style="padding:36px 48px;">
                    <p style="margin:0 0 24px;font-size:10px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#c49c68;">
                      Order Status
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        ${["Received", "Processing", "Shipped", "Delivered"]
                          .map(
                            (step, i) => `
                          <td align="center" style="vertical-align:top;width:25%;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0"
                              style="margin:0 auto;">
                              <tr>
                                <td align="center">
                                  <div style="width:10px;height:10px;border-radius:50%;
                                    background-color:${i === 0 ? "#7aab8a" : "transparent"};
                                    border:1px solid ${i === 0 ? "#7aab8a" : "rgba(255,255,255,0.12)"};
                                    margin:0 auto 10px;">
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center">
                                  <p style="margin:0;font-size:10px;font-weight:400;letter-spacing:0.14em;
                                    text-transform:uppercase;
                                    color:${i === 0 ? "#7aab8a" : "#4a4540"};">
                                    ${step}
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          ${
                            i < 3
                              ? `
                          <td style="vertical-align:middle;padding-bottom:20px;">
                            <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
                          </td>`
                              : ""
                          }
                        `,
                          )
                          .join("")}
                      </tr>
                    </table>
                  </td>
                </tr>
 
                <!-- DIVIDER -->
                <tr>
                  <td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;">&nbsp;</td>
                </tr>
 
                <!-- ── ORDER SUMMARY ── -->
                <tr>
                  <td style="padding:36px 48px;">
 
                    <!-- Section header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                      style="margin-bottom:20px;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:10px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#c49c68;">
                            Order Summary
                          </p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;font-weight:300;color:#4a4540;letter-spacing:0.06em;">
                            ${orderDate}
                          </p>
                        </td>
                      </tr>
                    </table>
 
                    <!-- Items table -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                      style="border:1px solid rgba(255,255,255,0.07);">
 
                      <!-- Table head -->
                      <tr style="background-color:#1a1714;">
                        <td style="padding:12px 16px;font-size:10px;font-weight:400;letter-spacing:0.14em;text-transform:uppercase;color:#4a4540;">Item</td>
                        <td align="center" style="padding:12px 8px;font-size:10px;font-weight:400;letter-spacing:0.14em;text-transform:uppercase;color:#4a4540;">Qty</td>
                        <td align="right" style="padding:12px 16px;font-size:10px;font-weight:400;letter-spacing:0.14em;text-transform:uppercase;color:#4a4540;">Unit</td>
                        <td align="right" style="padding:12px 16px;font-size:10px;font-weight:400;letter-spacing:0.14em;text-transform:uppercase;color:#4a4540;">Total</td>
                      </tr>
 
                      <!-- Items -->
                      ${cartItemsHtml}
 
                      <!-- Total row -->
                      <tr style="border-top:1px solid rgba(255,255,255,0.07);background-color:rgba(196,156,104,0.04);">
                        <td colspan="3" style="padding:18px 16px;font-size:10px;font-weight:400;letter-spacing:0.18em;text-transform:uppercase;color:#8a8178;">
                          Total Amount
                        </td>
                        <td align="right" style="padding:18px 16px;">
                          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:300;color:#f0ebe3;letter-spacing:-0.01em;">
                            &#8358;${total.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
 
                <!-- DIVIDER -->
                <tr>
                  <td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;">&nbsp;</td>
                </tr>
 
                <!-- ── DELIVERY INFO ── -->
                <tr>
                  <td style="padding:36px 48px;">
                    <p style="margin:0 0 20px;font-size:10px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#c49c68;">
                      Delivery Information
                    </p>
 
                    <!-- Address block -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <!-- Gold left bar -->
                        <td style="width:2px;background:linear-gradient(to bottom,#c49c68,transparent);vertical-align:top;">&nbsp;</td>
                        <td style="padding:0 0 0 20px;">
                          <p style="margin:0;font-size:14px;font-weight:300;line-height:1.8;color:#8a8178;letter-spacing:0.02em;">
                            ${shipping.address}<br>
                            ${shipping.city}, ${shipping.state}${shipping.zip ? ` ${shipping.zip}` : ""}
                          </p>
                        </td>
                      </tr>
                    </table>
 
                    <!-- Delivery notes -->
                    ${
                      shipping.deliveryNotes
                        ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                      style="margin-top:16px;border:1px solid rgba(255,255,255,0.07);background-color:#1a1714;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 6px;font-size:10px;font-weight:400;letter-spacing:0.18em;text-transform:uppercase;color:#4a4540;">
                            Delivery Notes
                          </p>
                          <p style="margin:0;font-size:13px;font-weight:300;line-height:1.65;color:#8a8178;">
                            ${shipping.deliveryNotes}
                          </p>
                        </td>
                      </tr>
                    </table>
                    `
                        : ""
                    }
                  </td>
                </tr>
 
                <!-- DIVIDER -->
                <tr>
                  <td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;">&nbsp;</td>
                </tr>
 
                <!-- ── NEXT STEPS ── -->
                <tr>
                  <td style="padding:36px 48px;">
                    <p style="margin:0 0 24px;font-size:10px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#c49c68;">
                      What Happens Next
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                      style="border:1px solid rgba(255,255,255,0.07);">
                      ${[
                        {
                          n: "01",
                          label: "Order Confirmed",
                          desc: "Your payment has been verified and your order logged.",
                          active: true,
                        },
                        {
                          n: "02",
                          label: "In Production",
                          desc: "Our artisans are preparing your handcrafted pieces.",
                          active: false,
                        },
                        {
                          n: "03",
                          label: "Out for Delivery",
                          desc: "A courier will contact you to arrange final delivery.",
                          active: false,
                        },
                      ]
                        .map(
                          (step, i) => `
                        <tr style="${i > 0 ? "border-top:1px solid rgba(255,255,255,0.07);" : ""}">
                          <td style="padding:18px 20px;vertical-align:top;width:36px;">
                            <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:300;
                              color:${step.active ? "#c49c68" : "#2a2620"};line-height:1;">
                              ${step.n}
                            </span>
                          </td>
                          <td style="padding:18px 20px 18px 0;vertical-align:top;border-left:1px solid rgba(255,255,255,0.07);">
                            <p style="margin:0 0 4px;font-size:12px;font-weight:400;letter-spacing:0.06em;
                              color:${step.active ? "#f0ebe3" : "#4a4540"};">
                              ${step.label}
                            </p>
                            <p style="margin:0;font-size:12px;font-weight:300;line-height:1.6;color:#4a4540;">
                              ${step.desc}
                            </p>
                          </td>
                        </tr>
                      `,
                        )
                        .join("")}
                    </table>
                  </td>
                </tr>
 
                <!-- DIVIDER -->
                <tr>
                  <td style="height:1px;background:rgba(255,255,255,0.07);font-size:0;">&nbsp;</td>
                </tr>
 
                <!-- ── SUPPORT ── -->
                <tr>
                  <td align="center" style="padding:32px 48px 40px;">
                   <p style="margin:0 0 6px;font-size:12px;font-weight:300;color:#4a4540;letter-spacing:0.04em;">
      Questions about your order?
    </p>
    
  
    <a href="https://joftasolemates.com.ng/contact"
      style="font-size:11px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;
        color:#c49c68;text-decoration:none;border-bottom:1px solid rgba(196,156,104,0.35);
        padding-bottom:2px;display:inline-block;margin:0 8px;">
      Chat on WhatsApp
    </a>
                  </td>
                </tr>
 
                <!-- BOTTOM GOLD RULE -->
                <tr>
                  <td style="height:1px;background:linear-gradient(90deg,transparent,#c49c68,transparent);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
 
              </table>
              <!-- /Inner card -->
 
              <!-- ── FOOTER ── -->
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
                style="max-width:600px;width:100%;margin-top:28px;">
                <tr>
                  <td align="center" style="padding:0 16px;">
                    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:300;
                      font-style:italic;color:#4a4540;letter-spacing:0.04em;">
                      Premium footwear for the discerning sole
                    </p>
                    <p style="margin:0;font-size:10px;font-weight:300;letter-spacing:0.12em;color:#2a2620;text-transform:uppercase;">
                      &copy; ${new Date().getFullYear()} Jofta Solemates &mdash; All Rights Reserved
                    </p>
                  </td>
                </tr>
              </table>
 
            </td>
          </tr>
        </table>
        <!-- /Outer wrapper -->
 
      </body>
      </html>
    `,
    });

    res.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Email failed" });
  }
});

export default router;
