import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { AppController } from './app.controller';

import { AppService } from './app.service';

import { UsersModule } from './users/user.module';

import { AuthModule } from './auth/auth.module';

import { LoggerMiddleware } from './middlewares/logger.middleware';

import { ConfigModule, ConfigService } from '@nestjs/config';

import typeorm from './config/typeorm';

import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';

import { FileResourceModule } from './file-resource/file-resource.module';

import { TrainingModule } from './training/training.module';

import { TrainingService } from './training/training.service';

import { MeetingsModule } from './meetings/meetings.module';

import { TrainingRequestModule } from './training-requests/training-request.module';

import { NotificationsModule } from './notifications/notifications.module';

import { PaymentsModule } from './payments/payments.module';

import { ChatModule } from './chat/chat.module';

import { BullModule } from '@nestjs/bull';

import { ContactModule } from './contact/contact.module';

import { ProfileModule } from './profile/profile.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    UsersModule,

    ProfileModule,

    AuthModule,

    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: '.development.env',

      load: [typeorm],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => config.get('typeorm')!,
    }),

    JwtModule.register({
      global: true,

      secret: process.env.JWT_SECRET,

      signOptions: {
        expiresIn: '30m',
      },
    }),

    FileResourceModule,

    TrainingModule,

    MeetingsModule,

    TrainingRequestModule,

    BullModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL') as string,
      }),
    }),

    NotificationsModule,

    PaymentsModule,

    ChatModule,

    ContactModule,

    ScheduleModule.forRoot(),
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule implements NestModule, OnApplicationBootstrap {
  constructor(
    private readonly trainingService: TrainingService
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }

async onApplicationBootstrap() {

  try {

    await this.trainingService.addTraining();

    console.log('Capacitaciones cargadas');

  } catch (error) {

    console.error(
      'Error cargando capacitaciones:',
      error,
    );
  }

  //this.calendlyService.createWebhookSubscription('https://shy-shopping-trunks.ngrok-free.dev'/)
}
}
