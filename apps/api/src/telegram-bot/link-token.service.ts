import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const TOKEN_TTL_MINUTES = 15;

export interface LinkChatResult {
  success: boolean;
  message: string;
  userFullName?: string;
  userRole?: string;
}

@Injectable()
export class LinkTokenService {
  private readonly logger = new Logger(LinkTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async generateToken(
    userId: string,
  ): Promise<{ token: string; deepLink: string; expiresAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    });
    if (user?.telegramChatId) {
      throw new ConflictException('Telegram уже привязан к этому аккаунту');
    }

    const token = randomBytes(18).toString('base64url');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

    await this.prisma.telegramLinkToken.create({
      data: { token, userId, expiresAt },
    });

    const botUsername =
      this.config.get<string>('TELEGRAM_BOT_USERNAME') ?? 'YourBot';
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return { token, deepLink, expiresAt };
  }

  async linkChat(token: string, chatId: string): Promise<LinkChatResult> {
    const record = await this.prisma.telegramLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return {
        success: false,
        message: '⚠️ Ссылка недействительна. Сгенерируйте новую в веб-админке.',
      };
    }
    if (record.expiresAt < new Date()) {
      return {
        success: false,
        message:
          '⚠️ Ссылка просрочена (срок 15 минут). Сгенерируйте новую в веб-админке.',
      };
    }
    if (record.usedAt) {
      return { success: false, message: '⚠️ Ссылка уже использована.' };
    }

    const existingLink = await this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });
    if (existingLink && existingLink.id !== record.userId) {
      return {
        success: false,
        message:
          '⚠️ Этот Telegram уже привязан к другому аккаунту. Используйте /unlink сначала.',
      };
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { telegramChatId: chatId, telegramLinkedAt: new Date() },
      }),
      this.prisma.telegramLinkToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    const roleLabel =
      record.user.role === 'ADMIN' ? 'Руководитель' : record.user.role;
    return {
      success: true,
      message:
        `✅ Готово! Вы привязаны как <b>${record.user.fullName}</b> (${roleLabel}).\n\n` +
        `Теперь вы будете получать уведомления. Наберите /help для списка команд.`,
      userFullName: record.user.fullName,
      userRole: record.user.role,
    };
  }

  async unlink(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: null, telegramLinkedAt: null },
    });
  }

  async unlinkByChatId(chatId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });
    if (!user) return null;
    await this.unlink(user.id);
    return user.fullName;
  }

  async cleanupExpired(): Promise<void> {
    const { count } = await this.prisma.telegramLinkToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired link tokens`);
    }
  }
}
