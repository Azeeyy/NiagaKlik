import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'NiagaKlik <noreply@niagaklik.com>';

let resendInstance: Resend | null = null;
if (RESEND_API_KEY) {
  resendInstance = new Resend(RESEND_API_KEY);
}

export async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
  try {
    if (!resendInstance) {
      console.log(`[OTP - No API Key] To: ${to}, OTP: ${otp}`);
      return false;
    }

    const { data, error } = await resendInstance.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Kode OTP Verifikasi NiagaKlik',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
            .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center; }
            .header h1 { color: #fff; font-size: 24px; margin: 0; }
            .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
            .body { padding: 32px; text-align: center; }
            .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #3b82f6; margin: 24px 0; font-family: 'Courier New', monospace; }
            .info { color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .footer { padding: 24px 32px; background: #f9fafb; text-align: center; }
            .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
            .badge { display: inline-block; background: #eff6ff; color: #3b82f6; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <span style="color:#fff;font-size:24px;font-weight:800;">NK</span>
              </div>
              <h1>Verifikasi Email</h1>
              <p>Masukkan kode OTP untuk melanjutkan</p>
            </div>
            <div class="body">
              <p class="info">Gunakan kode OTP berikut:</p>
              <div class="otp-code">${otp}</div>
              <p class="info">Kode ini berlaku selama <strong>10 menit</strong>.<br>Jika Anda tidak meminta kode ini, abaikan email ini.</p>
              <span class="badge">NiagaKlik - Marketplace Indonesia</span>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} NiagaKlik. All rights reserved.</p>
              <p style="margin-top:4px;">Email ini dikirim secara otomatis.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error(`[OTP Email Failed] To: ${to}, Error:`, error);
      console.log(`[OTP Fallback] To: ${to}, OTP: ${otp}`);
      return false;
    }

    console.log(`[OTP Email Sent] To: ${to}, ID: ${data?.id}`);
    return true;
  } catch (error: any) {
    console.error(`[OTP Email Failed] To: ${to}, Error:`, error.message);
    console.log(`[OTP Fallback] To: ${to}, OTP: ${otp}`);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, otp: string): Promise<boolean> {
  try {
    if (!resendInstance) {
      console.log(`[Reset Password - No API Key] To: ${to}, OTP: ${otp}`);
      return false;
    }

    const { data, error } = await resendInstance.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Password NiagaKlik',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
            .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 32px; text-align: center; }
            .header h1 { color: #fff; font-size: 24px; margin: 0; }
            .body { padding: 32px; text-align: center; }
            .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #ef4444; margin: 24px 0; font-family: 'Courier New', monospace; }
            .info { color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .footer { padding: 24px 32px; background: #f9fafb; text-align: center; }
            .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Password</h1>
            </div>
            <div class="body">
              <p class="info">Anda menerima email ini karena ada permintaan reset password untuk akun NiagaKlik.</p>
              <p class="info">Gunakan kode OTP berikut untuk mereset password Anda:</p>
              <div class="otp-code">${otp}</div>
              <p class="info">Kode ini berlaku selama <strong>10 menit</strong>.<br>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} NiagaKlik. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error(`[Reset Password Email Failed] To: ${to}, Error:`, error);
      console.log(`[Reset Password Fallback] To: ${to}, OTP: ${otp}`);
      return false;
    }

    console.log(`[Reset Password Email Sent] To: ${to}`);
    return true;
  } catch (error: any) {
    console.error(`[Reset Password Email Failed] To: ${to}, Error:`, error.message);
    console.log(`[Reset Password Fallback] To: ${to}, OTP: ${otp}`);
    return false;
  }
}
