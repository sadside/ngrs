# Iridium TMS — Redesign V2 (Rayum-inspired)

**Дата:** 2026-04-05
**Цель:** Полный визуальный редизайн админки — новая палитра, dark/light тема, компонентная система с вариантами, Storybook, переработка layout, таблицы с @tanstack/react-table.

---

## 1. Палитра и темы

### Цвета

| Название | HEX | Назначение |
|----------|-----|------------|
| True Cobalt | #3765F6 | Primary — кнопки, активные элементы, пагинация, ссылки |
| Neon Mint | #70FC8E | Accent/Success — активные статусы, положительные тренды |
| Ghost Grey | #F2F3F6 | Light background |
| Cool Mist | #606E80 | Muted text |
| Obsidian Black | #181D25 | Dark background |
| Card Dark | #1E2530 | Карточки/sidebar в тёмной теме |
| Border Dark | #2A3140 | Границы в тёмной теме |
| Danger | #EF4444 | Ошибки, удаление |
| Warning | #F59E0B | Предупреждения |

### Тема по умолчанию: Dark

CSS-токены в `@theme` блоке для Tailwind v4. Dark через `:root`, light через `.light` class на `<html>`.

**Dark (default):**
- `--color-background: #181D25`
- `--color-foreground: #F2F3F6`
- `--color-card: #1E2530`
- `--color-card-foreground: #F2F3F6`
- `--color-popover: #1E2530`
- `--color-popover-foreground: #F2F3F6`
- `--color-border: #2A3140`
- `--color-input: #2A3140`
- `--color-muted: #2A3140`
- `--color-muted-foreground: #606E80`
- `--color-primary: #3765F6`
- `--color-primary-foreground: #FFFFFF`
- `--color-accent: #70FC8E`
- `--color-accent-foreground: #181D25`
- `--color-destructive: #EF4444`
- `--color-destructive-foreground: #FFFFFF`
- `--color-ring: #3765F6`

**Light (.light class):**
- `--color-background: #F2F3F6`
- `--color-foreground: #181D25`
- `--color-card: #FFFFFF`
- `--color-card-foreground: #181D25`
- `--color-popover: #FFFFFF`
- `--color-popover-foreground: #181D25`
- `--color-border: #E3E5E8`
- `--color-input: #E3E5E8`
- `--color-muted: #E8EAED`
- `--color-muted-foreground: #606E80`
- Остальные (primary, accent, destructive) — те же значения

### Theme Provider

Простой React context + localStorage:
- Key: `iridium-theme`, values: `dark` | `light`
- Применяет/убирает `.light` class на `<html>`
- Default: `dark`
- Водительский layout: принудительно `.light`, без свитчера

---

## 2. Layout

### Sidebar

- Ширина: `w-64` expanded → `w-16` collapsed, `transition-all duration-300`
- Фон: `bg-card`, `rounded-2xl`, отделён от контента (`m-3`)
- Collapse кнопка: chevron рядом с лого
- Collapsed: иконки без текста, лого → "I", tooltip на hover
- Секции: "Main menu" (Дашборд, Рейсы, Накладные, Водители, Транспорт, Контрагенты, Маршруты, Грузы) + "Управление" (Пользователи — ADMIN only)
- Active item: `bg-primary text-white rounded-xl`
- Внизу: ThemeToggle (pill Light/Dark)
- Состояние collapse хранится в localStorage

### Header убран

Вместо него:
- Контент-область: приветствие "Добрый день, {ФИО}" + подпись (только дашборд)
- Справа сверху: UserPopover — имя + роль badge + chevron → Popover (Выйти)
- Остальные страницы: заголовок страницы слева + UserPopover справа

### Main area

- `bg-background` (тёмный по умолчанию)
- Контент с отступами `p-6`

---

## 3. Компонентная система + Storybook

### Компоненты с вариантами (cva)

**Button:**
- Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
- Sizes: `sm` (h-8), `md` (h-10), `lg` (h-12), `icon` (h-10 w-10)

**Input:**
- Variants: `default`, `search` (с иконкой MagnifyingGlass слева)
- Sizes: `sm`, `md`, `lg`

**Badge:**
- Variants: `success` (mint bg), `warning` (amber), `danger` (red), `info` (cobalt), `neutral` (muted)
- Sizes: `sm`, `md`

**Card:**
- Variants: `default`, `stats` (для stat-карточек дашборда), `dark` (primary bg)

**Select:**
- Variants: `default`, `filter` (компактный для toolbar)
- Sizes: `sm`, `md`

**Dialog:**
- Variants: `default`, `confirm` (иконка в круге сверху + stacked buttons)
- Sizes: `sm`, `md`, `lg`

