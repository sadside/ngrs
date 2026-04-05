# Group E2 — Telegram Bot for Manager + Project Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Telegram bot that notifies ADMIN about trip status changes and waybill submissions, supports read-only commands (`/trips`, `/waybills`, `/today`, `/status`, `/help`, `/unlink`), links via deep-link token from the web admin UI. Then rename the project from "Iridium" to "НГРС".

**Architecture:** New `TelegramBotModule` in NestJS backend using `nestjs-telegraf` in polling mode. Subscribes to the existing `NotificationsService` RxJS stream (via `getStream()` method that already exists). Enriches events with Prisma queries at send time. Sends HTML-formatted messages with inline keyboards to linked ADMIN users. Link flow: web admin generates 15-min token, user scans QR → bot matches token → saves `telegramChatId` on User. Rename happens last, after bot is verified working.

**Tech Stack:** NestJS + Prisma + PostgreSQL backend, `nestjs-telegraf` + `telegraf`, React + Vite + TanStack Query frontend, `qrcode.react` for link dialog.

**Spec:** `docs/superpowers/specs/2026-04-06-group-e2-telegram-bot-design.md`

**Build commands:**
- Backend: `pnpm --filter @iridium/api run build` (or `@ngrs/api` after rename)
- Frontend: `pnpm web:build`
- Migration: `pnpm db:migrate`

**Important pre-existing code facts discovered during planning:**
- `NotificationsService` already exposes `getStream(): Observable<SseEvent>` — no need to add a new `events$` getter like the spec suggested. Bot subscribes via `getStream()`.
- `@iridium/shared` package exists at `packages/shared/` and exports enums (`UserRole`, `TripStatus`, etc.). Used by both apps via `workspace:*`. Must be renamed during the rename tasks.
- Trip emission payload: `{ tripId, status, driverName }` (trips.service.ts:116).
- Waybill emission payload: `{ waybillId, ttnNumber, driverName, weight, loadWeight }` (waybills.service.ts:98).
- Both payloads will be re-fetched and enriched in the bot (minimum fields in payload is fine).
- `auth.service.ts` `getMe()` uses explicit `select` — must be updated to include `telegramChatId` and `telegramLinkedAt`.
- `TRIP_STATUS_LABELS` lives in `apps/web/src/shared/config/constants.ts` (frontend only). Bot will duplicate the label map in its own template file — short, rarely changes.

---

## Task 1: Add dependencies and env vars

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Install nestjs-telegraf, telegraf, date-fns**

Run from repo root:
```bash
pnpm --filter @iridium/api add nestjs-telegraf telegraf date-fns
```

Verify the three packages appear in `apps/api/package.json` dependencies.

- [ ] **Step 2: Add Telegram env vars to `.env.example`**

Append to `apps/api/.env.example`:

```
# ===== Telegram Bot =====
# From @BotFather. Leave empty to disable the bot (API starts normally, commands/notifications are no-ops).
TELEGRAM_BOT_TOKEN=

# Without @, used for deep link URLs in the web admin link dialog. Example: NgrsTmsBot
TELEGRAM_BOT_USERNAME=

# polling | webhook. Reserved for future; only "polling" is wired in this group.
TELEGRAM_BOT_MODE=polling

# Base URL for inline keyboard "Открыть в веб-админке" links. Example: https://ngrs.example.com
WEB_ADMIN_URL=http://localhost:5173
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS. The new deps are imported nowhere yet.

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json apps/api/.env.example pnpm-lock.yaml
git commit -m "feat(telegram): add nestjs-telegraf + telegraf + date-fns deps and env vars"
```

---

## Task 2: Prisma schema changes + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add telegramChatId and telegramLinkedAt to User model**

In `apps/api/prisma/schema.prisma`, find the `User` model and add two new fields. Also add the reverse relation for link tokens.

Find the `model User { ... }` block. Add inside it, before the closing `}`:

```prisma
  telegramChatId     String?             @unique
  telegramLinkedAt   DateTime?
  telegramLinkTokens TelegramLinkToken[]
```

- [ ] **Step 2: Add TelegramLinkToken model**

Append after the last existing model in `schema.prisma`:

```prisma
model TelegramLinkToken {
  token     String    @id
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())
  expiresAt DateTime
  usedAt    DateTime?

  @@index([expiresAt])
  @@map("telegram_link_tokens")
}
```

- [ ] **Step 3: Run migration**

```bash
pnpm db:migrate
```

When Prisma prompts for migration name, enter: `telegram_bot_integration`

Expected: new migration folder under `apps/api/prisma/migrations/<timestamp>_telegram_bot_integration/` with a `migration.sql` that adds two nullable columns to `users` and creates `telegram_link_tokens` table.

- [ ] **Step 4: Verify Prisma client regenerated**

```bash
pnpm --filter @iridium/api run db:generate
```

Expected: no errors. The new fields/models are available in the generated Prisma client types.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(telegram): add User.telegramChatId/LinkedAt + TelegramLinkToken model"
```

---

## Task 3: TelegramBotModule skeleton with graceful fallback

**Files:**
- Create: `apps/api/src/telegram-bot/telegram-bot.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create the module file**

Create `apps/api/src/telegram-bot/telegram-bot.module.ts`:

```ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

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
  controllers: [],
  providers: [],
})
export class TelegramBotModule {}
```

Empty `controllers` and `providers` — will be filled by later tasks. This task just establishes the module can load.

- [ ] **Step 2: Register module in app.module.ts**

In `apps/api/src/app.module.ts`, add the import and include in the `imports` array:

```ts
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
```

Add `TelegramBotModule` to the `imports` array, after `WaybillsModule`:

