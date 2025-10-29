export interface PasswordResetTemplateParams {
  userName: string;
  resetUrl: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

/**
 * Render password reset template
 */
export function renderPasswordReset(
  params: PasswordResetTemplateParams
): RenderedEmail {
  const { userName, resetUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
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
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>

    <p>Hi${userName ? ` ${userName}` : ''},</p>

    <p>We received a request to reset your password. Click the button below to choose a new password:</p>

    <a href="${resetUrl}" class="button">Reset Password</a>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${resetUrl}</p>

    <div class="warning">
      <strong>⚠️ Security Notice:</strong>
      <p style="margin: 5px 0 0 0;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>

    <div class="footer">
      <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
      <p>If you didn't request this password reset, please contact support immediately.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Reset Your Password

Hi${userName ? ` ${userName}` : ''},

We received a request to reset your password. Click the link below to choose a new password:

${resetUrl}

⚠️ SECURITY NOTICE:
This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

If you didn't request this password reset, please contact support immediately.
  `.trim();

  return { html, text };
}
