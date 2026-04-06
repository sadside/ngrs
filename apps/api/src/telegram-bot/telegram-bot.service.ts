import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Subscription } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService, SseEvent } from '../notifications/notifications.service';
import { LinkTokenService } from './link-token.service';
import { renderTripStatusMessage, TripForTemplate } from './templates/trip-status.template';
import { renderWaybillMessage, WaybillForTemplate } from './templates/waybill.template';
import { buildInlineKeyboard } from './templates/utils';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private subscription?: Subscription;
  private cleanupInterval?: NodeJS.Timeout;
  private readonly enabled: boolean;

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly linkTokenService: LinkTokenService,
    private readonly config: ConfigService,
  ) {
    this.enabled = !!this.config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.warn('TelegramBotService disabled (no token)');
      return;
    }

    this.subscription = this.notifications.getStream().subscribe((event) => {
      this.handleEvent(event).catch((err) =>
        this.logger.error('Failed to handle notification event', err),
      );
    });
    this.logger.log('Subscribed to notifications stream');

    // Background cleanup of expired link tokens every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.linkTokenService.cleanupExpired().catch((err) =>
        this.logger.error('Failed to cleanup expired link tokens', err),
      );
    }, 30 * 60 * 1000);
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }

  private async handleEvent(event: SseEvent): Promise<void> {
    switch (event.type) {
      case 'trip-status-changed':
        return this.sendTripStatusChanged(event.data);
      case 'waybill-submitted':
        return this.sendWaybillSubmitted(event.data);
      default:
        return;
    }
  }

  private async sendTripStatusChanged(data: { tripId: string }) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: data.tripId },
      include: {
        driver: true,
        vehicle: true,
        cargo: true,
        route: {
          include: { senderContractor: true, receiverContractor: true },
        },
      },
    });
    if (!trip) return;

    const recipients = await this.getAdminRecipients();
    if (recipients.length === 0) return;

    const message = renderTripStatusMessage(trip as unknown as TripForTemplate);
    const keyboard = buildInlineKeyboard('/trips');

    await Promise.allSettled(
      recipients.map((chatId) =>
        this.bot.telegram
          .sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
          })
          .catch((err) => this.handleSendError(err, chatId)),
      ),
    );
  }

  private async sendWaybillSubmitted(data: { waybillId: string }) {
    const waybill = await this.prisma.waybill.findUnique({
      where: { id: data.waybillId },
      include: {
        trip: {
          include: {
            route: {
              include: { senderContractor: true, receiverContractor: true },
            },
          },
        },
      },
    });
    if (!waybill) return;

    const recipients = await this.getAdminRecipients();
    if (recipients.length === 0) return;

    const message = renderWaybillMessage(waybill as unknown as WaybillForTemplate);
    const keyboard = buildInlineKeyboard('/waybills');

    await Promise.allSettled(
      recipients.map((chatId) =>
        this.bot.telegram
          .sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
          })
          .catch((err) => this.handleSendError(err, chatId)),
      ),
    );
  }

  private async getAdminRecipients(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
        status: 'ACTIVE',
        telegramChatId: { not: null },
      },
      select: { telegramChatId: true },
    });
    return users
      .map((u) => u.telegramChatId)
      .filter((id): id is string => id !== null);
  }

  private async handleSendError(err: unknown, chatId: string): Promise<void> {
    const e = err as { code?: number; description?: string; parameters?: { retry_after?: number } };
    if (e?.code === 403) {
      this.logger.warn(`Chat ${chatId} blocked bot, auto-unlinking`);
      await this.prisma.user
        .updateMany({
          where: { telegramChatId: chatId },
          data: { telegramChatId: null, telegramLinkedAt: null },
        })
        .catch((e2) => this.logger.error('Failed to auto-unlink', e2));
    } else if (e?.code === 400) {
      this.logger.error(`Telegram 400 for chat ${chatId}: ${e.description}`);
    } else if (e?.code === 429) {
      this.logger.warn(
        `Rate limited by Telegram, retry_after: ${e.parameters?.retry_after}`,
      );
    } else {
      this.logger.error(`Unexpected Telegram error for chat ${chatId}`, err);
    }
  }
}
