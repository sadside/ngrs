# Group E2 — Telegram Bot for Manager (+ Project Rename to НГРС) Design Spec

**Date:** 2026-04-06
**Scope:** Backend NestJS Telegram bot integration that notifies the ADMIN (руководитель) about trip status changes and waybill submissions; plus full project rename from "Iridium" to "НГРС" (after ООО "Нефтегазремстрой").

## Goal

Give the manager of ООО "Нефтегазремстрой" a Telegram bot that:
1. Pushes richly-formatted notifications when drivers change trip status or submit waybills
2. Responds to read-only commands (`/trips`, `/waybills`, `/today`, `/status`, `/help`, `/unlink`) for on-the-go inspection
3. Links to the manager's existing admin account via a deep-link token flow initiated from the web admin UI

Alongside the bot work, rename the product from the generic "Iridium" brand to "НГРС" — the company's own initials (НефтеГазРемСтрой). Rename is scoped last in the implementation order so bot work is verified before touching brand identifiers.

## Constraints and decisions

- **Bot library:** `nestjs-telegraf` (NestJS wrapper over `telegraf`). Mature, first-class DI with decorators, supports both polling and webhook modes.
- **Bot mode:** `polling` for initial deploy. Works from any network without public HTTPS URL, zero extra infra. Env-flag `TELEGRAM_BOT_MODE` reserved for future webhook migration.
- **Recipients:** `ADMIN` role only. Logists keep using SSE notifications in the web admin.
- **Link mechanism:** deep-link token from web admin. Token TTL = 15 minutes, single-use, 24-char URL-safe random string. No phone sharing, no password entry in chat.
- **Commands:** full read-only interface — `/start`, `/help`, `/status`, `/trips`, `/waybills`, `/today`, `/unlink`, plus catch-all for unknown input.
- **Message format:** HTML parse mode with emoji, bold labels, and inline keyboard "Открыть в веб-админке" on notification messages. Templates live in pure functions for easy modification.
- **Delivery guarantees:** fire-and-forget. No retry queue, no BullMQ. Notifications are a convenience — critical data flows through the database and SSE. `Promise.allSettled` so one failed send doesn't block others. Self-healing on `403 Forbidden` (user blocked bot) — unlink automatically.
- **Event source:** reuses existing `NotificationsService` RxJS Subject. No changes to `trips.service.ts` or `waybills.service.ts`. Telegram bot subscribes to the same stream as the SSE endpoint.
- **Data enrichment:** SSE events contain minimal fields (ids + names). Bot enriches with full relational data (route, vehicle, cargo, contractors) via Prisma query at send time. One query per event. Acceptable for expected volume.
- **External requirements:** user will create the bot via `@BotFather`, place the token in `.env`, and fill in `WEB_ADMIN_URL` for the deploy. Icon files, domain setup, TLS — not in scope.
- **Project rename:** `@iridium/*` scopes → `@ngrs/*`, brand text "Iridium" → "НГРС" (or "Н" in logo square), localStorage keys `iridium-*` → `ngrs-*`, CSS classes `.iridium-splash*` → `.ngrs-splash*`. Disk directory `iridium/` and PostgreSQL database name `iridium` left untouched.

---

## Section 1 — Architecture and library choice

### Why `nestjs-telegraf`

`telegraf` is the most mature Node library for Telegram Bot API (10k+ stars, active maintenance). `nestjs-telegraf` provides first-class NestJS integration:

- `@InjectBot()` decorator for DI into services
- `@Update()` class decorator registers command handlers as NestJS providers
- `@Start()`, `@Help()`, `@Command(name)`, `@On('text')` decorators bind methods to Telegram events
- Works in both polling and webhook modes via a single `launchOptions` switch
- Lifecycle hooks tie into NestJS `onModuleInit` / `onModuleDestroy`

Alternative `grammy` is newer and more TypeScript-native but its NestJS integration is community-maintained and less stable. Raw `fetch` to Telegram API would require us to hand-roll DI, lifecycle, polling loop, and command routing — ~500 lines of boilerplate we'd be taking on for no benefit.

### New module layout

```
apps/api/src/telegram-bot/
├── telegram-bot.module.ts       — TelegrafModule config, DI wiring
├── telegram-bot.service.ts      — core: NotificationsService subscription, enrichment, dispatch
├── telegram-bot.update.ts       — @Update class with all command handlers
├── telegram-bot.controller.ts   — REST endpoints for link-token generation and unlink
├── link-token.service.ts        — token generation, validation, linking logic
├── dto/
│   └── link-token-response.dto.ts
└── templates/
    ├── trip-status.template.ts  — HTML formatter for trip-status-changed
    ├── waybill.template.ts      — HTML formatter for waybill-submitted
    ├── trips-list.template.ts   — HTML formatter for /trips command
    ├── waybills-list.template.ts — HTML formatter for /waybills command
    ├── today-summary.template.ts — HTML formatter for /today command
    └── utils.ts                 — escapeHtml, formatDateTime, buildInlineKeyboard
```

### Integration with existing NotificationsService

`NotificationsService` already emits events via RxJS Subject for the SSE endpoint. Bot reuses the same stream:

```ts
// In NotificationsService — add a public getter:
get events$(): Observable<SseEvent> {
  return this.subject.asObservable();
}
```

