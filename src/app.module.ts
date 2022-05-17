import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { TaskModule } from './modules/task/task.module';
import { BullModule } from '@nestjs/bull';


@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            url: process.env.DATABASE_URL,
            type: 'postgres',
            ssl: {
                rejectUnauthorized: false,
            },
            entities: ['dist/**/*.entity{.ts,.js}'],
            synchronize: true, // This for development
            autoLoadEntities: true,
        }),
        BullModule.forRoot({
            redis: {
                host: 'redis-19686.c14.us-east-1-2.ec2.cloud.redislabs.com',
                port: 19686,
                password: 'xKHIgEzdIDPt5n8lJsS8LzJSOTSv1cFt'
            },
        }),
        UserModule,
        TaskModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
