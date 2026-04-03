# Iridium TMS — Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional NestJS REST API for Iridium TMS — auth, RBAC, all CRUD modules, trip lifecycle, waybill submission, SSE notifications, and Scalar API docs.

**Architecture:** Monorepo with pnpm workspaces. Backend lives in `apps/api/`, shared types in `packages/shared/`. NestJS modular structure with Prisma ORM, JWT auth (access + refresh), role-based guards, and SSE for realtime notifications.

**Tech Stack:** NestJS, TypeScript, PostgreSQL, Prisma, JWT (passport-jwt), class-validator, class-transformer, @nestjs/swagger + @scalar/nestjs-api-reference, pnpm workspaces.

---

## File Structure

```
iridium/
├── package.json                          # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── .env.example
├── packages/
│   └── shared/
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── enums/
│           │   ├── role.ts                # UserRole enum
│           │   ├── user-status.ts         # UserStatus enum
│           │   ├── trip-status.ts         # TripStatus enum
│           │   ├── ownership-type.ts      # VehicleOwnershipType enum
│           │   ├── contractor-type.ts     # ContractorType enum
│           │   └── vehicle-status.ts      # VehicleStatus enum
│           └── types/
│               ├── auth.ts               # Login/register DTOs
│               ├── user.ts               # User response type
│               ├── vehicle.ts            # Vehicle types
│               ├── contractor.ts         # Contractor types
│               ├── cargo.ts              # Cargo types
│               ├── route.ts              # Route types
│               ├── trip.ts               # Trip types
│               └── waybill.ts            # Waybill types
├── apps/
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json
│       ├── .env
│       ├── .env.example
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── prisma/
│       │   │   ├── prisma.module.ts
│       │   │   └── prisma.service.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── strategies/
│       │   │   │   └── jwt.strategy.ts
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   └── roles.guard.ts
│       │   │   ├── decorators/
│       │   │   │   ├── roles.decorator.ts
│       │   │   │   └── current-user.decorator.ts
│       │   │   └── dto/
│       │   │       ├── login.dto.ts
│       │   │       ├── register.dto.ts
│       │   │       └── token-response.dto.ts
│       │   ├── users/
│       │   │   ├── users.module.ts
│       │   │   ├── users.controller.ts
│       │   │   ├── users.service.ts
│       │   │   └── dto/
│       │   │       ├── create-user.dto.ts
│       │   │       └── update-user.dto.ts
│       │   ├── vehicles/
│       │   │   ├── vehicles.module.ts
│       │   │   ├── vehicles.controller.ts
│       │   │   ├── vehicles.service.ts
│       │   │   └── dto/
│       │   │       ├── create-vehicle.dto.ts
│       │   │       └── update-vehicle.dto.ts
│       │   ├── contractors/
│       │   │   ├── contractors.module.ts
│       │   │   ├── contractors.controller.ts
│       │   │   ├── contractors.service.ts
│       │   │   └── dto/
│       │   │       ├── create-contractor.dto.ts
│       │   │       └── update-contractor.dto.ts
│       │   ├── cargos/
│       │   │   ├── cargos.module.ts
│       │   │   ├── cargos.controller.ts
│       │   │   ├── cargos.service.ts
│       │   │   └── dto/
│       │   │       ├── create-cargo.dto.ts
│       │   │       └── update-cargo.dto.ts
│       │   ├── routes/
│       │   │   ├── routes.module.ts
│       │   │   ├── routes.controller.ts
│       │   │   ├── routes.service.ts
│       │   │   └── dto/
│       │   │       ├── create-route.dto.ts
│       │   │       └── update-route.dto.ts
│       │   ├── trips/
│       │   │   ├── trips.module.ts
│       │   │   ├── trips.controller.ts
│       │   │   ├── trips.service.ts
│       │   │   └── dto/
│       │   │       ├── create-trip.dto.ts
│       │   │       ├── update-trip-status.dto.ts
│       │   │       └── trip-filter.dto.ts
│       │   ├── waybills/
│       │   │   ├── waybills.module.ts
│       │   │   ├── waybills.controller.ts
│       │   │   ├── waybills.service.ts
│       │   │   └── dto/
│       │   │       ├── create-waybill.dto.ts
│       │   │       └── waybill-filter.dto.ts
│       │   └── notifications/
│       │       ├── notifications.module.ts
│       │       ├── notifications.controller.ts
│       │       └── notifications.service.ts
│       └── prisma/
│           ├── schema.prisma
│           └── seed.ts
```

---

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.env.example`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`

- [ ] **Step 1: Initialize git repo and root package.json**

```bash
cd /Users/vadimkhalikov/Documents/Development/iridium
git init
```

