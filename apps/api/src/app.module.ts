import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ContractorsModule } from './contractors/contractors.module';
import { CargosModule } from './cargos/cargos.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { WaybillsModule } from './waybills/waybills.module';

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
