import { Update, Start, Ctx } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { LinkTokenService } from './link-token.service';

@Update()
export class TelegramBotUpdate {
  private readonly logger = new Logger(TelegramBotUpdate.name);

  constructor(private readonly linkTokenService: LinkTokenService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    if (!ctx.chat) return;
    const chatId = String(ctx.chat.id);
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    const match = text.match(/^\/start(?:\s+(.+))?$/);
    const payload = match?.[1]?.trim();

    if (!payload) {
      await ctx.reply(
        'Привет! Это бот НГРС для уведомлений о рейсах и накладных.\n\n' +
        'Чтобы привязать бот к вашему аккаунту, откройте веб-админку и нажмите «Привязать Telegram» в профиле.',
      );
      return;
    }

    const result = await this.linkTokenService.linkChat(payload, chatId);
    await ctx.reply(result.message, { parse_mode: 'HTML' });

    if (result.success) {
      this.logger.log(`Linked chat ${chatId} to user ${result.userFullName}`);
    }
  }
}
