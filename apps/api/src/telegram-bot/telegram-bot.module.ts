import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LinkTokenService } from './link-token.service';
import { TelegramBotController } from './telegram-bot.controller';
import { TelegramBotUpdate } from './telegram-bot.update';

const logger = new Logger('TelegramBotModule');

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const token = config.get<string>('TELEGRAM_BOT_TOKEN');
        if (!token) {
          logger.warn(
            'TELEGRAM_BOT_TOKEN not set — Telegram bot disabled (API continues normally)',
          );
          return { token: 'disabled', launchOptions: false };
        }
        return {
          token,
          launchOptions: { allowedUpdates: ['message'] },
        };
      },
    }),
    PrismaModule,
    NotificationsModule,
  ],
  controllers: [TelegramBotController],
  providers: [LinkTokenService, TelegramBotUpdate],
  exports: [LinkTokenService],
})
export class TelegramBotModule {}