```ts
// In TelegramBotService:
constructor(
  private readonly notifications: NotificationsService,
  @InjectBot() private readonly bot: Telegraf,
  private readonly prisma: PrismaService,
  private readonly config: ConfigService,
) {}

onModuleInit() {
  this.subscription = this.notifications.events$.subscribe(event => {
    this.handleEvent(event).catch(err =>
      this.logger.error('Telegram notification failed', err)
    );
  });
}

onModuleDestroy() {
  this.subscription?.unsubscribe();
}
```

**Zero changes** to `trips.service.ts` and `waybills.service.ts` — they continue calling `this.notifications.emit(...)` unmodified.

### New dependencies

Added to `apps/api/package.json`:
- `nestjs-telegraf` (wrapper)
- `telegraf` (peer dependency)
- `date-fns` (for `/today` date range, if not already present; otherwise native `Date`)

No HTTP client library — `telegraf` has its own.

---

## Section 2 — Database schema changes

### Prisma schema additions

`apps/api/prisma/schema.prisma`:

**User model gains two fields:**

```prisma
model User {
  // ... existing fields
  telegramChatId   String?   @unique
  telegramLinkedAt DateTime?

  telegramLinkTokens TelegramLinkToken[]
}
```

- `telegramChatId` — Telegram chat ID as string (chat IDs can be int64, safer as string to avoid JavaScript number precision issues). `@unique` + nullable is valid in Prisma — many nulls allowed, at most one non-null per value.
- `telegramLinkedAt` — timestamp of the link event. Used in `/status` command response and in the web UI.

**New model:**

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

- `token` as primary key — 24-char `base64url` random string (`crypto.randomBytes(18).toString('base64url')`). Stored plain because TTL is 15 minutes and the attack surface is tiny.
- `userId` — the ADMIN who initiated the link.
- `createdAt` + `expiresAt` — 15-minute TTL.
- `usedAt` — nullable; when set, token is consumed and cannot be reused.
- `onDelete: Cascade` — removing a user cleans up their tokens.
- Index on `expiresAt` for efficient background cleanup of expired rows.
- `@@map("telegram_link_tokens")` — snake_case table name consistent with project convention.

### Migration

Run `pnpm db:migrate`, name: `telegram_bot_integration`. The migration:
- Adds two nullable columns to `users`
- Creates `telegram_link_tokens` table with the index

Non-destructive. Existing data untouched.

### Background cleanup of expired tokens

Inside `TelegramBotModule`, a simple `setInterval` every 30 minutes deletes expired rows:

```ts
onModuleInit() {
  this.cleanupInterval = setInterval(async () => {
    await this.prisma.telegramLinkToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }, 30 * 60 * 1000);
}

onModuleDestroy() {
  if (this.cleanupInterval) clearInterval(this.cleanupInterval);
}
```

No BullMQ, no cron library. One `deleteMany` call per 30 minutes is cheap. Token volume is ~a few per day, table will never be large.

---

## Section 3 — Link flow (connecting Telegram to User)

### End-to-end sequence

**Step 1 — User clicks "Привязать Telegram" in web admin.**
In `UserPopover` (the profile dropdown in the top-right of every admin page), a new item "Привязать Telegram" appears for `ADMIN` users. Clicking opens a `ResponsiveDialog` with a QR code, the deep link, and instructions.

If the user is already linked (`telegramChatId != null`), the popover shows "Telegram привязан ✓" + an "Отвязать" button instead.

**Step 2 — Backend generates a token.**
The dialog's open hook calls `POST /telegram-bot/link-token` with JWT auth, protected by `JwtAuthGuard + @Roles('ADMIN')`:

```ts
@Post('link-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async generateLinkToken(@CurrentUser() user: JwtUser) {
  // Reject if already linked
  const existing = await this.prisma.user.findUnique({
    where: { id: user.id },
    select: { telegramChatId: true },
  });
  if (existing?.telegramChatId) {
    throw new ConflictException('Telegram already linked');
  }

  const token = randomBytes(18).toString('base64url');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await this.prisma.telegramLinkToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const botUsername = this.config.get<string>('TELEGRAM_BOT_USERNAME');
  return {
    token,
    deepLink: `https://t.me/${botUsername}?start=${token}`,
    expiresAt,
  };
}
```

**Step 3 — Dialog renders QR code + deep link.**
The dialog displays:
- A QR code of the deep link (`qrcode.react` library — ~6KB)
- The clickable deep-link URL below it
- Textual instructions: "1. Отсканируйте QR-код телефоном или нажмите на ссылку. 2. В Telegram нажмите START. 3. Бот напишет вам подтверждение."
- Optional: a countdown timer "Токен действителен 14:32"

**Step 4 — User scans QR with their phone.**
Telegram opens the chat with the bot. The START button at the bottom of the chat already has the token pre-loaded as a message payload.

**Step 5 — Bot receives `/start TOKEN` and links the account.**

```ts
@Start()
async onStart(@Ctx() ctx: Context) {
  const match = ctx.message?.text?.match(/^\/start(?:\s+(.+))?$/);
  const payload = match?.[1];

  if (!payload) {
    return ctx.reply(
      'Привет! Это бот НГРС для уведомлений.\n\n' +
      'Чтобы привязать его к вашему аккаунту, откройте веб-админку и нажмите «Привязать Telegram» в профиле.'
    );
  }

  await this.linkTokenService.linkChat(payload, String(ctx.chat!.id), ctx);
}
```

`LinkTokenService.linkChat(token, chatId, ctx)`:

1. Look up token in `telegram_link_tokens`. If not found → "Ссылка недействительна. Сгенерируйте новую в веб-админке."
2. If `expiresAt < now` → "Ссылка просрочена (срок 15 минут). Сгенерируйте новую."
3. If `usedAt != null` → "Ссылка уже использована."
4. Check that `chatId` is not already linked to a different user. If yes → "Этот Telegram уже привязан к другому аккаунту. Используйте /unlink сначала."
5. Update `User`: `telegramChatId = chatId`, `telegramLinkedAt = now()`.
6. Mark token: `usedAt = now()`.
7. Reply in chat: `✅ Готово! Вы привязаны как <Имя> (Руководитель). Теперь вы будете получать уведомления. Наберите /help для списка команд.`

**Step 6 — Web admin polls and closes the dialog.**
The dialog uses React Query with `refetchInterval: 3000` on `/auth/me` while open. Once `telegramChatId != null` arrives in the response, the dialog auto-closes and shows a toast "Telegram успешно привязан". Simple polling, no WebSocket/SSE enhancement needed for this rare event.

### Unlink

Two paths:

**From web admin:** `UserPopover` shows "Отвязать Telegram" button → calls `DELETE /telegram-bot/link` → backend nulls `telegramChatId` and `telegramLinkedAt`, sends a farewell message to the chat ("Вы отвязали Telegram от аккаунта НГРС. Уведомления приходить не будут.").

**From Telegram:** `/unlink` command — bot finds user by `telegramChatId = ctx.chat.id`, nulls the field, replies "Отвязано. Чтобы снова подключиться, сгенерируйте новую ссылку в веб-админке."

### Edge cases

- **Double-linking attempt**: the `POST /telegram-bot/link-token` check returns 409 if user is already linked. Frontend proactively shows "Отвязать" button when linked, hiding this path.
- **Token race**: two tokens generated, both valid. First used → first linking succeeds. Second token remains valid until its own expiration, but linking it to the same chat will match `ConflictException` because the chat is already linked.
- **User re-installs Telegram (new chatId)**: old chatId is still in DB. The new install doesn't receive messages. User must unlink (either via the old chat if still accessible, or via the web admin) and re-link with the new chatId via a fresh token.
- **User DELETE in DB**: cascade removes `telegram_link_tokens`. The bot will no longer find the user by chatId during enrichment and silently skips delivery.

### Files touched

- **Modify:** `apps/api/src/telegram-bot/telegram-bot.controller.ts` — `POST /link-token`, `DELETE /link`
- **Create:** `apps/api/src/telegram-bot/link-token.service.ts` — generation and validation logic
- **Modify:** `apps/api/src/telegram-bot/telegram-bot.update.ts` — `@Start()` handler with token branch
- **Modify:** `apps/web/src/shared/ui/user-popover.tsx` — add "Привязать/Отвязать Telegram" item (visible for ADMIN only)
- **Create:** `apps/web/src/features/link-telegram/` — feature slice: `LinkTelegramDialog` (QR + deep link + polling), `useGenerateLinkToken` hook, `useUnlinkTelegram` hook
- **Modify:** `apps/web/src/entities/session/api.ts` — User type gains `telegramChatId?: string`, `telegramLinkedAt?: string` fields from `/auth/me`

---

## Section 4 — Notification dispatch (event → Telegram message)

### Subscription and delivery

`TelegramBotService` subscribes to `NotificationsService.events$` in `onModuleInit`. On each event it enriches the payload from the database and sends a formatted message to every linked ADMIN user.

```ts
private async handleEvent(event: SseEvent) {
  switch (event.type) {
    case 'trip-status-changed':
      return this.sendTripStatusChanged(event.data);
    case 'waybill-submitted':
      return this.sendWaybillSubmitted(event.data);
  }
}

