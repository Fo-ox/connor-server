import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task-entity';
import { BullModule } from '@nestjs/bull';
import { JobProcessor } from '../../jobs/job.processor';
import { NormalizeTaskService } from './normalize-task.service';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TaskEntity]),
        BullModule.registerQueue({
            name: 'connorCore',
        }),
        UserModule
    ],
    controllers: [TaskController],
    providers: [
        TaskService,
        NormalizeTaskService,
        JobProcessor,
    ]
})
export class TaskModule {}
