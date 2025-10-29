export interface EmailVerificationTemplateParams {
  userName: string;
  verificationUrl: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

/**
 * Render email verification template
 */
export function renderEmailVerification(
  params: EmailVerificationTemplateParams
): RenderedEmail {
  const { userName, verificationUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0070f3;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome${userName ? `, ${userName}` : ''}!</h1>

    <p>Thanks for signing up. To complete your registration, please verify your email address by clicking the button below:</p>

    <a href="${verificationUrl}" class="button">Verify Email Address</a>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

    <p>This link will expire in 24 hours.</p>

    <div class="footer">
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Welcome${userName ? `, ${userName}` : ''}!

Thanks for signing up. To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
  `.trim();

  return { html, text };
}