```json
// package.json
{
  "name": "iridium",
  "private": true,
  "scripts": {
    "api:dev": "pnpm --filter @iridium/api run start:dev",
    "api:build": "pnpm --filter @iridium/api run build",
    "db:migrate": "pnpm --filter @iridium/api run db:migrate",
    "db:seed": "pnpm --filter @iridium/api run db:seed",
    "db:studio": "pnpm --filter @iridium/api run db:studio"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

```gitignore
# .gitignore
node_modules/
dist/
.env
*.log
.DS_Store
```

```env
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/iridium
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
```

- [ ] **Step 2: Create shared package**

```json
// packages/shared/package.json
{
  "name": "@iridium/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

```ts
// packages/shared/src/index.ts
export * from './enums/role';
export * from './enums/user-status';
export * from './enums/trip-status';
export * from './enums/ownership-type';
export * from './enums/contractor-type';
export * from './enums/vehicle-status';
```

- [ ] **Step 3: Create all shared enums**

```ts
// packages/shared/src/enums/role.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  LOGIST = 'LOGIST',
  DRIVER = 'DRIVER',
}
```

```ts
// packages/shared/src/enums/user-status.ts
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}
```

```ts
// packages/shared/src/enums/trip-status.ts
export enum TripStatus {
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE_TO_LOADING = 'EN_ROUTE_TO_LOADING',
  LOADING = 'LOADING',
  EN_ROUTE_TO_UNLOADING = 'EN_ROUTE_TO_UNLOADING',
  UNLOADING = 'UNLOADING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```

```ts
// packages/shared/src/enums/ownership-type.ts
export enum VehicleOwnershipType {
  OWNED = 'OWNED',
  JOINT = 'JOINT',
  LEASED = 'LEASED',
  RENTED = 'RENTED',
  GRATUITOUS = 'GRATUITOUS',
}
```

```ts
// packages/shared/src/enums/contractor-type.ts
export enum ContractorType {
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER',
  BOTH = 'BOTH',
}
```

```ts
// packages/shared/src/enums/vehicle-status.ts
export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
```

- [ ] **Step 4: Install pnpm and verify workspace**

```bash
pnpm install
pnpm --filter @iridium/shared run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: init monorepo with pnpm workspaces and shared enums"
```

---

### Task 2: NestJS App Scaffolding

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`, `apps/api/src/app.module.ts`
- Create: `apps/api/.env`, `apps/api/.env.example`

- [ ] **Step 1: Create NestJS app package.json**

```json
// apps/api/package.json
{
  "name": "@iridium/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/swagger": "^8.0.0",
    "@scalar/nestjs-api-reference": "^0.3.0",
    "@prisma/client": "^6.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "@iridium/shared": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^5.0.0",
    "@types/passport-jwt": "^4.0.1",
    "@types/node": "^22.0.0",
    "prisma": "^6.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.7.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.2.0"
  }
}
```

- [ ] **Step 2: Create tsconfig and nest-cli.json**

```json
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@iridium/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["src", "prisma"]
}
```

```json
// apps/api/nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

```env
# apps/api/.env.example
DATABASE_URL=postgresql://user:password@localhost:5432/iridium
JWT_ACCESS_SECRET=your-access-secret-change-me
JWT_REFRESH_SECRET=your-refresh-secret-change-me
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
```

- [ ] **Step 3: Create main.ts with Swagger + Scalar + CORS**

```ts
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Iridium TMS API')
    .setDescription('Transport Management System for oil product logistics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/api/docs',
    apiReference({
      spec: { content: document },
      theme: 'kepler',
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
  console.log(`Docs at http://localhost:${port}/api/docs`);
}

bootstrap();
```

- [ ] **Step 4: Create app.module.ts**

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 5: Install dependencies and verify it starts**

```bash
cd /Users/vadimkhalikov/Documents/Development/iridium
pnpm install
```

Copy `.env.example` to `.env` in `apps/api/`, set a real `DATABASE_URL`.

```bash
pnpm api:dev
```

Expected: NestJS starts, logs `API running on http://localhost:3000/api`.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold NestJS app with Swagger/Scalar and global config"
```

---

### Task 3: Prisma Schema & Database

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/prisma/prisma.service.ts`

- [ ] **Step 1: Create Prisma schema**

```prisma
// apps/api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  LOGIST
  DRIVER
}

enum UserStatus {
  PENDING
  ACTIVE
  BLOCKED
}

enum TripStatus {
  ASSIGNED
  EN_ROUTE_TO_LOADING
  LOADING
  EN_ROUTE_TO_UNLOADING
  UNLOADING
  COMPLETED
  CANCELLED
}

enum VehicleOwnershipType {
  OWNED
  JOINT
  LEASED
  RENTED
  GRATUITOUS
}

enum ContractorType {
  SENDER
  RECEIVER
  BOTH
}

enum VehicleStatus {
  ACTIVE
  INACTIVE
}

model User {
  id        String     @id @default(uuid())
  login     String     @unique
  password  String
  fullName  String
  phone     String?
  role      UserRole
  status    UserStatus @default(PENDING)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  assignedVehicle Vehicle? @relation("AssignedDriver")
  trips           Trip[]
  waybills        Waybill[]

  @@map("users")
}

model Vehicle {
  id              String               @id @default(uuid())
  brand           String
  model           String
  licensePlate    String               @unique
  trailerPlate    String?
  capacity        Decimal?             @db.Decimal(10, 3)
  volumeCapacity  Decimal?             @db.Decimal(10, 3)
  ownershipType   VehicleOwnershipType @default(OWNED)
  status          VehicleStatus        @default(ACTIVE)
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  assignedDriverId String? @unique
  assignedDriver   User?   @relation("AssignedDriver", fields: [assignedDriverId], references: [id])

  allowedCargos VehicleCargo[]
  trips         Trip[]

  @@map("vehicles")
}

model VehicleCargo {
  vehicleId String
  cargoId   String

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  cargo   Cargo   @relation(fields: [cargoId], references: [id], onDelete: Cascade)

  @@id([vehicleId, cargoId])
  @@map("vehicle_cargos")
}

model Contractor {
  id            String         @id @default(uuid())
  name          String
  inn           String?
  legalAddress  String?
  actualAddress String?
  type          ContractorType
  contactPhone  String?
  contactPerson String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  senderRoutes   Route[] @relation("Sender")
  receiverRoutes Route[] @relation("Receiver")

  @@map("contractors")
}

model Cargo {
  id              String  @id @default(uuid())
  name            String
  technicalSpec   String?
  unCode          String?
  hazardClass     String?
  packagingMethod String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  vehicles VehicleCargo[]
  trips    Trip[]

  @@map("cargos")
}

model Route {
  id               String @id @default(uuid())
  loadingAddress   String
  unloadingAddress String
  description      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  senderContractorId   String
  senderContractor     Contractor @relation("Sender", fields: [senderContractorId], references: [id])
  receiverContractorId String
  receiverContractor   Contractor @relation("Receiver", fields: [receiverContractorId], references: [id])

  trips Trip[]

  @@map("routes")
}

model Trip {
  id          String     @id @default(uuid())
  status      TripStatus @default(ASSIGNED)
  assignedAt  DateTime   @default(now())
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  routeId   String
  route     Route   @relation(fields: [routeId], references: [id])
  driverId  String
  driver    User    @relation(fields: [driverId], references: [id])
  vehicleId String
  vehicle   Vehicle @relation(fields: [vehicleId], references: [id])
  cargoId   String
  cargo     Cargo   @relation(fields: [cargoId], references: [id])

  waybill Waybill?

  @@map("trips")
}

model Waybill {
  id              String   @id @default(uuid())
  ttnNumber       String
  weight          Decimal  @db.Decimal(10, 3)
  loadWeight      Decimal  @db.Decimal(10, 3)
  driverFullName  String
  photoUrl        String?
  submittedAt     DateTime @default(now())
  submittedOffline Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tripId String @unique
  trip   Trip   @relation(fields: [tripId], references: [id])

  @@map("waybills")
}
```

