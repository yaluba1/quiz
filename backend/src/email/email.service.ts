import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/env.js';
import { getEmailTranslations } from './email.translations.js';

export interface EmailService {
  sendVerificationEmail(options: {
    to: string;
    displayName: string;
    token: string;
    locale?: string;
  }): Promise<boolean>;

  sendPasswordResetEmail(options: {
    to: string;
    displayName: string;
    token: string;
    locale?: string;
  }): Promise<boolean>;
}

class NodeMailerEmailService implements EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (config.smtp.host && config.smtp.host.trim().length > 0) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        requireTLS: config.smtp.requireTLS,
        auth: config.smtp.user
          ? {
              user: config.smtp.user,
              pass: config.smtp.password,
            }
          : undefined,
      });
    }
  }

  async sendVerificationEmail(options: {
    to: string;
    displayName: string;
    token: string;
    locale?: string;
  }): Promise<boolean> {
    const locale = options.locale || 'en';
    const t = getEmailTranslations(locale).verification;
    const baseUrl = config.appUrl.replace(/\/+$/, '');
    const verificationUrl = `${baseUrl}/teacher/${locale}/auth/verify?token=${encodeURIComponent(options.token)}`;

    const text = `${t.greeting} ${options.displayName},\n\n${t.body}\n\n${verificationUrl}\n\n${t.disregard}\n\n${t.signoff}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #059669; margin-top: 0;">${t.headline}</h2>
        <p>${t.greeting} <strong>${options.displayName}</strong>,</p>
        <p>${t.body}</p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${verificationUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${t.button}</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">${t.fallbackLink}</p>
        <p style="font-size: 13px; color: #0284c7; word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">${t.disregard}</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.smtp.from,
          to: options.to,
          subject: t.subject,
          text,
          html,
        });
        return true;
      } catch (err) {
        console.error('Failed to send verification email via SMTP:', err);
      }
    }

    // Fallback logging for local testing / when SMTP is not configured
    console.log(`[EMAIL DISPATCH] Verification link for ${options.to}: ${verificationUrl}`);
    return true;
  }

  async sendPasswordResetEmail(options: {
    to: string;
    displayName: string;
    token: string;
    locale?: string;
  }): Promise<boolean> {
    const locale = options.locale || 'en';
    const t = getEmailTranslations(locale).passwordReset;
    const baseUrl = config.appUrl.replace(/\/+$/, '');
    const resetUrl = `${baseUrl}/teacher/${locale}/auth/forgot-password?token=${encodeURIComponent(options.token)}`;

    const text = `${t.greeting} ${options.displayName},\n\n${t.body}\n\n${resetUrl}\n\n${t.warning}\n\n${t.disregard}\n\n${t.signoff}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #ea580c; margin-top: 0;">${t.headline}</h2>
        <p>${t.greeting} <strong>${options.displayName}</strong>,</p>
        <p>${t.body}</p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${t.button}</a>
        </div>
        <p style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 12px; font-size: 13px; color: #9a3412;">
          ${t.warning}
        </p>
        <p style="font-size: 14px; color: #64748b; margin-top: 20px;">${t.fallbackLink}</p>
        <p style="font-size: 13px; color: #0284c7; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">${t.disregard}</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.smtp.from,
          to: options.to,
          subject: t.subject,
          text,
          html,
        });
        return true;
      } catch (err) {
        console.error('Failed to send password reset email via SMTP:', err);
      }
    }

    // Fallback logging for local testing / when SMTP is not configured
    console.log(`[EMAIL DISPATCH] Password reset link for ${options.to}: ${resetUrl}`);
    return true;
  }
}

let emailServiceInstance: EmailService = new NodeMailerEmailService();

export function getEmailService(): EmailService {
  return emailServiceInstance;
}

export function setEmailService(service: EmailService): void {
  emailServiceInstance = service;
}
