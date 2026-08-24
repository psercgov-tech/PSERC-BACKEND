import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Contact, ContactSchema } from '../contacts/contact.schema';
import { EmailModule } from '../email/email.module';
import { PortalController } from './portal.controller';
import {
  PortalSession,
  PortalSessionSchema,
} from './portal-session.schema';
import { PortalUser, PortalUserSchema } from './portal-user.schema';
import { PortalService } from './portal.service';
import { PortalJwtStrategy } from './strategies/portal-jwt.strategy';

@Module({
  imports: [
    EmailModule,
    MongooseModule.forFeature([
      { name: PortalUser.name, schema: PortalUserSchema },
      { name: PortalSession.name, schema: PortalSessionSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
    PassportModule.register({}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('app.jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [PortalController],
  providers: [PortalService, PortalJwtStrategy],
  exports: [PortalService],
})
export class PortalModule {}