- [ ] **Step 2: Create PrismaService and PrismaModule**

```ts
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```ts
// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 3: Run initial migration**

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

Expected: Migration created, Prisma client generated.

- [ ] **Step 4: Verify app still starts**

```bash
cd /Users/vadimkhalikov/Documents/Development/iridium
pnpm api:dev
```

Expected: NestJS starts without errors, connects to database.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Prisma schema with all entities and initial migration"
```

---

### Task 4: Auth Module — JWT Strategy & Guards

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/guards/roles.guard.ts`
- Create: `apps/api/src/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/auth/decorators/current-user.decorator.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/dto/register.dto.ts`
- Create: `apps/api/src/auth/dto/token-response.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ivanov' })
  @IsString()
  @MinLength(3)
  login: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Иванов Иван Иванович' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+79001234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
```

```ts
// apps/api/src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ivanov' })
  @IsString()
  login: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
```

```ts
// apps/api/src/auth/dto/token-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
```

- [ ] **Step 2: Create JWT strategy and guards**

```ts
// apps/api/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

```ts
// apps/api/src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

```ts
// apps/api/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@iridium/shared';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

- [ ] **Step 3: Create decorators**

```ts
// apps/api/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@iridium/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

```ts
// apps/api/src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 4: Create AuthService**

```ts
// apps/api/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@iridium/shared';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (existing) {
      throw new ConflictException('Login already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 'DRIVER',
        status: 'PENDING',
      },
    });

    return { id: user.id, status: user.status };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Account is blocked');
    }

    if (user.status === UserStatus.PENDING) {
      return { status: 'PENDING' as const };
    }

    const tokens = await this.generateTokens(user.id);
    return { ...tokens, status: 'ACTIVE' as const };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user.id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

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
      },
    });

    return user;
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRATION'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
```

- [ ] **Step 5: Create AuthController**

```ts
// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new driver account (status: PENDING)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }
}
```

- [ ] **Step 6: Create AuthModule and register in AppModule**

```ts
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [JwtStrategy, RolesGuard],
})
export class AuthModule {}
```

Update `app.module.ts`:

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Test auth manually via Scalar**

```bash
pnpm api:dev
```

Open `http://localhost:3000/api/docs`. Test:
1. POST `/api/auth/register` — should create user with PENDING status
2. POST `/api/auth/login` — should return `{ status: "PENDING" }` for the new user

Expected: both endpoints respond correctly.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add auth module with JWT, RBAC guards, register/login/refresh/me"
```

---

### Task 5: Users Module (ADMIN)

**Files:**
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/users/users.service.ts`
- Create: `apps/api/src/users/users.controller.ts`
- Create: `apps/api/src/users/dto/create-user.dto.ts`
- Create: `apps/api/src/users/dto/update-user.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@iridium/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'petrov' })
  @IsString()
  @MinLength(3)
  login: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Петров Пётр Петрович' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+79001234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DRIVER })
  @IsEnum(UserRole)
  role: UserRole;
}
```

```ts
// apps/api/src/users/dto/update-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '@iridium/shared';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
```

- [ ] **Step 2: Create UsersService**

```ts
// apps/api/src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  login: true,
  fullName: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
  assignedVehicle: { select: { id: true, brand: true, model: true, licensePlate: true } },
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string, status?: string) {
    return this.prisma.user.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(status && { status: status as any }),
      },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (existing) {
      throw new ConflictException('Login already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
        status: 'ACTIVE',
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = { ...dto };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }
}
```

- [ ] **Step 3: Create UsersController**

```ts
// apps/api/src/users/users.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('role') role?: string, @Query('status') status?: string) {
    return this.usersService.findAll(role, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user account' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (approve, block, edit)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
```

- [ ] **Step 4: Create UsersModule and register in AppModule**

```ts
// apps/api/src/users/users.module.ts
import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Add to `app.module.ts` imports:

```ts
import { UsersModule } from './users/users.module';

// In imports array, add:
UsersModule,
```

- [ ] **Step 5: Verify via Scalar**

```bash
pnpm api:dev
```

Test in Scalar: create an ADMIN user via register, manually set status to ACTIVE in DB, login, use token to access `/api/users`.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add users module with CRUD and ADMIN-only access"
```

---

