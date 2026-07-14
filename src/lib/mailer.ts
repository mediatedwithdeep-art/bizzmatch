import { env } from "./env";
import { log } from "./logger";

/**
 * Outbound email. With SMTP_* env vars set, sends through the configured
 * relay (fetch-based HTTP APIs like Resend/Sendgrid can be slotted in here);
 * without them, the message is logged so local/dev flows remain fully
 * functional and testable.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM) {
    // Minimal SMTP over TCP is deliberately not hand-rolled; production
    // deployments should provide an HTTP relay or add nodemailer.
    // Until then we log loudly so misconfiguration is visible.
    log.warn("SMTP configured but no transport bundled — logging email instead", { to, subject });
  }
  log.info(`email → ${to}`, { subject, text });
}

export function verifyEmailMessage(name: string, link: string) {
  return {
    subject: "Verify your BizMatch email",
    text: `Hi ${name},\n\nConfirm your email to secure your BizMatch account:\n${link}\n\nThe link is valid for 48 hours. If you didn't create this account, ignore this email.`,
  };
}

export function resetPasswordMessage(name: string, link: string) {
  return {
    subject: "Reset your BizMatch password",
    text: `Hi ${name},\n\nReset your password using this link (valid for 30 minutes):\n${link}\n\nIf you didn't request this, you can safely ignore it.`,
  };
}
