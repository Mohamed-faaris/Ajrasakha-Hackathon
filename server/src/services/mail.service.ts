import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import type { Options as SMTPTransportOptions } from 'nodemailer/lib/smtp-transport';
import { env } from '../config/env';

let transporter: Transporter | null = null;

export const initializeMailTransport = (): Transporter | null => {
  if (transporter) return transporter;

  if (!env.SMTP_PASS) {
    console.warn('SMTP_PASS not configured, email service will be disabled');
    return null;
  }

  try {
    const transportOptions: SMTPTransportOptions = {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    };

    transporter = nodemailer.createTransport(transportOptions);

    console.log('Email transport initialized');
    return transporter;
  } catch (error) {
    console.error('Failed to initialize email transport:', error);
    return null;
  }
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: SendMailOptions['attachments'];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const getEmailTemplate = (content: string, title: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #2c5f2d 0%, #3d7a3e 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    .header p {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      margin-top: 8px;
    }
    .content {
      padding: 40px 30px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      color: #6c757d;
      font-size: 12px;
      margin: 0;
    }
    .otp-box {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 2px dashed #2c5f2d;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .otp-code {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 12px;
      color: #2c5f2d;
      font-family: 'Courier New', monospace;
    }
    .otp-label {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #2c5f2d 0%, #3d7a3e 100%);
      color: #ffffff !important;
      padding: 16px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(44,95,45,0.3);
      transition: transform 0.2s;
    }
    .info-box {
      background: #e8f5e9;
      border-left: 4px solid #2c5f2d;
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .warning-box {
      background: #fff3e0;
      border-left: 4px solid #f57c00;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #dee2e6, transparent);
      margin: 30px 0;
    }
    h2 { color: #2c5f2d; font-size: 20px; margin-bottom: 15px; }
    p { color: #495057; line-height: 1.7; margin-bottom: 15px; }
    .link-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      word-break: break-all;
      font-size: 13px;
      color: #6c757d;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌾</div>
      <h1>Ajrasakha</h1>
      <p>Agricultural Market Intelligence</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 Ajrasakha. All rights reserved.<br>This is an automated email, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  const transport = initializeMailTransport();

  if (!transport) {
    return {
      success: false,
      error: 'Email transport not initialized - check SMTP configuration',
    };
  }

  try {
    const result = await transport.sendMail({
      from: `"Ajrasakha" <${env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
};

export const sendPriceAlertEmail = async (
  to: string,
  cropName: string,
  mandiName: string,
  currentPrice: number,
  thresholdPrice: number,
  direction: 'above' | 'below',
  unit: string = 'Qtl'
): Promise<EmailResult> => {
  const subject = `🚨 Price Alert: ${cropName} is now ${direction} ₹${thresholdPrice}/${unit}`;
  
  const content = `
    <h2>Price Alert Triggered!</h2>
    <p>Hello,</p>
    <p>Your price alert for <strong>${cropName}</strong> at <strong>${mandiName}</strong> has been triggered.</p>
    
    <div class="info-box">
      <p style="margin: 0;"><strong>📊 Current Price:</strong> ₹${currentPrice}/${unit}</p>
      <p style="margin: 8px 0 0 0;"><strong>🎯 Threshold:</strong> ₹${thresholdPrice}/${unit}</p>
      <p style="margin: 8px 0 0 0;"><strong>📈 Condition:</strong> Price went ${direction} threshold</p>
    </div>
    
    <div class="divider"></div>
    
    <p>Log in to your account to manage your alerts and view detailed market insights.</p>
    
    <center>
      <a href="http://localhost:3000/dashboard" class="button">View Dashboard</a>
    </center>
  `;

  const text = `
Price Alert Triggered

Your price alert for ${cropName} at ${mandiName} has been triggered.

Current Price: ₹${currentPrice}/${unit}
Threshold: ₹${thresholdPrice}/${unit}
Condition: Price went ${direction} threshold

Log in to your account to manage your alerts.
  `;

  return sendEmail({ to, subject, text, html: getEmailTemplate(content, 'Price Alert') });
};

export const sendTrendAlertEmail = async (
  to: string,
  cropName: string,
  mandiName: string,
  trendDirection: 'increase' | 'decrease',
  percentage: number,
  days: number
): Promise<EmailResult> => {
  const directionText = trendDirection === 'increase' ? 'increasing' : 'decreasing';
  const emoji = trendDirection === 'increase' ? '📈' : '📉';
  const subject = `${emoji} Trend Alert: ${cropName} is ${directionText} by ${percentage}%`;
  
  const content = `
    <h2>Trend Alert</h2>
    <p>Hello,</p>
    <p>Your trend alert for <strong>${cropName}</strong> at <strong>${mandiName}</strong> has been triggered.</p>
    
    <div class="info-box">
      <p style="margin: 0;"><strong>Trend:</strong> ${directionText}</p>
      <p style="margin: 8px 0 0 0;"><strong>Change:</strong> ${percentage}%</p>
      <p style="margin: 8px 0 0 0;"><strong>Period:</strong> Last ${days} days</p>
    </div>
    
    <div class="divider"></div>
    
    <p>Log in to your account to view detailed trend analysis.</p>
    
    <center>
      <a href="http://localhost:3000/dashboard" class="button">View Dashboard</a>
    </center>
  `;

  const text = `
Trend Alert

Your trend alert for ${cropName} at ${mandiName} has been triggered.

Trend: ${directionText}
Change: ${percentage}%
Period: Last ${days} days

Log in to your account to view detailed trend analysis.
  `;

  return sendEmail({ to, subject, text, html: getEmailTemplate(content, 'Trend Alert') });
};

export const verifyEmailTransport = async (): Promise<boolean> => {
  const transport = initializeMailTransport();
  if (!transport) return false;

  try {
    await transport.verify();
    console.log('Email transport verified successfully');
    return true;
  } catch (error) {
    console.error('Email transport verification failed:', error);
    return false;
  }
};

export const sendMagicLinkEmail = async (to: string, url: string): Promise<EmailResult> => {
  const subject = '✨ Your Magic Sign-In Link';
  const content = `
    <h2>Sign In to Ajrasakha</h2>
    <p>Hello,</p>
    <p>Click the button below to securely sign in to your account. No password needed!</p>
    
    <center>
      <a href="${url}" class="button">Sign In Now</a>
    </center>
    
    <div class="warning-box">
      <p style="margin: 0; font-size: 13px;">⏰ This link will expire in <strong>1 hour</strong> for your security.</p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">Or copy and paste this link into your browser:</p>
    <div class="link-box">${url}</div>
    
    <p style="margin-top: 20px; font-size: 13px; color: #6c757d;">
      🔒 If you didn't request this link, you can safely ignore this email. Your account is secure.
    </p>
  `;
  
  const text = `Sign in to Ajrasakha: ${url}`;
  return sendEmail({ to, subject, text, html: getEmailTemplate(content, 'Sign In Link') });
};

export const sendOtpEmail = async (to: string, otp: string, type: 'sign-in' | 'verification' = 'sign-in'): Promise<EmailResult> => {
  const subject = type === 'sign-in' ? '🔐 Your Sign In Code' : '✉️ Your Verification Code';
  const title = type === 'sign-in' ? 'Sign In' : 'Email Verification';
  const content = `
    <h2>${type === 'sign-in' ? 'Sign In to Your Account' : 'Verify Your Email'}</h2>
    <p>Hello,</p>
    <p>Use the verification code below to ${type === 'sign-in' ? 'sign in to your account' : 'verify your email address'}:</p>
    
    <div class="otp-box">
      <div class="otp-label">Your Verification Code</div>
      <div class="otp-code">${otp}</div>
    </div>
    
    <div class="warning-box">
      <p style="margin: 0; font-size: 13px;">⏰ This code will expire in <strong>5 minutes</strong> for security reasons.</p>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6c757d;">Didn't request this code? You can safely ignore this email.</p>
  `;
  
  const text = `Your verification code is: ${otp}`;
  return sendEmail({ to, subject, text, html: getEmailTemplate(content, title) });
};