```ts
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    ContractorsModule,
    CargosModule,
    RoutesModule,
    TripsModule,
    WaybillsModule,
    TelegramBotModule,
  ],
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 4: Verify graceful fallback works**

Start the API without setting `TELEGRAM_BOT_TOKEN`:
```bash
pnpm api:dev
```
Expected in logs:
```
[TelegramBotModule] TELEGRAM_BOT_TOKEN not set — Telegram bot disabled (API continues normally)
```
The API must start normally and respond to requests. Ctrl+C to stop.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/telegram-bot/telegram-bot.module.ts apps/api/src/app.module.ts
git commit -m "feat(telegram): add TelegramBotModule skeleton with graceful fallback"
```

---

## Task 4: LinkTokenService + link/unlink REST endpoints

**Files:**
- Create: `apps/api/src/telegram-bot/link-token.service.ts`
- Create: `apps/api/src/telegram-bot/telegram-bot.controller.ts`
- Create: `apps/api/src/telegram-bot/dto/link-token-response.dto.ts`
- Modify: `apps/api/src/telegram-bot/telegram-bot.module.ts`

- [ ] **Step 1: Create the response DTO**

Create `apps/api/src/telegram-bot/dto/link-token-response.dto.ts`:

```ts
export class LinkTokenResponseDto {
  token!: string;
  deepLink!: string;
  expiresAt!: Date;
}
```

- [ ] **Step 2: Create LinkTokenService**

Create `apps/api/src/telegram-bot/link-token.service.ts`:

```ts
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

  async generateToken(userId: string): Promise<{ token: string; deepLink: string; expiresAt: Date }> {
    // Ensure not already linked
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

    const botUsername = this.config.get<string>('TELEGRAM_BOT_USERNAME') ?? 'YourBot';
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return { token, deepLink, expiresAt };
  }

  async linkChat(token: string, chatId: string): Promise<LinkChatResult> {
    const record = await this.prisma.telegramLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return { success: false, message: '⚠️ Ссылка недействительна. Сгенерируйте новую в веб-админке.' };
    }
    if (record.expiresAt < new Date()) {
      return { success: false, message: '⚠️ Ссылка просрочена (срок 15 минут). Сгенерируйте новую в веб-админке.' };
    }
    if (record.usedAt) {
      return { success: false, message: '⚠️ Ссылка уже использована.' };
    }

    // Check if this chat is already linked to a different user
    const existingLink = await this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
    });
    if (existingLink && existingLink.id !== record.userId) {
      return {
        success: false,
        message: '⚠️ Этот Telegram уже привязан к другому аккаунту. Используйте /unlink сначала.',
      };
    }

    // Link + mark token used
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

    return {
      success: true,
      message: `✅ Готово! Вы привязаны как <b>${record.user.fullName}</b> (${record.user.role === 'ADMIN' ? 'Руководитель' : record.user.role}).\n\nТеперь вы будете получать уведомления. Наберите /help для списка команд.`,
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
    const user = await this.prisma.user.findUnique({ where: { telegramChatId: chatId } });
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
```

- [ ] **Step 3: Create the controller**

Create `apps/api/src/telegram-bot/telegram-bot.controller.ts`:

```ts
import { Controller, Post, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LinkTokenService } from './link-token.service';
import { LinkTokenResponseDto } from './dto/link-token-response.dto';

@ApiTags('Telegram Bot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telegram-bot')
export class TelegramBotController {
  constructor(private readonly linkTokenService: LinkTokenService) {}

  @Post('link-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate one-time link token for Telegram deep link' })
  async generateLinkToken(@Req() req: any): Promise<LinkTokenResponseDto> {
    const userId = req.user.sub ?? req.user.id;
    return this.linkTokenService.generateToken(userId);
  }

  @Delete('link')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Unlink Telegram from current user account' })
  async unlink(@Req() req: any): Promise<{ ok: true }> {
    const userId = req.user.sub ?? req.user.id;
    await this.linkTokenService.unlink(userId);
    return { ok: true };
  }
}
```

Note: the `@Req() req: any` + `req.user.sub` pattern matches how existing controllers in the project extract the JWT payload. If the project has a `@CurrentUser()` decorator, use that instead (grep `CurrentUser` in `apps/api/src/auth/` to confirm; if found, swap `Req` for it).

- [ ] **Step 4: Wire into TelegramBotModule**

In `apps/api/src/telegram-bot/telegram-bot.module.ts`, add imports and register the service + controller:

```ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LinkTokenService } from './link-token.service';
import { TelegramBotController } from './telegram-bot.controller';

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
  providers: [LinkTokenService],
  exports: [LinkTokenService],
})
export class TelegramBotModule {}
```

- [ ] **Step 5: Update auth.service.getMe to include telegram fields**

In `apps/api/src/auth/auth.service.ts`, modify the `getMe` method's `select` block:

```ts
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        telegramChatId: true,
        telegramLinkedAt: true,
      },
    });
    return user;
  }
```

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/telegram-bot/ apps/api/src/auth/auth.service.ts
git commit -m "feat(telegram): link token service + REST endpoints for generate/unlink"
```

---

## Task 5: Bot /start handler with token linking

**Files:**
- Create: `apps/api/src/telegram-bot/telegram-bot.update.ts`
- Modify: `apps/api/src/telegram-bot/telegram-bot.module.ts`

- [ ] **Step 1: Create the Update class with /start handler**

Create `apps/api/src/telegram-bot/telegram-bot.update.ts`:

```ts
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
    const chatId = String(ctx.chat!.id);
    const text = (ctx.message as any)?.text ?? '';
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
```

- [ ] **Step 2: Register the update in TelegramBotModule**

In `apps/api/src/telegram-bot/telegram-bot.module.ts`, add `TelegramBotUpdate` to providers:

```ts
import { TelegramBotUpdate } from './telegram-bot.update';
```

Inside the `@Module` decorator:
```ts
  providers: [LinkTokenService, TelegramBotUpdate],
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/telegram-bot/telegram-bot.update.ts apps/api/src/telegram-bot/telegram-bot.module.ts
git commit -m "feat(telegram): /start handler with deep link token processing"
```

---

## Task 6: Web link dialog + user-popover integration

**Files:**
- Create: `apps/web/src/features/link-telegram/api.ts`
- Create: `apps/web/src/features/link-telegram/ui.tsx`
- Create: `apps/web/src/features/link-telegram/index.ts`
- Modify: `apps/web/src/entities/session/api.ts`
- Modify: `apps/web/src/shared/ui/user-popover.tsx`

- [ ] **Step 1: Install qrcode.react**

```bash
pnpm --filter @iridium/web add qrcode.react
```

Verify it appears in `apps/web/package.json`.

- [ ] **Step 2: Extend User type with telegram fields**

In `apps/web/src/entities/session/api.ts`, update the `User` interface:

```ts
export interface User {
  id: string;
  login: string;
  fullName: string;
  phone: string | null;
  role: 'ADMIN' | 'LOGIST' | 'DRIVER';
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  telegramChatId: string | null;
  telegramLinkedAt: string | null;
}
```

- [ ] **Step 3: Create link-telegram API hooks**

Create `apps/web/src/features/link-telegram/api.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';

