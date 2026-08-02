import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
    ContactsModule,
    NewsModule,
    MediaModule,
    ChatModule,
    StatsModule,
  ],
})
export class AppModule {}