**Tabs:**
- Variants: `default`, `pill`

**Checkbox** (новый):
- Для таблиц, select all / individual

**DropdownMenu** (новый):
- Для row actions в таблицах (Просмотр, Редактировать, Удалить)

**Pagination** (новый):
- Номера страниц, активная `bg-primary text-white rounded-lg`
- Previous / Next кнопки

**ThemeToggle** (новый):
- Pill-свитчер Light/Dark

**UserPopover** (новый):
- Аватар/инициалы + имя + роль badge + chevron
- Popover: Выйти

### Storybook

- `@storybook/react-vite`
- Каждый компонент → `.stories.tsx` рядом
- Stories: все варианты, размеры, состояния (disabled, loading, error)
- Темы переключаются в toolbar

---

## 4. Таблицы (DataTable)

### Зависимость

`@tanstack/react-table` для логики (sorting, filtering, pagination, row selection).

### Композиция

```
<DataTable>
  <DataTableToolbar>
    <Input variant="search" />
    <Select variant="filter" />        // фильтры
    <Button variant="primary">+ Добавить</Button>
  </DataTableToolbar>
  <DataTableInfo>
    "Всего X записей"    "Строк: 10 ▾"
  </DataTableInfo>
  <DataTableContent>
    <Table>
      <TableHeader> ☐ | колонки... | Actions </TableHeader>
      <TableBody> строки с чекбоксами + kebab menu </TableBody>
    </Table>
  </DataTableContent>
  <DataTableFooter>
    "Выбрано X из Y"    < 1 2 3 ... 10 >    Prev | Next
  </DataTableFooter>
</DataTable>
```

### Фильтры по сущностям

| Страница | Поиск по | Фильтры |
|----------|----------|---------|
| Рейсы | водитель, маршрут | статус, дата |
| Накладные | номер ТТН | дата, водитель |
| Водители | ФИО | статус |
| Транспорт | госномер, марка | статус, тип владения |
| Контрагенты | название, ИНН | тип |
| Маршруты | адрес | — |
| Грузы | название | — |
| Пользователи | логин, ФИО | роль, статус |

### Row actions (DropdownMenu)

- Просмотр → Sheet/Drawer справа с деталями
- Редактировать → Dialog с предзаполненной формой
- Удалить → Confirm Dialog с иконкой

### Bulk actions

При выделении строк появляется toolbar: "Экспорт CSV", "Удалить выбранные".

---

## 5. Dashboard

### Layout

```
Row 1: 5 stat cards (первая bg-primary, остальные bg-card)
Row 2: Bar chart (рейсы/день) | Line chart (вес/день)
Row 3: Последние рейсы (table 5 строк) | Donut (статусы) | Alerts (без накладной >2ч)
```

### Stat cards

5 штук: рейсов сегодня (trend), в пути, завершено, накладных, водителей.
Анимированные счётчики (easeOutExpo).

### Графики (ECharts)

- Bar: рейсы/день за 7 дней, цвет primary (#3765F6)
- Line: вес/день, градиент accent (#70FC8E → transparent)
- Donut: распределение рейсов по статусам
- Тултипы с полными датами

### Alerts виджет

Рейсы без накладной > 2ч:
- Иконка ⚠, маршрут, водитель, время
- Пусто → "Все накладные отправлены вовремя ✓"

---

## 6. CRUD-страницы

Все следуют DataTable паттерну (секция 4). Модалки создания/редактирования:
- `bg-card`, `rounded-2xl`
- Заголовок + описание
- Форма с Input/Select из UI-кита (варианты, не инлайн)
- Кнопки: `<Button variant="primary">` + `<Button variant="ghost">`
- Confirm-модалка: иконка в круглом фоне

---

## 7. Водительский UI

- Рескин под новую палитру (bg-card, border-border, text-foreground)
- Принудительно `.light` тема, без свитчера
- Компоненты из UI-кита (Button variant, Badge variant, Input variant)
- Функционально без изменений

---

## 8. Зависимости

| Пакет | Назначение |
|-------|------------|
| `@tanstack/react-table` | Логика таблиц |
| `@storybook/react-vite` | Storybook |
| `@storybook/addon-essentials` | Storybook addons |
| `@storybook/addon-themes` | Переключение тем |

Уже установлены: `echarts`, `echarts-for-react`, `framer-motion`, `tailwindcss-animate`.

---

## 9. Что НЕ меняется

- Бэкенд API (NestJS)
- Роутинг (TanStack Router)
- Auth flow (JWT)
- Entity API hooks (React Query)
- Effector модели (SSE, session)
- Бизнес-логика рейсов/накладных