export interface LinkTokenResponse {
  token: string;
  deepLink: string;
  expiresAt: string;
}

export function useGenerateLinkToken() {
  return useMutation({
    mutationFn: async (): Promise<LinkTokenResponse> => {
      const res = await api.post<LinkTokenResponse>('/telegram-bot/link-token');
      return res.data;
    },
  });
}

export function useUnlinkTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.delete('/telegram-bot/link');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', 'me'] }),
  });
}
```

- [ ] **Step 4: Create the dialog component**

Create `apps/web/src/features/link-telegram/ui.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle } from '@phosphor-icons/react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from '@/shared/ui/responsive-dialog';
import { Button } from '@/shared/ui/button';
import { getMeFn } from '@/entities/session/api';
import { useGenerateLinkToken } from './api';

interface LinkTelegramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkTelegramDialog({ open, onOpenChange }: LinkTelegramDialogProps) {
  const qc = useQueryClient();
  const generate = useGenerateLinkToken();
  const [tokenData, setTokenData] = useState<{ deepLink: string; expiresAt: string } | null>(null);

  // Poll /auth/me every 3s while dialog open to detect linkage
  const { data: me } = useQuery({
    queryKey: ['session', 'me'],
    queryFn: getMeFn,
    enabled: open,
    refetchInterval: open ? 3000 : false,
  });

  // Generate token when dialog opens
  useEffect(() => {
    if (open && !tokenData) {
      generate.mutate(undefined, {
        onSuccess: (data) => setTokenData({ deepLink: data.deepLink, expiresAt: data.expiresAt }),
        onError: () => {
          toast.error('Не удалось создать ссылку');
          onOpenChange(false);
        },
      });
    }
    if (!open) {
      setTokenData(null);
    }
  }, [open]);

  // Close on success
  useEffect(() => {
    if (open && me?.telegramChatId) {
      toast.success('Telegram успешно привязан');
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ['session', 'me'] });
    }
  }, [open, me?.telegramChatId]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Привязка Telegram</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-4">
          {generate.isPending && (
            <p className="text-sm text-muted-foreground text-center py-8">Генерация ссылки…</p>
          )}
          {tokenData && (
            <>
              <div className="flex justify-center py-2">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={tokenData.deepLink} size={200} />
                </div>
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Отсканируйте QR-код телефоном или нажмите на ссылку ниже.</li>
                <li>В Telegram нажмите кнопку <b>START</b>.</li>
                <li>Бот отправит вам подтверждение.</li>
              </ol>
              <a
                href={tokenData.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-primary hover:underline break-all"
              >
                {tokenData.deepLink}
              </a>
              <p className="text-xs text-muted-foreground text-center">
                Ссылка действительна 15 минут.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                <CheckCircle size={16} className="text-muted-foreground" />
                Ожидание подтверждения…
              </div>
            </>
          )}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
```

- [ ] **Step 5: Barrel export**

Create `apps/web/src/features/link-telegram/index.ts`:

```ts
export { LinkTelegramDialog } from './ui';
export { useGenerateLinkToken, useUnlinkTelegram } from './api';
```

- [ ] **Step 6: Add link/unlink items to UserPopover**

Modify `apps/web/src/shared/ui/user-popover.tsx`. Add imports at the top:

```tsx
import { CaretDown, SignOut, TelegramLogo } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from 'sonner';
import { LinkTelegramDialog, useUnlinkTelegram } from '@/features/link-telegram';
```

Inside `UserPopover` component, after the existing `useState(false)` for `open`, add:

```tsx
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const unlink = useUnlinkTelegram();

  const handleUnlink = () => {
    unlink.mutate(undefined, {
      onSuccess: () => {
        toast.success('Telegram отвязан');
        setOpen(false);
      },
      onError: () => toast.error('Не удалось отвязать'),
    });
  };
```

Inside the popover content (after the role badge div, before the logout Button), add the Telegram link/unlink button for ADMIN users only:

```tsx
            {user.role === 'ADMIN' && !user.telegramChatId && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => { setLinkDialogOpen(true); setOpen(false); }}
              >
                <TelegramLogo size={16} weight="fill" />
                Привязать Telegram
              </Button>
            )}
            {user.role === 'ADMIN' && user.telegramChatId && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleUnlink}
              >
                <TelegramLogo size={16} weight="fill" />
                Отвязать Telegram
              </Button>
            )}
```

At the very end of the component return, BEFORE the closing `</div>` of the outer `relative` div, mount the dialog as a sibling:

```tsx
      <LinkTelegramDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
    </div>
