import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// TODO: Add PrismaModule import once it is created in Task 3
// import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // TODO: Add PrismaModule here in Task 3
  ],
})
export class AppModule {}
