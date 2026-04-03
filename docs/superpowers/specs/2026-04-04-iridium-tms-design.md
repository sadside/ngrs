# Iridium TMS — Transport Management System

**Дата:** 2026-04-04
**Заказчик:** ИП Низамова О.В., перевозка нефтепродуктов, Оренбургская область
**Проблема:** Бумажный документооборот, потеря данных, нет контроля рейсов в реальном времени, водители не заполняют накладные

## Суть системы

Две части: админка (десктоп) для руководителя/логиста и мобильный PWA для водителей. Логист создаёт рейсы, водитель отправляет данные накладной при погрузке. Бумажные накладные остаются — система оцифровывает ключевые данные.

---

## 1. Сущности и модель данных

### User (Пользователь)
- id, login, password (hashed), fullName, phone
- role: ADMIN | LOGIST | DRIVER
- status: PENDING | ACTIVE | BLOCKED
- Связь: Driver → Vehicle (текущее назначение)

### Vehicle (Транспортное средство)
- id, brand, model, licensePlate, trailerPlate, capacity, volumeCapacity
- ownershipType: OWNED | JOINT | LEASED | RENTED | GRATUITOUS (1-5 по форме ТН)
- status: ACTIVE | INACTIVE
- Связи: Vehicle → allowedCargos[], Vehicle → assignedDriver

### Contractor (Контрагент)
- id, name, inn, legalAddress, actualAddress
- type: SENDER | RECEIVER | BOTH
- contactPhone, contactPerson

### Cargo (Груз)
- id, name, technicalSpec (ТУ), unCode, hazardClass, packagingMethod

### Route (Маршрут)
- id, senderContractor, receiverContractor, loadingAddress, unloadingAddress, description
- Шаблон "откуда → куда", переиспользуется при создании рейсов

### Trip (Рейс)
- id, route, driver, vehicle, cargo
- status: ASSIGNED | EN_ROUTE_TO_LOADING | LOADING | EN_ROUTE_TO_UNLOADING | UNLOADING | COMPLETED | CANCELLED
- assignedAt, startedAt, completedAt

### Waybill (Данные накладной)
- id, trip, ttnNumber, weight (тонны, decimal), loadWeight (вес налива, тонны, decimal), driverFullName
- photoUrl (опционально)
- submittedAt, submittedOffline (boolean)

---

## 2. Роли и права доступа (RBAC)

### ADMIN (Руководитель)
- Всё, что может LOGIST
- Управление пользователями: создание аккаунтов, апрув регистраций, блокировка
- Просмотр аналитики и отчётов, экспорт CSV/Excel
- Настройки системы

### LOGIST (Логист)
- CRUD: контрагенты, маршруты, грузы, ТС
- Назначение/переназначение водителя на ТС
- Создание рейсов, назначение водителю
- Просмотр всех рейсов и накладных, фильтрация, поиск
- SSE-уведомления при отправке накладной

### DRIVER (Водитель)
- Просмотр только своих назначенных рейсов
- Смена статуса рейса (кнопки этапов)
- Отправка данных накладной (ТТН, вес, вес налива, ФИО)
- Опциональное фото накладной
- Просмотр истории своих рейсов

---

## 3. Бизнес-флоу рейса

### Создание (админка)
1. Логист/руководитель создаёт рейс: выбирает маршрут, водителя, ТС, груз
2. Поля предзаполняются: ФИО водителя, госномер ТС — из справочников
3. Рейс → статус ASSIGNED

### Выполнение (водитель, мобилка)
1. Водитель видит назначенный рейс — карточка с маршрутом, грузом, адресами
2. "Начать рейс" → EN_ROUTE_TO_LOADING
3. *(Опционально)* "Прибыл на погрузку" → LOADING
4. **Ключевой шаг — отправка накладной:**
   - Номер ТТН (ввод вручную)
   - Вес (ввод вручную)
   - Вес налива (ввод вручную)
   - ФИО (предзаполнено, можно поправить)
   - Фото накладной (опционально)
   - Большая кнопка "Отправить"
5. После отправки → EN_ROUTE_TO_UNLOADING
6. *(Опционально)* "Прибыл на выгрузку" → UNLOADING
7. *(Опционально)* "Рейс завершён" → COMPLETED

**Принцип:** Обязательный шаг — только отправка накладной (п.4). Кнопки этапов доступны, но не блокируют флоу.

### Уведомления
- Отправка накладной → SSE → логист/руководитель видят в реальном времени
- *(v3)* Telegram-бот дублирует руководителю

### Офлайн (v2)
- Данные сохраняются в IndexedDB
- Автоматическая отправка при появлении сети
- Флаг submittedOffline в админке

---

## 4. Структура интерфейсов

### Админка (десктоп + планшет)

**Layout:** Sidebar навигация + контентная область