```

- [ ] **Step 7: Typecheck**

```bash
pnpm web:build
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/features/link-telegram apps/web/src/entities/session/api.ts apps/web/src/shared/ui/user-popover.tsx apps/web/package.json pnpm-lock.yaml
git commit -m "feat(telegram): web link dialog with QR code and user-popover integration"
```

---

## Task 7: Notification dispatch — subscription, enrichment, templates

**Files:**
- Create: `apps/api/src/telegram-bot/templates/utils.ts`
- Create: `apps/api/src/telegram-bot/templates/trip-status.template.ts`
- Create: `apps/api/src/telegram-bot/templates/waybill.template.ts`
- Create: `apps/api/src/telegram-bot/telegram-bot.service.ts`
- Modify: `apps/api/src/telegram-bot/telegram-bot.module.ts`

- [ ] **Step 1: Create shared template utils**

Create `apps/api/src/telegram-bot/templates/utils.ts`:

```ts
export function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildInlineKeyboard(path: string) {
  const webUrl = process.env.WEB_ADMIN_URL ?? 'http://localhost:5173';
  return {
    inline_keyboard: [[
      { text: '🔗 Открыть в веб-админке', url: `${webUrl}${path}` },
    ]],
  };
}
```

- [ ] **Step 2: Create trip status template**

Create `apps/api/src/telegram-bot/templates/trip-status.template.ts`:

```ts
import { escapeHtml, formatDateTime } from './utils';

// Label map duplicated from apps/web/src/shared/config/constants.ts — backend has no shared UI constants.
// Keep in sync if the frontend map changes.
const TRIP_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Назначен',
  EN_ROUTE_TO_LOADING: 'Едет на погрузку',
  LOADING: 'На погрузке',
  EN_ROUTE_TO_UNLOADING: 'Едет на выгрузку',
  UNLOADING: 'На выгрузке',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const STATUS_EMOJI: Record<string, string> = {
  ASSIGNED: '📋',
  EN_ROUTE_TO_LOADING: '🚚',
  LOADING: '⚙️',
  EN_ROUTE_TO_UNLOADING: '🚛',
  UNLOADING: '📦',
  COMPLETED: '✅',
  CANCELLED: '❌',
};

export interface TripForTemplate {
  id: string;
  status: string;
  driver: { fullName: string };
  vehicle: { brand: string; licensePlate: string };
  cargo: { name: string };
  route: {
    senderContractor: { name: string };
    receiverContractor: { name: string };
  };
}

export function renderTripStatusMessage(trip: TripForTemplate): string {
  const emoji = STATUS_EMOJI[trip.status] ?? '🚚';
  const statusLabel = TRIP_STATUS_LABELS[trip.status] ?? trip.status;

  return [
    `${emoji} <b>Изменение статуса рейса</b>`,
    ``,
    `<b>Водитель:</b> ${escapeHtml(trip.driver.fullName)}`,
    `<b>Маршрут:</b> ${escapeHtml(trip.route.senderContractor.name)} → ${escapeHtml(trip.route.receiverContractor.name)}`,
    `<b>ТС:</b> ${escapeHtml(trip.vehicle.brand)} ${escapeHtml(trip.vehicle.licensePlate)}`,
    `<b>Груз:</b> ${escapeHtml(trip.cargo.name)}`,
    `<b>Статус:</b> ${statusLabel}`,
    `<b>Время:</b> ${formatDateTime(new Date())}`,
  ].join('\n');
}
```

- [ ] **Step 3: Create waybill template**

Create `apps/api/src/telegram-bot/templates/waybill.template.ts`:

```ts
import { escapeHtml, formatDateTime } from './utils';

export interface WaybillForTemplate {
  id: string;
  ttnNumber: string;
  driverFullName: string;
  weight: any; // Prisma Decimal
  loadWeight: any;
  submittedAt: Date;
  trip: {
    route: {
      senderContractor: { name: string };
      receiverContractor: { name: string };
    };
  };
}

export function renderWaybillMessage(waybill: WaybillForTemplate): string {
  return [
    `📄 <b>Новая накладная</b>`,
    ``,
    `<b>ТТН:</b> ${escapeHtml(waybill.ttnNumber)}`,
    `<b>Водитель:</b> ${escapeHtml(waybill.driverFullName)}`,
    `<b>Маршрут:</b> ${escapeHtml(waybill.trip.route.senderContractor.name)} → ${escapeHtml(waybill.trip.route.receiverContractor.name)}`,
    `<b>Вес брутто:</b> ${Number(waybill.weight).toFixed(2)} т`,
    `<b>Вес нетто:</b> ${Number(waybill.loadWeight).toFixed(2)} т`,
    `<b>Время:</b> ${formatDateTime(waybill.submittedAt)}`,
  ].join('\n');
}
```

- [ ] **Step 4: Create TelegramBotService**

Create `apps/api/src/telegram-bot/telegram-bot.service.ts`:

```ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Subscription } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService, SseEvent } from '../notifications/notifications.service';
import { LinkTokenService } from './link-token.service';
import { renderTripStatusMessage } from './templates/trip-status.template';
import { renderWaybillMessage } from './templates/waybill.template';
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

    // Subscribe to notifications stream
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

  private async sendTripStatusChanged(data: { tripId: string; status: string; driverName: string }) {
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

    const message = renderTripStatusMessage(trip as any);
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

    const message = renderWaybillMessage(waybill as any);
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
    return users.map((u) => u.telegramChatId!).filter(Boolean);
  }

  private async handleSendError(err: any, chatId: string): Promise<void> {
    if (err?.code === 403) {
      this.logger.warn(`Chat ${chatId} blocked bot, auto-unlinking`);
      await this.prisma.user
        .updateMany({
          where: { telegramChatId: chatId },
          data: { telegramChatId: null, telegramLinkedAt: null },
        })
        .catch((e) => this.logger.error('Failed to auto-unlink', e));
    } else if (err?.code === 400) {
      this.logger.error(`Telegram 400 for chat ${chatId}: ${err.description}`);
    } else if (err?.code === 429) {
      this.logger.warn(
        `Rate limited by Telegram, retry_after: ${err.parameters?.retry_after}`,
      );
    } else {
      this.logger.error(`Unexpected Telegram error for chat ${chatId}`, err);
    }
  }
}
```

- [ ] **Step 5: Register service in module**

In `apps/api/src/telegram-bot/telegram-bot.module.ts`, add `TelegramBotService` to providers:

```ts
import { TelegramBotService } from './telegram-bot.service';
```

Update the providers array:
```ts
  providers: [LinkTokenService, TelegramBotUpdate, TelegramBotService],