### Task 6: Vehicles Module

**Files:**
- Create: `apps/api/src/vehicles/vehicles.module.ts`
- Create: `apps/api/src/vehicles/vehicles.service.ts`
- Create: `apps/api/src/vehicles/vehicles.controller.ts`
- Create: `apps/api/src/vehicles/dto/create-vehicle.dto.ts`
- Create: `apps/api/src/vehicles/dto/update-vehicle.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/vehicles/dto/create-vehicle.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { VehicleOwnershipType } from '@iridium/shared';

export class CreateVehicleDto {
  @ApiProperty({ example: 'СКАНИЯ' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'R440' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'Е063НМ156' })
  @IsString()
  licensePlate: string;

  @ApiProperty({ example: 'ВК861256', required: false })
  @IsString()
  @IsOptional()
  trailerPlate?: string;

  @ApiProperty({ example: 25.04, required: false })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: 41.36, required: false })
  @IsNumber()
  @IsOptional()
  volumeCapacity?: number;

  @ApiProperty({ enum: VehicleOwnershipType, example: VehicleOwnershipType.GRATUITOUS })
  @IsEnum(VehicleOwnershipType)
  ownershipType: VehicleOwnershipType;

  @ApiProperty({ required: false, description: 'Driver user ID to assign' })
  @IsString()
  @IsOptional()
  assignedDriverId?: string;

  @ApiProperty({ required: false, type: [String], description: 'Cargo IDs allowed for this vehicle' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedCargoIds?: string[];
}
```

```ts
// apps/api/src/vehicles/dto/update-vehicle.dto.ts
import { PartialType } from '@nestjs/swagger';

import { CreateVehicleDto } from './create-vehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
```

- [ ] **Step 2: Create VehiclesService**

```ts
// apps/api/src/vehicles/vehicles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const VEHICLE_INCLUDE = {
  assignedDriver: { select: { id: true, fullName: true } },
  allowedCargos: { include: { cargo: { select: { id: true, name: true } } } },
};

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.vehicle.findMany({
      where: status ? { status: status as any } : undefined,
      include: VEHICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: VEHICLE_INCLUDE,
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    const { allowedCargoIds, ...data } = dto;

    return this.prisma.vehicle.create({
      data: {
        ...data,
        allowedCargos: allowedCargoIds?.length
          ? { create: allowedCargoIds.map((cargoId) => ({ cargoId })) }
          : undefined,
      },
      include: VEHICLE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);

    const { allowedCargoIds, ...data } = dto;

    if (allowedCargoIds !== undefined) {
      await this.prisma.vehicleCargo.deleteMany({ where: { vehicleId: id } });
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        allowedCargos: allowedCargoIds?.length
          ? { create: allowedCargoIds.map((cargoId) => ({ cargoId })) }
          : undefined,
      },
      include: VEHICLE_INCLUDE,
    });
  }
}
```

- [ ] **Step 3: Create VehiclesController**

```ts
// apps/api/src/vehicles/vehicles.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LOGIST)
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) {
    return this.vehiclesService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }
}
```

- [ ] **Step 4: Create VehiclesModule and register in AppModule**

```ts
// apps/api/src/vehicles/vehicles.module.ts
import { Module } from '@nestjs/common';

import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
```

Add `VehiclesModule` to `app.module.ts` imports.

- [ ] **Step 5: Verify via Scalar and commit**

```bash
pnpm api:dev
```

Test CRUD in Scalar.

```bash
git add .
git commit -m "feat: add vehicles module with CRUD, driver assignment, cargo binding"
```

---

### Task 7: Contractors Module

**Files:**
- Create: `apps/api/src/contractors/contractors.module.ts`
- Create: `apps/api/src/contractors/contractors.service.ts`
- Create: `apps/api/src/contractors/contractors.controller.ts`
- Create: `apps/api/src/contractors/dto/create-contractor.dto.ts`
- Create: `apps/api/src/contractors/dto/update-contractor.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/contractors/dto/create-contractor.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ContractorType } from '@iridium/shared';

export class CreateContractorDto {
  @ApiProperty({ example: 'ООО "Интерком"' })
  @IsString()
  name: string;

  @ApiProperty({ example: '5609182980', required: false })
  @IsString()
  @IsOptional()
  inn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  legalAddress?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  actualAddress?: string;

  @ApiProperty({ enum: ContractorType, example: ContractorType.SENDER })
  @IsEnum(ContractorType)
  type: ContractorType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;
}
```

```ts
// apps/api/src/contractors/dto/update-contractor.dto.ts
import { PartialType } from '@nestjs/swagger';

import { CreateContractorDto } from './create-contractor.dto';

export class UpdateContractorDto extends PartialType(CreateContractorDto) {}
```

- [ ] **Step 2: Create ContractorsService**

```ts
// apps/api/src/contractors/contractors.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string) {
    return this.prisma.contractor.findMany({
      where: type ? { type: type as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contractor = await this.prisma.contractor.findUnique({ where: { id } });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    return contractor;
  }

  async create(dto: CreateContractorDto) {
    return this.prisma.contractor.create({ data: dto });
  }

  async update(id: string, dto: UpdateContractorDto) {
    await this.findOne(id);
    return this.prisma.contractor.update({ where: { id }, data: dto });
  }
}
```

- [ ] **Step 3: Create ContractorsController**

