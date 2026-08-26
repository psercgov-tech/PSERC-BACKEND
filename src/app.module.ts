import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import appConfig from './config/app.config';
import { ContactsModule } from './contacts/contacts.module';
import { MediaModule } from './media/media.module';
import { NewsModule } from './news/news.module';
import { ChatModule } from './chat/chat.module';
import { StatsModule } from './stats/stats.module';
import { PortalModule } from './portal/portal.module';
import { DocumentsModule } from './documents/documents.module';
import { MiniGridApplicationsModule } from './mini-grid-applications/mini-grid-applications.module';
import { DiscoMonthlyReportsModule } from './disco-monthly-reports/disco-monthly-reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('app.mongodbUri'),
      }),
    }),
    CloudinaryModule,
    AdminsModule,
    AuthModule,
    PortalModule,
    DocumentsModule,
    MiniGridApplicationsModule,
    DiscoMonthlyReportsModule,
    ContactsModule,
    NewsModule,
    MediaModule,
    ChatModule,
    StatsModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 80 }],
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