```

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/telegram-bot/telegram-bot.service.ts apps/api/src/telegram-bot/templates apps/api/src/telegram-bot/telegram-bot.module.ts
git commit -m "feat(telegram): notification dispatch with enrichment + HTML templates"
```

---

## Task 8: Commands — /help, /status, /unlink

**Files:**
- Modify: `apps/api/src/telegram-bot/telegram-bot.update.ts`

- [ ] **Step 1: Add /help, /status, /unlink handlers**

In `apps/api/src/telegram-bot/telegram-bot.update.ts`, add the Help, Command decorators import at the top:

```ts
import { Update, Start, Help, Command, Ctx } from 'nestjs-telegraf';
```

Inject `PrismaService` into the constructor. Update imports and constructor:

```ts
import { PrismaService } from '../prisma/prisma.service';

// ...

constructor(
  private readonly linkTokenService: LinkTokenService,
  private readonly prisma: PrismaService,
) {}
```

Add helper method inside the class:

```ts
  private async getLinkedUser(ctx: Context) {
    const chatId = String(ctx.chat!.id);
    return this.prisma.user.findUnique({ where: { telegramChatId: chatId } });
  }

  private readonly notLinkedMessage =
    '⚠️ Вы не привязаны. Откройте веб-админку НГРС и нажмите «Привязать Telegram» в профиле.';

  private readonly roleLabels: Record<string, string> = {
    ADMIN: 'Руководитель',
    LOGIST: 'Логист',
    DRIVER: 'Водитель',
  };
```

Add handlers after the existing `onStart`:

```ts
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
      return ctx.reply(this.notLinkedMessage);
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
      return ctx.reply(this.notLinkedMessage);
    }
    await this.linkTokenService.unlink(user.id);
    await ctx.reply(
      '🔓 Вы отвязали Telegram от аккаунта НГРС. Уведомления приходить больше не будут.\n\n' +
      'Чтобы снова привязать — сгенерируйте новую ссылку в веб-админке.',
    );
  }
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/telegram-bot/telegram-bot.update.ts
git commit -m "feat(telegram): /help /status /unlink commands"
```

---

## Task 9: Commands — /trips, /waybills

**Files:**
- Create: `apps/api/src/telegram-bot/templates/trips-list.template.ts`
- Create: `apps/api/src/telegram-bot/templates/waybills-list.template.ts`
- Modify: `apps/api/src/telegram-bot/telegram-bot.update.ts`

- [ ] **Step 1: Create trips list template**

Create `apps/api/src/telegram-bot/templates/trips-list.template.ts`:

```ts
import { escapeHtml, formatDateTime } from './utils';

const TRIP_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Назначен',
  EN_ROUTE_TO_LOADING: 'Едет на погрузку',
  LOADING: 'На погрузке',
  EN_ROUTE_TO_UNLOADING: 'Едет на выгрузку',
  UNLOADING: 'На выгрузке',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const STATUS_EMOJI: Record<string, string> = {
  ASSIGNED: '📋',
  EN_ROUTE_TO_LOADING: '🚚',
  LOADING: '⚙️',
  EN_ROUTE_TO_UNLOADING: '🚛',
  UNLOADING: '📦',
  COMPLETED: '✅',
  CANCELLED: '❌',
};

export interface TripListItem {
  id: string;
  status: string;
  assignedAt: Date;
  driver: { fullName: string };
  vehicle: { licensePlate: string };
  route: {
    senderContractor: { name: string };
    receiverContractor: { name: string };
  };
}

export function renderTripsList(trips: TripListItem[]): string {
  if (trips.length === 0) return 'Нет рейсов.';

  const lines = [`🚚 <b>Последние ${trips.length} рейсов</b>`, ''];
  trips.forEach((trip, i) => {
    const emoji = STATUS_EMOJI[trip.status] ?? '🚚';
    const status = TRIP_STATUS_LABELS[trip.status] ?? trip.status;
    lines.push(
      `${i + 1}. ${emoji} ${status} — ${escapeHtml(trip.driver.fullName)}`,
      `   ${escapeHtml(trip.route.senderContractor.name)} → ${escapeHtml(trip.route.receiverContractor.name)}`,
      `   ТС: ${escapeHtml(trip.vehicle.licensePlate)} · ${formatDateTime(trip.assignedAt)}`,
      '',
    );
  });
  return lines.join('\n').trimEnd();
}
```

- [ ] **Step 2: Create waybills list template**

Create `apps/api/src/telegram-bot/templates/waybills-list.template.ts`:

```ts
import { escapeHtml, formatDateTime } from './utils';

export interface WaybillListItem {
  id: string;
  ttnNumber: string;
  driverFullName: string;
  weight: any;
  loadWeight: any;
  submittedAt: Date;
  trip: {
    route: {
      senderContractor: { name: string };
      receiverContractor: { name: string };
    };
  };
}

export function renderWaybillsList(waybills: WaybillListItem[]): string {
  if (waybills.length === 0) return 'Нет накладных.';

  const lines = [`📄 <b>Последние ${waybills.length} накладных</b>`, ''];
  waybills.forEach((wb, i) => {
    lines.push(
      `${i + 1}. ТТН ${escapeHtml(wb.ttnNumber)} — ${escapeHtml(wb.driverFullName)}`,
      `   ${escapeHtml(wb.trip.route.senderContractor.name)} → ${escapeHtml(wb.trip.route.receiverContractor.name)}`,
      `   Вес: ${Number(wb.weight).toFixed(2)} т · ${formatDateTime(wb.submittedAt)}`,
      '',
    );
  });
  return lines.join('\n').trimEnd();
}
```

