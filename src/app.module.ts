import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { TaskModule } from './modules/task/task.module';
import { ModelModule } from './modules/model/model.module';
import * as process from 'node:process';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            url: process.env.DATABASE_URL,
            type: 'postgres',
            ssl: false,
            entities: ['dist/**/*.entity{.ts,.js}'],
            synchronize: true, // This for development
            autoLoadEntities: true,
        }),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_URL,
                port: 6379
            },
        }),
        UserModule,
        TaskModule,
        ModelModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor() {
        console.log(process.env);
    }
}