```ts
// apps/api/src/contractors/contractors.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@ApiTags('Contractors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LOGIST)
@Controller('contractors')
export class ContractorsController {
  constructor(private contractorsService: ContractorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contractors' })
  @ApiQuery({ name: 'type', required: false, enum: ['SENDER', 'RECEIVER', 'BOTH'] })
  findAll(@Query('type') type?: string) {
    return this.contractorsService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contractor by ID' })
  findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create contractor' })
  create(@Body() dto: CreateContractorDto) {
    return this.contractorsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contractor' })
  update(@Param('id') id: string, @Body() dto: UpdateContractorDto) {
    return this.contractorsService.update(id, dto);
  }
}
```

- [ ] **Step 4: Create module, register, verify, commit**

```ts
// apps/api/src/contractors/contractors.module.ts
import { Module } from '@nestjs/common';

import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';

@Module({
  controllers: [ContractorsController],
  providers: [ContractorsService],
})
export class ContractorsModule {}
```

Add `ContractorsModule` to `app.module.ts` imports.

```bash
pnpm api:dev
git add .
git commit -m "feat: add contractors module with CRUD"
```

---

### Task 8: Cargos Module

**Files:**
- Create: `apps/api/src/cargos/cargos.module.ts`
- Create: `apps/api/src/cargos/cargos.service.ts`
- Create: `apps/api/src/cargos/cargos.controller.ts`
- Create: `apps/api/src/cargos/dto/create-cargo.dto.ts`
- Create: `apps/api/src/cargos/dto/update-cargo.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/cargos/dto/create-cargo.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateCargoDto {
  @ApiProperty({ example: 'Конденсат газовый смесевой' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ТУ 19.20.32-001-20484253-2018', required: false })
  @IsString()
  @IsOptional()
  technicalSpec?: string;

  @ApiProperty({ example: 'UN 3295', required: false })
  @IsString()
  @IsOptional()
  unCode?: string;

  @ApiProperty({ example: '3', required: false })
  @IsString()
  @IsOptional()
  hazardClass?: string;

  @ApiProperty({ example: 'наливом', required: false })
  @IsString()
  @IsOptional()
  packagingMethod?: string;
}
```

```ts
// apps/api/src/cargos/dto/update-cargo.dto.ts
import { PartialType } from '@nestjs/swagger';

import { CreateCargoDto } from './create-cargo.dto';

export class UpdateCargoDto extends PartialType(CreateCargoDto) {}
```

- [ ] **Step 2: Create CargosService**

```ts
// apps/api/src/cargos/cargos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';

@Injectable()
export class CargosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cargo.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const cargo = await this.prisma.cargo.findUnique({ where: { id } });

    if (!cargo) {
      throw new NotFoundException('Cargo not found');
    }

    return cargo;
  }

  async create(dto: CreateCargoDto) {
    return this.prisma.cargo.create({ data: dto });
  }

  async update(id: string, dto: UpdateCargoDto) {
    await this.findOne(id);
    return this.prisma.cargo.update({ where: { id }, data: dto });
  }
}
```

- [ ] **Step 3: Create CargosController**

```ts
// apps/api/src/cargos/cargos.controller.ts
import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CargosService } from './cargos.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';

@ApiTags('Cargos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LOGIST)
@Controller('cargos')
export class CargosController {
  constructor(private cargosService: CargosService) {}

  @Get()
  @ApiOperation({ summary: 'List all cargo types' })
  findAll() {
    return this.cargosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cargo by ID' })
  findOne(@Param('id') id: string) {
    return this.cargosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create cargo type' })
  create(@Body() dto: CreateCargoDto) {
    return this.cargosService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update cargo type' })
  update(@Param('id') id: string, @Body() dto: UpdateCargoDto) {
    return this.cargosService.update(id, dto);
  }
}
```

- [ ] **Step 4: Create module, register, verify, commit**

```ts
// apps/api/src/cargos/cargos.module.ts
import { Module } from '@nestjs/common';

import { CargosController } from './cargos.controller';
import { CargosService } from './cargos.service';

@Module({
  controllers: [CargosController],
  providers: [CargosService],
})
export class CargosModule {}
```

Add `CargosModule` to `app.module.ts` imports.

```bash
pnpm api:dev
git add .
git commit -m "feat: add cargos module with CRUD"
```

---

### Task 9: Routes Module

**Files:**
- Create: `apps/api/src/routes/routes.module.ts`
- Create: `apps/api/src/routes/routes.service.ts`
- Create: `apps/api/src/routes/routes.controller.ts`
- Create: `apps/api/src/routes/dto/create-route.dto.ts`
- Create: `apps/api/src/routes/dto/update-route.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/routes/dto/create-route.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ description: 'Sender contractor ID' })
  @IsString()
  senderContractorId: string;

  @ApiProperty({ description: 'Receiver contractor ID' })
  @IsString()
  receiverContractorId: string;

  @ApiProperty({ example: 'Оренбургская обл., Переволоцкий, ул. Промышленная, д.4' })
  @IsString()
  loadingAddress: string;

  @ApiProperty({ example: 'Оренбургский район, с/с Подгородне-Покровский, 26 км' })
  @IsString()
  unloadingAddress: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
```

```ts
// apps/api/src/routes/dto/update-route.dto.ts
import { PartialType } from '@nestjs/swagger';

import { CreateRouteDto } from './create-route.dto';

export class UpdateRouteDto extends PartialType(CreateRouteDto) {}
```

- [ ] **Step 2: Create RoutesService**

```ts
// apps/api/src/routes/routes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

const ROUTE_INCLUDE = {
  senderContractor: { select: { id: true, name: true, inn: true } },
  receiverContractor: { select: { id: true, name: true, inn: true } },
};

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.route.findMany({
      include: ROUTE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: ROUTE_INCLUDE,
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: dto,
      include: ROUTE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateRouteDto) {
    await this.findOne(id);
    return this.prisma.route.update({
      where: { id },
      data: dto,
      include: ROUTE_INCLUDE,
    });
  }
}
```