- [ ] **Step 3: Add /trips and /waybills handlers**

In `apps/api/src/telegram-bot/telegram-bot.update.ts`, add imports:

```ts
import { renderTripsList } from './templates/trips-list.template';
import { renderWaybillsList } from './templates/waybills-list.template';
```

Add these handler methods inside the class, after `onUnlink`:

```ts
  @Command('trips')
  async onTrips(@Ctx() ctx: Context) {
    const user = await this.getLinkedUser(ctx);
    if (!user) return ctx.reply(this.notLinkedMessage);
    if (user.role !== 'ADMIN') {
      return ctx.reply('⚠️ Эта команда доступна только руководителям.');
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
    if (!user) return ctx.reply(this.notLinkedMessage);
    if (user.role !== 'ADMIN') {
      return ctx.reply('⚠️ Эта команда доступна только руководителям.');
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
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/telegram-bot/templates/trips-list.template.ts apps/api/src/telegram-bot/templates/waybills-list.template.ts apps/api/src/telegram-bot/telegram-bot.update.ts
git commit -m "feat(telegram): /trips and /waybills commands with list templates"
```

---

## Task 10: Command /today + unknown input catch-all

**Files:**
- Create: `apps/api/src/telegram-bot/templates/today-summary.template.ts`
- Modify: `apps/api/src/telegram-bot/telegram-bot.update.ts`

- [ ] **Step 1: Create today summary template**

Create `apps/api/src/telegram-bot/templates/today-summary.template.ts`:

```ts
import { formatDateTime } from './utils';

export interface TodaySummary {
  date: Date;
  assigned: number;
  completed: number;
  inRoute: number;
  waybillsCount: number;
  totalWeight: number;
  activeDrivers: number;
}

export function renderTodaySummary(summary: TodaySummary): string {
  const dateLabel = summary.date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return [
    `📊 <b>Сводка за ${dateLabel}</b>`,
    ``,
    `🚚 Назначено рейсов: ${summary.assigned}`,
    `✅ Завершено рейсов: ${summary.completed}`,
    `⏳ В пути: ${summary.inRoute}`,
    `📄 Накладных отправлено: ${summary.waybillsCount}`,
    `⚖️ Общий вес: ${summary.totalWeight.toFixed(2)} т`,
    ``,
    `Активных водителей: ${summary.activeDrivers}`,
  ].join('\n');
}
```

- [ ] **Step 2: Add /today and text catch-all handlers**

In `apps/api/src/telegram-bot/telegram-bot.update.ts`, add import:

```ts
import { Update, Start, Help, Command, On, Ctx } from 'nestjs-telegraf';
import { renderTodaySummary } from './templates/today-summary.template';
```

Add these methods inside the class, after `onWaybills`:

```ts
  @Command('today')
  async onToday(@Ctx() ctx: Context) {
    const user = await this.getLinkedUser(ctx);
    if (!user) return ctx.reply(this.notLinkedMessage);
    if (user.role !== 'ADMIN') {
      return ctx.reply('⚠️ Эта команда доступна только руководителям.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const IN_ROUTE_STATUSES = [
      'EN_ROUTE_TO_LOADING',
      'LOADING',
      'EN_ROUTE_TO_UNLOADING',
      'UNLOADING',
    ];

    const [assigned, completed, inRoute, waybillsAgg, activeDrivers] = await Promise.all([
      this.prisma.trip.count({
        where: { assignedAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.trip.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.trip.count({
        where: { status: { in: IN_ROUTE_STATUSES as any } },
      }),
      this.prisma.waybill.aggregate({
        where: { submittedAt: { gte: today, lt: tomorrow } },
        _count: true,
        _sum: { weight: true },
      }),
      this.prisma.user.count({
        where: { role: 'DRIVER', status: 'ACTIVE' },
      }),
    ]);

    const totalWeight = Number(waybillsAgg._sum.weight ?? 0);

    const message = renderTodaySummary({
      date: today,
      assigned,
      completed,
      inRoute,
      waybillsCount: waybillsAgg._count,
      totalWeight,
      activeDrivers,
    });

    await ctx.reply(message, { parse_mode: 'HTML' });
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const text = (ctx.message as any)?.text;
    if (!text) return;
    if (text.startsWith('/')) {
      // Any slash command not handled by above decorators
      await ctx.reply('⚠️ Неизвестная команда. Наберите /help чтобы увидеть список доступных команд.');
    } else {
      await ctx.reply('Я не понимаю обычные сообщения. Наберите /help чтобы увидеть доступные команды.');
    }
  }
```

Note: `@On('text')` is a catch-all that fires for any text message that wasn't matched by a more specific command decorator above it. Telegraf/nestjs-telegraf resolves decorators in declaration order, so `@Start`, `@Help`, and `@Command` handlers take priority; `@On('text')` only runs for unmatched text.

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @iridium/api run build
```
Expected: PASS.

- [ ] **Step 4: End-to-end manual verification with real bot**

Before committing, do a full manual smoke test with a dev Telegram bot:

1. Get a test bot token from @BotFather (separate from production)
2. Set in `apps/api/.env`:
   ```
   TELEGRAM_BOT_TOKEN=<test token>
   TELEGRAM_BOT_USERNAME=<test bot username>
   WEB_ADMIN_URL=http://localhost:5173
   ```
3. `pnpm api:dev` — confirm bot initializes in logs
4. `pnpm web:dev` — open web admin, login as ADMIN
5. Click profile → "Привязать Telegram" → scan QR or click deep link
6. Bot should reply "✅ Готово!"
7. Dialog auto-closes
8. In a separate driver session, change a trip status → Telegram message arrives
9. Test every command: `/help`, `/status`, `/trips`, `/waybills`, `/today`, `/unlink`
10. Test unknown input: send "hello" and `/foo`

If all pass, proceed to commit. If any fail, debug and fix inline.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/telegram-bot/templates/today-summary.template.ts apps/api/src/telegram-bot/telegram-bot.update.ts
git commit -m "feat(telegram): /today command with daily summary + unknown input catch-all"
```