**Разделы:**
- **Дашборд** — активные рейсы, свежие накладные, быстрая статистика
- **Рейсы** — таблица с фильтрами (статус, водитель, маршрут, дата), создание, детальная карточка
- **Накладные** — таблица, поиск по ТТН, фильтры, просмотр данных + фото, экспорт
- **Водители** — список, карточка (ФИО, телефон, ТС, история рейсов)
- **Транспорт** — список ТС, карточка, привязка водителей и грузов
- **Контрагенты** — CRUD
- **Маршруты** — список, создание из контрагентов
- **Грузы** — справочник CRUD
- **Пользователи** (ADMIN) — список, создание, апрув заявок
- **Аналитика** (ADMIN) — рейсы за период, суммарный вес, экспорт

### Водительский PWA (мобильный)

**Принципы:** Минимум текста, 48px+ тач-зоны, 2-3 действия на экран, контрастные цвета.

**Экраны:**
1. **Логин** — два поля + кнопка
2. **Ожидание подтверждения** — заглушка
3. **Мои рейсы** — список назначенных (обычно 1-2)
4. **Активный рейс** — статус, маршрут, кнопки этапов
5. **Отправка накладной** — 3 обязательных поля + ФИО + фото + "Отправить"
6. **История** — список завершённых рейсов

---

## 5. Технический стек

### Бэкенд
- NestJS + TypeScript
- PostgreSQL + Prisma ORM
- JWT авторизация (access + refresh tokens)
- SSE (@Sse() из NestJS)
- Multer для загрузки фото
- class-validator + class-transformer
- Scalar (API-документация, замена Swagger UI)
- Модули: auth, users, vehicles, contractors, cargos, routes, trips, waybills, notifications

### Фронтенд
- React 18 + TypeScript + Vite
- TanStack Router (роутинг, гарды по ролям)
- React Query (серверный стейт, кеш, инвалидация)
- Effector (локальный UI-стейт, стейт-машина рейса, SSE-фабрика)
- React Hook Form + Zod (формы и валидация)
- shadcn/ui + Tailwind CSS
- vite-plugin-pwa
- SSE-архитектура:
  - createSSEConnectionFactory на Effector (@withease/factories) — управление EventSource
  - SSE-события триггерят queryClient.invalidateQueries() для инвалидации React Query кеша
  - Без промежуточной шины событий ($$globalEvents не нужна)
- FSD-архитектура:
  - shared/ — UI-кит (обёртки shadcn), API-клиент, SSE-фабрика, типы
  - entities/ — trip, waybill, vehicle, contractor, cargo, user, route
  - features/ — create-trip, submit-waybill, manage-users, filter-trips
  - widgets/ — trip-table, waybill-list, sidebar, dashboard-stats
  - pages/ — разделы админки + водительские экраны
  - app/ — провайдеры, роутинг, layout

### Разделение интерфейсов
Один фронтенд-проект, два layout:
- AdminLayout — sidebar + header (десктоп/планшет)
- DriverLayout — мобильный, без sidebar, крупные элементы
- Гарды по ролям через TanStack Router (beforeLoad)

### Монорепозиторий
- apps/api (NestJS) + apps/web (React/Vite)
- packages/shared — общие типы, константы
- pnpm workspaces

---

## 6. API-эндпоинты

### Auth
- POST /auth/register — регистрация
- POST /auth/login — вход → tokens
- POST /auth/refresh — обновление токена
- GET /auth/me — текущий пользователь

### Users (ADMIN)
- GET /users — список
- POST /users — создание
- PATCH /users/:id — редактирование, апрув/блок

### Vehicles
- GET /vehicles — список
- POST /vehicles — создание
- PATCH /vehicles/:id — редактирование

### Contractors
- GET /contractors — список
- POST /contractors — создание
- PATCH /contractors/:id — редактирование

### Cargos
- GET /cargos — список
- POST /cargos — создание
- PATCH /cargos/:id — редактирование

### Routes
- GET /routes — список
- POST /routes — создание
- PATCH /routes/:id — редактирование

### Trips
- GET /trips — список с фильтрами
- GET /trips/my — рейсы текущего водителя
- POST /trips — создание (LOGIST/ADMIN)
- PATCH /trips/:id/status — смена статуса (DRIVER)

### Waybills
- GET /waybills — список, поиск по ТТН, фильтры
- POST /waybills — отправка данных (DRIVER) → триггер SSE
- POST /waybills/:id/photo — загрузка фото

### Notifications
- GET /notifications/sse — SSE-поток для админки

### Analytics (ADMIN)
- GET /analytics/trips — рейсы за период
- GET /analytics/weight — суммарный вес
- GET /analytics/export — CSV/Excel

---

## 7. MVP-скоуп и итерации

### MVP (v1)
- Auth (логин/пароль, JWT, RBAC)
- Справочники: водители, ТС, контрагенты, грузы, маршруты
- Создание рейсов
- Водительский PWA: просмотр рейса, отправка накладной
- Админка: таблицы рейсов и накладных, фильтры, поиск по ТТН
- SSE-уведомления
- Scalar API-документация
- Управление пользователями

### v2
- Фото накладной
- Офлайн-режим водителя
- Аналитика и экспорт
- Полный стейт-машина этапов рейса

### v3
- Telegram-бот
- OCR по фото накладной
- ГЛОНАСС-интеграция