- [ ] **Step 3: Create RoutesController**

```ts
// apps/api/src/routes/routes.controller.ts
import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LOGIST)
@Controller('routes')
export class RoutesController {
  constructor(private routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: 'List all routes' })
  findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route by ID' })
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create route' })
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update route' })
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }
}
```

- [ ] **Step 4: Create module, register, verify, commit**

```ts
// apps/api/src/routes/routes.module.ts
import { Module } from '@nestjs/common';

import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';

@Module({
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}
```

Add `RoutesModule` to `app.module.ts` imports.

```bash
pnpm api:dev
git add .
git commit -m "feat: add routes module with CRUD and contractor relations"
```

---

### Task 10: Trips Module

**Files:**
- Create: `apps/api/src/trips/trips.module.ts`
- Create: `apps/api/src/trips/trips.service.ts`
- Create: `apps/api/src/trips/trips.controller.ts`
- Create: `apps/api/src/trips/dto/create-trip.dto.ts`
- Create: `apps/api/src/trips/dto/update-trip-status.dto.ts`
- Create: `apps/api/src/trips/dto/trip-filter.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/trips/dto/create-trip.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ description: 'Route ID' })
  @IsString()
  routeId: string;

  @ApiProperty({ description: 'Driver user ID' })
  @IsString()
  driverId: string;

  @ApiProperty({ description: 'Vehicle ID' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ description: 'Cargo ID' })
  @IsString()
  cargoId: string;
}
```

```ts
// apps/api/src/trips/dto/update-trip-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TripStatus } from '@iridium/shared';

export class UpdateTripStatusDto {
  @ApiProperty({ enum: TripStatus })
  @IsEnum(TripStatus)
  status: TripStatus;
}
```

```ts
// apps/api/src/trips/dto/trip-filter.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { TripStatus } from '@iridium/shared';

export class TripFilterDto {
  @ApiProperty({ enum: TripStatus, required: false })
  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  routeId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
```

- [ ] **Step 2: Create TripsService**

```ts
// apps/api/src/trips/trips.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TripStatus } from '@iridium/shared';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';
import { NotificationsService } from '../notifications/notifications.service';

const TRIP_INCLUDE = {
  route: {
    include: {
      senderContractor: { select: { id: true, name: true } },
      receiverContractor: { select: { id: true, name: true } },
    },
  },
  driver: { select: { id: true, fullName: true, phone: true } },
  vehicle: { select: { id: true, brand: true, model: true, licensePlate: true } },
  cargo: { select: { id: true, name: true } },
  waybill: true,
};

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(filters: TripFilterDto) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.dateFrom || filters.dateTo) {
      where.assignedAt = {};
      if (filters.dateFrom) where.assignedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.assignedAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.trip.findMany({
      where,
      include: TRIP_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyTrips(driverId: string) {
    return this.prisma.trip.findMany({
      where: { driverId },
      include: TRIP_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: TRIP_INCLUDE,
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async create(dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: {
        routeId: dto.routeId,
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        cargoId: dto.cargoId,
        status: TripStatus.ASSIGNED,
      },
      include: TRIP_INCLUDE,
    });
  }

  async updateStatus(id: string, status: TripStatus, userId: string) {
    const trip = await this.findOne(id);

    if (trip.driverId !== userId) {
      throw new ForbiddenException('You can only update your own trips');
    }

    const data: any = { status };

    if (status === TripStatus.EN_ROUTE_TO_LOADING && !trip.startedAt) {
      data.startedAt = new Date();
    }

    if (status === TripStatus.COMPLETED) {
      data.completedAt = new Date();
    }

    const updated = await this.prisma.trip.update({
      where: { id },
      data,
      include: TRIP_INCLUDE,
    });

    this.notifications.emit('trip-status-changed', {
      tripId: id,
      status,
      driverName: trip.driver.fullName,
    });

    return updated;
  }
}
```

- [ ] **Step 3: Create TripsController**

```ts
// apps/api/src/trips/trips.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripStatusDto } from './dto/update-trip-status.dto';
import { TripFilterDto } from './dto/trip-filter.dto';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  @ApiOperation({ summary: 'List all trips with filters' })
  findAll(@Query() filters: TripFilterDto) {
    return this.tripsService.findAll(filters);
  }

  @Get('my')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'List current driver trips' })
  findMyTrips(@CurrentUser() user: User) {
    return this.tripsService.findMyTrips(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGIST, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get trip by ID' })
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  @ApiOperation({ summary: 'Create a new trip' })
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update trip status (driver only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTripStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.updateStatus(id, dto.status, user.id);
  }
}
```

- [ ] **Step 4: Create TripsModule (depends on NotificationsModule — create a stub first)**

Create a minimal `NotificationsService` stub so TripsModule can compile:

```ts
// apps/api/src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: any;
}

@Injectable()
export class NotificationsService {
  private events$ = new Subject<SseEvent>();

  emit(type: string, data: any) {
    this.events$.next({ type, data });
  }

  getStream() {
    return this.events$.asObservable();
  }
}
```

```ts
// apps/api/src/notifications/notifications.module.ts
import { Global, Module } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Global()
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

```ts
// apps/api/src/trips/trips.module.ts
import { Module } from '@nestjs/common';