---

## Task 11: Rename — package scopes @iridium/* → @ngrs/*

**Files:**
- Modify: `package.json` (root)
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Modify: `packages/shared/package.json`
- Modify: all `.ts`/`.tsx` files importing from `@iridium/shared`
- Modify: `apps/web/tsconfig.app.json` (if it has path aliases for @iridium/shared)
- Modify: `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json` (if they have path aliases)
- Regenerate: `pnpm-lock.yaml`, `node_modules/`

- [ ] **Step 1: Root package.json**

In `package.json` at repo root, change `name` and all script filters:

```json
{
  "name": "ngrs",
  "private": true,
  "scripts": {
    "api:dev": "pnpm --filter @ngrs/api run start:dev",
    "api:build": "pnpm --filter @ngrs/api run build",
    "db:migrate": "pnpm --filter @ngrs/api run db:migrate",
    "db:seed": "pnpm --filter @ngrs/api run db:seed",
    "db:studio": "pnpm --filter @ngrs/api run db:studio",
    "web:dev": "pnpm --filter @ngrs/web run dev",
    "web:build": "pnpm --filter @ngrs/web run build"
  },
  "pnpm": {
    "overrides": { "zod": "3.23.8" },
    "onlyBuiltDependencies": [
      "@nestjs/core", "@prisma/client", "@prisma/engines",
      "bcrypt", "esbuild", "prisma", "@scarf/scarf", "core-js-pure"
    ]
  }
}
```

- [ ] **Step 2: apps/api/package.json**

Change `"name": "@iridium/api"` → `"name": "@ngrs/api"`.

Change dependency `"@iridium/shared": "workspace:*"` → `"@ngrs/shared": "workspace:*"`.

- [ ] **Step 3: apps/web/package.json**

Change `"name": "@iridium/web"` → `"name": "@ngrs/web"`.

Change dependency `"@iridium/shared": "workspace:*"` → `"@ngrs/shared": "workspace:*"`.

- [ ] **Step 4: packages/shared/package.json**

Change `"name": "@iridium/shared"` → `"name": "@ngrs/shared"`.

- [ ] **Step 5: Rewrite TypeScript imports**

Run from repo root to find all references:

```bash
grep -rln "@iridium/shared" apps/api/src apps/web/src 2>/dev/null
```

For every file in the result, replace `from '@iridium/shared'` with `from '@ngrs/shared'`. Use sed for safety:

```bash
grep -rln "@iridium/shared" apps/api/src apps/web/src 2>/dev/null | xargs sed -i '' "s|from '@iridium/shared'|from '@ngrs/shared'|g"
```

On Linux (GNU sed) drop the `''` after `-i`:
```bash
grep -rln "@iridium/shared" apps/api/src apps/web/src 2>/dev/null | xargs sed -i "s|from '@iridium/shared'|from '@ngrs/shared'|g"
```

- [ ] **Step 6: Check and update tsconfig path aliases**

Check `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`, `apps/web/tsconfig.app.json`, and `apps/web/tsconfig.json` for any `"@iridium/shared": [...]` path aliases. Replace with `"@ngrs/shared": [...]` preserving the target path.

```bash
grep -rln '@iridium/shared' apps/api/tsconfig*.json apps/web/tsconfig*.json
```

For each match, open the file and replace `@iridium/shared` → `@ngrs/shared` in the `paths` object.

- [ ] **Step 7: Regenerate lockfile and reinstall**

```bash
rm -rf node_modules apps/api/node_modules apps/web/node_modules packages/shared/node_modules pnpm-lock.yaml
pnpm install
```

Expected: `pnpm install` completes successfully. New `pnpm-lock.yaml` is generated with `@ngrs/*` package names.

- [ ] **Step 8: Full typecheck**

```bash
pnpm --filter @ngrs/api run build
pnpm web:build
```

Both must PASS. If any file still has a stale `@iridium/shared` import, the build will fail — fix the file and re-run.

- [ ] **Step 9: Commit**

```bash
git add package.json apps/api/package.json apps/web/package.json packages/shared/package.json pnpm-lock.yaml apps/api/src apps/web/src apps/api/tsconfig*.json apps/web/tsconfig*.json
git commit -m "refactor(rename): @iridium/* → @ngrs/* package scopes"
```

---

## Task 12: Rename — UI strings, CSS classes, localStorage keys

