import { Update, Start, Help, Command, On, Ctx } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { LinkTokenService } from './link-token.service';
import { renderTripsList } from './templates/trips-list.template';
import { renderWaybillsList } from './templates/waybills-list.template';
import { renderTodaySummary } from './templates/today-summary.template';

@Update()
export class TelegramBotUpdate {
  private readonly logger = new Logger(TelegramBotUpdate.name);

  private readonly notLinkedMessage =
    '⚠️ Вы не привязаны. Откройте веб-админку НГРС и нажмите «Привязать Telegram» в профиле.';

  private readonly roleLabels: Record<string, string> = {
    ADMIN: 'Руководитель',
    LOGIST: 'Логист',
    DRIVER: 'Водитель',
  };

  constructor(
    private readonly linkTokenService: LinkTokenService,
    private readonly prisma: PrismaService,
  ) {}

  private async getLinkedUser(ctx: Context) {
    if (!ctx.chat) return null;
    const chatId = String(ctx.chat.id);
    return this.prisma.user.findUnique({ where: { telegramChatId: chatId } });
  }

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

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    const message = [
      '🤖 <b>НГРС — Система управления перевозками</b>',
      '',
      'Доступные команды:',
      '',
      '/start — начать работу с ботом',
      '/status — показать информацию о привязке',
      '/trips — последние 5 рейсов',
      '/waybills — последние 5 накладных',
      '/today — сводка за сегодня',
      '/unlink — отвязать Telegram от аккаунта',
      '/help — показать это сообщение',
      '',
      'Для привязки бота к вашему аккаунту откройте веб-админку НГРС и нажмите «Привязать Telegram» в профиле.',
    ].join('\n');
    await ctx.reply(message, { parse_mode: 'HTML' });
  }

  @Command('status')
  async onStatus(@Ctx() ctx: Context) {
    const user = await this.getLinkedUser(ctx);
    if (!user) {
      await ctx.reply(this.notLinkedMessage);
      return;
    }

    const roleLabel = this.roleLabels[user.role] ?? user.role;
    const linkedAt = user.telegramLinkedAt
      ? user.telegramLinkedAt.toLocaleString('ru-RU', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })
      : 'неизвестно';
    const message = [
      `✅ Вы привязаны как <b>${user.fullName}</b>`,
      `Роль: ${roleLabel}`,
      `Привязка активна с ${linkedAt}`,
    ].join('\n');
    await ctx.reply(message, { parse_mode: 'HTML' });
  }

  @Command('unlink')
  async onUnlink(@Ctx() ctx: Context) {
    const user = await this.getLinkedUser(ctx);
    if (!user) {
      await ctx.reply(this.notLinkedMessage);
      return;
    }

    await this.linkTokenService.unlink(user.id);
    await ctx.reply(
      '🔓 Вы отвязали Telegram от аккаунта НГРС. Уведомления приходить больше не будут.\n\n' +
      'Чтобы снова привязать — сгенерируйте новую ссылку в веб-админке.',
    );
  }

  @Command('trips')
  async onTrips(@Ctx() ctx: Context) {
    const user = await this.getLinkedUser(ctx);
    if (!user) {
      await ctx.reply(this.notLinkedMessage);
      return;
    }
    if (user.role !== 'ADMIN') {
      await ctx.reply('⚠️ Эта команда доступна только руководителям.');
      return;
    }

    const trips = await this.prisma.trip.findMany({
      orderBy: { assignedAt: 'desc' },
      take: 5,
      include: {
        driver: true,
        vehicle: true,
        route: {
          include: { senderContractor: true, receiverContractor: true },
        },
      },
    });

    await ctx.reply(renderTripsList(trips as any), { parse_mode: 'HTML' });
  }

  @Command('waybills')
  async onWaybills(@Ctx() ctx: Context) {
    const user = await this.getLinkedUser(ctx);
    if (!user) {
      await ctx.reply(this.notLinkedMessage);
      return;
    }
    if (user.role !== 'ADMIN') {
      await ctx.reply('⚠️ Эта команда доступна только руководителям.');
      return;
    }

    const waybills = await this.prisma.waybill.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 5,
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

    await ctx.reply(renderWaybillsList(waybills as any), { parse_mode: 'HTML' });
  }

  @Command('today')
  async onToday(@Ctx() ctx: Context) {
    const user = await this.getLinkedUser(ctx);
    if (!user) {
      await ctx.reply(this.notLinkedMessage);
      return;
    }
    if (user.role !== 'ADMIN') {
      await ctx.reply('⚠️ Эта команда доступна только руководителям.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const IN_ROUTE_STATUSES = [
      'EN_ROUTE_TO_LOADING', 'LOADING', 'EN_ROUTE_TO_UNLOADING', 'UNLOADING',
    ];

    const [assigned, completed, inRoute, waybillsAgg, activeDrivers] = await Promise.all([
      this.prisma.trip.count({ where: { assignedAt: { gte: today, lt: tomorrow } } }),
      this.prisma.trip.count({ where: { status: 'COMPLETED', completedAt: { gte: today, lt: tomorrow } } }),
      this.prisma.trip.count({ where: { status: { in: IN_ROUTE_STATUSES as any } } }),
      this.prisma.waybill.aggregate({
        where: { submittedAt: { gte: today, lt: tomorrow } },
        _count: true,
        _sum: { weight: true },
      }),
      this.prisma.user.count({ where: { role: 'DRIVER', status: 'ACTIVE' } }),
    ]);

    const message = renderTodaySummary({
      date: today,
      assigned,
      completed,
      inRoute,
      waybillsCount: waybillsAgg._count,
      totalWeight: Number(waybillsAgg._sum.weight ?? 0),
      activeDrivers,
    });

    await ctx.reply(message, { parse_mode: 'HTML' });
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const message = ctx.message;
    const text = message && 'text' in message ? message.text : '';
    if (!text) return;
    if (text.startsWith('/')) {
      await ctx.reply('⚠️ Неизвестная команда. Наберите /help чтобы увидеть список доступных команд.');
    } else {
      await ctx.reply('Я не понимаю обычные сообщения. Наберите /help чтобы увидеть доступные команды.');
    }
  }
}
