import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend :Resend;

  constructor(private readonly configService: ConfigService){
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  private readonly logger = new Logger(MailService.name);

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }) {

    try {

      await this.resend.emails.send({
        from: this.configService.get<string>('MAIL_FROM')!,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent to ${options.to}`);

    } catch (error) {

      this.logger.error('Email failed', error);

    }
  }
}