**Files:**
- Modify: `apps/web/index.html`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/src/widgets/admin-sidebar/ui.tsx`
- Modify: `apps/web/src/app/layouts/admin-layout.tsx`
- Modify: `apps/web/src/pages/auth/login.tsx`
- Modify: `apps/web/src/pages/auth/register.tsx`

- [ ] **Step 1: index.html**

Update `apps/web/index.html`:

- `<title>Iridium TMS</title>` → `<title>НГРС</title>`
- `<meta name="apple-mobile-web-app-title" content="Iridium" />` → `content="НГРС"`
- Inside splash markup: `<span class="iridium-splash__brand">Iridium</span>` → `<span class="ngrs-splash__brand">НГРС</span>`
- All `iridium-splash*` CSS class names in the `<style>` block and HTML markup → `ngrs-splash*`
- `@keyframes iridium-pulse` → `@keyframes ngrs-pulse` (and update the `animation: iridium-pulse ...` reference)
- `@keyframes iridium-spin` → `@keyframes ngrs-spin` (and update `animation: iridium-spin ...` reference)

The easiest safe way: in the file, replace every occurrence of `iridium` with `ngrs` case-sensitively. Use sed:

```bash
sed -i '' 's/iridium-splash/ngrs-splash/g; s/iridium-pulse/ngrs-pulse/g; s/iridium-spin/ngrs-spin/g' apps/web/index.html
sed -i '' 's|>Iridium<|>НГРС<|g' apps/web/index.html
sed -i '' 's|content="Iridium"|content="НГРС"|g' apps/web/index.html
sed -i '' 's|<title>Iridium TMS</title>|<title>НГРС</title>|' apps/web/index.html
```

On GNU sed (Linux), omit the `''` after `-i`.

Visually verify the resulting file has no `Iridium` or `iridium-` references.

- [ ] **Step 2: vite.config.ts VitePWA manifest**

In `apps/web/vite.config.ts`, update the `manifest` object inside VitePWA:

```ts
manifest: {
  name: 'НГРС — Система управления перевозками',
  short_name: 'НГРС',
  description: 'Транспортная система ООО "Нефтегазремстрой" для управления рейсами и накладными',
  theme_color: '#3765F6',
  background_color: '#181D25',
  display: 'standalone',
  orientation: 'any',
  start_url: '/',
  scope: '/',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
},
```

The keys `name`, `short_name`, `description` are the only lines that change.

- [ ] **Step 3: admin-sidebar/ui.tsx**

In `apps/web/src/widgets/admin-sidebar/ui.tsx`:

- Change the STORAGE_KEY constant: `const STORAGE_KEY = 'iridium-sidebar-collapsed';` → `const STORAGE_KEY = 'ngrs-sidebar-collapsed';`
- In the logo block inside `AdminSidebarContent`, change the brand text: `<span className="font-bold text-foreground text-lg">Iridium</span>` → `<span className="font-bold text-foreground text-lg">НГРС</span>`
- In the logo square tile, change `I` to `Н`: find `<div ...>I</div>` and change to `<div ...>Н</div>` (there's exactly one such div inside the logo Link block)

- [ ] **Step 4: admin-layout.tsx (mobile header)**

In `apps/web/src/app/layouts/admin-layout.tsx`, inside the mobile `<header>` block:

- `<span className="font-bold text-foreground">Iridium</span>` → `<span className="font-bold text-foreground">НГРС</span>`
- The logo square `<div ...>I</div>` → `<div ...>Н</div>`

- [ ] **Step 5: login.tsx and register.tsx**

In `apps/web/src/pages/auth/login.tsx`:
- `<h1 ...>Iridium</h1>` → `<h1 ...>НГРС</h1>`

In `apps/web/src/pages/auth/register.tsx`:
- `<h1 ...>Iridium</h1>` → `<h1 ...>НГРС</h1>`

- [ ] **Step 6: Sanity grep**

```bash
grep -rn "Iridium" apps/web/src apps/web/index.html apps/web/vite.config.ts 2>/dev/null
```

Expected: zero results for user-visible contexts. If any results appear in comments or doc strings, update them to `НГРС` if they refer to the product name. Historical references (e.g., "this was changed in Iridium v1") can stay if they refer to a historical version.

```bash
grep -rn "iridium-" apps/web/src apps/web/index.html 2>/dev/null
```

Expected: zero results. Any stale CSS class or localStorage key must be renamed to `ngrs-`.

- [ ] **Step 7: Typecheck and full build**

```bash
pnpm web:build
```
Expected: PASS. Manifest should be regenerated with `"name": "НГРС — ..."`.

- [ ] **Step 8: Manual verification**

Start dev server: `pnpm web:dev` and visit `http://localhost:5173`.

- [ ] Hard reload the page. Splash screen shows "НГРС" crossfading with the subtitle.
- [ ] Login page heading: "НГРС".
- [ ] After login, admin sidebar logo: square tile with "Н", text "НГРС".
- [ ] Mobile view (DevTools iPhone 12): mobile header shows "Н" tile + "НГРС" text.
- [ ] Tab title: "НГРС".
- [ ] DevTools → Application → Manifest: name "НГРС — Система управления перевозками", short_name "НГРС".

- [ ] **Step 9: Commit**

```bash
git add apps/web/index.html apps/web/vite.config.ts apps/web/src/widgets/admin-sidebar/ui.tsx apps/web/src/app/layouts/admin-layout.tsx apps/web/src/pages/auth/login.tsx apps/web/src/pages/auth/register.tsx
git commit -m "refactor(rename): UI strings, CSS classes, and localStorage keys → НГРС"
```

---

## Final Verification

- [ ] **Full backend build**

```bash
pnpm --filter @ngrs/api run build
```
Expected: PASS.

- [ ] **Full frontend build**

```bash
pnpm web:build
```
Expected: PASS. Dist artifacts should contain НГРС branding.

- [ ] **Deploy checklist for the owner**

1. On the production server, set in `.env`:
   - `TELEGRAM_BOT_TOKEN` (from @BotFather)
   - `TELEGRAM_BOT_USERNAME=NgrsTmsBot` (or whatever was registered)
   - `WEB_ADMIN_URL=https://ngrs.your-domain.com`
2. Run `pnpm db:migrate` — applies `telegram_bot_integration`
3. Restart the API. Confirm logs show bot initialized (no "disabled" warning)
4. Log in as ADMIN, click profile → "Привязать Telegram", scan QR on your phone, confirm "✅ Готово!"
5. Have a driver change a trip status → confirm Telegram notification arrives with full formatting and inline keyboard
6. Test each command: `/help`, `/status`, `/trips`, `/waybills`, `/today`, `/unlink`
7. Confirm all web admin branding shows "НГРС" not "Iridium"

- [ ] **One-time BotFather registration** (the owner does this manually before deploying):

1. Open @BotFather in Telegram → `/newbot`
2. Name: "НГРС TMS", username: any available (suggested `NgrsTmsBot`)
3. Copy token → set as `TELEGRAM_BOT_TOKEN` in production `.env`
4. `/setdescription` → "Система управления перевозками НГРС. Уведомления о рейсах и накладных."
5. `/setcommands` → paste:
   ```
   start - Начать работу
   help - Список команд
   status - Информация о привязке
   trips - Последние 5 рейсов
   waybills - Последние 5 накладных
   today - Сводка за сегодня
   unlink - Отвязать Telegram
   ```
