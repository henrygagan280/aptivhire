import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

type SendInviteEmailParams = {
  email: string
  teamName: string
  inviteUrl: string
}

const APP_NAME = "Ventry"

export async function sendInviteEmail({
  email,
  teamName,
  inviteUrl,
}: SendInviteEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY")
  }

  if (!process.env.INVITE_FROM_EMAIL) {
    throw new Error("Missing INVITE_FROM_EMAIL")
  }

  const result = await resend.emails.send({
    from: process.env.INVITE_FROM_EMAIL,
    to: email,
    subject: `You've been invited to join ${teamName} on ${APP_NAME}`,
    html: `
      <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:36px;box-shadow:0 12px 30px rgba(15,23,42,0.08);">
            <div style="font-size:24px;font-weight:800;color:#7c3aed;margin-bottom:24px;">
              ${APP_NAME}
            </div>

            <h1 style="font-size:26px;line-height:1.25;margin:0 0 16px;font-weight:800;color:#0f172a;">
              You’ve been invited to join ${teamName}
            </h1>

            <p style="font-size:16px;line-height:1.6;color:#475569;margin:0 0 24px;">
              You’ve been invited to collaborate with your team on ${APP_NAME}.
            </p>

            <a href="${inviteUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px;">
              Accept invite
            </a>

            <p style="font-size:13px;line-height:1.6;color:#64748b;margin:28px 0 8px;">
              If the button doesn’t work, copy and paste this link into your browser:
            </p>

            <p style="font-size:13px;line-height:1.6;margin:0;word-break:break-all;">
              <a href="${inviteUrl}" style="color:#7c3aed;">${inviteUrl}</a>
            </p>
          </div>

          <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:20px;">
            This invite expires in 7 days.
          </p>
        </div>
      </div>
    `,
  })

  return result
}