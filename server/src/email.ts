type ApprovalEmailInput = {
  companyName: string
  recipientEmail: string
}

export function buildApprovalEmail({ companyName, recipientEmail }: ApprovalEmailInput) {
  const subject = 'Your EcoRoute company registration has been approved'
  const text = `Hello,\n\nYour company, ${companyName}, has been approved on EcoRoute. You can now sign in and access your dashboard.\n\nEmail: ${recipientEmail}\n\nWelcome aboard!\n\nEcoRoute Team`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc;">
        <p style="margin: 0 0 12px; font-size: 14px; color: #2563eb; font-weight: bold;">EcoRoute</p>
        <h2 style="margin: 0 0 16px; font-size: 28px; color: #0f172a;">Company approved</h2>
        <p style="margin: 0 0 12px; line-height: 1.6;">
          Hello,<br /><br />
          Your company, <strong>${companyName}</strong>, has been approved on EcoRoute.
          You can now sign in and access your dashboard.
        </p>
        <p style="margin: 0 0 16px; line-height: 1.6;">
          Email: <strong>${recipientEmail}</strong>
        </p>
        <p style="margin: 0; line-height: 1.6;">Welcome aboard!<br />EcoRoute Team</p>
      </div>
    </div>
  `

  return {
    to: recipientEmail,
    subject,
    text,
    html,
  }
}

export async function sendApprovalEmail({ companyName, recipientEmail }: ApprovalEmailInput) {
  const email = buildApprovalEmail({ companyName, recipientEmail })
  const configuredFrom = process.env.EMAIL_FROM?.trim() ?? 'onboarding@resend.dev'
  const from = configuredFrom.includes('@ecoroute.app') ? 'onboarding@resend.dev' : configuredFrom

  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipientEmail],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Resend email failed: ${body}`)
    }

    return { ok: true, provider: 'resend' }
  }

  const sendGridKey = process.env.SENDGRID_API_KEY
  if (sendGridKey) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendGridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipientEmail }] }],
        from: { email: from },
        subject: email.subject,
        content: [
          { type: 'text/plain', value: email.text },
          { type: 'text/html', value: email.html },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`SendGrid email failed: ${body}`)
    }

    return { ok: true, provider: 'sendgrid' }
  }

  console.warn('Approval email not sent: no email provider configured (RESEND_API_KEY or SENDGRID_API_KEY).')
  return { ok: false, provider: 'none' }
}