import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
```

Add `NotificationsModule` and `TripsModule` to `app.module.ts` imports.

- [ ] **Step 5: Verify and commit**

```bash
pnpm api:dev
git add .
git commit -m "feat: add trips module with CRUD, status updates, filters, and notifications stub"
```

---

### Task 11: Waybills Module

**Files:**
- Create: `apps/api/src/waybills/waybills.module.ts`
- Create: `apps/api/src/waybills/waybills.service.ts`
- Create: `apps/api/src/waybills/waybills.controller.ts`
- Create: `apps/api/src/waybills/dto/create-waybill.dto.ts`
- Create: `apps/api/src/waybills/dto/waybill-filter.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// apps/api/src/waybills/dto/create-waybill.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateWaybillDto {
  @ApiProperty({ description: 'Trip ID' })
  @IsString()
  tripId: string;

  @ApiProperty({ example: '593' })
  @IsString()
  ttnNumber: string;

  @ApiProperty({ example: 25.04, description: 'Weight in tonnes' })
  @IsNumber()
  weight: number;

  @ApiProperty({ example: 41.36, description: 'Load weight (gross) in tonnes' })
  @IsNumber()
  loadWeight: number;

  @ApiProperty({ example: 'Шведкин О.Ю.' })
  @IsString()
  driverFullName: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  submittedOffline?: boolean;
}
```

```ts
// apps/api/src/waybills/dto/waybill-filter.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class WaybillFilterDto {
  @ApiProperty({ required: false, description: 'Search by TTN number' })
  @IsString()
  @IsOptional()
  ttnNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
```

- [ ] **Step 2: Create WaybillsService**

```ts
// apps/api/src/waybills/waybills.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TripStatus } from '@iridium/shared';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWaybillDto } from './dto/create-waybill.dto';
import { WaybillFilterDto } from './dto/waybill-filter.dto';