private async sendTripStatusChanged(data: { tripId: string; status: TripStatus; driverName: string }) {
  const trip = await this.prisma.trip.findUnique({
    where: { id: data.tripId },
    include: {
      driver: true,
      vehicle: true,
      cargo: true,
      route: {
        include: { senderContractor: true, receiverContractor: true }
      },
    },
  });
  if (!trip) return; // race: trip deleted between emit and subscribe

  const recipients = await this.prisma.user.findMany({
    where: {
      role: 'ADMIN',
      telegramChatId: { not: null },
      status: 'ACTIVE',
    },
    select: { telegramChatId: true },
  });
  if (recipients.length === 0) return;

  const message = renderTripStatusMessage(trip);
  const keyboard = buildInlineKeyboard(`/trips`);

  await Promise.allSettled(
    recipients.map(user =>
      this.bot.telegram.sendMessage(user.telegramChatId!, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }).catch(err => this.handleSendError(err, user.telegramChatId!))
    )
  );
}
```

`sendWaybillSubmitted` is structurally identical, querying `Waybill` with `include: { trip: { include: { driver, vehicle, cargo, route: { include: { senderContractor, receiverContractor } } } } }`.

### Message templates

Pure functions in `templates/*.ts`, decoupled from I/O for easy modification.

**`trip-status.template.ts`:**

```ts
import { escapeHtml, formatDateTime } from './utils';
import { TRIP_STATUS_LABELS } from '../../shared/constants';

const STATUS_EMOJI: Record<TripStatus, string> = {
  ASSIGNED: '📋',
  EN_ROUTE_TO_LOADING: '🚚',
  LOADING: '⚙️',
  EN_ROUTE_TO_UNLOADING: '🚛',
  UNLOADING: '📦',
  COMPLETED: '✅',
  CANCELLED: '❌',
};

export function renderTripStatusMessage(trip: TripWithRelations): string {
  return [
    `${STATUS_EMOJI[trip.status]} <b>Изменение статуса рейса</b>`,
    ``,
    `<b>Водитель:</b> ${escapeHtml(trip.driver.fullName)}`,
    `<b>Маршрут:</b> ${escapeHtml(trip.route.senderContractor.name)} → ${escapeHtml(trip.route.receiverContractor.name)}`,
    `<b>ТС:</b> ${escapeHtml(trip.vehicle.brand)} ${escapeHtml(trip.vehicle.licensePlate)}`,
    `<b>Груз:</b> ${escapeHtml(trip.cargo.name)}`,
    `<b>Статус:</b> ${TRIP_STATUS_LABELS[trip.status]}`,
    `<b>Время:</b> ${formatDateTime(new Date())}`,
  ].join('\n');
}
```

**`waybill.template.ts`:**

```ts
export function renderWaybillMessage(waybill: WaybillWithRelations): string {
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

**`utils.ts`:**

```ts
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function buildInlineKeyboard(path: string) {
  const webUrl = process.env.WEB_ADMIN_URL ?? 'http://localhost:5173';
  return {
    inline_keyboard: [[
      { text: '🔗 Открыть в веб-админке', url: `${webUrl}${path}` }
    ]]
  };
}
```

### Error handling

```ts
private async handleSendError(err: any, chatId: string) {
  if (err.code === 403) {
    // Bot blocked by user, chat deactivated, or kicked from group
    this.logger.warn(`Chat ${chatId} blocked bot, auto-unlinking`);
    await this.prisma.user.updateMany({
      where: { telegramChatId: chatId },
      data: { telegramChatId: null, telegramLinkedAt: null },
    });
  } else if (err.code === 400) {
    // Bad chat id, bad HTML, invalid markup — log and drop
    this.logger.error(`Telegram 400 for chat ${chatId}: ${err.description}`);
  } else if (err.code === 429) {
    // Rate limit — log retry_after, no retry this session
    this.logger.warn(`Rate limited by Telegram, retry_after: ${err.parameters?.retry_after}`);
  } else {
    this.logger.error(`Unexpected Telegram error for chat ${chatId}`, err);
  }
}
```

**Fire-and-forget semantics.** No retry queue. If Telegram is unavailable, the event is dropped. This is acceptable because the notification is a convenience — the authoritative state lives in the database and is visible via SSE in the web admin.

**Self-healing on 403.** When a user blocks the bot, we automatically null their `telegramChatId` so we don't waste API calls on them on every subsequent event.

---

## Section 5 — Bot commands

All command handlers live in `TelegramBotUpdate` (decorated with `@Update()`).

### Helper for authenticated commands

```ts
private async getLinkedUser(ctx: Context): Promise<User | null> {
  const chatId = String(ctx.chat!.id);
  return this.prisma.user.findUnique({ where: { telegramChatId: chatId } });
}
```

Commands that require a link call this first. If it returns `null`, reply "⚠️ Вы не привязаны. Откройте веб-админку и нажмите «Привязать Telegram»."

### `/start` — see Section 3

Handled above. Either token linking or greeting message.

### `/help` — static list of commands

Does not require linking. Works even for anonymous users to help them discover how to link.

```
🤖 <b>НГРС — Система управления перевозками</b>

Доступные команды:

/start — начать работу с ботом
/status — показать информацию о привязке
/trips — последние 5 рейсов
/waybills — последние 5 накладных
/today — сводка за сегодня
/unlink — отвязать Telegram от аккаунта
/help — показать это сообщение

Для привязки бота к вашему аккаунту откройте веб-админку НГРС и нажмите «Привязать Telegram» в профиле.
```

### `/status` — current binding info

Requires linking.

- Linked: `✅ Вы привязаны как <b>${fullName}</b>\nРоль: ${ROLE_LABELS[role]}\nПривязка активна с ${formatDateTime(telegramLinkedAt)}`
- Not linked: the standard "not linked" warning.

### `/unlink` — unlink from Telegram

Requires linking.

```ts
await this.prisma.user.update({
  where: { id: user.id },
  data: { telegramChatId: null, telegramLinkedAt: null },
});
await ctx.reply('🔓 Вы отвязали Telegram от аккаунта НГРС. Уведомления приходить больше не будут.\n\nЧтобы снова привязать — сгенерируйте ссылку в веб-админке.');
```

### `/trips` — last 5 trips

Requires linking + ADMIN role (defensive check in case role changed after linking).

```ts
if (user.role !== 'ADMIN') {
  return ctx.reply('⚠️ Эта команда доступна только руководителям.');
}

const trips = await this.prisma.trip.findMany({
  orderBy: { assignedAt: 'desc' },
  take: 5,
  include: {
    driver: true,
    vehicle: true,
    route: { include: { senderContractor: true, receiverContractor: true } },
  },
});

if (trips.length === 0) {
  return ctx.reply('Нет рейсов.');
}

await ctx.reply(renderTripsList(trips), { parse_mode: 'HTML' });
```

`renderTripsList` (in `templates/trips-list.template.ts`) formats as a numbered list:

```
🚚 <b>Последние 5 рейсов</b>

1. ✅ Завершён — Иванов И.И.
   ООО "Интерком" → ООО "ОЙЛ ГРУПП"
   ТС: А123БВ777 · 06.04.2026 18:30

2. 🚛 Едет на выгрузку — Петров П.П.
   ...
```

### `/waybills` — last 5 waybills

Structurally identical, queries `Waybill` with full relations.

```
📄 <b>Последние 5 накладных</b>

1. ТТН 123-4567890 — Иванов И.И.
   Интерком → ОЙЛ ГРУПП
   Вес: 20.50 т · 06.04.2026 18:30

2. ...
```

### `/today` — today's summary

Aggregated metrics for the current day using 4-5 parallel Prisma queries:

```ts
const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);

const [assigned, completed, inRoute, waybillsAgg, activeDrivers] = await Promise.all([
  prisma.trip.count({ where: { assignedAt: { gte: today, lt: tomorrow } } }),
  prisma.trip.count({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: today, lt: tomorrow },
    },
  }),
  prisma.trip.count({
    where: {
      status: { in: ['EN_ROUTE_TO_LOADING', 'LOADING', 'EN_ROUTE_TO_UNLOADING', 'UNLOADING'] },
    },
  }),
  prisma.waybill.aggregate({
    where: { submittedAt: { gte: today, lt: tomorrow } },
    _count: true,
    _sum: { weight: true },
  }),
  prisma.user.count({ where: { role: 'DRIVER', status: 'ACTIVE' } }),
]);
```

Rendered as:

```
📊 <b>Сводка за 06.04.2026</b>

🚚 Назначено рейсов: 8
✅ Завершено рейсов: 5
⏳ В пути: 3
📄 Накладных отправлено: 5
⚖️ Общий вес: 102.30 т

Активных водителей: 4
```

`date-fns` is added to `apps/api/package.json` for `startOfDay` / `addDays`. Alternatively use native `Date` methods if avoiding the dependency is preferred — native is ~10 lines more verbose but zero new deps.

### Unknown input catch-all

```ts
@On('text')
async onText(@Ctx() ctx: Context) {
  const text = (ctx.message as any).text;
  if (text?.startsWith('/')) {
    return ctx.reply('⚠️ Неизвестная команда. Наберите /help чтобы увидеть список.');
  }
  return ctx.reply('Я не понимаю обычные сообщения. Наберите /help чтобы увидеть доступные команды.');
}
```

### Files

- **Modify:** `apps/api/src/telegram-bot/telegram-bot.update.ts` — all 7 handlers
- **Create:** `apps/api/src/telegram-bot/templates/trips-list.template.ts`
- **Create:** `apps/api/src/telegram-bot/templates/waybills-list.template.ts`
- **Create:** `apps/api/src/telegram-bot/templates/today-summary.template.ts`

---

## Section 6 — Configuration, env vars, module init

### New environment variables

Added to `apps/api/.env.example`:

```
# Telegram Bot
TELEGRAM_BOT_TOKEN=                  # From @BotFather. Required for bot to start. If empty, bot is disabled, API works normally.
TELEGRAM_BOT_USERNAME=NgrsTmsBot     # Without @. Used for deep links in the QR dialog.
TELEGRAM_BOT_MODE=polling            # polling | webhook. Reserved for future; only 'polling' is wired.
WEB_ADMIN_URL=http://localhost:5173  # Base URL for inline keyboard "Открыть в веб-админке" links. Set to https://domain in prod.
```

All four are optional at load time. If `TELEGRAM_BOT_TOKEN` is empty:
- `TelegramBotModule` logs a warning on startup
- `TelegrafModule.forRootAsync` returns a dummy config that does not launch the bot
- `TelegramBotService.onModuleInit` does not subscribe to `NotificationsService.events$`
- Commands are not registered
- API continues running, SSE notifications continue working

This graceful fallback is important for:
- Local developer machines without their own test bot
- CI runs
- Test environments

### One-time bot registration via @BotFather

Manual steps (documented in the implementation plan as a deploy checklist, not code):

1. Open @BotFather in Telegram
2. `/newbot` → name "НГРС TMS", username `NgrsTmsBot` (or any available)
3. Copy the token returned by BotFather
4. `/setdescription` → "Система управления перевозками НГРС. Уведомления о рейсах и накладных."
5. `/setcommands` → paste the following for Telegram UI autocomplete:
   ```
   start - Начать работу
   help - Список команд
   status - Информация о привязке
   trips - Последние 5 рейсов
   waybills - Последние 5 накладных
   today - Сводка за сегодня
   unlink - Отвязать Telegram
   ```
6. Paste the token into the production `.env` file as `TELEGRAM_BOT_TOKEN`

### TelegramBotModule

```ts
// telegram-bot.module.ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotUpdate } from './telegram-bot.update';
import { TelegramBotController } from './telegram-bot.controller';
import { LinkTokenService } from './link-token.service';

const logger = new Logger('TelegramBotModule');

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const token = config.get<string>('TELEGRAM_BOT_TOKEN');
        if (!token) {
          logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
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
  providers: [TelegramBotService, LinkTokenService, TelegramBotUpdate],
})
export class TelegramBotModule {}
```

Registered in `apps/api/src/app.module.ts` alongside the other feature modules.

### Webhook mode (future skeleton)

The `TELEGRAM_BOT_MODE` env var is reserved but not wired. When needed later:

- Set `launchOptions: false`
- Call `bot.telegram.setWebhook(config.get('TELEGRAM_WEBHOOK_URL'))` in `TelegramBotService.onModuleInit`
- Add an HTTP handler at `POST /telegram/webhook` that forwards `req.body` to `bot.handleUpdate(req.body)`

~20 lines of change. Documented as a comment in `telegram-bot.service.ts` but not implemented in this group.

### Deploy checklist for the owner

1. On the production server, set in `.env`:
   - `TELEGRAM_BOT_TOKEN` (from BotFather)
   - `TELEGRAM_BOT_USERNAME=NgrsTmsBot` (or whatever was registered)
   - `WEB_ADMIN_URL=https://ngrs.your-domain.com`
2. Run `pnpm db:migrate` — applies the `telegram_bot_integration` migration
3. Restart the API. Confirm logs show the bot initialized (no warnings about missing token)
4. Log into the web admin as ADMIN, click profile → "Привязать Telegram", scan the QR code on your phone, confirm the bot replies "✅ Готово!"
5. Have a driver change a trip status or submit a waybill → confirm the Telegram message arrives with full formatting and an inline keyboard

### Files

- **Modify:** `apps/api/.env.example` — four new variables with comments
- **Create:** `apps/api/src/telegram-bot/telegram-bot.module.ts`
- **Modify:** `apps/api/src/app.module.ts` — import `TelegramBotModule`
- **Modify:** `apps/api/package.json` — add `nestjs-telegraf`, `telegraf`, `date-fns` (if not present)

---

## Section 7 — Verification

No unit test infrastructure exists in the project. Group E2 is verified exclusively through manual checks.

### Manual verification checklist

Each section is gated by a corresponding set of checks during implementation.

**Module initialization:**
- [ ] `pnpm api:dev` starts without errors
- [ ] Logs show bot initialized in polling mode
- [ ] With empty `TELEGRAM_BOT_TOKEN`, API still starts, logs warn "Telegram bot disabled"

**Link flow (happy path):**
- [ ] Web admin ADMIN user sees "Привязать Telegram" in profile popover
- [ ] Click → dialog opens with QR code and text deep link
- [ ] Scan QR with phone → Telegram chat opens with START button pre-filled with token
- [ ] Press START → bot replies "✅ Готово! Вы привязаны как …"
- [ ] Web dialog auto-closes, toast "Telegram успешно привязан"
- [ ] Profile popover now shows "Отвязать Telegram"

**Link flow (edge cases):**
- [ ] Reuse same token → "Ссылка уже использована"
- [ ] Wait 15+ minutes → "Ссылка просрочена"
- [ ] Second token generated while first unused → both valid until either is used
- [ ] Database check: `SELECT * FROM telegram_link_tokens` — used tokens have `usedAt != NULL`, expired rows removed by background cleanup within 30 minutes

**Notifications — trip status change:**
- [ ] Logged in as DRIVER in a separate window, advance an active trip through statuses: ASSIGNED → EN_ROUTE_TO_LOADING → LOADING → EN_ROUTE_TO_UNLOADING → UNLOADING → COMPLETED
- [ ] Each status change produces a Telegram message with emoji matching the status, full formatting (driver, route, vehicle, cargo, status label, timestamp)
- [ ] Inline keyboard "🔗 Открыть в веб-админке" is present and clicks open the web admin
- [ ] All six status labels render correctly

**Notifications — waybill submitted:**
- [ ] Submit a waybill via the driver PWA
- [ ] Telegram message arrives with `📄 Новая накладная`, TTN, driver, route, weights, timestamp
- [ ] Inline keyboard present

**Commands:**
- [ ] `/help` — shows command list (works without linking)
- [ ] `/status` — shows "Вы привязаны как …"
- [ ] `/trips` — lists last 5 trips with status + route + vehicle + date
- [ ] `/waybills` — lists last 5 waybills with TTN + weights + date
- [ ] `/today` — aggregated summary of trips assigned/completed/in-route, waybills submitted, total weight, active drivers
- [ ] `/unlink` — unlinks; web admin popover now shows "Привязать" again
- [ ] Plain text message → "Я не понимаю обычные сообщения"
- [ ] Unknown command `/foo` → "Неизвестная команда"

**Error resilience:**
- [ ] Block the bot in Telegram → next event logs warn "Chat X blocked bot, unlinking", DB field is cleared
- [ ] Delete a linked user from DB → cascade removes their tokens; bot stops trying to send to that chatId
- [ ] Kill and restart the API during active polling → Telegraf resumes from the last offset, no events lost (Telegram retains updates for 24h)
- [ ] Set `TELEGRAM_BOT_TOKEN=invalid_string` → Telegraf logs error at startup, API still starts

**Production deploy (post-rename):**
- [ ] `.env` on production server has correct token and `WEB_ADMIN_URL`
- [ ] `pnpm db:migrate` applied cleanly
- [ ] Owner successfully performs link flow on their phone
- [ ] Test trip/waybill → message delivered within 1-3 seconds

### What is NOT verified

- Load testing (thousands of messages per minute) — out of scope for current company size
- Internationalization — Russian only
- Webhook mode — deferred
- Photo attachments in waybill messages — deferred until waybill photo upload exists (Group D1)

---

## Section 8 — Project rename (Iridium → НГРС)

This section runs **last** in the implementation order so the bot is verified working before brand identifiers are touched. If rename breaks something, scope is localized to this step.

### Scope summary

Three layers:
1. **Package scopes** — `@iridium/*` → `@ngrs/*` in `package.json` files, scripts, imports
2. **UI strings** — "Iridium" → "НГРС" in all user-visible text
3. **Internal identifiers** — localStorage keys `iridium-*` → `ngrs-*`, CSS classes `.iridium-splash*` → `.ngrs-splash*`

### What is NOT renamed

- The on-disk directory `/Users/vadimkhalikov/Documents/Development/iridium/` — does not affect functionality; user can rename git remote separately.
- The PostgreSQL database name `iridium` (if currently used in `DATABASE_URL`) — renaming a live DB requires dump/restore; out of scope. New deploys can use a different DB name in their `.env` without affecting the code.
- Historical spec/plan files in `docs/superpowers/` — these are artifacts of past design sessions, not product surface.
- Past migration names — they are timestamped and immutable.

### Layer 1 — Package scopes

**Root `package.json`:**
- `"name": "iridium"` → `"name": "ngrs"`
- Every script filter: `pnpm --filter @iridium/api` → `pnpm --filter @ngrs/api` (same for web, shared if exists)
- Check `workspaces` / `overrides` fields for stale references

**`apps/api/package.json`:**
- `"name": "@iridium/api"` → `"name": "@ngrs/api"`
- Any `dependencies["@iridium/shared"]` → `"@ngrs/shared"`

**`apps/web/package.json`:**
- `"name": "@iridium/web"` → `"name": "@ngrs/web"`
- Same dependency rewrite

**`packages/shared/package.json` (if it exists):**
- `"name": "@iridium/shared"` → `"name": "@ngrs/shared"`

**TypeScript imports:**
- Grep `import .* from '@iridium/` in `apps/api/src` and `apps/web/src` — rewrite all matches to `@ngrs/`

**Post-rename step:**
- Delete `node_modules/` (all workspaces) and `pnpm-lock.yaml`
- Run `pnpm install` to regenerate the lockfile with the new scope names and re-link workspaces

### Layer 2 — UI strings

**`apps/web/index.html`:**
- `<title>Iridium TMS</title>` → `<title>НГРС</title>`
- `<meta name="apple-mobile-web-app-title" content="Iridium" />` → `content="НГРС"`
- Inline splash markup:
  - `<span class="iridium-splash__brand">Iridium</span>` → `НГРС`
  - `<span class="iridium-splash__subtitle">Система управления перевозками</span>` — unchanged (subtitle is brand-agnostic)
- All inline splash CSS classes renamed: `.iridium-splash*` → `.ngrs-splash*`, `@keyframes iridium-pulse|spin` → `@keyframes ngrs-pulse|spin`

**`apps/web/vite.config.ts` — VitePWA manifest:**

```ts
manifest: {
  name: 'НГРС — Система управления перевозками',
  short_name: 'НГРС',
  description: 'Транспортная система ООО "Нефтегазремстрой" для управления рейсами и накладными',
  theme_color: '#3765F6',
  // ... everything else unchanged
}
```

**`apps/web/src/widgets/admin-sidebar/ui.tsx`:**
- In `AdminSidebarContent`, the logo block renders `<span>Iridium</span>` — change to `<span>НГРС</span>`
- The square logo tile currently shows the letter `I` — change to `Н` (one letter fits the square best; three letters would not fit aesthetically)

**`apps/web/src/app/layouts/admin-layout.tsx` — mobile header:**
- `<span>Iridium</span>` → `<span>НГРС</span>`
- Square logo `<div>I</div>` → `<div>Н</div>`

**`apps/web/src/pages/auth/login.tsx`:**
- `<h1>Iridium</h1>` → `<h1>НГРС</h1>`

**`apps/web/src/pages/auth/register.tsx`:**
- `<h1>Iridium</h1>` → `<h1>НГРС</h1>`

**`apps/web/src/widgets/page-header/ui.tsx`:**
- Grep for hardcoded "Iridium" — there should be none; the title prop is dynamic. Nothing to change.

**Toast messages and other hardcoded strings:**
- Grep `Iridium` across `apps/web/src` and `apps/api/src` to catch any stragglers. Replace each with `НГРС` if user-visible; remove or update comments that mention "Iridium" as a project name.

### Layer 3 — Internal identifiers

**localStorage keys:**
- `apps/web/src/widgets/admin-sidebar/ui.tsx` — `const STORAGE_KEY = 'iridium-sidebar-collapsed'` → `'ngrs-sidebar-collapsed'`
- Grep for any other `iridium-*` string literals in TypeScript source and rewrite

**Side effect:** existing dev-machine users lose their sidebar-collapsed preference on first load after rename (orphaned old key). Acceptable — this is a one-time sacrifice for a one-time rename.

**CSS theme variables:**
- `apps/web/src/index.css` `@theme` block — verify there are no `--iridium-*` custom properties (there shouldn't be; they're prefixed with `--color-*`, `--radius`, etc.). No change expected.

**JWT issuer / audience:**
- `apps/api/src/auth/` — check `JwtService.sign` config for any `issuer: 'iridium'`. If present, renaming invalidates live JWT tokens, which is acceptable since users will re-login after the deploy. If absent, no change.

### Bot-related identifiers

The bot name registered with BotFather (`TELEGRAM_BOT_USERNAME`) can be chosen at deploy time — suggested `NgrsTmsBot` or similar. This is already part of the deploy checklist in Section 6.

In bot messages:
- `/help` header `🤖 <b>НГРС — Система управления перевозками</b>` — matches the new brand
- `/unlink` message `Вы отвязали Telegram от аккаунта НГРС` — already matches
- Welcome message on `/start` without token — `Привет! Это бот НГРС для уведомлений.` — already matches

All bot templates are written for "НГРС" from the start (not "Iridium"), so no rewriting needed inside the bot module. The rename only affects pre-existing web admin code.

### Execution order

In the implementation plan, the rename work runs **after** all bot tasks are verified:

1. Bot infrastructure tasks (Sections 1-6)
2. Bot verification (Section 7)
3. **Rename begins**:
   - Rename package.json files + regenerate lockfile + reinstall
   - Rename UI strings (index.html, vite.config, all touched TSX files)
   - Rename CSS classes and localStorage keys
   - Manual verification: app opens, all text reads "НГРС", bot messages still work, no broken imports

Splitting rename after bot verification isolates risk — if rename introduces a build or runtime error, the bot logic is already proven.

### Files touched (summary)

**Modified (~15 files):**
- `package.json` (root)
- `apps/api/package.json`
- `apps/web/package.json`
- `packages/shared/package.json` (if exists)
- `apps/web/index.html`
- `apps/web/vite.config.ts`
- `apps/web/src/widgets/admin-sidebar/ui.tsx`
- `apps/web/src/app/layouts/admin-layout.tsx`
- `apps/web/src/pages/auth/login.tsx`
- `apps/web/src/pages/auth/register.tsx`
- `apps/web/src/index.css` (if splash CSS lives there; otherwise only `index.html`)
- Any TypeScript files importing `@iridium/shared` (rewrite to `@ngrs/shared`)
- `pnpm-lock.yaml` (regenerated)

**Side effects:**
- `node_modules/` rebuilt after `pnpm install`
- Dev users lose `iridium-sidebar-collapsed` localStorage preference once

---

## Implementation order summary

1. **Foundation** — Prisma schema + migration + new `TelegramBotModule` skeleton with graceful fallback when token missing
2. **Link flow** — `LinkTokenService`, `POST /link-token`, `DELETE /link`, bot `@Start()` handler, web admin dialog with QR + polling
3. **Dispatch** — `TelegramBotService` subscription to `NotificationsService.events$`, enrichment, message templates, error handling
4. **Commands** — all 7 handlers: `/start`, `/help`, `/status`, `/unlink`, `/trips`, `/waybills`, `/today`, plus catch-all
5. **Config** — env vars, BotFather registration docs, deploy checklist
6. **Verification** — full manual checklist walkthrough
7. **Rename** — package scopes, UI strings, localStorage keys, CSS classes (last, after bot is proven)

Each step is independent enough to ship incrementally if needed — e.g., foundation + link flow + dispatch without commands is already useful (notifications work), and commands can be added in a later PR.

## File summary

**Created (~12 files):**
- `apps/api/src/telegram-bot/telegram-bot.module.ts`
- `apps/api/src/telegram-bot/telegram-bot.service.ts`
- `apps/api/src/telegram-bot/telegram-bot.update.ts`
- `apps/api/src/telegram-bot/telegram-bot.controller.ts`
- `apps/api/src/telegram-bot/link-token.service.ts`
- `apps/api/src/telegram-bot/dto/link-token-response.dto.ts`
- `apps/api/src/telegram-bot/templates/trip-status.template.ts`
- `apps/api/src/telegram-bot/templates/waybill.template.ts`
- `apps/api/src/telegram-bot/templates/trips-list.template.ts`
- `apps/api/src/telegram-bot/templates/waybills-list.template.ts`
- `apps/api/src/telegram-bot/templates/today-summary.template.ts`
- `apps/api/src/telegram-bot/templates/utils.ts`
- `apps/web/src/features/link-telegram/ui.tsx` (dialog)
- `apps/web/src/features/link-telegram/api.ts` (hooks)
- `apps/web/src/features/link-telegram/index.ts` (barrel)

**Modified (bot + rename, ~25 files):**
- `apps/api/prisma/schema.prisma`
- `apps/api/src/notifications/notifications.service.ts` (add `events$` getter)
- `apps/api/src/app.module.ts` (import `TelegramBotModule`)
- `apps/api/package.json` (new deps)
- `apps/api/.env.example` (4 new keys)
- `apps/web/src/shared/ui/user-popover.tsx` (link/unlink items)
- `apps/web/src/entities/session/api.ts` (type update)
- All rename targets from Section 8

**Deleted:**
- None (no existing files removed; `packages/shared/package.json` is only renamed if it exists)

**Migrations:**
- `apps/api/prisma/migrations/<timestamp>_telegram_bot_integration/`

**External (user-provided, before deploy):**
- Telegram bot token from @BotFather
- `WEB_ADMIN_URL` for production domain
