import { supabase } from '../lib/supabase';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface EmailProvider {
  sendEmail(payload: EmailPayload): Promise<void>;
}

export class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async sendEmail(payload: EmailPayload) {
    await this.provider.sendEmail(payload);
  }
}

export class SupabaseEmailProvider implements EmailProvider {
  private readonly defaultRecipient = import.meta.env.VITE_EMAIL_TO || 'oakcherrykraft@gmail.com';

  async sendEmail({ to, subject, body, from }: EmailPayload) {
    const recipient = to || this.defaultRecipient;
    const sender = from ?? (import.meta.env.VITE_EMAIL_FROM || 'no-reply@oakcherrykraft.com');

    const { error } = await supabase.functions.invoke('send-email', {
      body: JSON.stringify({
        to: recipient,
        subject,
        body,
        from: sender,
      }),
    });

    if (error) {
      throw error;
    }
  }
}

export const emailService = new EmailService(new SupabaseEmailProvider());