const WAYBILL_INCLUDE = {
  trip: {
    include: {
      route: {
        include: {
          senderContractor: { select: { id: true, name: true } },
          receiverContractor: { select: { id: true, name: true } },
        },
      },
      driver: { select: { id: true, fullName: true } },
      vehicle: { select: { id: true, licensePlate: true } },
      cargo: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class WaybillsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(filters: WaybillFilterDto) {
    const where: any = {};

    if (filters.ttnNumber) {
      where.ttnNumber = { contains: filters.ttnNumber, mode: 'insensitive' };
    }

    if (filters.driverId) {
      where.trip = { driverId: filters.driverId };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.submittedAt = {};
      if (filters.dateFrom) where.submittedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.submittedAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.waybill.findMany({
      where,
      include: WAYBILL_INCLUDE,
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const waybill = await this.prisma.waybill.findUnique({
      where: { id },
      include: WAYBILL_INCLUDE,
    });

    if (!waybill) {
      throw new NotFoundException('Waybill not found');
    }

    return waybill;
  }

  async create(dto: CreateWaybillDto) {
    const existing = await this.prisma.waybill.findUnique({
      where: { tripId: dto.tripId },
    });

    if (existing) {
      throw new ConflictException('Waybill already submitted for this trip');
    }

    const waybill = await this.prisma.waybill.create({
      data: {
        tripId: dto.tripId,
        ttnNumber: dto.ttnNumber,
        weight: dto.weight,
        loadWeight: dto.loadWeight,
        driverFullName: dto.driverFullName,
        submittedOffline: dto.submittedOffline ?? false,
      },
      include: WAYBILL_INCLUDE,
    });

    // Auto-advance trip status to EN_ROUTE_TO_UNLOADING
    await this.prisma.trip.update({
      where: { id: dto.tripId },
      data: { status: TripStatus.EN_ROUTE_TO_UNLOADING },
    });

    this.notifications.emit('waybill-submitted', {
      waybillId: waybill.id,
      ttnNumber: waybill.ttnNumber,
      driverName: waybill.driverFullName,
      weight: waybill.weight,
      loadWeight: waybill.loadWeight,
    });

    return waybill;
  }
}
```

- [ ] **Step 3: Create WaybillsController**

```ts
// apps/api/src/waybills/waybills.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WaybillsService } from './waybills.service';
import { CreateWaybillDto } from './dto/create-waybill.dto';
import { WaybillFilterDto } from './dto/waybill-filter.dto';

@ApiTags('Waybills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waybills')
export class WaybillsController {
  constructor(private waybillsService: WaybillsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  @ApiOperation({ summary: 'List waybills with filters' })
  findAll(@Query() filters: WaybillFilterDto) {
    return this.waybillsService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  @ApiOperation({ summary: 'Get waybill by ID' })
  findOne(@Param('id') id: string) {
    return this.waybillsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Submit waybill data (driver)' })
  create(@Body() dto: CreateWaybillDto) {
    return this.waybillsService.create(dto);
  }
}
```

- [ ] **Step 4: Create module, register, verify, commit**

```ts
// apps/api/src/waybills/waybills.module.ts
import { Module } from '@nestjs/common';

import { WaybillsController } from './waybills.controller';
import { WaybillsService } from './waybills.service';

@Module({
  controllers: [WaybillsController],
  providers: [WaybillsService],
})
export class WaybillsModule {}
```

Add `WaybillsModule` to `app.module.ts` imports.

```bash
pnpm api:dev
git add .
git commit -m "feat: add waybills module with submission, TTN search, SSE trigger"
```

---

### Task 12: SSE Notifications Controller

**Files:**
- Modify: `apps/api/src/notifications/notifications.controller.ts`
- Modify: `apps/api/src/notifications/notifications.module.ts`

- [ ] **Step 1: Create NotificationsController with SSE endpoint**

```ts
// apps/api/src/notifications/notifications.controller.ts
import { Controller, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { UserRole } from '@iridium/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService, SseEvent } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Sse('sse')
  @Roles(UserRole.ADMIN, UserRole.LOGIST)
  @ApiOperation({ summary: 'SSE stream for realtime notifications' })
  sse(): Observable<MessageEvent> {
    return this.notificationsService.getStream().pipe(
      map((event: SseEvent) => ({
        data: JSON.stringify(event),
        type: event.type,
      } as MessageEvent)),
    );
  }
}
```

- [ ] **Step 2: Update NotificationsModule to include controller**

```ts
// apps/api/src/notifications/notifications.module.ts
import { Global, Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 3: Verify SSE works**

```bash
pnpm api:dev
```

In another terminal, test SSE connection (use a valid JWT token):

```bash
curl -N -H "Authorization: Bearer <token>" http://localhost:3000/api/notifications/sse
```

Then submit a waybill via Scalar — the curl terminal should receive the event.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add SSE notifications endpoint for realtime waybill/trip updates"
```

---

### Task 13: Database Seed

**Files:**
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Write seed script**

```ts
// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      password,
      fullName: 'Низамова О.В.',
      phone: '+79001234567',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Logist user
  const logist = await prisma.user.upsert({
    where: { login: 'logist' },
    update: {},
    create: {
      login: 'logist',
      password: await bcrypt.hash('logist123', 10),
      fullName: 'Логист Тестовый',
      phone: '+79001234568',
      role: 'LOGIST',
      status: 'ACTIVE',
    },
  });

  // Driver user
  const driver = await prisma.user.upsert({
    where: { login: 'shvedkin' },
    update: {},
    create: {
      login: 'shvedkin',
      password: await bcrypt.hash('driver123', 10),
      fullName: 'Шведкин О.Ю.',
      phone: '+79001234569',
      role: 'DRIVER',
      status: 'ACTIVE',
    },
  });

  // Cargo
  const cargo = await prisma.cargo.create({
    data: {
      name: 'Конденсат газовый смесевой',
      technicalSpec: 'ТУ 19.20.32-001-20484253-2018',
      unCode: 'UN 3295',
      hazardClass: '3',
      packagingMethod: 'наливом',
    },
  });

  // Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      brand: 'СКАНИЯ',
      model: 'R440',
      licensePlate: 'Е063НМ156',
      trailerPlate: 'ВК861256',
      ownershipType: 'GRATUITOUS',
      assignedDriverId: driver.id,
      allowedCargos: { create: [{ cargoId: cargo.id }] },
    },
  });

  // Contractors
  const sender = await prisma.contractor.create({
    data: {
      name: 'ООО "Интерком"',
      inn: '5609182980',
      legalAddress: 'Оренбург, ул. Мало-Луговая, 3/1, оф. 507',
      type: 'SENDER',
    },
  });

  const receiver = await prisma.contractor.create({
    data: {
      name: 'ООО "ОЙЛ ГРУПП"',
      inn: '5611081141',
      legalAddress: 'Оренбург, мкр Ростоши, ул. Дальнереченская, д. 8А, кв. 38',
      type: 'RECEIVER',
    },
  });

  const loadingPoint = await prisma.contractor.create({
    data: {
      name: 'ООО "Триумф"',
      inn: '5640021583',
      legalAddress: 'Оренбургская область, Переволоцкий район, п. Переволоцкий, ул. Промышленная, д.4',
      type: 'BOTH',
    },
  });

  // Route
  const route = await prisma.route.create({
    data: {
      senderContractorId: sender.id,
      receiverContractorId: receiver.id,
      loadingAddress: 'Оренбургская обл., Переволоцкий район, п. Переволоцкий, ул. Северная, д. 1А',
      unloadingAddress: 'Оренбургский район, с/с Подгородне-Покровский, 26 км автодороги "Оренбург-Самара"',
      description: 'Триумф → ОЙЛ ГРУПП (Переволоцкий → Подгородне-Покровский)',
    },
  });

  console.log('Seed complete:', { admin: admin.id, logist: logist.id, driver: driver.id, cargo: cargo.id, vehicle: vehicle.id, route: route.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed config to package.json**

Add to `apps/api/package.json`:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

- [ ] **Step 3: Run seed**

```bash
cd apps/api
npx prisma db seed
```

Expected: seed data created, IDs printed.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add database seed with real business data from waybill"
```

---

### Task 14: Final AppModule Assembly & Smoke Test

**Files:**
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Verify final AppModule has all modules**

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ContractorsModule } from './contractors/contractors.module';
import { CargosModule } from './cargos/cargos.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { WaybillsModule } from './waybills/waybills.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
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
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Full smoke test via Scalar**

```bash
pnpm api:dev
```

Open `http://localhost:3000/api/docs` and test the full flow:

1. `POST /api/auth/login` with `{ "login": "admin", "password": "admin123" }` → get tokens
2. Set Bearer token in Scalar
3. `GET /api/users` → see all seeded users
4. `GET /api/vehicles` → see СКАНИЯ with assigned driver
5. `GET /api/contractors` → see Интерком, ОЙЛ ГРУПП, Триумф
6. `GET /api/routes` → see the route with contractors
7. `POST /api/trips` with `{ routeId, driverId, vehicleId, cargoId }` from seed data → create trip
8. Login as driver: `{ "login": "shvedkin", "password": "driver123" }` → get tokens
9. `GET /api/trips/my` → see assigned trip
10. `PATCH /api/trips/:id/status` with `{ "status": "EN_ROUTE_TO_LOADING" }` → start trip
11. `POST /api/waybills` with `{ tripId, ttnNumber: "593", weight: 25.04, loadWeight: 41.36, driverFullName: "Шведкин О.Ю." }` → submit waybill
12. Login as admin again, `GET /api/waybills` → see submitted waybill

Expected: all endpoints return correct data, Scalar docs render all endpoints with descriptions.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete backend API with all modules, seed data, and Scalar docs"
```
