import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import { env } from '../config/env';

let transporter: Transporter | null = null;

export const initializeMailTransport = (): Transporter | null => {
  if (transporter) return transporter;

  if (!env.SMTP_PASS) {
    console.warn('SMTP_PASS not configured, email service will be disabled');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

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
      from: env.EMAIL_FROM,
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
  const subject = `Price Alert: ${cropName} is now ${direction} ₹${thresholdPrice}/${unit}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5f2d;">Price Alert Triggered</h2>
      <p>Hello,</p>
      <p>Your price alert for <strong>${cropName}</strong> at <strong>${mandiName}</strong> has been triggered.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Current Price:</strong> ₹${currentPrice}/${unit}</p>
        <p style="margin: 5px 0;"><strong>Threshold:</strong> ₹${thresholdPrice}/${unit}</p>
        <p style="margin: 5px 0;"><strong>Condition:</strong> Price went ${direction} threshold</p>
      </div>
      <p>Log in to your account to manage your alerts.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated email from Ajrasakha. Please do not reply to this email.
      </p>
    </div>
  `;

  const text = `
Price Alert Triggered

Your price alert for ${cropName} at ${mandiName} has been triggered.

Current Price: ₹${currentPrice}/${unit}
Threshold: ₹${thresholdPrice}/${unit}
Condition: Price went ${direction} threshold

Log in to your account to manage your alerts.

This is an automated email from Ajrasakha. Please do not reply to this email.
  `;

  return sendEmail({ to, subject, text, html });
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
  const subject = `Trend Alert: ${cropName} is ${directionText} by ${percentage}%`;
  
  const color = trendDirection === 'increase' ? '#2c5f2d' : '#d32f2f';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${color};">Trend Alert</h2>
      <p>Hello,</p>
      <p>Your trend alert for <strong>${cropName}</strong> at <strong>${mandiName}</strong> has been triggered.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Trend:</strong> ${directionText}</p>
        <p style="margin: 5px 0;"><strong>Change:</strong> ${percentage}%</p>
        <p style="margin: 5px 0;"><strong>Period:</strong> Last ${days} days</p>
      </div>
      <p>Log in to your account to manage your alerts.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This is an automated email from Ajrasakha. Please do not reply to this email.
      </p>
    </div>
  `;

  const text = `
Trend Alert

Your trend alert for ${cropName} at ${mandiName} has been triggered.

Trend: ${directionText}
Change: ${percentage}%
Period: Last ${days} days

Log in to your account to manage your alerts.

This is an automated email from Ajrasakha. Please do not reply to this email.
  `;

  return sendEmail({ to, subject, text, html });
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
